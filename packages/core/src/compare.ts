import { inCalendarOf } from './arithmetic';
import { getConfig } from './config';
import { toCalendar, toEpoch } from './convert';
import { weekdayOf } from './epoch';
import type { CalendarDate, DateOf, Weekday } from './types';

type Maybe = CalendarDate | null | undefined;

/** -1, 0 or 1. Dates in different calendars compare by the day they fall on. */
export function compareDates(a: CalendarDate, b: CalendarDate): -1 | 0 | 1 {
  return Math.sign(toEpoch(a) - toEpoch(b)) as -1 | 0 | 1;
}

/** Same day, in any calendars. False when either is missing. */
export function isSameDay(a: Maybe, b: Maybe): boolean {
  return a != null && b != null && toEpoch(a) === toEpoch(b);
}

/** Whether `b` falls in the same month as `a`, judged in `a`'s calendar. */
export function isSameMonth(a: CalendarDate, b: CalendarDate): boolean {
  const other = inCalendarOf(a, b);

  return other.year === a.year && other.month === a.month;
}

/** Whether `b` falls in the same year as `a`, judged in `a`'s calendar. */
export function isSameYear(a: CalendarDate, b: CalendarDate): boolean {
  return inCalendarOf(a, b).year === a.year;
}

export function isBefore(a: CalendarDate, b: CalendarDate): boolean {
  return toEpoch(a) < toEpoch(b);
}

export function isAfter(a: CalendarDate, b: CalendarDate): boolean {
  return toEpoch(a) > toEpoch(b);
}

/** On or after `min` and on or before `max`; a missing bound is open. */
export function isWithin(date: CalendarDate, min?: Maybe, max?: Maybe): boolean {
  const day = toEpoch(date);

  return (min == null || day >= toEpoch(min)) && (max == null || day <= toEpoch(max));
}

/** The date, or the nearest bound when it is outside, in the date's calendar. */
export function clampDate<D extends CalendarDate>(
  date: D,
  min?: Maybe,
  max?: Maybe,
): DateOf<D['calendar']> {
  if (min != null && isBefore(date, min)) {
    return toCalendar(min, date.calendar) as DateOf<D['calendar']>;
  }
  if (max != null && isAfter(date, max)) {
    return toCalendar(max, date.calendar) as DateOf<D['calendar']>;
  }

  return date as DateOf<D['calendar']>;
}

/** 0 = Sunday … 6 = Saturday. The same in both calendars. */
export function dayOfWeek(date: CalendarDate): Weekday {
  return weekdayOf(toEpoch(date));
}

/** Saturday by default (Nepal); set `weekendDays` in configure() or pass them here. */
export function isWeekend(
  date: CalendarDate,
  weekendDays: readonly Weekday[] = getConfig().weekendDays,
): boolean {
  return weekendDays.includes(dayOfWeek(date));
}
