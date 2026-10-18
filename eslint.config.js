// ESLint flat config: Airbnb style guide (via eslint-config-airbnb-extended, the flat-config
// port of the official rules) + React Refresh for Vite + Prettier last, so formatting rules
// are owned by Prettier and never conflict with ESLint.
import js from '@eslint/js';
import { configs, plugins } from 'eslint-config-airbnb-extended';
import prettierConfig from 'eslint-config-prettier/flat';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

// React 17+ JSX transform (used by Vite): React no longer needs to be in scope.
// Taken from the same eslint-plugin-react instance Airbnb registers, to avoid a duplicate plugin.
const reactJsxRuntime = plugins.react.plugins.react.configs.flat['jsx-runtime'];

export default [
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  plugins.stylistic,
  plugins.importX,
  plugins.react,
  plugins.reactA11y,
  plugins.reactHooks,
  ...configs.base.recommended,
  ...configs.react.recommended,
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
    name: 'telegraph/browser-globals',
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Airbnb's dev-dependency globs cover *.test.js but not *.test.jsx (component tests) or
    // the shared test helpers in src/test/.
    name: 'telegraph/tests',
    files: ['**/*.test.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    // Vitest runs in Node.
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
  prettierConfig,
];
