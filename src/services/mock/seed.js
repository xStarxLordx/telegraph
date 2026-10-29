// Deterministic demo data for the mock services (M1). Every list has 2+ pages for the demo
// user (@ada), and some of her followers aren't followed back, so "Follow" buttons show up.
// All demo accounts share the password below; it is mock-only and never reaches Firebase.

export const DEMO_PASSWORD = 'telegraph';
/** Bump when the stored shape changes, so old browser data falls back to the seed. */
export const SEED_SCHEMA_VERSION = 1;
export const DEMO_USERNAME = 'ada';

const SEED_EPOCH = Date.parse('2026-10-12T12:00:00Z');
const MINUTE = 60 * 1000;

const PEOPLE = [
  ['ada', 'Ada Lovelace'],
  ['babbage', 'Charles Babbage'],
  ['tesla', 'Nikola Tesla'],
  ['mshelley', 'Mary Shelley'],
  ['verne', 'Jules Verne'],
  ['mcurie', 'Marie Curie'],
  ['hgwells', 'H. G. Wells'],
  ['brunel', 'Isambard Kingdom Brunel'],
  ['hlamarr', 'Hedy Lamarr'],
  ['emilie', 'Émilie du Châtelet'],
  ['aruizrobles', 'Ángela Ruiz Robles'],
  ['torresquevedo', 'Leonardo Torres Quevedo'],
  ['ramonycajal', 'Santiago Ramón y Cajal'],
  ['iperal', 'Isaac Peral'],
  ['edison', 'Thomas Edison'],
  ['faraday', 'Michael Faraday'],
  ['maxwell', 'James Clerk Maxwell'],
  ['hopper', 'Grace Hopper'],
  ['kovalevskaya', 'Sofia Kovalévskaya'],
  ['somerville', 'Mary Somerville'],
  ['jwatt', 'James Watt'],
  ['orsted', 'Hans Christian Ørsted'],
  ['nbly', 'Nellie Bly'],
  ['lmeitner', 'Lise Meitner'],
  ['zuse', 'Konrad Zuse'],
];

const ADA_TWEETS = [
  'Hoy terminé las notas para la máquina analítica. Mañana, a probar el primer programa.',
  'La máquina analítica teje patrones algebraicos como el telar de Jacquard teje flores.',
  'Ciencia poética: imaginar es tan necesario como calcular.',
  'Café, tarjetas perforadas y una tarde entera de depuración.',
  '¿Alguien más ha intentado calcular números de Bernoulli a mano? No lo recomiendo.',
  'El vapor mueve trenes; las ideas mueven el vapor.',
  'Nota mental: documentar cada paso. El yo del futuro lo agradecerá.',
  'Las máquinas no se equivocan; los programas, a veces.',
  'Hoy aprendí que un bucle bien hecho ahorra cien tarjetas.',
  'Telegrama recibido: el prototipo funciona. ¡Celebramos con té!',
  'Leyendo sobre electricidad. Faraday tiene ideas fascinantes.',
  'Primer despacho del día: buenos días, Telegraph.',
];

