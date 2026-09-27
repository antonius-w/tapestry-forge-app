import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'vue', 'vitest'],
  env: {
    browser: true,
  },
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  rules: {
    'eslint/no-console': ['error', { allow: ['warn', 'error'] }],
    'no-nested-ternary': 'error',
    'func-style': ['error', 'declaration'],
    'typescript/explicit-function-return-type': 'error',
    'typescript/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'never',
      },
    ],
    complexity: ['error', { max: 10 }],
  },
});
