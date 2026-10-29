// Firebase TweetService (see contracts.js). Tweets are denormalized (author name and username
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
} from 'firebase/firestore';
import { ServiceError } from '../../domain/errors';
import { validateTweetBody } from '../../domain/validation';
import chunk from '../../utils/chunk';
import Collection, { MAX_IN_VALUES } from './collections';
import { withMappedErrors } from './mapFirebaseError';
import paginateQuery, { readCursor, resolvePageSize } from './paginateQuery';
import { requireActor } from './profiles';

/** Reads server timestamps as an estimate, so a tweet that was just published isn't null. */
const readData = (snapshot) => snapshot.data({ serverTimestamps: 'estimate' });

/** @returns {import('../contracts').Tweet} */
function toTweet(snapshot) {
  const data = readData(snapshot);
  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorFullName: data.authorFullName,
    authorUsername: data.authorUsername,
    body: data.body,
    createdAt: data.createdAt.toDate(),
  };
}

// Same order as `orderBy('createdAt', 'desc')`: Firestore breaks ties by document id, in the
// direction of the last orderBy. Compares the full timestamp (nanoseconds), not milliseconds.
function compareNewest(a, b) {
  const left = readData(a).createdAt;
  const right = readData(b).createdAt;
  const byTime = right.seconds - left.seconds || right.nanoseconds - left.nanoseconds;
  if (byTime !== 0) return byTime;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

/**
 * @param {{ auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore }} deps
 * @returns {import('../contracts').TweetService}
 */
export default function createFirebaseTweetService({ auth, db }) {
  const tweets = () => collection(db, Collection.TWEETS);

  /** Everyone whose tweets make up the user's feed: the user and the accounts they follow. */
  const listAuthorIds = async (userId) => {
    const result = await getDocs(
      query(collection(db, Collection.FOLLOWS), where('followerId', '==', userId)),
    );
    return [userId, ...result.docs.map((snapshot) => snapshot.data().followeeId)];
  };

  return {
    publish: withMappedErrors(async ({ authorId, body }) => {
      const author = await requireActor({ auth, db }, authorId);
      const error = validateTweetBody(body);
      if (error) throw new ServiceError(error, { field: 'body' });
      const reference = await addDoc(tweets(), {
        authorId,
        authorFullName: author.fullName,
        authorUsername: author.username,
        body: body.trim(),
        createdAt: serverTimestamp(),
      });
      return toTweet(await getDoc(reference));
    }),

    listByAuthor: withMappedErrors((authorId, page) =>
      paginateQuery({
        db,
        collectionName: Collection.TWEETS,
        filters: [where('authorId', '==', authorId)],
        orders: [orderBy('createdAt', 'desc')],
        page,
        mapDocument: toTweet,
      }),
    ),

    // Firestore allows 30 values per `in`, so the authors are split into chunks of 30 and every
    // chunk is queried on its own. All chunks share one ordering (newest first), so a single
    // cursor serves them all: the last tweet shown. Whatever a chunk didn't return for this page
    // comes after that tweet, so every chunk simply continues after it.
    listFeed: withMappedErrors(async (userId, page = {}) => {
      const size = resolvePageSize(page.pageSize);
      const after = await readCursor(db, Collection.TWEETS, page.cursor);
      const chunks = chunk(await listAuthorIds(userId), MAX_IN_VALUES);
      const byChunk = (ids) => where('authorId', 'in', ids);
      const [results, counts] = await Promise.all([
        Promise.all(
          chunks.map((ids) =>
            getDocs(
              query(
                tweets(),
                byChunk(ids),
                orderBy('createdAt', 'desc'),
                ...(after ? [startAfter(after)] : []),
                limit(size + 1),
              ),
            ),
          ),
        ),
        Promise.all(chunks.map((ids) => getCountFromServer(query(tweets(), byChunk(ids))))),
      ]);
      // Each chunk gives up to size + 1, so more than `size` here means another page exists.
      const newest = results.flatMap(({ docs }) => docs).sort(compareNewest);
      const shown = newest.slice(0, size);
      return {
        items: shown.map(toTweet),
        nextCursor: newest.length > size ? shown[size - 1].id : null,
        total: counts.reduce((sum, count) => sum + count.data().count, 0),
      };
    }),
  };
}
