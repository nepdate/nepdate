import {
  compareDates,
  toCalendar,
  toEpoch,
  type CalendarDate,
  type LocaleCode,
} from '@nepdate/core';
import { fixedHolidaysFor, registeredHolidaysFor } from './registry';
import type { Holiday, HolidayType } from './types';

export interface HolidayQuery {
  /** Only these kinds. Default: all. */
  readonly types?: readonly HolidayType[] | undefined;
  /** Include the bundled fixed national days. Default true. */
  readonly includeFixed?: boolean | undefined;
}

/**
 * All holidays in a BS year, sorted by date (on a shared day, fixed national
 * days first). A registered entry with a fixed day's id replaces it.
 */
export function holidaysFor(year: number, query: HolidayQuery = {}): Holiday[] {
  const registered = registeredHolidaysFor(year);
  const ids = new Set(registered.map((holiday) => holiday.id));
  const fixed =
    (query.includeFixed ?? true)
      ? fixedHolidaysFor(year).filter((holiday) => !ids.has(holiday.id))
      : [];

  return [...fixed, ...registered]
    .filter((holiday) => !query.types || query.types.includes(holiday.type))
    .sort(
      (a, b) =>
        compareDates(a.date, b.date) ||
        (a.source === b.source
          ? a.id.localeCompare(b.id)
          : a.source === 'fixed'
            ? -1
            : 1),
    );
}

/** The holidays on a day (any calendar). */
export function holidaysOn(date: CalendarDate, query: HolidayQuery = {}): Holiday[] {
  let bs;
  try {
    bs = toCalendar(date, 'BS');
  } catch {
    return [];
  }
  const day = toEpoch(bs);

  return holidaysFor(bs.year, query).filter((holiday) => toEpoch(holiday.date) === day);
}

export function isHoliday(date: CalendarDate, query: HolidayQuery = {}): boolean {
  return holidaysOn(date, query).length > 0;
}

/** Holidays from `start` to `end` inclusive, in date order. */
export function holidaysBetween(
  start: CalendarDate,
  end: CalendarDate,
  query: HolidayQuery = {},
): Holiday[] {
  const from = toCalendar(start, 'BS');
  const to = toCalendar(end, 'BS');
  const out: Holiday[] = [];
  for (let year = from.year; year <= to.year; year++) {
    for (const holiday of holidaysFor(year, query)) {
      if (compareDates(holiday.date, from) >= 0 && compareDates(holiday.date, to) <= 0) {
        out.push(holiday);
      }
    }
  }

  return out;
}

/** The holiday's name in a locale (Nepali for 'ne', English otherwise). */
export function holidayName(holiday: Holiday, locale: LocaleCode = 'en'): string {
  return locale === 'ne' ? holiday.name.ne : holiday.name.en;
}

/**
 * A lookup for @nepdate/calendar's `holidays` option (and the pickers'):
 *   createCalendar({ holidays: toCalendarHolidays({ locale: 'ne' }) })
 * Several holidays on one day are joined with ", ".
 */
export function toCalendarHolidays(
  options: HolidayQuery & { readonly locale?: LocaleCode | undefined } = {},
): (date: CalendarDate) => { readonly label: string } | null {
  return (date) => {
    const found = holidaysOn(date, options);

    return found.length === 0
      ? null
      : {
          label: found.map((holiday) => holidayName(holiday, options.locale)).join(', '),
        };
  };
}
