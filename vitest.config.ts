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
    },
  },
});
