import { adMonthLength, isValidAdDate, MAX_AD_YEAR } from './ad/calendar';
import { bsMonthLength, isValidBsDate } from './bs/table';
import { NepDateRangeError } from './errors';
import type {
  AdDate,
  BsDate,
  CalendarDate,
  CalendarSystem,
  DateOf,
  MonthNumber,
} from './types';

/** An AD date. Any year within ±999,999 is allowed; only conversion to BS is limited. */
export function adDate(year: number, month: number, day: number): AdDate {
  if (!isValidAdDate(year, month, day)) {
    throw new NepDateRangeError(
      Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
        ? 'INVALID_DATE'
        : 'INVALID_ARGUMENT',
      Math.abs(year) > MAX_AD_YEAR
        ? `AD year ${String(year)} is outside ±${MAX_AD_YEAR}.`
        : `AD ${String(year)}-${String(month)}-${String(day)} is not a valid date.`,
    );
  }

  return Object.freeze({ calendar: 'AD', year, month: month as MonthNumber, day });
}

/** A BS date. The year must be in the BS table. */
export function bsDate(year: number, month: number, day: number): BsDate {
  const length = bsMonthLength(year, month);
  if (!Number.isInteger(day) || day < 1 || day > length) {
    throw new NepDateRangeError(
      Number.isInteger(day) ? 'INVALID_DATE' : 'INVALID_ARGUMENT',
      `BS ${year}-${month} has ${length} days, not ${String(day)}.`,
    );
  }

  return Object.freeze({ calendar: 'BS', year, month: month as MonthNumber, day });
}

export function createDate<C extends CalendarSystem>(
  calendar: C,
  year: number,
  month: number,
  day: number,
): DateOf<C> {
  return (
    calendar === 'AD' ? adDate(year, month, day) : bsDate(year, month, day)
  ) as DateOf<C>;
}

export function isValidDate(
  calendar: CalendarSystem,
  year: number,
  month: number,
  day: number,
): boolean {
  return calendar === 'AD'
    ? isValidAdDate(year, month, day)
    : isValidBsDate(year, month, day);
}

/** Days in a month of either calendar. */
export function daysInMonth(
  calendar: CalendarSystem,
  year: number,
  month: number,
): number {
  if (calendar === 'BS') {
    return bsMonthLength(year, month);
  }
  if (!isValidAdDate(year, month, 1)) {
    throw new NepDateRangeError(
      'INVALID_DATE',
      `AD ${String(year)}-${String(month)} is not a month.`,
    );
  }

  return adMonthLength(year, month);
}

/** True for a valid, frozen-or-not AD date object (e.g. from JSON). */
export function isAdDate(value: unknown): value is AdDate {
  return isDateLike(value, 'AD') && isValidAdDate(value.year, value.month, value.day);
}

/** True for a valid BS date object (e.g. from JSON). */
export function isBsDate(value: unknown): value is BsDate {
  return isDateLike(value, 'BS') && isValidBsDate(value.year, value.month, value.day);
}

export function isCalendarDate(value: unknown): value is CalendarDate {
  return isAdDate(value) || isBsDate(value);
}

function isDateLike(
  value: unknown,
  calendar: CalendarSystem,
): value is { calendar: CalendarSystem; year: number; month: number; day: number } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;

  return (
    record['calendar'] === calendar &&
    typeof record['year'] === 'number' &&
    typeof record['month'] === 'number' &&
    typeof record['day'] === 'number'
  );
}
