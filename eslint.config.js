// @ts-check
import { readFileSync } from 'node:fs';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {{ packages: Record<string, { internal: string[]; external: string[]; mayUseDate?: boolean }> }} */
const boundaries = JSON.parse(
  readFileSync(new URL('./boundaries.json', import.meta.url), 'utf8'),
);
const allPackages = Object.keys(boundaries.packages);

const dateBan = [
  {
    selector: "NewExpression[callee.name='Date']",
    message: 'Only @nepdate/core may create Date objects. Ask core instead (D-004).',
  },
  {
    selector: "MemberExpression[object.name='Date'][property.name=/^(now|UTC|parse)$/]",
    message: 'Only @nepdate/core may read the clock or do date maths (D-004).',
  },
];

/** Per-package import rules, generated from boundaries.json. */
const packageRules = allPackages.map((name) => {
  const rule = boundaries.packages[name] ?? { internal: [], external: [] };
  const forbidden = allPackages
    .filter((other) => other !== name && !rule.internal.includes(other))
    .map((other) => `@nepdate/${other}`);

  return {
    files: [`packages/${name}/src/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: forbidden.map((path) => ({
            name: path,
            message: `@nepdate/${name} may not import ${path} (see boundaries.json).`,
          })),
          patterns: [
            {
              group: forbidden.map((path) => `${path}/*`),
              message: `@nepdate/${name} may not import this package (see boundaries.json).`,
            },
            {
              group: ['../../*'],
              message:
                'Import other packages by name (@nepdate/...), not by relative path.',
            },
          ],
        },
      ],
      'no-restricted-syntax': rule.mayUseDate ? 'off' : ['error', ...dateBan],
    },
  };
});

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      'docs/**',
      'scripts/test/fixtures/**',
      'packages/core/src/bs/data/years.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': 'error',
    },
  },
  ...packageRules,
  // D-001: inside core, AD code never reads BS code and BS code never reads AD code.
  {
    files: ['packages/core/src/ad/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../bs/*', '**/bs/**'],
              message: 'AD code may not import BS code (D-001).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/core/src/bs/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../ad/*', '**/ad/**'],
              message: 'BS code may not import AD code (D-001).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['scripts/**', '**/test/**', '**/*.config.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
);
