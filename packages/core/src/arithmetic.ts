import { getConfig, isWeekday } from './config';
import { fromEpoch, toCalendar, toEpoch } from './convert';
import { createDate, daysInMonth } from './create';
import { toEpochDay, weekdayOf } from './epoch';
import { NepDateRangeError } from './errors';
import type { CalendarDate, DateOf, Weekday } from './types';

/** A date in the same calendar as `D`. */
type Same<D extends CalendarDate> = DateOf<D['calendar']>;

export function addDays<D extends CalendarDate>(date: D, days: number): Same<D> {
  assertInteger(days, 'days');

  return fromEpoch(toEpochDay(toEpoch(date) + days), date.calendar) as Same<D>;
}

/** Move by whole months in the date's own calendar; the day is capped to the new month's length. */
export function addMonths<D extends CalendarDate>(date: D, months: number): Same<D> {
  assertInteger(months, 'months');
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  const day = Math.min(date.day, daysInMonth(date.calendar, year, month));

  return createDate(date.calendar, year, month, day) as Same<D>;
}

/** Move by whole years in the date's own calendar; the day is capped (29 Feb, short BS months). */
export function addYears<D extends CalendarDate>(date: D, years: number): Same<D> {
  assertInteger(years, 'years');

  return addMonths(date, years * 12);
}

export function startOfMonth<D extends CalendarDate>(date: D): Same<D> {
  return createDate(date.calendar, date.year, date.month, 1) as Same<D>;
}

export function endOfMonth<D extends CalendarDate>(date: D): Same<D> {
  return createDate(
    date.calendar,
    date.year,
    date.month,
    daysInMonth(date.calendar, date.year, date.month),
  ) as Same<D>;
}

export function startOfYear<D extends CalendarDate>(date: D): Same<D> {
  return createDate(date.calendar, date.year, 1, 1) as Same<D>;
}

export function endOfYear<D extends CalendarDate>(date: D): Same<D> {
  return createDate(
    date.calendar,
    date.year,
    12,
    daysInMonth(date.calendar, date.year, 12),
  ) as Same<D>;
}

export function startOfWeek<D extends CalendarDate>(
  date: D,
  weekStartsOn: Weekday = getConfig().weekStartsOn,
): Same<D> {
  assertWeekday(weekStartsOn);
  const back = (weekdayOf(toEpoch(date)) - weekStartsOn + 7) % 7;

  return addDays(date, -back);
}

export function endOfWeek<D extends CalendarDate>(
  date: D,
  weekStartsOn: Weekday = getConfig().weekStartsOn,
): Same<D> {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

/** Whole days from `b` to `a` (positive when `a` is later). The calendars may differ. */
export function differenceInDays(a: CalendarDate, b: CalendarDate): number {
  return toEpoch(a) - toEpoch(b);
}

/** Every day from `start` to `end` inclusive, in `start`'s calendar. Nothing when end < start. */
export function* eachDayOfInterval<D extends CalendarDate>(
  start: D,
  end: CalendarDate,
): Generator<Same<D>, void, undefined> {
  const last = toEpoch(end);
  for (let epoch = toEpoch(start); epoch <= last; epoch++) {
    yield fromEpoch(toEpochDay(epoch), start.calendar) as Same<D>;
  }
}

/** Every day of the month the date is in. */
export function eachDayOfMonth<D extends CalendarDate>(date: D): Same<D>[] {
  return [...eachDayOfInterval(startOfMonth(date), endOfMonth(date))] as Same<D>[];
}

/** The date converted to `target`'s calendar; a small helper used by compare and fiscal code. */
export function inCalendarOf<D extends CalendarDate>(
  target: D,
  date: CalendarDate,
): Same<D> {
  return toCalendar(date, target.calendar) as Same<D>;
}

function assertInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `${name} must be a whole number, not ${String(value)}.`,
    );
  }
}

function assertWeekday(value: number): void {
  if (!isWeekday(value)) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `${String(value)} is not a weekday (0–6).`,
    );
  }
}
