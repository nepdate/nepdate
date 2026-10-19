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
  /** Measure only these exports, to check tree-shaking (TEST-034). */
  only?: string[];
  maxGzipBytes: number;
}

const KB = 1000;

export const BUDGETS: Record<string, Budget[]> = {
  // The whole API with en + ne names, incl. time (A3); 8 kB since D-035.
  core: [
    { file: 'dist/index.js', bundle: true, maxGzipBytes: 8 * KB },
    { file: 'dist/index.js', bundle: true, only: ['adToBs'], maxGzipBytes: 3 * KB },
    // A typical form: parse what was typed, store AD, show BS.
    {
      file: 'dist/index.js',
      bundle: true,
      only: ['parseDate', 'toIsoDate', 'formatDate'],
      maxGzipBytes: 4.5 * KB,
    },
  ],
  // Day, month, year and fiscal-year views; 4.5 kB since FY-001 (docs/plan D-034).
  calendar: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 4.5 * KB }],
  // Single, range, date-time and multiple-date pickers and presets; 6 kB since D-042.
  datepicker: [
    { file: 'dist/index.js', bundle: true, maxGzipBytes: 6 * KB },
    // One picker: what most apps ship.
    {
      file: 'dist/index.js',
      bundle: true,
      only: ['createDatePicker'],
      maxGzipBytes: 3 * KB,
    },
  ],
  dom: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 1.5 * KB }],
  holidays: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 2 * KB }],
  react: [{ file: 'dist/index.js', bundle: true, maxGzipBytes: 8 * KB }],
  vanilla: [
    // Five elements incl. <nep-multi-date-picker>; 11 kB / 26 kB since D-042.
    { file: 'dist/index.js', bundle: true, maxGzipBytes: 11 * KB },
    { file: 'dist/nepdate-picker.global.js', bundle: false, maxGzipBytes: 26 * KB },
    // One element per page: each entry must stay well under the full package.
    { file: 'dist/date-picker.js', bundle: true, maxGzipBytes: 7 * KB },
    { file: 'dist/calendar.js', bundle: true, maxGzipBytes: 4 * KB },
    { file: 'dist/date-range-picker.js', bundle: true, maxGzipBytes: 6.5 * KB },
    { file: 'dist/date-time-picker.js', bundle: true, maxGzipBytes: 6.5 * KB },
    { file: 'dist/multi-date-picker.js', bundle: true, maxGzipBytes: 6 * KB },
  ],
};

const EXTERNAL = [/^@nepdate\//, /^react(?:-dom)?(?:\/|$)/];

const VIRTUAL_ENTRY = '\0nepdate-size-entry';

export async function measure(
  path: string,
  bundle: boolean,
  only?: string[],
): Promise<number> {
  if (!bundle) {
    return gzipSync(readFileSync(path)).length;
  }
  const result = await build({
    input: only ? VIRTUAL_ENTRY : path,
    write: false,
    // React's 'use client' banner is meant for frameworks, not this measurement.
    onLog: (level, log, handler) => {
      if (log.code !== 'MODULE_LEVEL_DIRECTIVE') {
        handler(level, log);
      }
    },
    external: EXTERNAL,
    plugins: only
      ? [
          {
            name: 'size-entry',
            resolveId: (id) => (id === VIRTUAL_ENTRY ? id : null),
            load: (id) =>
              id === VIRTUAL_ENTRY
                ? `export { ${only.join(', ')} } from ${JSON.stringify(path)};`
                : null,
          },
        ]
      : [],
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
      const bytes = await measure(path, budget.bundle, budget.only);
      const ok = bytes <= budget.maxGzipBytes;
      failed ||= !ok;
      console.log(
        `${ok ? '✔' : '✖'} @nepdate/${pkg} ${budget.only ? `{ ${budget.only.join(', ')} }` : budget.file}: ${(bytes / KB).toFixed(2)} kB gzip (budget ${(budget.maxGzipBytes / KB).toFixed(1)} kB)`,
      );
    }
  }

  if (failed) {
    process.exit(1);
  }
}
