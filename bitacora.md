# Bitácora de uso de IA

Registro append-only de las interacciones con asistentes de IA en este proyecto.
No se editan ni se borran entradas anteriores.

---

## 2026-10-12 11:00 (UTC-5) — Planeación inicial del proyecto

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Opus 5.5 (`claude-opus-5-5`)

### Mensajes del estudiante (textuales)

1. > En la carpeta actual tienes el pdf de un proyecto de aula, necesito que revises el pdf ya sea con la herramienta markitdown que tengo o con otra herramienta para extraer la información del pdf de manera eficiente, luego de extraer la información del pdf necesito que utilices mi skill de dev best practices para que analicemos todos los requerimientos del proyecto y creemos un md file con las tareas que tenemos que realizar para la realización del proyecto, en el pdf se habla de 2 milestones, creemos un md por cada milestone los cuales se van a referenciar en el claude.md file principal del proyecto, la estructura de los md files que tiene los requerimientos y las tareas debe ser la siguiente: debe tener nombre de la tarea con descripción clara de la tarea y relaciones con otras tareas o requerimientos, al final del file debe haber un seguimiento de las tareas completadas que se pueden marcar con una "X" y la fecha en la que se realizó con notas opcionales que sean relevantes, el estilo que vamos a usar para el app es principalmente darkmode tipo steampunk retro, podemos agregar un modo claro que sea estilo acuarela con color de fondo como blanco marfil o crema, puedes usar la habilidad de design para crear el mockup del diseño y la paleta de colores que vamos a usar para cada modo, durante la planeación inicial me puedes hacer preguntas para cualquier decisión importante o de estilos.

2. Respuestas a las preguntas de planeación:
   > Milestones: "3 archivos (Recommended)" · Idioma docs: "Inglés (Recommended)" · Stack: "Vite + JS + CSS Modules (Recommended)" · Bitácora: "Sí, desde esta sesión (Recommended)"

3. Respuestas a las preguntas de diseño:
   > Nombre app: "Telegraph" · Idioma UI: "Usemos i18 para manejar inglés y español" · Equipo: "No, trabajo individual"

4. > Podemos usar agentes de sonnet cuando consideres pertinente para la tarea

### Resumen de la respuesta

- Se extrajo el texto de `Clon de X.pdf` con markitdown. El PDF define **3 milestones** (no 2),
  así que se crearon tres archivos de tareas.
- Se acordó: documentación y código en inglés, React + Vite + JavaScript + CSS Modules + Firebase,
  interfaz bilingüe es/en con i18next, marca **Telegraph**, trabajo individual.
- Se planearon 44 tareas (M1: 21, M2: 14, M3: 9), cada una con descripción, requisitos que cubre,
  dependencias, relaciones y criterio de "terminado", más una tabla de seguimiento al final.
- Se documentaron las trampas técnicas: login por username en Firebase Auth, límite de 30 valores en
  consultas `in`, paginación sin offset y transacciones con Auth.
- Se diseñó un mockup con dos temas: **Brass & Soot** (oscuro steampunk, por defecto) e
  **Ivory Wash** (claro acuarela). Incluye las paletas con tokens, la tipografía y las páginas de
  Feed y Login en cada tema: <https://claude.ai/artifact/HUXCqN3qrhiKpUyy8mtbP3>
- Un subagente (Claude Sonnet) auditó la cobertura de los documentos contra el PDF. Con su informe
  se corrigieron dependencias entre tareas, el conteo de caracteres con emoji, la paginación del
  feed por chunks, la regla de `createdAt` y la referencia al documento de reglas del repositorio.

### Archivos creados o modificados

- `CLAUDE.md` (creado)
- `docs/milestone-1.md` (creado)
- `docs/milestone-2.md` (creado)
- `docs/milestone-3.md` (creado)
- `docs/design-system.md` (creado)
- `bitacora.md` (creado)

---

## 2026-10-12 11:32 (UTC-5) — Unificación del diseño entre temas

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Opus 5.5 (`claude-opus-5-5`)

### Mensaje del estudiante (textual)

