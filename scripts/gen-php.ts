/**
 * Writes the PHP port's data and conformance fixtures from @nepdatejs/core in
 * this repository, so the PHP package can never drift from the JS one.
 *
 * - php/data/bs-table.json, php/data/locales.json: the table and names core ships.
 * - php/tests/Conformance/fixtures/*.json: core's answers for every BS day
 *   1970–2099 and for arithmetic, fiscal-year, format and parse cases. The PHP
 *   conformance tests must give the same answers.
 * - php/tests/Conformance/fixtures/SHA256SUMS: checksums of all of the above.
 *
 * Run after `pnpm build` (it loads packages/core/dist):
 *   node scripts/gen-php.ts          write the files
 *   node scripts/gen-php.ts --check  fail if any file would change (CI)
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as CoreModule from '../packages/core/src/index.ts';
import type { BS_DATA as BsDataValue } from '../packages/core/src/data.ts';

type Core = typeof CoreModule;
type AnyDate = CoreModule.CalendarDate;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = (file: string): string =>
  pathToFileURL(resolve(root, 'packages/core/dist', file)).href;
const nd = (await import(dist('index.js'))) as Core;
const { BS_DATA } = (await import(dist('data.js'))) as { BS_DATA: typeof BsDataValue };
const version = (
  JSON.parse(readFileSync(resolve(root, 'packages/core/package.json'), 'utf8')) as {
    version: string;
  }
).version;

const check = process.argv.includes('--check');
const fixtures = 'php/tests/Conformance/fixtures';
const written: [string, string][] = [];
/** Set by writeText when a file differs (an object, so TypeScript sees the change). */
const state = { stale: false };

