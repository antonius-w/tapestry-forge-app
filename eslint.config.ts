import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import pluginOxlint from 'eslint-plugin-oxlint';
import skipFormatting from 'eslint-config-prettier/flat';
import oxlintConfig from './oxlint.config';

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use literal unions or `as const` objects instead of enums.',
        },
        {
          selector: 'IfStatement > IfStatement.alternate',
          message: 'Avoid `else if`. Prefer early returns or ternary operators.',
        },
        {
          selector: 'IfStatement > :not(IfStatement).alternate',
          message: 'Avoid `else`. Prefer early returns or ternary operators.',
        },
        {
          selector:
            'CallExpression[callee.property.name="push"][callee.object.name="router"] > Literal:first-child',
          message: 'Use named routes with RouteNames instead of hardcoded path strings.',
        },
        {
          selector:
            'CallExpression[callee.property.name="push"][callee.object.name="router"] > TemplateLiteral:first-child',
          message: 'Use named routes with RouteNames instead of template literals.',
        },
      ],
    },
  },

  {
    files: ['src/**/*.vue'],
    rules: {
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false,
        },
      ],
      'vue/custom-event-name-casing': ['error', 'kebab-case'],
      'vue/define-props-destructuring': 'error',
      'vue/require-expose': 'warn',
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['App', 'Layout'],
        },
      ],
      'vue/no-unused-properties': [
        'error',
        {
          groups: ['props', 'data', 'computed', 'methods'],
        },
      ],
      'vue/prefer-use-template-ref': 'error',
    },
  },

  {
    files: ['src/**/__tests__/**/*.{ts,spec.ts}'],
    ignores: ['src/__tests__/helpers/**'],
    rules: {
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-mock-promise-shorthand': 'error',
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-hooks-in-order': 'error',
      'vitest/no-duplicate-hooks': 'error',
      'vitest/require-top-level-describe': 'error',
      'vitest/max-nested-describe': ['error', { max: 2 }],
      'vitest/no-conditional-in-test': 'warn',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'CallExpression[callee.property.name=/^querySelector(All)?$/]',
          message:
            'Prefer page.getByRole(), page.getByText(), or page.getByTestId() over querySelector. Vitest locators are more resilient to DOM changes.',
        },
      ],
    },
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfig(oxlintConfig),
  skipFormatting,
);
