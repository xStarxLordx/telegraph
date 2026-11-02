// ESLint flat config: Airbnb style guide (via eslint-config-airbnb-extended, the flat-config
// port of the official rules, with its TypeScript preset) + React Refresh for Vite + Prettier
// last, so formatting rules are owned by Prettier and never conflict with ESLint.
import js from '@eslint/js';
import { configs, plugins } from 'eslint-config-airbnb-extended';
import prettierConfig from 'eslint-config-prettier/flat';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

// React 17+ JSX transform (used by Vite): React no longer needs to be in scope.
// Taken from the same eslint-plugin-react instance Airbnb registers, to avoid a duplicate plugin.
const reactJsxRuntime = plugins.react.plugins.react.configs.flat['jsx-runtime'];

const airbnb = [
  ...configs.base.recommended,
  ...configs.react.recommended,
  ...configs.base.typescript,
  ...configs.react.typescript,
];
const airbnbSetting = (name) => airbnb.find((config) => config.name === name);

// Components stay in .jsx but import the .ts modules: they resolve imports the way .ts files do.
const typescriptImports = airbnbSetting(
  'airbnb/config/react-typescript-settings-extensions-configurations',
);
const typescriptExtensionsRule = airbnbSetting('airbnb/config/typescript/import-x').rules[
  'import-x/extensions'
];

// Airbnb's own restricted syntax (for..in, labels…), extended below rather than replaced.
const [, ...airbnbRestrictedSyntax] =
  airbnbSetting('airbnb/config/style').rules['no-restricted-syntax'];

export default [
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  plugins.stylistic,
  plugins.importX,
  plugins.react,
  plugins.reactA11y,
  plugins.reactHooks,
  plugins.typescriptEslint,
  ...airbnb,
  reactJsxRuntime,
  reactRefresh.configs.vite,
  {
    // Airbnb pins parserOptions.ecmaVersion to 2018 (which wins over languageOptions.ecmaVersion);
    // Vite compiles modern syntax such as `??` and `catch {}`.
    name: 'telegraph/modern-syntax',
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest' },
    },
  },
  {
    // React 19 ignores `defaultProps` on function components, so optional props get their
    // defaults from destructuring instead (Airbnb asks for `defaultProps`).
    name: 'telegraph/react-19',
    rules: {
      'react/require-default-props': [
        'error',
        { forbidDefaultForRequired: true, functions: 'defaultArguments' },
      ],
    },
  },
  {
    // So does the Vitest test of the Node scripts.
    name: 'telegraph/jsx-imports-typescript',
    files: ['**/*.jsx', 'scripts/**/*.test.js'],
    settings: typescriptImports.settings,
    rules: { 'import-x/extensions': typescriptExtensionsRule },
  },
  {
    // Every interface and type alias lives in src/interfaces/, so the shapes the app shares
    // are declared once and found in one place.
    name: 'telegraph/interfaces-folder',
    files: ['src/**/*.ts'],
    ignores: ['src/interfaces/**', '**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...airbnbRestrictedSyntax,
        {
          selector: 'TSInterfaceDeclaration',
          message: 'Declare interfaces in src/interfaces/.',
        },
        {
          selector: 'TSTypeAliasDeclaration',
          message: 'Declare types in src/interfaces/.',
        },
      ],
    },
  },
  {
    name: 'telegraph/browser-globals',
    files: ['src/**/*.{ts,jsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Airbnb's dev-dependency globs cover *.test.ts but not *.test.jsx (component tests) or
    // the shared test helpers in src/test/.
    name: 'telegraph/tests',
    files: ['**/*.test.{js,ts,jsx}', 'src/test/**/*.{ts,jsx}'],
    // Vitest runs in Node.
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
  {
    // Node scripts (`npm run seed`): run by `node` itself, so imports keep their file extension,
    // they print to the console and may use dev dependencies.
    name: 'telegraph/node-scripts',
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
      'import-x/extensions': 'off',
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
  prettierConfig,
];
