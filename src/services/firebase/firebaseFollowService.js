// Firebase FollowService (see contracts.js). A follow is one document whose id is
// `followerId_followeeId`, holding both people's names so the lists need no joins.
import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { ErrorCode, ServiceError } from '../../domain/errors';
import { toSortKey } from '../../domain/text';
import chunk from '../../utils/chunk';
import Collection, { followDocumentId, MAX_IN_VALUES } from './collections';
import { withMappedErrors } from './mapFirebaseError';
import paginateQuery from './paginateQuery';
import { findProfileByUid, findProfileByUsername, profileToUser, requireActor } from './profiles';

// The fields of a follow document for each list: who is being listed, and by what they sort.
// Ties on the name break on the username, like `compareByFullName` does in the mocks.
const LISTS = Object.freeze({
  following: {
    filterField: 'followerId',
    personId: 'followeeId',
    personFullName: 'followeeFullName',
    personUsername: 'followeeUsername',
    sortKey: 'followeeFullNameLower',
  },
  followers: {
    filterField: 'followeeId',
    personId: 'followerId',
    personFullName: 'followerFullName',
    personUsername: 'followerUsername',
    sortKey: 'followerFullNameLower',
  },
});

/**
 * @param {{ auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore }} deps
 * @returns {import('../contracts').FollowService}
 */
export default function createFirebaseFollowService({ auth, db }) {
  const follows = () => collection(db, Collection.FOLLOWS);
  const followRef = (followerId, followeeId) =>
    doc(db, Collection.FOLLOWS, followDocumentId(followerId, followeeId));
  const countWhere = async (field, userId) =>
    (await getCountFromServer(query(follows(), where(field, '==', userId)))).data().count;

  // Both profiles are already resolved. The transaction is what makes "already following"
  // reliable when the button is pressed twice quickly.
  const createFollow = async (follower, followee) => {
    if (follower.uid === followee.uid) throw new ServiceError(ErrorCode.FOLLOW_SELF);
    const reference = followRef(follower.uid, followee.uid);
    await runTransaction(db, async (transaction) => {
      if ((await transaction.get(reference)).exists()) {
        throw new ServiceError(ErrorCode.ALREADY_FOLLOWING);
      }
      transaction.set(reference, {
        followerId: follower.uid,
        followerUsername: follower.username,
        followerFullName: follower.fullName,
        followerFullNameLower: toSortKey(follower.fullName),
        followeeId: followee.uid,
        followeeUsername: followee.username,
        followeeFullName: followee.fullName,
        followeeFullNameLower: toSortKey(followee.fullName),
        createdAt: serverTimestamp(),
      });
    });
  };

  const listPeople = (list, userId, page) =>
    paginateQuery({
      db,
      collectionName: Collection.FOLLOWS,
      filters: [where(list.filterField, '==', userId)],
      orders: [orderBy(list.sortKey), orderBy(list.personUsername)],
      page,
      mapDocument: (snapshot) => {
        const data = snapshot.data();
        return {
          id: data[list.personId],
          fullName: data[list.personFullName],
          username: data[list.personUsername],
        };
      },
    });

  return {
    follow: withMappedErrors(async (followerId, followeeId) => {
      const follower = await requireActor({ auth, db }, followerId);
      const followee = await findProfileByUid(db, followeeId);
      if (!followee) throw new ServiceError(ErrorCode.USER_NOT_FOUND);
      await createFollow(follower, followee);
    }),

    followByUsername: withMappedErrors(async (followerId, username) => {
      const follower = await requireActor({ auth, db }, followerId);
      const followee = await findProfileByUsername(db, username);
      if (!followee) throw new ServiceError(ErrorCode.USER_NOT_FOUND, { field: 'username' });
      await createFollow(follower, followee);
      return profileToUser(followee);
    }),

    isFollowing: withMappedErrors(async (followerId, followeeId) =>
      (await getDoc(followRef(followerId, followeeId))).exists(),
    ),

    // One query per 30 users: the follow ids are known, so they are looked up by document id.
    getFollowingStatus: withMappedErrors(async (followerId, userIds) => {
      const groups = chunk([...new Set(userIds)], MAX_IN_VALUES);
      const results = await Promise.all(
        groups.map((ids) =>
          getDocs(
            query(
              follows(),
              where(
                documentId(),
                'in',
                ids.map((id) => followDocumentId(followerId, id)),
              ),
            ),
          ),
        ),
      );
      const followed = new Set(
        results.flatMap(({ docs }) => docs.map((snapshot) => snapshot.data().followeeId)),
      );
      return Object.fromEntries(userIds.map((id) => [id, followed.has(id)]));
    }),

    // Counted by the server on every call, so a stored counter can never drift.
    getCounts: withMappedErrors(async (userId) => {
      const [followers, following] = await Promise.all([
        countWhere('followeeId', userId),
        countWhere('followerId', userId),
      ]);
      return { followers, following };
    }),

    listFollowing: withMappedErrors((userId, page) => listPeople(LISTS.following, userId, page)),

    listFollowers: withMappedErrors((userId, page) => listPeople(LISTS.followers, userId, page)),
  };
}
