/**
 * Size budgets (docs/plan/03-tooling.md, TOOL-012). Each package's built ESM
 * entry is bundled and minified with its @nepdate dependencies and framework
 * peers left external, then gzipped. Run after `pnpm build`.
 *
 * Run: node scripts/check-size.ts
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'rolldown';

interface Budget {
  /** Built file, relative to the package folder. */
  file: string;
  /** Bundle it (true) or measure the file as it is, e.g. an already-minified IIFE. */
  bundle: boolean;
  maxGzipBytes: number;
}

const KB = 1000;

export const BUDGETS: Record<string, Budget[]> = {
  core: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 6 * KB }],
  calendar: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 4 * KB }],
  datepicker: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 3 * KB }],
  dom: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 1.5 * KB }],
  react: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 8 * KB }],
  vanilla: [
    { file: 'dist/index.js', bundle: true, maxGzipBytes: 8 * KB },
    { file: 'dist/nepdate-picker.global.js', bundle: false, maxGzipBytes: 22 * KB },
  ],
};

const EXTERNAL = [/^@nepdate\//, /^react(?:-dom)?(?:\/|$)/];

export async function measure(path: string, bundle: boolean): Promise<number> {
  if (!bundle) {
    return gzipSync(readFileSync(path)).length;
  }
  const result = await build({
    input: path,
    write: false,
    external: EXTERNAL,
    output: { format: 'esm', minify: true },
  });
  const code = result.output.map((chunk) => ('code' in chunk ? chunk.code : '')).join('');

  return gzipSync(code).length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let failed = false;

  for (const [pkg, budgets] of Object.entries(BUDGETS)) {
    for (const budget of budgets) {
      const path = resolve(root, 'packages', pkg, budget.file);
      if (!existsSync(path) || !statSync(path).isFile()) {
        console.error(
          `✖ @nepdate/${pkg} ${budget.file} is missing. Run \`pnpm build\` first.`,
        );
        failed = true;
        continue;
      }
      const bytes = await measure(path, budget.bundle);
      const ok = bytes <= budget.maxGzipBytes;
      failed ||= !ok;
      console.log(
        `${ok ? '✔' : '✖'} @nepdate/${pkg} ${budget.file}: ${(bytes / KB).toFixed(2)} kB gzip (budget ${(budget.maxGzipBytes / KB).toFixed(1)} kB)`,
      );
    }
  }

  if (failed) {
    process.exit(1);
  }
}
