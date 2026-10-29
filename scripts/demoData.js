// The demo dataset for Firebase (loaded by `npm run seed`): the mock seed (25 people, with long
// lists for @ada) plus extra people and tweets that exercise every screen and edge case.
// Pure and I/O-free, so the tests can load it into the fake Firestore and run the real services.
//
// Every document id is fixed, and every account uid starts with DEMO_UID_PREFIX, so seeding twice
// changes nothing and cleaning can find exactly what was seeded.
import { toSortKey } from '../src/domain/text.js';
import { createSeedState, DEMO_PASSWORD } from '../src/services/mock/seed.js';

export { DEMO_PASSWORD };
export const DEMO_UID_PREFIX = 'demo-';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/** The Firebase Auth uid of a demo account. */
export const demoUid = (username) => `${DEMO_UID_PREFIX}${username.toLowerCase()}`;

// People added to the mock seed. A username keeps the case it was typed with (`Hypatia`), which
// the profile, the tweets and the follows must all repeat exactly.
const HISTORICAL_PEOPLE = [
  ['turing', 'Alan Turing'],
  ['kjohnson', 'Katherine Johnson'],
  ['rfranklin', 'Rosalind Franklin'],
  ['mendeleev', 'Dmitri Mendeléyev'],
  ['agbell', 'Alexander Graham Bell'],
  ['marconi', 'Guglielmo Marconi'],
  ['rcarson', 'Rachel Carson'],
  ['kepler', 'Johannes Kepler'],
  ['galileo', 'Galileo Galilei'],
  ['Hypatia', 'Hipatia de Alejandría'],
  ['gauss', 'Carl Friedrich Gauß'],
  ['enoether', 'Emmy Noether'],
];
// Each of these shows one thing on purpose.
const SPECIAL_PEOPLE = [
  ['mshelley2', 'Mary Shelley'], // same name as @mshelley: the username breaks the tie
  ['telegrafista', 'Teodoro Telegrafista'], // follows 32 people: the feed needs two `in` chunks
  ['diez', 'Dora Diez'], // exactly 10 tweets, followers and following: one page, no paging
  ['once', 'Olga Once'], // exactly 11 of each: a second page with a single item
  ['novato', 'Nora Novata'], // brand new: every empty state
];

const HISTORICAL_TWEETS = {
  turing: [
    'Una máquina puede imitar a una persona, pero ¿puede aburrirse de nosotros?',
    'Hoy descifré un mensaje sin ayuda del café. Solo con terquedad.',
  ],
  kjohnson: [
    'Calculé tres trayectorias antes del almuerzo. La luna no se mueve sola.',
    'Los números no discriminan; la gente a veces sí. Sigamos contando.',
  ],
  rfranklin: [
    'La fotografía 51 salió nítida. Ahora, a convencer a los que no miran.',
    'Una buena imagen vale más que una teoría sin datos.',
  ],
  mendeleev: [
    'Ordené los elementos como cartas de un solitario. Faltan huecos: ya vendrán.',
    'La tabla periódica es un juego de paciencia con consecuencias.',
  ],
  agbell: [
    'Hablé por el cable y alguien respondió al otro lado. ¿Hola? ¿Hola?',
    'El teléfono suena. La soledad acaba de perder una batalla.',
  ],
  marconi: [
    'La señal cruzó el canal sin un solo cable. Pura música del aire.',
    'Probando la antena desde el acantilado. El viento también transmite.',
  ],
  rcarson: [
    'La primavera quedó en silencio esta mañana. Algo no va bien con los pájaros.',
    'Cuidar la tierra es cuidar el futuro que aún no tiene nombre.',
  ],
  kepler: [
    'Las órbitas no son círculos, son elipses. El universo tiene sentido del humor.',
    'Medí Marte durante diez años. Marte fue paciente conmigo.',
  ],
  galileo: [
    'Con el telescopio vi lunas girando alrededor de Júpiter. Y sin embargo, se mueve.',
    'Comprobar es mejor que repetir. Pero repetir es más cómodo.',
  ],
  Hypatia: [
    'Enseñar es encender, no llenar. Hoy encendí cuarenta velas en la biblioteca.',
    'Defender el pensamiento libre es un oficio de riesgo. Lo sigo eligiendo.',
  ],
  gauss: [
    'Sumar de uno a cien lleva un segundo si sabes mirar. Ver el patrón es el truco.',
    'Los números primos aparecen sin avisar, como los buenos amigos.',
  ],
  enoether: [
    'Toda simetría esconde una ley de conservación. Hoy encontré otra más.',
    'Las matemáticas no tienen género, pero sus pasillos necesitan ventilación.',
  ],
};

