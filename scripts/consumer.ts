/**
 * Installs the packed packages into a throwaway project, the way users get
 * them, and checks them there (TEST-031, TEST-033):
 *
 *   prepare <dir>  pack every package, install the tarballs, write consumer files
 *   types   <dir>  type-check consumers with moduleResolution node16 (ESM + CJS) and bundler
 *   run     <dir>  load every entry with plain Node: ESM import and CJS require
 *
 * `run` only executes plain .mjs/.cjs files, so CI can run it on Node 18.
 * Run `pnpm build` first.
 *
 *   node scripts/consumer.ts all [dir]   prepare + types + run
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [command = 'all', dirArg] = process.argv.slice(2);
const dir = resolve(dirArg ?? mkdtempSync(join(tmpdir(), 'nepdate-consumer-')));

/** Every JS entry users can import, by package. */
const ENTRIES: Record<string, string[]> = {
  core: ['@nepdate/core', '@nepdate/core/data'],
  calendar: ['@nepdate/calendar'],
  datepicker: ['@nepdate/datepicker'],
  dom: ['@nepdate/dom'],
  holidays: ['@nepdate/holidays'],
  react: ['@nepdate/react', '@nepdate/react/headless', '@nepdate/react/server'],
  vanilla: [
    '@nepdate/vanilla',
    '@nepdate/vanilla/define',
    '@nepdate/vanilla/date-picker',
    '@nepdate/vanilla/calendar',
    '@nepdate/vanilla/date-range-picker',
    '@nepdate/vanilla/date-time-picker',
  ],
};

function run(file: string, args: string[], cwd: string): void {
  execFileSync(file, args, { cwd, stdio: 'inherit' });
}

/** The version the repo itself uses, so the consumer tests against the same tools. */
function versionOf(pkg: string, from = '.'): string {
  const manifest = JSON.parse(
    readFileSync(join(root, from, 'node_modules', pkg, 'package.json'), 'utf8'),
  ) as { version: string };

  return manifest.version;
}

function prepare(): void {
  rmSync(dir, { recursive: true, force: true });
  const tarballs = join(dir, 'tarballs');
  mkdirSync(tarballs, { recursive: true });
  for (const name of [...Object.keys(ENTRIES), 'styles']) {
    execFileSync('pnpm', ['pack', '--pack-destination', tarballs], {
      cwd: join(root, 'packages', name),
      stdio: 'ignore',
    });
  }
  const dependencies: Record<string, string> = {};
  for (const file of readdirSync(tarballs)) {
    const match = /^nepdate-(\w+)-/.exec(file);
    if (match) {
      dependencies[`@nepdate/${match[1] ?? ''}`] = `file:./tarballs/${file}`;
    }
  }
  const react = versionOf('react', 'packages/react');
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'nepdate-consumer',
        private: true,
        dependencies: { ...dependencies, react, 'react-dom': react },
        devDependencies: {
          typescript: versionOf('typescript'),
          '@types/react': versionOf('@types/react', 'packages/react'),
          '@types/react-dom': versionOf('@types/react-dom', 'packages/react'),
        },
        // The tarballs depend on each other at 0.0.0, which is not on npm: point those at the files too.
        overrides: dependencies,
      },
      null,
      2,
    )}\n`,
  );
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], dir);
  writeConsumers();
}

function writeConsumers(): void {
  const usage = `
