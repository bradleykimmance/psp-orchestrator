import { defineConfig } from 'eslint/config';
import auto from 'eslint-config-canonical/auto';
import { recommended as vitestConfig } from 'eslint-config-canonical/vitest';
import reactRefresh from 'eslint-plugin-react-refresh';

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig(
  {
    ignores: ['**/dist', '**/node_modules', 'package-lock.json'],
  },
  ...auto,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./web/tsconfig.eslint.json', './worker/tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...vitestConfig.map((config) => ({
    ...config,
    files: ['**/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
  })),
  {
    files: ['web/src/**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/react-in-jsx-scope': 'off',
    },
  },
);