function writeText(relative: string, text: string): void {
  const path = resolve(root, relative);
  let current: string | null = null;
  try {
    current = readFileSync(path, 'utf8');
  } catch {
    // Missing file counts as out of date.
  }
  if (current !== text) {
    if (check) {
      console.error(`✖ ${relative} is out of date`);
      state.stale = true;
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
  }
}

function write(relative: string, value: unknown): void {
  const text = JSON.stringify(value) + '\n';
  writeText(relative, text);
  written.push([relative, createHash('sha256').update(text).digest('hex')]);
}

/** The error code when `fn` throws, otherwise null. */
function err(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (e) {
    return codeOf(e);
  }
}

function codeOf(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e && typeof e.code === 'string'
    ? e.code
    : 'ERROR';
}

const iso = (d: AnyDate): string => nd.toIsoDate(d);
const tuple = (d: AnyDate): [number, number, number] => [d.year, d.month, d.day];

/** The date's [year, month, day], or the error code when the operation throws. */
function safe(fn: () => AnyDate): [number, number, number] | string {
  try {
    return tuple(fn());
  } catch (e) {
    return codeOf(e);
  }
}

// 1. Data for the PHP package: the same table and names the JS package ships.
write('php/data/bs-table.json', {
  source: `@nepdatejs/core@${version}`,
  firstYear: BS_DATA.firstYear,
  epochStart: BS_DATA.epochStart,
  verifiedThrough: BS_DATA.verifiedThrough,
  years: BS_DATA.years,
});
const locales: Record<string, unknown> = {};
for (const code of ['en', 'ne'] as const) {
  const l = nd.getLocale(code);
  locales[code] = {
    digits: l.digits,
    weekdays: { long: l.weekdays.long, short: l.weekdays.short },
    months: { AD: l.months.AD, BS: l.months.BS },
  };
}
write('php/data/locales.json', { source: `@nepdatejs/core@${version}`, locales });

// 2. Every BS day in the table: [bsYear, bsMonth, bsDay, adIso, epochDay, weekday, projected].
const days: (string | number)[][] = [];
for (let year = nd.bsFirstYear(); year <= nd.bsLastYear(); year++) {
  for (let month = 1; month <= 12; month++) {
    const length = nd.daysInMonth('BS', year, month);
    for (let day = 1; day <= length; day++) {
      const bs = nd.bsDate(year, month, day);
      days.push([
        year,
        month,
        day,
        iso(bs),
        nd.toEpoch(bs),
        nd.dayOfWeek(bs),
        nd.isProjected(bs) ? 1 : 0,
      ]);
    }
  }
}
write(`${fixtures}/days.json`, days);

// 3. Edges and errors.
const samples = [
  '1970-01-01',
  '2000-02-29',
  '2026-04-13',
  '2026-07-16',
  '2026-11-15',
  '2027-04-14',
  '2042-12-31',
];
const fromIso = (s: string): CoreModule.AdDate => {
  const d = nd.fromIsoDate(s);
  if (!d) throw new Error(`not an ISO date: ${s}`);
  return d;
};
write(`${fixtures}/edges.json`, {
  firstBs: tuple(nd.minDate('BS')),
  lastBs: tuple(nd.maxDate('BS')),
  firstAd: iso(nd.minDate('AD')),
  lastAd: iso(nd.maxDate('AD')),
  invalidBs: (
    [
      [2083, 13, 1],
      [2083, 1, 32],
      [2083, 1, 0],
      [1969, 12, 1],
      [2100, 1, 1],
    ] as const
  ).map(([y, m, d]) => [y, m, d, err(() => nd.bsDate(y, m, d))]),
  invalidAd: (
    [
      [2026, 2, 29],
      [2026, 13, 1],
      [2024, 4, 31],
    ] as const
  ).map(([y, m, d]) => [y, m, d, err(() => nd.adDate(y, m, d))]),
  outOfTableAd: ['1913-04-12', '2043-04-14', '2100-01-01'].map((s) => [
    s,
    err(() => nd.adToBs(fromIso(s))),
  ]),
});

// 4. Arithmetic and compare, in both calendars.
const arithmetic: Record<string, unknown>[] = [];
for (const s of samples) {
  const ad = fromIso(s);
  for (const d of [ad, nd.adToBs(ad)] as AnyDate[]) {
    arithmetic.push({
      calendar: d.calendar,
      date: tuple(d),
      addMonths: [-25, -13, -1, 0, 1, 2, 11, 12, 37].map((n) =>
        safe(() => nd.addMonths(d, n)),
      ),
      addYears: [-3, 1, 4].map((n) => safe(() => nd.addYears(d, n))),
      addDays: [-400, -1, 1, 30, 365].map((n) => safe(() => nd.addDays(d, n))),
      startOfMonth: safe(() => nd.startOfMonth(d)),
      endOfMonth: safe(() => nd.endOfMonth(d)),
      startOfYear: safe(() => nd.startOfYear(d)),
      endOfYear: safe(() => nd.endOfYear(d)),
      startOfWeek: ([0, 1, 6] as const).map((w) => safe(() => nd.startOfWeek(d, w))),
      endOfWeek: ([0, 1] as const).map((w) => safe(() => nd.endOfWeek(d, w))),
      dayOfWeek: nd.dayOfWeek(d),
      isWeekend: nd.isWeekend(d),
      daysInMonth: nd.daysInMonth(d.calendar, d.year, d.month),
    });
  }
}
write(`${fixtures}/arithmetic.json`, arithmetic);

// 5. Fiscal years for every start year in the table, plus labels and parsing.
const fiscal = {
  years: [] as Record<string, unknown>[],
  dates: [] as [string, string | number][],
  parse: [] as [string, number | null][],
};
for (let y = nd.bsFirstYear(); y < nd.bsLastYear(); y++) {
  const fy = nd.fiscalYearRange(y);
  fiscal.years.push({
    startYear: y,
    label: fy.label,
    first: tuple(fy.firstDay),
    last: tuple(fy.lastDay),
    full: nd.formatFiscalYear(fy, 'full'),
    cbms: nd.formatFiscalYear(fy, 'cbms'),
    labelNe: nd.formatFiscalYear(fy, 'label', 'ne'),
  });
}
for (const s of [...samples, '2026-07-15', '2026-07-17']) {
  fiscal.dates.push([
    s,
    err(() => nd.fiscalYear(fromIso(s))) ?? nd.fiscalYear(fromIso(s)).startYear,
  ]);
}
for (const text of [
  '2083/84',
  '2083/2084',
  '2083-84',
  '2083.084',
  '२०८३/८४',
  '2083/85',
  '2083/2085',
  '83/84',
  '2099/00',
  '',
  'abc',
]) {
  fiscal.parse.push([text, nd.parseFiscalYear(text)?.startYear ?? null]);
}
write(`${fixtures}/fiscal.json`, fiscal);

// 6. Formatting: patterns × locales × dates in both calendars.
const patterns = [
  'iso',
  'cbms',
  'short',
  'long',
  'full',
  'Y-m-d',
  'y n j',
  'D, j M Y',
  'l F',
  '\\Y\\e\\a\\r: Y',
  'd/m/y',
];
const format: unknown[] = [];
for (const s of samples) {
  const ad = fromIso(s);
  for (const d of [ad, nd.adToBs(ad)] as AnyDate[]) {
    for (const locale of ['en', 'ne'] as const) {
      for (const pattern of patterns) {
        format.push([
          d.calendar,
          tuple(d),
          pattern,
          locale,
          nd.formatDate(d, pattern, locale),
        ]);
      }
    }
  }
}
write(`${fixtures}/format.json`, format);

// 7. Parsing.
const inputs = [
  '2083-06-24',
  '2083/6/24',
  '2083.06.24',
  '20830624',
  '२०८३-०७-३०',
  ' 2083-01-01 ',
  '2083-13-01',
  '2083-02-32',
  '24-06-2083',
  '2083-6',
  '',
  'abc',
  '1900-01-01',
  '2026-02-29',
  '2024-02-29',
];
const parse: unknown[] = [];
for (const calendar of ['AD', 'BS'] as const) {
  for (const text of inputs) {
    parse.push([calendar, text, safe(() => nd.parseDateStrict(text, calendar))]);
  }
}
write(`${fixtures}/parse.json`, parse);

// 8. Checksums and the version they came from.
writeText(
  `${fixtures}/SHA256SUMS`,
  `# @nepdatejs/core@${version}\n` +
    written.map(([file, hash]) => `${hash}  ${file}`).join('\n') +
    '\n',
);

if (state.stale) {
  console.error('Run `pnpm gen:php`.');
  process.exit(1);
}
console.log(
  `✔ ${check ? 'Checked' : 'Wrote'} ${written.length} PHP data and fixture files from @nepdatejs/core@${version} (${days.length} BS days)`,
);