> Tenemos que ajustar el diseño, actualmente no se ve mal pero parecen 2 apps diferentes, la idea es que se vea que es el mismo app con íconos similares y lo que cambie sean los colores

### Resumen de la respuesta

- Se rehízo el mockup para que ambos temas sean el mismo producto: mismo logo de engranaje,
  íconos, tipografías (Cinzel + Lora + Special Elite), radios, remaches, marcos, manómetros y
  tarjetas de tweet. Solo cambian los valores de los tokens de color.
- Feed y Login ahora son un único componente con un ajuste `theme` (dark/light). Los tableros
  claros importan ese mismo componente, así que no pueden divergir.
- Se eliminó Fraunces y se agregaron tokens de color para los elementos decorativos (remaches,
  rayas del encabezado, manchas de fondo, marca de agua, manómetro y avisos de éxito).
- Nueva regla en `CLAUDE.md`: un tema solo cambia valores de tokens; nunca markup, íconos,
  fuentes ni formas (la única excepción es el ícono sol/luna del botón de tema).

### Archivos creados o modificados

- `docs/design-system.md` (modificado)
- `docs/milestone-1.md` (modificado: M1-04)
- `CLAUDE.md` (modificado: regla "One app, two palettes")
- `bitacora.md` (nueva entrada)
- Mockup: https://claude.ai/artifact/HUXCqN3qrhiKpUyy8mtbP3 (versión 7)

---

## 2026-10-12 12:12 (UTC-5) — M1-01: creación del repositorio y scaffold

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Opus 5.5 (`claude-opus-5-5`)

### Mensajes del estudiante (textuales)

1. > Se ve bien, podemos dar por terminado el diseño y podemos empezar con la creación del repositorio
2. Respuestas a las preguntas de configuración:
   > Cuenta: "xStarxLordx + gmail" · Repo: "telegraph · público (Recommended)" · PDF: "No, ignorarlo (Recommended)"

### Resumen de la respuesta

- Se generó el proyecto con `create-vite` 9.2.1 (plantilla React + JavaScript: React 19, Vite 8)
  y se agregó `react-router` 8. El template actual trae **oxlint**, que se reemplazará por
  ESLint + Airbnb en M1-02.
- Se creó un README esqueleto, la plantilla de PR (`.github/pull_request_template.md`) y
  `.gitattributes` para normalizar a LF. El PDF del enunciado se excluye con `.gitignore`.
- Se inicializó Git en `main` con autor local Francisco López <lopezfrancisco1506@gmail.com>.
- Verificación: `npm run build` correcto; el servidor de desarrollo responde 200 en `/` con el
  título "Telegraph".

### Archivos creados o modificados

