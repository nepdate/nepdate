import { dayOfWeek } from './compare';
import { formatNumber, getLocale } from './locale/index';
import type { CalendarDate, LocaleCode } from './types';

/** Named formats. `cbms` is the dotted form Nepal's tax system uses. */
export const DATE_FORMATS: {
  readonly iso: 'Y-m-d';
  readonly cbms: 'Y.m.d';
  readonly short: 'j M Y';
  readonly long: 'j F Y';
  readonly full: 'l, j F Y';
} = Object.freeze({
  iso: 'Y-m-d',
  cbms: 'Y.m.d',
  short: 'j M Y',
  long: 'j F Y',
  full: 'l, j F Y',
});

export type NamedFormat = keyof typeof DATE_FORMATS;
/** A named format, or a pattern of tokens (see formatDate). */
export type DateFormatPattern = NamedFormat | (string & Record<never, never>);

/**
 * Format a date in its own calendar. Tokens: Y 2083, y 83, m 06, n 6, d 09,
 * j 9, F month name, M short month name, l weekday, D short weekday. Put a
 * backslash before a letter to print it as is. Digits follow the locale.
 *
 *   formatDate(bsDate(2082, 4, 1), 'full')        → "Thursday, 1 Shrawan 2082"
 *   formatDate(bsDate(2082, 4, 1), 'long', 'ne')  → "१ साउन २०८२"
 */
export function formatDate(
  date: CalendarDate,
  pattern: DateFormatPattern = 'iso',
  locale?: LocaleCode,
): string {
  const tokens: string =
    pattern in DATE_FORMATS ? DATE_FORMATS[pattern as NamedFormat] : pattern;
  const data = getLocale(locale);
  const months = data.months[date.calendar];
  const digits = (value: string | number): string => formatNumber(value, locale);
  const pad = (value: number): string => String(value).padStart(2, '0');
  let output = '';

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens.charAt(index);
    switch (token) {
      case '\\':
        index++;
        output += tokens.charAt(index);
        break;
      case 'Y':
        output += digits(date.year);
        break;
      case 'y':
        output += digits(pad(((date.year % 100) + 100) % 100));
        break;
      case 'm':
        output += digits(pad(date.month));
        break;
      case 'n':
        output += digits(date.month);
        break;
      case 'd':
        output += digits(pad(date.day));
        break;
      case 'j':
        output += digits(date.day);
        break;
      case 'F':
        output += months.long[date.month - 1] ?? '';
        break;
      case 'M':
        output += months.short[date.month - 1] ?? '';
        break;
      case 'l':
        output += data.weekdays.long[dayOfWeek(date)] ?? '';
        break;
      case 'D':
        output += data.weekdays.short[dayOfWeek(date)] ?? '';
        break;
      default:
        output += token;
    }
  }

  return output;
}
