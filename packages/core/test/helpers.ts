import { fromIsoDate, parseDate, type AdDate, type BsDate } from '@nepdate/core';

/** "2083-06-24" → BsDate (throws in tests if the fixture is wrong). */
export function bs(text: string): BsDate {
  const date = parseDate(text, 'BS');
  if (!date) {
    throw new Error(`Bad BS fixture ${text}`);
  }

  return date;
}

/** "2026-10-18" → AdDate. */
export function ad(text: string): AdDate {
  const date = fromIsoDate(text);
  if (!date) {
    throw new Error(`Bad AD fixture ${text}`);
  }

  return date;
}

/** Plain "YYYY-MM-DD" of a date in its own calendar. */
export function ymd(date: { year: number; month: number; day: number }): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}