- `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `.oxlintrc.json`,
  `public/*`, `src/*` (scaffold de Vite)
- `.gitignore`, `.gitattributes`, `.github/pull_request_template.md`, `README.md` (creados)
- `docs/milestone-1.md` (M1-01: react-router v8)
- `bitacora.md` (nueva entrada)

---

## 2026-10-12 12:24 (UTC-5) — M1-02: ESLint (Airbnb) y Prettier

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Opus 5.5 (`claude-opus-5-5`)

### Mensajes del estudiante (textuales)

1. > Sí, arranca la M1-02

### Resumen de la respuesta

- Evidencia del registro de npm: `eslint-config-airbnb` 19.0.4 solo soporta ESLint 7/8 (fuera de
  soporte); `eslint-config-airbnb-extended` 3.3.0 (port flat-config) requiere ESLint 9; ESLint 10
  aún no es compatible. Decisión: ESLint 9.39.5 + airbnb-extended + Prettier 3 +
  eslint-config-prettier + eslint-plugin-react-refresh, con el preset `jsx-runtime` de React.
- Se eliminó oxlint y se reemplazó el demo de Vite por un componente placeholder (el demo violaba
  reglas de Airbnb y se iba a reemplazar de todas formas).
- Se agregaron los scripts `lint`, `lint:fix`, `format` y `format:check`, y se formateó el repo
  (los cambios en la documentación son solo de formato: alineación de tablas y énfasis).
- Verificación: 291 reglas activas; `eslint-config-prettier` no detecta conflictos; un archivo
  roto a propósito falló con 11 errores (var, props mutadas, deps de hooks, alt, extensiones,
  prop-types, fast refresh); `npm run lint`, `format:check` y `build` en verde.
- `npm audit`: 5 avisos high en `braces` (dependencia transitiva, solo herramientas de
  desarrollo); `npm audit --omit=dev` sin vulnerabilidades. Se documentó en el README.
- Incidente: un comando con `git stash` dejó el stash sin aplicar; se verificó su contenido y se
  restauró sin pérdida de cambios.

### Archivos creados o modificados

- `eslint.config.js`, `.prettierrc.json`, `.prettierignore` (creados)
- `.oxlintrc.json`, `src/App.css`, `src/assets/*`, `public/icons.svg` (eliminados)
- `package.json`, `package-lock.json`, `src/App.jsx`, `src/main.jsx`, `src/index.css`,
  `vite.config.js` (modificados)
- `README.md` (sección Code style), `CLAUDE.md` (trampas de ESLint y remoto), `docs/*.md`
  (formato y seguimiento de M1-01/M1-02), `bitacora.md` (nueva entrada)

---

## 2026-10-12 15:22 (UTC-5) — M1-03: arquitectura y servicios mock

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Opus 5.5 (`claude-opus-5-5`)

### Mensajes del estudiante (textuales)

1. > Ya hice el merge, arranca la M1-03
2. Respuestas a las decisiones del plan:
   > Paginación: "Cursor (Recommended)" · Persistencia: "localStorage (Recommended)" · Tests: "Sí, Vitest ahora (Recommended)"

### Resumen de la respuesta

- Se definieron los contratos de los 4 servicios en `src/services/contracts.js` (JSDoc). Todos
  los métodos son asíncronos y las listas usan paginación por cursor (`{ items, nextCursor, total }`).
- Reglas de negocio puras en `src/domain/` (carpeta nueva, no estaba en el plan original):
  límites, validaciones, conteo de caracteres por code points, claves de orden sin tildes
  (incluye Ø, ß, æ) y comparación por código (igual que Firestore). Los errores se lanzan como
  `ServiceError` con `code`.
- Implementación mock: base de datos en memoria persistida en localStorage, semilla
  determinista (25 usuarios, 45 tweets, @ada con 2+ páginas en cada lista y seguidores sin
  seguir de vuelta), servicios construidos por factory con dependencias inyectadas, y
  `ServicesProvider` + `useServices`.
- ESLint: se fijó `parserOptions.ecmaVersion: 'latest'`, porque Airbnb lo fija en 2018 y
  bloqueaba `??` y `catch {}`. También se permitieron devDependencies en `*.test.jsx`.
- Vitest se adelantó desde M1-09: 55 tests en verde. Un test falló en la primera corrida por una
  suposición equivocada del propio test sobre la semilla; se reescribió para no depender de un
  usuario concreto. También se corrigieron 3 defectos de la semilla detectados al revisar el
  código antes de probarlo.
- Docs: README (Architecture, cuentas demo), CLAUDE.md (reglas de arquitectura), M1-09 y M3-01
  reescritas para el contrato por cursor.
- Revisión independiente con un subagente (Claude Sonnet). Se corrigieron los hallazgos reales:
  una cuenta de Google sin username podía publicar o seguir (`USERNAME_REQUIRED`); una cuenta de
  Google podía iniciar sesión sin contraseña; la comparación usaba unidades UTF-16 en vez de code
  points; el cursor por offset repetía elementos al insertar (ahora usa el id del último elemento,
  como `startAfter`); `pageSize` no se validaba; los listeners de sesión se deduplicaban, no se
  notificaban al hacer reset y podían interrumpir una escritura; el estado guardado no se validaba
  (ahora tiene `schemaVersion`); el mock no exigía que quien escribe sea el usuario en sesión
  (`PERMISSION_DENIED`). Se agregaron notas para Firebase en el contrato y se reforzaron los
  tests: valores esperados literales o calculados desde la semilla, y 74 tests en total.
- Verificación con mutaciones: se reintrodujo cada defecto corregido y siempre falló al menos un
  test; al restaurar, los 74 tests pasan.
- Limitación documentada (sin corregir): con dos pestañas abiertas, el mock se sobrescribe.

### Archivos creados o modificados

- `src/domain/*` (constants, errors, text, validation, sorting + domain.test.js)
- `src/services/contracts.js`, `ServicesContext.js`, `ServicesProvider.jsx` (+ test),
  `createAppServices.js`
- `src/services/mock/*` (seed, mockDatabase, paginateArray, mappers, requireActor,
  4 servicios, createMockServices + tests)
- `src/utils/storage.js` (+ test), `src/main.jsx`, `eslint.config.js`, `package.json`,
  `package-lock.json`
- `README.md`, `CLAUDE.md`, `docs/milestone-1.md`, `docs/milestone-3.md`, `bitacora.md`

---

## 2026-10-18 10:29 (UTC-5) — M1-04: tokens de diseño y temas

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Opus 5.5 (`claude-opus-5-5`)

### Mensajes del estudiante (textuales)

1. > adelanté algunas tareas en el app durante la semana, ahora necesito que continúes con las tareas del plan que siguén, dejé marcado lo completado en los md puedes revisar qué sigue para continuar
2. Respuestas a las preguntas de la sesión:
   > Alcance: "Todo lo que se pueda de M1"

### Resumen de la respuesta

- Revisión del estado: en `develop` solo M1-01…M1-03 estaban integrados (PR #1 y #2); lint y los
  74 tests en verde. Se actualizó `develop` local y se creó `feature/M1-04-theming`.
- `src/styles/tokens.css`: las dos paletas de `design-system.md` como custom properties bajo
  `data-theme` (oscuro por defecto, también sin atributo), más fuentes, radios y tamaño táctil
  compartidos. Es el único archivo con valores de color.
- `src/styles/global.css` (antes `src/index.css`): fondo, texto, tipografías, enlaces y anillo de
  foco desde los tokens. Google Fonts (Cinzel, Lora, Special Elite) en `index.html`.
- `src/theme/`: `themePreference.js` (funciones puras: leer, guardar, alternar y aplicar),
  `ThemeContext.js` (`useTheme`) y `ThemeProvider.jsx`, con el mismo patrón que `ServicesProvider`.
  La preferencia se guarda en `localStorage` (`telegraph.theme`).
- Script inline en `index.html` que aplica el tema guardado antes de montar React (sin parpadeo).
  Un test comprueba que usa la misma clave que `themePreference.js`.
- `ThemeToggle` (sol en oscuro, luna en claro) con íconos SVG de trazo; su `aria-label` queda en
  inglés hasta M1-05 (i18n). Favicon de Vite reemplazado por el engranaje de Telegraph.
- Verificación: 82 tests, lint, `format:check` y build en verde; `grep` sin colores hex fuera de
  `tokens.css`. La extensión de Chrome no estaba conectada, así que se verificó con Chrome
  headless por CDP (script en el scratchpad): el toggle cambia fondo, texto y títulos; la
  elección sobrevive a la recarga; sin errores en consola. Se corrigió un scroll vertical
  sobrante (`min-height: 100vh` en `body`).

### Archivos creados o modificados

- `src/styles/tokens.css`, `src/theme/*` (+ `theme.test.jsx`), `src/components/icons/icons.jsx`,
  `src/components/ThemeToggle/*` (creados)
- `src/styles/global.css` (movido desde `src/index.css`), `src/main.jsx`, `src/App.jsx`,
  `index.html`, `public/favicon.svg` (modificados)
- `README.md` (Architecture), `docs/milestone-1.md` (seguimiento M1-04), `bitacora.md`

---

## 2026-10-18 11:29 (UTC-5) — M1-05 a M1-19: SPA completa sobre datos mock

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Opus 5.5 (`claude-opus-5-5`); revisión independiente con un subagente
  Claude Sonnet

### Mensajes del estudiante (textuales)

1. > Ok hice todas las pruebas, modifiqué algunas cosas de diseño y probé la funcionalidad de dark y light mode, puedes hacer el commit con el push y el PR para hacer merge
2. Respuesta a la pregunta sobre los cambios de diseño (no aparecían en los archivos):
   > "Commit sin ellos"
3. > Listo ya está listo el merge puedes continuar con todas las tareas restantes de M1
4. Respuesta a la pregunta sobre commits:
   > Hagamos un solo commit al finalizar todas las tareas de M1, el push y el PR se harían cuando yo revise y pruebe todo lo que se hizo en M1 y de el visto bueno

### Resumen de la respuesta

- M1-04: commits, push y PR #3; el estudiante hizo el merge. Se trabajó M1-05…M1-19 en una sola
  rama (`feature/M1-05-to-M1-19-spa`), sin commit hasta la revisión del estudiante.
- Dependencias nuevas con versiones publicadas hace más de dos semanas: i18next 26.4.2,
  react-i18next 17.0.15, i18next-browser-languagedetector 8.2.1; de desarrollo jsdom 30.1.1 y
  Testing Library (react 16.3.3, dom 10.4.2, user-event 14.6.7). `npm audit --omit=dev` limpio.
- **M1-05 i18n:** `src/i18n/` con `es` por defecto (el detector solo mira `localStorage`, así un
  visitante nuevo siempre ve español), `en`, `<html lang>` sincronizado, mensajes por código de
  error (`errors.<code>`) con los límites interpolados, `LanguageSwitcher` y fechas con `Intl`.
- **M1-06 rutas:** `BrowserRouter` declarativo, `AuthLayout` y `AppLayout`, guards
  `RequireAuth`, `PublicOnly` y `RequireMissingUsername`, `AuthProvider` sobre
  `onAuthStateChanged`, página 404. La cuenta Google de demo (sin username) pasa por
  `/choose-username`: es la interfaz de M2-06 adelantada sobre el mock (no se marcó M2-06).
- **M1-07/M1-08:** header con textura de latón cepillado, navegación y componentes compartidos
  (Button/LinkButton, TextField/TextArea, Card con remaches, TweetCard con el formato G-06,
  UserListItem, Pagination, CounterGauge tipo manómetro, Notice, Toast, EmptyState, Spinner,
  PagedList, PageHeader). ESLint: `require-default-props` en `defaultArguments` porque React 19
  ignora `defaultProps`.
- **M1-09:** `usePaginatedList` con pila de cursores; el estado de carga se deriva de la última
  petición resuelta (la regla `react-hooks/set-state-in-effect` prohíbe `setState` síncrono en
  efectos). 9 tests: vacío, 10, 11, adelante/atrás, recarga, página vaciada, error, cambio de
  fuente y respuesta tardía.
- **M1-10…M1-17:** páginas de registro, login, inicio, redactar (contador por code points, aviso a
  20 del límite, bloqueo sobre 280), siguiendo, seguidores (botón Seguir solo si se sabe que no lo
  sigo; contadores refrescados por `SocialProvider`), perfil de usuario y feed. La lógica vive en
  hooks (`useForm`, `useTweetDraft`, `useFollowUser`, `useFollowCounts`…).
- **M1-18:** auditoría en Chrome headless (la extensión de Chrome no estaba conectada) a 360, 768
  y 1280 px: áreas táctiles de 44 px, labels, nombres accesibles, un `h1` por página, sin scroll
  horizontal; skip link; login completo solo con teclado; contraste de los pares de color nuevos
  ≥ 4.5:1 en ambos temas. Se corrigió el enlace `@username` del header (36 px de ancho).
- **M1-19:** README con funcionalidades, stack, puesta en marcha, arquitectura, pruebas y estilo.
  CLAUDE.md: reglas de seguir y redirecciones, y trampas de React 19, `set-state-in-effect` y
  entorno jsdom.
- Verificación: 120 tests (38 nuevos, incluidos tests de integración que montan la app completa
  sobre mocks), lint, `format:check` y build en verde; sin hex fuera de `tokens.css` ni textos sin
  traducir. Pruebas de mutación: se reintrodujeron 4 defectos (sin retroceso de página, sin
  descartar respuestas tardías, botón Seguir siempre visible, conteo UTF-16) y cada uno hizo fallar
  al menos un test. Un test de orden alfabético falló por usar `localeCompare` en vez de la regla
  del dominio; se corrigió el test, no la app.
- Revisión independiente (subagente Claude Sonnet, solo lectura). Se corrigieron los hallazgos
  reales: tras cerrar sesión, el siguiente usuario aterrizaba en la última página del anterior
  (ahora la sesión sabe que terminó y el guard no guarda `from`); el botón Seguir reaparecía unos
  300 ms tras seguir y podía pulsarse dos veces (se oculta mientras el estado recarga; pendientes
  por usuario); un error de paginación no permitía volver a la primera página; el contador no
  hacía `trim` como el servicio; un error viejo del login tapaba uno nuevo; sin scroll arriba ni
  foco en el contenido al cambiar de ruta; los botones de paginación se deshabilitaban con el foco
  encima; el contador no se anunciaba a lectores de pantalla; los contadores mostraban 0 mientras
  cargaban. Se reforzaron los tests débiles que señaló (el de perfil no probaba el botón Seguir) y
  se agregaron tests de logout + nuevo login, registro, cambio de idioma y seguir desde un perfil.
  Cada corrección se verificó reintroduciendo el defecto: siempre falló al menos un test.
- Pendiente menor (no corregido): un fallo al cerrar sesión no muestra mensaje; un primer login
  con Google pierde el enlace profundo al que se quería ir.

### Archivos creados o modificados

- `src/i18n/*` (i18n, errorKey, useErrorMessage, locales es/en + test), `src/auth/*`,
  `src/social/*`, `src/routes/*` (paths, guards, AppRoutes + test), `src/layouts/*`,
  `src/hooks/*` (usePaginatedList + test, useAsyncData, useAsyncAction, useForm, useFollowData,
  useFollowUser, useTweetDraft + test, useLogout, usePageTitle), `src/pages/*` (+ pages.test),
  `src/components/*` (Button, TextField, Card, TweetCard + test, UserListItem, Pagination,
  CounterGauge, Notice, Toast, EmptyState, Spinner, Logo, LanguageSwitcher, Header, MainNav,
  SocialPanel, PageHeader, PagedList, icons), `src/AppProviders.jsx`, `src/test/renderApp.jsx`,
  `src/utils/formatDateTime.js` (creados)
- `src/App.jsx`, `src/main.jsx`, `src/components/ThemeToggle/ThemeToggle.jsx`, `src/styles/global.css`,
  `eslint.config.js`, `package.json`, `package-lock.json` (modificados)
- `README.md`, `CLAUDE.md`, `docs/milestone-1.md` (seguimiento M1-05…M1-19),
  `docs/milestone-2.md` (nota en M2-06), `bitacora.md`

---

## 2026-10-28 22:05 (UTC-5) — Revisión de la integración con Firebase y actualización del contexto

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Sonnet 5.5 (`claude-sonnet-5-5`)

### Mensaje del estudiante (textual)

> El fin de semana adelanté en el proyecto la implementación de firebase en todo el app, ya funciona el registro y el inicio de sesion, quiero que revises todo lo que hice nuevo y actualices el contexto del app en el claude.md y veamos qué tareas adicionales faltan del plan inicial para terminar y crear datos mockup para demostrar todas las funcionalidades del app

### Resumen de la respuesta

- Se revisó el commit `c13b029` (31 archivos): `authService` sobre Firebase, `firestore.rules` solo
  para `users`, hooks `useLogin` / `useRegister` / `useChooseUsername`, `mapFirebaseError` y
  tests. Línea base antes de editar: 173 tests, `lint`, `format:check` y `build` en verde.
- Hallazgo verificado con una sonda temporal (borrada): `createAppServices` solo cambia
  `authService`; los mocks de usuarios, tweets y follows consultan la sesión del mock, así que un
  usuario de Firebase recibe `auth/not-authenticated` al publicar o seguir, y su perfil, contadores
  y feed salen vacíos.
- El modelo de datos implementado (`users/{usernameLower}`) difiere del texto de M2-02 / M2-04 /
  M2-05; se documentó en `CLAUDE.md` junto con la consecuencia en las reglas.
- Se agregó a `CLAUDE.md` la sección "Firebase wiring", se corrigió la regla de cuentas demo
  (solo existen dentro del mock) y la trampa del login por username.
- No se marcó ninguna tarea en las tablas de seguimiento ni se cambió código.

### Archivos creados o modificados

- `CLAUDE.md` (modificado), `bitacora.md` (nueva entrada)

---

## 2026-10-28 22:40 (UTC-5) — M2-02 y servicios Firebase (users, tweets, follows)

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Sonnet 5.5 (`claude-sonnet-5-5`)

### Mensaje del estudiante (textual)

> terminemos M2-02 y los servicios Firebase antes del seed.

### Resumen de la respuesta

- Rama `feature/M2-02-to-M2-12-firebase-services`, creada desde `origin/develop` (con el PR #5).
- **Reglas e índices (M2-02):** `firestore.rules` cubre ahora `tweets` y `follows` (campos
  exactos, 280 caracteres, `createdAt == request.time`, id de follow derivado de los dos uid,
  sin ediciones ni borrados). Los nombres copiados en tweets y follows se comprueban contra el
  perfil con `get()`. `firestore.indexes.json` tiene los 3 índices compuestos.
- **Servicios (M2-03, M2-08 a M2-12 y el helper de M3-01):** `firebaseUserService`,
  `firebaseTweetService`, `firebaseFollowService`, `paginateQuery` (cursor `startAfter` + total
  con `getCountFromServer`) y `profiles` (extraído de `firebaseAuthService`, que ahora lo usa).
  `createAppServices` entrega solo implementaciones Firebase; ninguna página ni componente
  cambió (comprobado con `git status`).
- **Decisión de diseño:** el feed por chunks usa **un solo cursor** (el último tweet mostrado) en
  vez de uno por chunk como decía M2-12, porque todos los chunks comparten el orden; lo que un
  chunk no devolvió queda después de ese tweet. Documentado en README, `milestone-2.md` y
  `CLAUDE.md`. Las listas desempatan por nombre y luego `username`, igual que `compareByFullName`.
- **Pruebas sin emulador (el equipo tiene Java 8):** `src/test/fakeFirestore.js` ordena, filtra y
  pagina como Firestore y rechaza `in` con más de 30 valores y consultas sin índice compuesto en
  `firestore.indexes.json`. No ejecuta las reglas; `firestoreRules.test.js` solo verifica que sus
  campos y límites coincidan con el código.
- Verificación: lint, `format:check`, build y 236 tests en verde (antes 173). Pruebas de mutación:
  9 defectos en los servicios y 6 en reglas/código se reintrodujeron uno a uno y cada uno hizo
  fallar al menos un test. Un test de M1 (`createAppServices` sobre `localStorage`) quedó obsoleto
  y, con servicios reales, golpeaba el proyecto Firebase; se reemplazó por un test de composición
  sin red.
- **No verificado:** que las reglas compilen y se comporten como se espera, que los índices
  construyan y el comportamiento contra el SDK real. Requiere desplegar (`firebase login` pendiente)
  y probar la app. No se marcó ninguna tarea en las tablas de seguimiento.

### Archivos creados o modificados

- Creados: `src/services/firebase/` (`firebaseUserService`, `firebaseTweetService`,
  `firebaseFollowService`, `paginateQuery`, `profiles` + tests de cada servicio y
  `firestoreRules.test.js`), `src/test/` (`fakeFirestore`, `fakeFirestore.test`,
  `firebaseFixtures`), `src/utils/chunk.js` (+ test), `src/services/createAppServices.test.js`
- Modificados: `firestore.rules`, `firestore.indexes.json`, `src/services/createAppServices.js`,
  `src/services/firebase/` (`collections`, `mapFirebaseError` + test, `firebaseAuthService`),
  `src/domain/validation.js` (+ test), `src/services/mock/paginateArray.js`,
  `src/utils/storage.test.js`, `README.md`, `CLAUDE.md`, `docs/milestone-2.md`, `bitacora.md`

---

## 2026-10-28 22:56 (UTC-5) — Datos demo en Firebase y prueba de extremo a extremo

- **Herramienta:** Claude Code (CLI)
- **Modelo:** Claude Sonnet 5.5 (`claude-sonnet-5-5`)

### Mensajes del estudiante (textuales)

1. > ya hice lo de npx firebase-tools deploy --only firestore:rules,firestore:indexes pero no veo los datos en el app
2. > Quiero que inyectes los datos de mockup en firebase y ya creé la clave de service account y está en "[ruta omitida a propósito: es el archivo de una clave secreta, fuera del repositorio, y este repo es público]"

### Resumen de la respuesta

- **Diagnóstico del mensaje 1:** Firestore estaba vacío. Una lectura pública de `users/ada`,
  `users/babbage` y `users/tesla` devolvió 404: los 25 usuarios demo existían solo en el mock, que
  la app ya no usa. Los 3 índices estaban desplegados.
- **Dataset (`scripts/demoData.js`):** la semilla del mock más 17 personas y 52 tweets nuevos:
  42 cuentas, 97 tweets, 200 follows. Cubre: `ada` (2 páginas en todo), `telegrafista` (sigue a
  32: el feed necesita dos chunks), `diez` (exactamente 10), `once` (exactamente 11), `novato`
  (estados vacíos), dos "Mary Shelley" (desempate), `Hypatia` (username con mayúscula) y tweets de
  280 caracteres, con emoji y multilínea. Es puro; sus tests (16) lo cargan en el Firestore falso y
  ejecutan los servicios reales encima. Pruebas de mutación: 7 defectos, todos detectados (uno
  sobrevivió al principio, un test tautológico sobre el prefijo `demo-`, y se corrigió).
- **Script (`scripts/seed-firebase.mjs`, `npm run seed`):** Admin SDK; `--dry-run`, `--clean`.
  Idempotente (ids fijos), rechaza una clave de otro proyecto, aborta si pisaría una cuenta real
  y solo borra uids con prefijo `demo-`. Dependencia nueva: `firebase-admin` 14.5.0 (publicada el
  2026-09-23), solo desarrollo.
- **Ejecución real en `x-clone-desarrollo1`:** 42 cuentas creadas; lectura de vuelta: 42 / 42 / 97 / 200.
- **Prueba de extremo a extremo** (archivo temporal, ya borrado) con el SDK de cliente y los
  servicios reales contra las reglas e índices desplegados: login como `ada`, contadores 14/14,
  listas `[10,4]`, feed de `telegrafista` con 65 tweets únicos y ordenados en 7 páginas; las 13
  escrituras maliciosas (281 caracteres, autor falso, follow a nombre de otro, a sí mismo o a un
  inexistente, editar y borrar) fueron rechazadas; publicar y seguir como `novato` funcionó.
- **Hallazgos:**
  1. Una prueba mía escribió `users/nuevoperfil` con el uid de `ada`: las reglas lo aceptan (es la
     limitación ya documentada de varios perfiles por cuenta). Se borró.
  2. **`size()` de las reglas cuenta unidades UTF-16**: 280 × `ñ` y 140 × 😀 se aceptan; 141 × 😀
     se rechaza. La app cuenta code points, así que un tweet con muchos emoji pasa la UI y las
     reglas lo deniegan. **Sin corregir; decisión pendiente.**
  3. `npm audit` ya no muestra los avisos de `braces`; quedan 4 de `@grpc/grpc-js` vía `firebase`
     (ya estaban antes de esta sesión, no están en el bundle del navegador). README y CLAUDE.md
     tenían una afirmación obsoleta; se corrigió.
- Todo lo creado por las pruebas se borró con Admin SDK: `novato` quedó con 0 tweets y 0 follows.
- Verificación final: lint, `format:check`, build y 252 tests en verde. No se marcó ninguna tarea
  en las tablas de seguimiento.

### Archivos creados o modificados

- Creados: `scripts/demoData.js`, `scripts/demoData.test.js`, `scripts/seed-firebase.mjs`,
  `src/test/firestoreRules.js`
- Modificados: `package.json` y `package-lock.json` (`firebase-admin`, script `seed`),
  `eslint.config.js` (bloque para `scripts/`), `.gitignore` (patrones de claves),
  `src/services/firebase/firestoreRules.test.js` (usa el helper compartido), `README.md`,
  `CLAUDE.md`, `bitacora.md`