const OTHER_TWEETS = [
  'El motor de diferencias por fin gira sin atascos.',
  'Si quieres descubrir los secretos del universo, piensa en energía, frecuencia y vibración.',
  'Nada es tan doloroso para la mente humana como un cambio grande y repentino.',
  'Todo lo que un hombre puede imaginar, otros podrán hacerlo realidad.',
  'En la ciencia hay que interesarse por las cosas, no por las personas.',
  'Mañana pruebo la máquina del tiempo. Si este mensaje llega ayer, funcionó.',
  'Un puente más sobre el río. El hierro canta cuando lo pisas.',
  'Una idea de frecuencias saltarinas me ronda la cabeza.',
  'La energía cinética depende del cuadrado de la velocidad. Lo sostengo.',
  'Mi enciclopedia mecánica pasa páginas sola. Los libros también pueden ser máquinas.',
  'El autómata ajedrecista ganó otra partida. Paciencia de engranaje.',
  'Las neuronas son las mariposas misteriosas del alma.',
  'Primera inmersión del submarino: éxito y mucha emoción.',
  'El genio es uno por ciento inspiración y noventa y nueve por ciento transpiración.',
  'Nada es demasiado maravilloso para ser cierto si es coherente con las leyes de la naturaleza.',
  'Las ecuaciones de la luz cuentan una historia preciosa.',
  'Es más fácil pedir perdón que pedir permiso.',
  'Las matemáticas también son poesía con rigor.',
  'Traduciendo un tratado de mecánica celeste. Las estrellas no esperan.',
  'El condensador separado mejora la eficiencia del motor. Por fin.',
  'Una aguja imantada se movió junto a un cable. Algo grande está pasando.',
  'Vuelta al mundo en 72 días. Verne, te gané.',
  'La física necesita más mujeres y menos excusas.',
  'La computadora programable es real. Se llama Z3.',
  'El vapor no espera: hoy, prueba de presión a las tres.',
  'Despacho desde el taller: los engranajes nuevos llegaron.',
  'Hoy dibujé un dirigible. Mañana lo construimos.',
  'Telegrafiando desde la estación norte. La línea está clara.',
  'Recordatorio: aceitar los engranajes antes de la demostración.',
  'Gran velada de ciencia anoche. Gracias a todos los que vinieron.',
  'Tres hipótesis antes del desayuno: buen día.',
  'Si el experimento falla, el cuaderno sigue ganando.',
  'La lluvia en el laboratorio suena a aplausos.',
];

function buildUsers() {
  return PEOPLE.map(([username, fullName], index) => ({
    id: `u${String(index + 1).padStart(2, '0')}`,
    fullName,
    username,
    email: `${username}@telegraph.test`,
    createdAt: new Date(SEED_EPOCH - (400 - index) * 24 * 60 * MINUTE).toISOString(),
  }));
}

function buildTweets(users) {
  const ada = users[0];
  const others = users.slice(1);
  const tweets = [];
  ADA_TWEETS.forEach((body, index) => {
    tweets.push({ authorId: ada.id, body, offsetMinutes: index * 211 + 37 });
  });
  OTHER_TWEETS.forEach((body, index) => {
    const author = others[index % others.length];
    tweets.push({ authorId: author.id, body, offsetMinutes: index * 97 + 5 });
  });
  return tweets.map(({ authorId, body, offsetMinutes }, index) => {
    const author = users.find((user) => user.id === authorId);
    return {
      id: `t${String(index + 1).padStart(3, '0')}`,
      authorId,
      authorFullName: author.fullName,
      authorUsername: author.username,
      body,
      createdAt: new Date(SEED_EPOCH - offsetMinutes * MINUTE).toISOString(),
    };
  });
}

function buildFollowPairs(users) {
  const pairs = new Set();
  const add = (follower, followee) => {
    if (follower !== followee) pairs.add(`${users[follower].id}_${users[followee].id}`);
  };
  // @ada follows users #2–#15 (14 people, 2 pages).
  for (let i = 1; i <= 14; i += 1) add(0, i);
  // Users #10–#22 follow @ada (13 followers); #16–#22 aren't followed back.
  for (let i = 9; i <= 21; i += 1) add(i, 0);
  // Everyone else follows the next three people, so every profile has counts.
  // Wrapping skips index 0 so @ada's followers stay exactly the ones above.
  for (let i = 1; i < users.length; i += 1) {
    for (let step = 1; step <= 3; step += 1) add(i, (i + step) % users.length || 1);
  }
  return [...pairs];
}

/** Builds a fresh copy of the seed state (never shared between databases). */
export function createSeedState() {
  const users = buildUsers();
  const tweets = buildTweets(users);
  const follows = buildFollowPairs(users).map((pairId, index) => {
    const [followerId, followeeId] = pairId.split('_');
    return {
      id: pairId,
      followerId,
      followeeId,
      createdAt: new Date(SEED_EPOCH - (300 - index) * 60 * MINUTE).toISOString(),
    };
  });
  return {
    schemaVersion: SEED_SCHEMA_VERSION,
    users,
    passwords: Object.fromEntries(users.map((user) => [user.id, DEMO_PASSWORD])),
    tweets,
    follows,
    session: null,
    // Last id number used per entity, so new records never collide with seeded ones.
    counters: { user: users.length, tweet: tweets.length },
  };
}