const bs = adToBs(adDate(2026, 10, 18));
const label: string = formatDate(bs, 'long');
const cal: CalendarState = createCalendar({ today: adDate(2026, 10, 18) }).getState();
const picker = createDatePicker({});
const value: string = picker.getState().value;
const fy: FiscalYear = fiscalYear(bs);
const days: number = holidaysFor(2083).length;
const place = computePosition({ top: 0, left: 0, bottom: 10, right: 10 }, 100, { width: 400, height: 400 });
export const results = [label, cal.title, value, fy.label, days, place.side, BS_DATA.firstYear, ELEMENT_NAMES.calendar];
`;
  const imports = (): string => {
    const lines = [
      ['{ adDate, adToBs, fiscalYear, formatDate, type FiscalYear }', '@nepdate/core'],
      ['{ BS_DATA }', '@nepdate/core/data'],
      ['{ createCalendar, type CalendarState }', '@nepdate/calendar'],
      ['{ createDatePicker }', '@nepdate/datepicker'],
      ['{ computePosition }', '@nepdate/dom'],
      ['{ holidaysFor }', '@nepdate/holidays'],
      ['{ ELEMENT_NAMES }', '@nepdate/vanilla'],
      ['{ DatePicker, type DatePickerProps }', '@nepdate/react'],
      ['{ useDatePicker }', '@nepdate/react/headless'],
      ['{ DateText }', '@nepdate/react/server'],
    ];

    return lines.map(([names, from]) => `import ${names} from '${from}';`).join('\n');
  };
  const reactUse = `
export const props: DatePickerProps = { value: '', onChange: () => undefined };
export const components = [DatePicker, DateText, useDatePicker];
`;
  writeFileSync(join(dir, 'esm.mts'), `${imports()}\n${usage}${reactUse}`);
  writeFileSync(join(dir, 'cjs.cts'), `${imports()}\n${usage}${reactUse}`);
  writeFileSync(join(dir, 'bundler.ts'), `${imports()}\n${usage}${reactUse}`);
  const base = {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: 'ES2022',
    lib: ['ES2022', 'DOM'],
    jsx: 'react-jsx',
    types: [],
  };
  writeFileSync(
    join(dir, 'tsconfig.node16.json'),
    JSON.stringify(
      {
        compilerOptions: { ...base, module: 'node16', moduleResolution: 'node16' },
        files: ['esm.mts', 'cjs.cts'],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(dir, 'tsconfig.bundler.json'),
    JSON.stringify(
      {
        compilerOptions: { ...base, module: 'ESNext', moduleResolution: 'bundler' },
        files: ['bundler.ts'],
      },
      null,
      2,
    ),
  );

  const all = Object.values(ENTRIES).flat();
  writeFileSync(
    join(dir, 'check.mjs'),
    `// Plain ESM: works on Node 18.
const entries = ${JSON.stringify(all)};
for (const entry of entries) {
  const module = await import(entry);
  if (Object.keys(module).length === 0) throw new Error(entry + ' has no exports');
  console.log('✔ import ' + entry);
}
const core = await import('@nepdate/core');
const iso = core.toIsoDate(core.bsDate(2083, 7, 1));
if (iso !== '2026-10-18') throw new Error('core converted wrongly: ' + iso);
console.log('✔ BS 2083-07-01 = AD ' + iso);
`,
  );
  writeFileSync(
    join(dir, 'check.cjs'),
    `// Plain CommonJS: works on Node 18.
const entries = ${JSON.stringify(all)};
for (const entry of entries) {
  const module = require(entry);
  if (Object.keys(module).length === 0) throw new Error(entry + ' has no exports');
  console.log('✔ require ' + entry);
}
const core = require('@nepdate/core');
const iso = core.toIsoDate(core.bsDate(2083, 7, 1));
if (iso !== '2026-10-18') throw new Error('core converted wrongly: ' + iso);
console.log('✔ BS 2083-07-01 = AD ' + iso + ' (CJS)');
`,
  );
}

function types(): void {
  const tsc = join(dir, 'node_modules', '.bin', 'tsc');
  run(tsc, ['-p', 'tsconfig.node16.json'], dir);
  console.log('✔ types: moduleResolution node16 (ESM and CJS)');
  run(tsc, ['-p', 'tsconfig.bundler.json'], dir);
  console.log('✔ types: moduleResolution bundler');
}

function runtime(): void {
  run(process.execPath, ['check.mjs'], dir);
  run(process.execPath, ['check.cjs'], dir);
}

switch (command) {
  case 'prepare':
    prepare();
    break;
  case 'types':
    types();
    break;
  case 'run':
    runtime();
    break;
  default:
    prepare();
    types();
    runtime();
}
console.log(`consumer project: ${dir}`);
