/**
 * Loads the built packages the way users do, with no bundler (TEST-015, part of
 * TEST-031/032): Node ESM import, Node CJS require, and the IIFE <script> build
 * in a bare VM context. Run after `pnpm build`.
 *
 * Run: node scripts/smoke.ts
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createContext, runInContext } from 'node:vm';

interface CoreLike {
  bsDate(year: number, month: number, day: number): unknown;
  toIsoDate(date: unknown): string;
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const core = resolve(root, 'packages/core/dist');
const expected = '2026-10-18';
const failures: string[] = [];

function check(name: string, api: CoreLike | undefined): void {
  const result = api ? api.toIsoDate(api.bsDate(2083, 7, 1)) : 'missing';
  if (result === expected) {
    console.log(`✔ core via ${name}`);
  } else {
    failures.push(`core via ${name}: got ${result}`);
  }
}

check(
  'ESM import',
  (await import(pathToFileURL(resolve(core, 'index.js')).href)) as CoreLike,
);
check(
  'CJS require',
  createRequire(import.meta.url)(resolve(core, 'index.cjs')) as CoreLike,
);

const sandbox: { NepDate?: CoreLike } = {};
runInContext(
  readFileSync(resolve(core, 'nepdate.global.js'), 'utf8'),
  createContext(sandbox),
);
check('IIFE window.NepDate', sandbox.NepDate);

const data = (await import(pathToFileURL(resolve(core, 'data.js')).href)) as {
  BS_DATA?: { firstYear: number };
};
if (data.BS_DATA?.firstYear === 1970) {
  console.log('✔ core/data via ESM import');
} else {
  failures.push('core/data: BS_DATA missing');
}

interface CalendarLike {
  createCalendar(options: Record<string, unknown>): { getState(): { title: string } };
}
const calendarDist = resolve(root, 'packages/calendar/dist');
const calendarOptions = { today: { calendar: 'AD', year: 2026, month: 10, day: 18 } };
function checkCalendar(name: string, api: CalendarLike | undefined): void {
  const title = api ? api.createCalendar(calendarOptions).getState().title : 'missing';
  if (title === 'Kartik 2083') {
    console.log(`✔ calendar via ${name}`);
  } else {
    failures.push(`calendar via ${name}: got ${title}`);
  }
}
checkCalendar(
  'ESM import',
  (await import(pathToFileURL(resolve(calendarDist, 'index.js')).href)) as CalendarLike,
);
checkCalendar(
  'CJS require',
  createRequire(import.meta.url)(resolve(calendarDist, 'index.cjs')) as CalendarLike,
);
const calendarSandbox: { NepDateCalendar?: CalendarLike } = {};
runInContext(
  readFileSync(resolve(calendarDist, 'nepdate-calendar.global.js'), 'utf8'),
  createContext(calendarSandbox),
);
checkCalendar(
  'IIFE window.NepDateCalendar (core bundled in)',
  calendarSandbox.NepDateCalendar,
);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`✖ ${failure}`);
  }
  process.exit(1);
}
