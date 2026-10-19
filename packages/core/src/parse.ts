import { createDate } from './create';
import { NepDateRangeError } from './errors';
import { fiscalYearRange } from './fiscal';
import { toAsciiDigits } from './locale/index';
import type { CalendarSystem, DateOf, FiscalYear } from './types';

const YEAR_FIRST = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/;
const COMPACT = /^(\d{4})(\d{2})(\d{2})$/;

/**
 * A date written year first ("2083-06-24", "2083/6/24", "2083.06.24", or
 * compact "20830624") in ASCII or Devanagari digits, in the calendar the caller names. Other orders are
 * rejected, not guessed. Returns null when the text is not a valid date.
 */
export function parseDate<C extends CalendarSystem>(
  text: string | null | undefined,
  calendar: C,
): DateOf<C> | null {
  try {
    return parseDateStrict(text ?? '', calendar);
  } catch {
    return null;
  }
}

/** Like parseDate, but throws a NepDateRangeError that says what is wrong. */
export function parseDateStrict<C extends CalendarSystem>(
  text: string,
  calendar: C,
): DateOf<C> {
  const ascii = toAsciiDigits(text).trim();
  const match = YEAR_FIRST.exec(ascii) ?? COMPACT.exec(ascii);
  if (!match) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `"${text}" is not a date written as YYYY-MM-DD.`,
    );
  }

  return createDate(calendar, Number(match[1]), Number(match[2]), Number(match[3]));
}

/**
 * A fiscal year from its label: "2083/84", "2083/2084", "2083-84" or the
 * tax form "2083.084", in ASCII or Devanagari digits. Null when not valid.
 */
export function parseFiscalYear(text: string | null | undefined): FiscalYear | null {
  const match = /^(\d{4})\s*[-/.]\s*(\d{2,4})$/.exec(toAsciiDigits(text ?? '').trim());
  if (!match) {
    return null;
  }
  const start = Number(match[1]);
  const end = match[2] ?? '';
  const next = start + 1;
  const expected =
    end.length === 4
      ? String(next)
      : String(next % 10 ** end.length).padStart(end.length, '0');
  if (end !== expected) {
    return null;
  }
  try {
    return fiscalYearRange(start);
  } catch {
    return null;
  }
}
