// Loads the demo data into the Firebase project, or removes it. See scripts/demoData.js for
// what the data contains.
//
//   npm run seed -- --dry-run   show what would be written; needs no credentials
//   npm run seed                create the accounts and documents (safe to repeat)
//   npm run seed -- --clean     delete every demo account and what it published or follows
//   npm run seed -- --follow <username>
//                               make a real account follow some demo accounts (after seeding);
//                               --clean removes those follows too
//
// It uses the Admin SDK, which skips the security rules: that is what lets the tweets be dated in
// the past. Point GOOGLE_APPLICATION_CREDENTIALS at a service account key of the project in
// .firebaserc. The key is a secret: keep it outside the repository.
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import chunk from '../src/utils/chunk.js';
import { buildDemoDataset, buildFollowsOf, DEMO_PASSWORD, DEMO_UID_PREFIX } from './demoData.js';

const IN_LIMIT = 30; // values Firestore accepts in one `in` filter
const AUTH_BATCH = 100; // identifiers Auth looks up per call
const AUTH_CONCURRENCY = 10;

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function parseArguments(argv) {
  const followAt = argv.indexOf('--follow');
  const follow = followAt === -1 ? null : argv[followAt + 1];
  if (followAt !== -1 && (!follow || follow.startsWith('--')))
    fail('--follow needs a username: npm run seed -- --follow <username>');
  const flags = new Set(followAt === -1 ? argv : argv.toSpliced(followAt, 2));
  const unknown = [...flags].filter((flag) => !['--clean', '--dry-run'].includes(flag));
  if (unknown.length > 0)
    fail(`Unknown option: ${unknown.join(' ')}\nUse --dry-run, --clean or --follow <username>.`);
  if (flags.size + (follow ? 1 : 0) > 1)
    fail('--clean, --dry-run and --follow exclude each other.');
  return { clean: flags.has('--clean'), dryRun: flags.has('--dry-run'), follow };
}

/** Connects with the service account key, after checking it belongs to this repo's project. */
function connect() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) fail('Set GOOGLE_APPLICATION_CREDENTIALS to the path of the service account key.');
  const { project_id: keyProject } = JSON.parse(readFileSync(keyPath, 'utf8'));
  const { projects } = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'));
  if (keyProject !== projects.default) {
    fail(
      `The key is for "${keyProject}" but .firebaserc points at "${projects.default}". Nothing changed.`,
    );
  }
  const app = initializeApp({ credential: cert(keyPath) });
  return { projectId: keyProject, auth: getAuth(app), db: getFirestore(app) };
}

/** Runs `task` over `items`, a few at a time. */
async function inBatches(items, size, task) {
  await chunk(items, size).reduce(
    (previous, group) => previous.then(() => Promise.all(group.map(task))),
    Promise.resolve(),
  );
}

/** Things that already exist and belong to someone else: the seed must not overwrite them. */
async function findConflicts({ auth, db }, dataset) {
  const conflicts = [];
  const profiles = await db.getAll(
    ...dataset.users.map(({ id }) => db.collection('users').doc(id)),
  );
  profiles.forEach((snapshot, index) => {
    if (snapshot.exists && snapshot.data().uid !== dataset.users[index].data.uid) {
      conflicts.push(`users/${snapshot.id} is a real account (another uid)`);
    }
  });
  const lookups = await Promise.all(
    chunk(dataset.accounts, AUTH_BATCH).map((group) =>
      auth.getUsers(group.map(({ email }) => ({ email }))),
    ),
  );
  lookups
    .flatMap(({ users }) => users)
    .forEach((user) => {
      const expected = dataset.accounts.find(({ email }) => email === user.email);
      if (expected && expected.uid !== user.uid) {
        conflicts.push(`${user.email} already belongs to another Auth account`);
      }
    });
  return conflicts;
}

async function upsertAccount(auth, { uid, ...properties }) {
  const fields = { ...properties, emailVerified: true };
  try {
    await auth.createUser({ uid, ...fields });
    return 'created';
  } catch (error) {
    if (error.code !== 'auth/uid-already-exists') throw error;
    await auth.updateUser(uid, fields);
    return 'updated';
  }
}

async function writeDocuments(db, dataset) {
  const failures = [];
  const writer = db.bulkWriter();
  writer.onWriteError((error) => {
    failures.push(error);
    return false;
  });
  [
    ['users', dataset.users],
    ['tweets', dataset.tweets],
    ['follows', dataset.follows],
  ].forEach(([collectionName, docs]) => {
    docs.forEach(({ id, data }) => writer.set(db.collection(collectionName).doc(id), data));
  });
  await writer.close();
  if (failures.length > 0)
    throw new Error(`${failures.length} writes failed: ${failures[0].message}`);
}

