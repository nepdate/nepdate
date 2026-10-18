import {
  formatDate,
  formatMessage,
  fromIsoDate,
  getLocale,
  isWithin,
  parseDate,
  toCalendar,
  type AdDate,
  type CalendarDate,
  type CalendarSystem,
  type DateFormatPattern,
  type LocaleCode,
} from '@nepdate/core';
import type { DateDetail, DateError } from './types';

/** What a picker allows, in any calendar. */
export interface InputLimits {
  readonly min: CalendarDate;
  readonly max: CalendarDate;
  /** Whether the app set min/max (else they are the edges of the BS table). Picks the message. */
  readonly hasMin?: boolean;
  readonly hasMax?: boolean;
  readonly isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
}

export type ParseResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'date'; readonly date: AdDate }
  | { readonly kind: 'error'; readonly error: DateError };

/**
 * Read what the user typed: year first, ASCII or Devanagari digits, in the
 * calendar on screen. All date work is done by core (docs/plan D-005).
 */
export function parseInput(
  text: string,
  calendar: CalendarSystem,
  limits: InputLimits,
  locale: LocaleCode,
  format: DateFormatPattern = 'iso',
): ParseResult {
  if (text.trim() === '') {
    return { kind: 'empty' };
  }
  const messages = getLocale(locale).messages;
  const date = parseDate(text, calendar);
  if (!date) {
    return {
      kind: 'error',
      error: { code: 'format', message: messages.invalidFormat[calendar] },
    };
  }
  const error = checkDate(date, calendar, limits, locale, format);

  return error
    ? { kind: 'error', error }
    : { kind: 'date', date: toCalendar(date, 'AD') };
}

/** Null when the day is allowed; otherwise a translated error. */
export function checkDate(
  date: CalendarDate,
  calendar: CalendarSystem,
  limits: InputLimits,
  locale: LocaleCode,
  format: DateFormatPattern = 'iso',
): DateError | null {
  const messages = getLocale(locale).messages;
  if (!isWithin(date, limits.min, limits.max)) {
    const values = {
      min: formatInput(limits.min, calendar, format, locale),
      max: formatInput(limits.max, calendar, format, locale),
    };
    const template =
      limits.hasMin === limits.hasMax
        ? messages.outOfRange
        : limits.hasMin
          ? messages.onOrAfter
          : messages.onOrBefore;

    return { code: 'range', message: formatMessage(template, values) };
  }
  if (limits.isDateDisabled?.(date)) {
    return { code: 'disabled', message: messages.unavailable };
  }

  return null;
}

/** How the input shows a date: in the calendar on screen, with the locale's digits. */
export function formatInput(
  date: CalendarDate | null,
  calendar: CalendarSystem,
  format: DateFormatPattern,
  locale: LocaleCode,
): string {
  return date ? formatDate(toCalendar(date, calendar), format, locale) : '';
}

/** "10 October 2026 AD": the same day in the other calendar. */
export function equivalentText(
  date: CalendarDate | null,
  calendar: CalendarSystem,
  locale: LocaleCode,
): string | null {
  if (!date) {
    return null;
  }
  const other: CalendarSystem = calendar === 'BS' ? 'AD' : 'BS';

  return `${formatDate(toCalendar(date, other), 'long', locale)} ${getLocale(locale).calendarNames[other]}`;
}

export function placeholderText(calendar: CalendarSystem, locale: LocaleCode): string {
  return `YYYY-MM-DD (${getLocale(locale).calendarNames[calendar]})`;
}

/** An AD "YYYY-MM-DD" string as a date; anything else is null. */
export function readIso(value: string | null | undefined): AdDate | null {
  return value ? fromIsoDate(value) : null;
}

export function detailOf(date: CalendarDate | null): DateDetail | null {
  return date
    ? Object.freeze({ ad: toCalendar(date, 'AD'), bs: toCalendar(date, 'BS') })
    : null;
}
