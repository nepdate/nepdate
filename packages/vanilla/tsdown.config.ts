import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/auto-define.ts'],
    format: ['esm', 'cjs'],
    platform: 'browser',
    target: 'es2020',
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: { 'nepdate-picker': 'src/global.ts' },
    format: ['iife'],
    platform: 'browser',
    target: 'es2020',
    globalName: 'NepDateElements',
    minify: true,
    sourcemap: true,
    dts: false,
    clean: false,
    deps: { alwaysBundle: [/^@nepdate\//] },
    outputOptions: { entryFileNames: '[name].global.js' },
  },
]);