/** How many of the dataset's accounts and documents exist right now. */
async function countPresent({ auth, db }, dataset) {
  const present = async (collectionName, docs) =>
    (await db.getAll(...docs.map(({ id }) => db.collection(collectionName).doc(id)))).filter(
      (snapshot) => snapshot.exists,
    ).length;
  const accounts = (
    await Promise.all(
      chunk(dataset.accounts, AUTH_BATCH).map((group) =>
        auth.getUsers(group.map(({ uid }) => ({ uid }))),
      ),
    )
  ).reduce((sum, { users }) => sum + users.length, 0);
  return {
    accounts,
    users: await present('users', dataset.users),
    tweets: await present('tweets', dataset.tweets),
    follows: await present('follows', dataset.follows),
  };
}

function describe(dataset) {
  return {
    accounts: dataset.accounts.length,
    users: dataset.users.length,
    tweets: dataset.tweets.length,
    follows: dataset.follows.length,
  };
}

async function seed(connection, dataset) {
  const { auth, db } = connection;
  const conflicts = await findConflicts(connection, dataset);
  if (conflicts.length > 0) {
    fail(`Nothing was written. These would overwrite real data:\n - ${conflicts.join('\n - ')}`);
  }
  const results = [];
  await inBatches(dataset.accounts, AUTH_CONCURRENCY, async (account) => {
    results.push(await upsertAccount(auth, account));
  });
  console.log(
    `Auth: ${results.filter((r) => r === 'created').length} created, ` +
      `${results.filter((r) => r === 'updated').length} updated`,
  );
  await writeDocuments(db, dataset);
  const expected = describe(dataset);
  const present = await countPresent(connection, dataset);
  console.log('Written and read back:', present, '(expected', expected, ')');
  if (JSON.stringify(present) !== JSON.stringify(expected)) fail('The read-back does not match.');
}

/** Makes the real account with `username` follow the demo accounts `buildFollowsOf` picks. */
async function followDemoAccounts({ db }, dataset, username) {
  const snapshot = await db.collection('users').doc(username.toLowerCase()).get();
  if (!snapshot.exists) fail(`There is no account @${username}. Nothing changed.`);
  const account = snapshot.data();
  if (account.uid.startsWith(DEMO_UID_PREFIX))
    fail(`@${account.username} is a demo account: its follows come from the seed.`);
  const follows = buildFollowsOf(account, dataset);
  const followees = await db.getAll(
    ...follows.map(({ data }) => db.collection('users').doc(data.followeeUsername.toLowerCase())),
  );
  if (!followees.every((profile) => profile.exists))
    fail('Some demo accounts are missing: run `npm run seed` first. Nothing changed.');
  await writeDocuments(db, { users: [], tweets: [], follows });
  const present = (
    await db.getAll(...follows.map(({ id }) => db.collection('follows').doc(id)))
  ).filter((document) => document.exists).length;
  console.log(`@${account.username} now follows ${present} of ${follows.length} demo accounts.`);
  if (present !== follows.length) fail('The read-back does not match.');
}

/** Everything the demo accounts own: their tweets and every follow that involves them. */
async function findDemoDocuments(db, uids) {
  const paths = new Map();
  const queries = chunk(uids, IN_LIMIT).flatMap((group) => [
    db.collection('tweets').where('authorId', 'in', group),
    db.collection('follows').where('followerId', 'in', group),
    db.collection('follows').where('followeeId', 'in', group),
  ]);
  (await Promise.all(queries.map((query) => query.get()))).forEach((snapshot) =>
    snapshot.docs.forEach((document) => paths.set(document.ref.path, document.ref)),
  );
  return [...paths.values()];
}

async function clean({ auth, db }, dataset) {
  const uids = dataset.accounts.map(({ uid }) => uid);
  if (!uids.every((uid) => uid.startsWith(DEMO_UID_PREFIX)))
    fail('Refusing: a uid is not a demo uid.');
  const owned = await findDemoDocuments(db, uids);
  // A profile is only removed when it really belongs to a demo account.
  const profiles = (
    await db.getAll(...dataset.users.map(({ id }) => db.collection('users').doc(id)))
  )
    .filter((snapshot) => snapshot.exists && uids.includes(snapshot.data().uid))
    .map((snapshot) => snapshot.ref);
  const writer = db.bulkWriter();
  [...owned, ...profiles].forEach((reference) => writer.delete(reference));
  await writer.close();
  const removed = await auth.deleteUsers(uids);
  console.log(
    `Deleted ${owned.length} tweets/follows, ${profiles.length} profiles and ` +
      `${removed.successCount} Auth accounts (${removed.failureCount} failed).`,
  );
}

async function main() {
  const { clean: cleaning, dryRun, follow } = parseArguments(process.argv.slice(2));
  const dataset = buildDemoDataset();
  if (dryRun) {
    console.log('Dry run: nothing is written. The dataset would contain', describe(dataset));
    console.log(`Every account's password is "${DEMO_PASSWORD}"; e.g. ada@telegraph.test (@ada).`);
    return;
  }
  const connection = connect();
  console.log(`Project: ${connection.projectId}`);
  if (cleaning) await clean(connection, dataset);
  else if (follow) await followDemoAccounts(connection, dataset, follow);
  else await seed(connection, dataset);
}

main().catch((error) => fail(`Failed: ${error.message}`));
