import {
  addDays,
  addMonths,
  daysInMonth,
  isAfter,
  isWithin,
  maxDate,
  minDate,
  startOfMonth,
  toCalendar,
  type CalendarDate,
  type CalendarSystem,
} from '@nepdate/core';

/** The days and months the calendar may show and select, all in `calendar`. */
export interface Limits {
  readonly calendar: CalendarSystem;
  /** First and last selectable days. */
  readonly lowDay: CalendarDate;
  readonly highDay: CalendarDate;
  /** Day 1 of the first and last months that may be shown. */
  readonly lowMonth: CalendarDate;
  readonly highMonth: CalendarDate;
  /** min is after max: nothing can be selected. */
  readonly empty: boolean;
}

/**
 * The intersection of min/max with the range core can convert. Only whole
 * months are offered: the AD side of the BS table starts and ends mid-month
 * (docs/plan CAL-013).
 */
export function computeLimits(
  calendar: CalendarSystem,
  min?: CalendarDate | null,
  max?: CalendarDate | null,
): Limits {
  const tableLow = firstWholeMonthDay(calendar);
  const tableHigh = lastWholeMonthDay(calendar);
  let empty = false;

  let lowDay = tableLow;
  if (min != null && isAfter(min, tableLow)) {
    if (isAfter(min, tableHigh)) {
      empty = true;
    } else {
      lowDay = toCalendar(min, calendar);
    }
  }
  let highDay = tableHigh;
  if (max != null && isAfter(tableHigh, max)) {
    if (isAfter(tableLow, max)) {
      empty = true;
    } else {
      highDay = toCalendar(max, calendar);
    }
  }
  if (empty || isAfter(lowDay, highDay)) {
    empty = true;
    highDay = lowDay;
  }

  return {
    calendar,
    lowDay,
    highDay,
    lowMonth: startOfMonth(lowDay),
    highMonth: startOfMonth(highDay),
    empty,
  };
}

/** Whether a day may be selected under these limits. */
export function isInLimits(date: CalendarDate, limits: Limits): boolean {
  return !limits.empty && isWithin(date, limits.lowDay, limits.highDay);
}

function firstWholeMonthDay(calendar: CalendarSystem): CalendarDate {
  const first = minDate(calendar);

  return first.day === 1 ? first : startOfMonth(addMonths(first, 1));
}

function lastWholeMonthDay(calendar: CalendarSystem): CalendarDate {
  const last = maxDate(calendar);

  return last.day === daysInMonth(calendar, last.year, last.month)
    ? last
    : addDays(startOfMonth(last), -1);
}