/** Exactly 280 characters (code points): the longest tweet the app accepts. */
function longestTweet() {
  const phrase =
    'Telegrama de longitud máxima: doscientos ochenta caracteres exactos, ni uno más. ';
  // The last character is a full stop, never a space: the app trims tweets before counting.
  return `${[...phrase.repeat(4)].slice(0, 279).join('')}.`;
}

// Tweets for @ada beyond the mock seed's twelve: the limit, emoji, and accents over several lines.
const ADA_SPECIAL_TWEETS = [
  longestTweet(),
  'Mañana de vapor y engranajes: 🚂💨⚙️📜🔧 ¡todo listo para el despacho!',
  'Línea uno: ¿qué tal, Ángela?\nLínea dos: ¡Ñandú, Ørsted y Æsir!\nLínea tres: 日本語 también.',
];

const COUNTED_TWEETS = { diez: 10, once: 11 };

/** @returns {Array<[string, string]>} [username, body] of the extra tweets, in a fixed order. */
function extraTweets() {
  const tweets = [];
  HISTORICAL_PEOPLE.forEach(([username]) => {
    HISTORICAL_TWEETS[username].forEach((body) => tweets.push([username, body]));
  });
  [
    'Transmitiendo desde la estación central: punto, raya, punto.',
    'Hoy envié trescientos telegramas. La tinta ya no me cabe en los dedos.',
    'Sigo a 32 personas y mi bandeja de entrada pide auxilio.',
  ].forEach((body) => tweets.push(['telegrafista', body]));
  tweets.push([
    'mshelley2',
    'Soy otra Mary Shelley. No, no escribí Frankenstein: solo comparto el nombre.',
  ]);
  Object.entries(COUNTED_TWEETS).forEach(([username, count]) => {
    Array.from({ length: count }, (_, index) => index + 1).forEach((number) => {
      tweets.push([username, `Despacho ${number} de ${count} desde la estación ${username}.`]);
    });
  });
  return tweets;
}

/** The follows added to the mock seed, as [follower username, followee username]. */
function extraFollows(people) {
  const usernames = people.map(({ username }) => username);
  const base = usernames.slice(0, 25);
  const historical = HISTORICAL_PEOPLE.map(([username]) => username);
  const pairs = [];
  const add = (follower, followee) => pairs.push([follower, followee]);

  // 32 followees: more than the 30 values one `in` filter accepts.
  usernames
    .filter((username) => !['telegrafista', 'novato'].includes(username))
    .slice(0, 32)
    .forEach((followee) => add('telegrafista', followee));
  ['babbage', 'tesla', 'mshelley'].forEach((follower) => add(follower, 'telegrafista'));

  // `diez`: 10 followers and 10 following. Following both Mary Shelleys puts the tie in a list.
  base.slice(1, 11).forEach((follower) => add(follower, 'diez'));
  ['mshelley', 'mshelley2', ...base.slice(11, 19)].forEach((followee) => add('diez', followee));

  // `once`: 11 and 11, so each list has a second page with one item.
  base.slice(1, 12).forEach((follower) => add(follower, 'once'));
  base.slice(12, 23).forEach((followee) => add('once', followee));

  // The new historical people follow each other, and `mshelley2` follows two writers.
  historical.forEach((username, index) => {
    add(username, historical[(index + 1) % historical.length]);
    add(username, historical[(index + 2) % historical.length]);
  });
  ['verne', 'hgwells'].forEach((followee) => add('mshelley2', followee));
  return pairs;
}

