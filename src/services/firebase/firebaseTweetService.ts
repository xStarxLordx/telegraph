// Firebase TweetService (see src/interfaces/tweetService.ts). Tweets are denormalized (author name and username
// are copied in), so no list needs a join; the security rules check the copies against the
// author's profile.
import {
  addDoc,
  collection,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ServiceError } from '../../domain/errors';
import { validateTweetBody } from '../../domain/validation';
import type { FirebaseServiceDeps, FollowDocument, TweetDocument } from '../../interfaces/firebase';
import type { PageRequest } from '../../interfaces/pagination';
import type { Tweet } from '../../interfaces/tweet';
import type { TweetService } from '../../interfaces/tweetService';
import chunk from '../../utils/chunk';
import Collection, { MAX_IN_VALUES } from './collections';
import { withMappedErrors } from './mapFirebaseError';
import paginateQuery, { readCursor, resolvePageSize } from './paginateQuery';
import { requireActor } from './profiles';

/** Reads server timestamps as an estimate, so a tweet that was just published isn't null. */
const readData = (snapshot: DocumentSnapshot) =>
  snapshot.data({ serverTimestamps: 'estimate' }) as TweetDocument;

function toTweet(snapshot: DocumentSnapshot): Tweet {
  const data = readData(snapshot);
  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorFullName: data.authorFullName,
    authorUsername: data.authorUsername,
    body: data.body,
    createdAt: data.createdAt.toDate(),
    ...(data.media ? { media: data.media } : {}),
  };
}

// Same order as `orderBy('createdAt', 'desc')`: Firestore breaks ties by document id, in the
// direction of the last orderBy. Compares the full timestamp (nanoseconds), not milliseconds.
function compareNewest(a: DocumentSnapshot, b: DocumentSnapshot) {
  const left = readData(a).createdAt;
  const right = readData(b).createdAt;
  const byTime = right.seconds - left.seconds || right.nanoseconds - left.nanoseconds;
  if (byTime !== 0) return byTime;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

const OTHERS_BATCH_SIZE = 50;

export default function createFirebaseTweetService({
  auth,
  db,
}: FirebaseServiceDeps): TweetService {
  const tweets = () => collection(db, Collection.TWEETS);

  const listAuthorIds = async (userId: string) => {
    const result = await getDocs(
      query(collection(db, Collection.FOLLOWS), where('followerId', '==', userId)),
    );
    return [
      userId,
      ...result.docs.map((snapshot) => (snapshot.data() as FollowDocument).followeeId),
    ];
  };

  const listFromAuthors = async (
    authorIds: string[],
    after: DocumentSnapshot | null,
    wanted: number,
  ) => {
    const results = await Promise.all(
      chunk(authorIds, MAX_IN_VALUES).map((ids) =>
        getDocs(
          query(
            tweets(),
            where('authorId', 'in', ids),
            orderBy('createdAt', 'desc'),
            ...(after ? [startAfter(after)] : []),
            limit(wanted),
          ),
        ),
      ),
    );
    return results
      .flatMap(({ docs }) => docs)
      .sort(compareNewest)
      .slice(0, wanted);
  };

  const listFromOthers = async (
    priority: Set<string>,
    after: DocumentSnapshot | null,
    wanted: number,
  ): Promise<QueryDocumentSnapshot[]> => {
    const batch = await getDocs(
      query(
        tweets(),
        orderBy('createdAt', 'desc'),
        ...(after ? [startAfter(after)] : []),
        limit(OTHERS_BATCH_SIZE),
      ),
    );
    const found = batch.docs.filter((snapshot) => !priority.has(readData(snapshot).authorId));
    if (found.length >= wanted || batch.docs.length < OTHERS_BATCH_SIZE) {
      return found.slice(0, wanted);
    }
    const rest = await listFromOthers(
      priority,
      batch.docs[batch.docs.length - 1],
      wanted - found.length,
    );
    return [...found, ...rest];
  };

  return {
    publish: withMappedErrors(async ({ authorId, body, media }) => {
      const author = await requireActor({ auth, db }, authorId);
      const error = validateTweetBody(body, Boolean(media));
      if (error) throw new ServiceError(error, { field: 'body' });
      const reference = await addDoc(tweets(), {
        authorId,
        authorFullName: author.fullName,
        authorUsername: author.username,
        body: body.trim(),
        createdAt: serverTimestamp(),
        // Firestore rejects `undefined`, so a tweet without media has no `media` field at all.
        ...(media ? { media } : {}),
      });
      return toTweet(await getDoc(reference));
    }),

    listByAuthor: withMappedErrors((authorId: string, page?: PageRequest) =>
      paginateQuery({
        db,
        collectionName: Collection.TWEETS,
        filters: [where('authorId', '==', authorId)],
        orders: [orderBy('createdAt', 'desc')],
        page,
        mapDocument: toTweet,
      }),
    ),

    listFeed: withMappedErrors(async (userId: string, page: PageRequest = {}) => {
      const size = resolvePageSize(page.pageSize);
      const after = await readCursor(db, Collection.TWEETS, page.cursor);
      const authorIds = await listAuthorIds(userId);
      const priority = new Set(authorIds);
      const inOthers = after !== null && !priority.has(readData(after).authorId);
      const fromPriority = inOthers ? [] : await listFromAuthors(authorIds, after, size + 1);
      const fromOthers =
        fromPriority.length > size
          ? []
          : await listFromOthers(priority, inOthers ? after : null, size + 1 - fromPriority.length);
      const collected = [...fromPriority, ...fromOthers];
      const shown = collected.slice(0, size);
      const total = await getCountFromServer(query(tweets()));
      return {
        items: shown.map(toTweet),
        nextCursor: collected.length > size ? shown[size - 1].id : null,
        total: total.data().count,
      };
    }),
  };
}
