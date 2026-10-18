import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'neutral',
    target: 'es2020',
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: { 'nepdate-calendar': 'src/index.ts' },
    format: ['iife'],
    platform: 'browser',
    target: 'es2020',
    globalName: 'NepDateCalendar',
    minify: true,
    sourcemap: true,
    dts: false,
    clean: false,
    deps: { alwaysBundle: [/^@nepdate\//] },
    outputOptions: { entryFileNames: '[name].global.js' },
  },
]);
