import { fromIsoDate, parseDate, type AdDate, type BsDate } from '@nepdate/core';
import type { CalendarState, DayCell } from '@nepdate/calendar';

export function bs(text: string): BsDate {
  const date = parseDate(text, 'BS');
  if (!date) {
    throw new Error(`Bad BS fixture ${text}`);
  }
  return date;
}

export function ad(text: string): AdDate {
  const date = fromIsoDate(text);
  if (!date) {
    throw new Error(`Bad AD fixture ${text}`);
  }
  return date;
}

export function ymd(date: { year: number; month: number; day: number }): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

/** All non-empty cells of the grid, in order. */
export function cells(state: CalendarState): DayCell[] {
  return state.weeks.flat().filter((cell): cell is DayCell => cell !== null);
}

/** The cell for a day of the visible month (not an outside day). */
export function cell(state: CalendarState, day: number): DayCell {
  const found = cells(state).find((c) => !c.isOutside && c.date.day === day);
  if (!found) {
    throw new Error(`No day ${day} in the grid`);
  }
  return found;
}

/** Fixed "today" for deterministic tests: Kartik 1, 2083 BS = 2026-10-18 AD (a Sunday). */
export const TODAY: AdDate = ad('2026-10-18');
