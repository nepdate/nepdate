/**
 * Micro-benchmarks against the built packages (CAL-020). Run after `pnpm build`.
 * Target: building one month grid takes < 0.2 ms on a laptop.
 *
 * Run: node scripts/bench.ts
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = async <T>(path: string): Promise<T> =>
  (await import(pathToFileURL(resolve(root, path)).href)) as T;

interface Core {
  adDate(y: number, m: number, d: number): unknown;
  bsDate(y: number, m: number, d: number): unknown;
}
interface Calendar {
  computeLimits(calendar: 'BS' | 'AD'): unknown;
  buildMonthGrid(input: Record<string, unknown>): unknown;
  createCalendar(options: Record<string, unknown>): {
    actions: { next(): void; prev(): void };
  };
}

const core = await load<Core>('packages/core/dist/index.js');
const calendar = await load<Calendar>('packages/calendar/dist/index.js');

function time(label: string, runs: number, fn: (i: number) => void): void {
  for (let i = 0; i < Math.min(runs, 2000); i++) {
    fn(i);
  }
  const start = performance.now();
  for (let i = 0; i < runs; i++) {
    fn(i);
  }
  console.log(`${label}: ${((performance.now() - start) / runs).toFixed(4)} ms`);
}

const limits = calendar.computeLimits('BS');
const today = core.adDate(2026, 10, 18);
time('buildMonthGrid (BS, with AD sub-labels)', 20_000, (i) => {
  calendar.buildMonthGrid({
    calendar: 'BS',
    month: core.bsDate(2083, (i % 12) + 1, 1),
    limits,
    locale: 'en',
    today,
    selectionMode: 'single',
    selected: null,
    rangeHover: null,
    focusTarget: null,
    showOtherCalendar: true,
    showOutsideDays: true,
    fixedWeeks: false,
    weekStartsOn: 0,
    weekendDays: [6],
  });
});

const store = calendar.createCalendar({ today });
time('store next()/prev() (grid + tiles + snapshot)', 10_000, (i) => {
  if (i % 2 === 0) {
    store.actions.next();
  } else {
    store.actions.prev();
  }
});