function followDocument(follower, followee, createdAt) {
  return {
    id: `${demoUid(follower.username)}_${demoUid(followee.username)}`,
    data: {
      followerId: demoUid(follower.username),
      followerUsername: follower.username,
      followerFullName: follower.fullName,
      followerFullNameLower: toSortKey(follower.fullName),
      followeeId: demoUid(followee.username),
      followeeUsername: followee.username,
      followeeFullName: followee.fullName,
      followeeFullNameLower: toSortKey(followee.fullName),
      createdAt,
    },
  };
}

/**
 * @param {{ now?: Date }} [options] Dates are relative to `now`, so the data always looks recent.
 * @returns {{
 *   accounts: Array<{ uid: string, email: string, password: string, displayName: string }>,
 *   users: Array<{ id: string, data: object }>,
 *   tweets: Array<{ id: string, data: object }>,
 *   follows: Array<{ id: string, data: object }>,
 * }} Documents in the exact shape the security rules and the services expect.
 */
export function buildDemoDataset({ now = new Date() } = {}) {
  const seed = createSeedState();
  // Moves the seed's dates so its newest tweet is ten minutes old.
  const shift =
    now.getTime() -
    10 * MINUTE -
    Math.max(...seed.tweets.map((tweet) => Date.parse(tweet.createdAt)));
  const moved = (iso) => new Date(Date.parse(iso) + shift);
  const ago = (minutes) => new Date(now.getTime() - minutes * MINUTE);

  const seedPeople = seed.users.map((user) => ({
    username: user.username,
    fullName: user.fullName,
    joinedAt: moved(user.createdAt),
  }));
  const extraPeople = [...HISTORICAL_PEOPLE, ...SPECIAL_PEOPLE].map(
    ([username, fullName], index) => ({
      username,
      fullName,
      joinedAt: new Date(now.getTime() - (90 - index) * DAY),
    }),
  );
  const people = [...seedPeople, ...extraPeople];
  const byUsername = new Map(people.map((person) => [person.username, person]));
  const emailOf = (username) => `${username.toLowerCase()}@telegraph.test`;

  const accounts = people.map(({ username, fullName }) => ({
    uid: demoUid(username),
    email: emailOf(username),
    password: DEMO_PASSWORD,
    displayName: fullName,
  }));

  const users = people.map(({ username, fullName, joinedAt }) => ({
    id: username.toLowerCase(),
    data: {
      uid: demoUid(username),
      fullName,
      username,
      email: emailOf(username),
      createdAt: joinedAt,
    },
  }));

  const tweetDocument = (id, username, body, createdAt) => {
    const author = byUsername.get(username);
    return {
      id,
      data: {
        authorId: demoUid(username),
        authorFullName: author.fullName,
        authorUsername: username,
        body,
        createdAt,
      },
    };
  };
  const seedTweets = seed.tweets.map((tweet) =>
    tweetDocument(`demo-${tweet.id}`, tweet.authorUsername, tweet.body, moved(tweet.createdAt)),
  );
  const addedTweets = [
    ...ADA_SPECIAL_TWEETS.map((body, index) => ['ada', body, 3 + index * 311]),
    ...extraTweets().map(([username, body], index) => [username, body, 90 + index * 47]),
  ].map(([username, body, minutesAgo], index) =>
    tweetDocument(`demo-x${String(index + 1).padStart(3, '0')}`, username, body, ago(minutesAgo)),
  );

  const seedFollows = seed.follows.map((follow) => {
    const follower = seedPeople[Number(follow.followerId.slice(1)) - 1];
    const followee = seedPeople[Number(follow.followeeId.slice(1)) - 1];
    return followDocument(follower, followee, moved(follow.createdAt));
  });
  const addedFollows = extraFollows(people).map(([follower, followee], index) =>
    followDocument(byUsername.get(follower), byUsername.get(followee), ago(600 + index * 13)),
  );
  // A pair that is in both lists keeps its seed document: in a Map the last one added wins.
  const follows = [
    ...new Map([...addedFollows, ...seedFollows].map((doc) => [doc.id, doc])).values(),
  ];

  return { accounts, users, tweets: [...seedTweets, ...addedTweets], follows };
}
