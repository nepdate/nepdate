import { defaultClientConditions, defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

/** Resolve @nepdate/* to their TypeScript sources so tests never need a build first. */
const SOURCE_CONDITION = '@nepdate/source';

export default defineConfig({
  resolve: { conditions: [SOURCE_CONDITION, ...defaultClientConditions] },
  ssr: { resolve: { conditions: [SOURCE_CONDITION, ...defaultServerConditions] } },
  test: {
    include: ['packages/*/test/**/*.test.{ts,tsx}', 'scripts/test/**/*.test.ts'],
    environment: 'node',
    typecheck: {
      enabled: true,
      include: ['packages/*/test/**/*.test-d.ts'],
      tsconfig: './tsconfig.typetests.json',
    },
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      exclude: ['packages/core/src/bs/data/years.ts'],
      thresholds: {
        // Branches below 100% are the `?? 0` fallbacks noUncheckedIndexedAccess requires.
        'packages/core/src/**': {
          statements: 100,
          lines: 100,
          functions: 100,
          branches: 90,
        },
        'packages/dom/src/**': {
          statements: 100,
          lines: 100,
          functions: 100,
          branches: 100,
        },
        'packages/datepicker/src/**': {
          statements: 99,
          lines: 99,
          functions: 100,
          branches: 90,
        },
        'packages/calendar/src/**': {
          statements: 99,
          lines: 99,
          functions: 100,
          branches: 90,
        },
      },
    },
  },
});
