import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  // Use the packages' TypeScript sources, so edits show up without a build (docs/plan D-017).
  resolve: { conditions: ['@nepdate/source', ...defaultClientConditions] },
  server: { fs: { allow: [repo] } },
  build: {
    rollupOptions: {
      input: {
        react: `${root}index.html`,
        vanilla: `${root}vanilla.html`,
        script: `${root}script.html`,
        styles: `${root}styles.html`,
      },
    },
  },
});
