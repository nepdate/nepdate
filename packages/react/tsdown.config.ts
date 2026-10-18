import { defineConfig } from 'tsdown';

/** Client entries get a 'use client' banner (React Server Components); server.ts stays plain. */
const CLIENT_ENTRIES = new Set(['index', 'headless']);

export default defineConfig({
  entry: ['src/index.ts', 'src/headless.ts', 'src/server.ts'],
  format: ['esm', 'cjs'],
  platform: 'browser',
  target: 'es2020',
  dts: true,
  sourcemap: true,
  clean: true,
  outputOptions: {
    banner: (chunk) =>
      chunk.isEntry && CLIENT_ENTRIES.has(chunk.name) && !chunk.fileName.includes('.d.')
        ? "'use client';"
        : '',
  },
});
