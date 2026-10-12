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
