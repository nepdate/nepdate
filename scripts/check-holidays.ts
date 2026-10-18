/**
 * Validates every data/holidays/<year>.json against @nepdate/holidays'
 * parseHolidayFile (HOL-003). Run after `pnpm build`.
 *
 * Run: node scripts/check-holidays.ts
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

interface HolidaysModule {
  parseHolidayFile(input: unknown): { year: number; holidays: unknown[] };
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'data/holidays');
const holidays = (await import(
  pathToFileURL(resolve(root, 'packages/holidays/dist/index.js')).href
)) as HolidaysModule;
const files = readdirSync(dir).filter((name) => /^\d{4}\.json$/.test(name));
let failed = false;

for (const name of files) {
  try {
    const file = holidays.parseHolidayFile(
      JSON.parse(readFileSync(resolve(dir, name), 'utf8')),
    );
    if (`${file.year}.json` !== name) {
      throw new Error(`file name says ${name} but year is ${file.year}`);
    }
    console.log(`✔ ${name}: ${file.holidays.length} holidays`);
  } catch (error) {
    failed = true;
    console.error(`✖ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (files.length === 0) {
  console.log('✔ No yearly holiday lists yet (data/holidays/<year>.json)');
}
if (failed) {
  process.exit(1);
}
