/**
 * The Gregorian (AD) calendar, by arithmetic only: no table, no BS knowledge,
 * no `Date`. Works for any year in ±MAX_AD_YEAR (docs/plan D-001).
 *
 * The day-count algorithms are Howard Hinnant's days_from_civil and
 * civil_from_days (proleptic Gregorian, March-based years).
 */

/** AD years must lie within ±this value. */
export const MAX_AD_YEAR = 999_999;

const DAYS_BEFORE_EPOCH = 719_468; // 0000-03-01 → 1970-01-01
const DAYS_PER_ERA = 146_097; // 400 years
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isAdLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Days in an AD month. The month must be 1–12. */
export function adMonthLength(year: number, month: number): number {
  return month === 2 && isAdLeapYear(year) ? 29 : (MONTH_DAYS[month - 1] ?? 0);
}

export function isValidAdDate(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    Math.abs(year) <= MAX_AD_YEAR &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= adMonthLength(year, month)
  );
}

/** Days since 1970-01-01 of a valid AD date. */
export function adToEpoch(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;

  return era * DAYS_PER_ERA + dayOfEra - DAYS_BEFORE_EPOCH;
}

/** The AD year, month and day of a day count. */
export function epochToAd(epoch: number): { year: number; month: number; day: number } {
  const z = epoch + DAYS_BEFORE_EPOCH;
  const era = Math.floor(z / DAYS_PER_ERA);
  const dayOfEra = z - era * DAYS_PER_ERA;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36_524) -
      Math.floor(dayOfEra / 146_096)) /
      365,
  );
  const dayOfYear =
    dayOfEra -
    (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
  const month = shiftedMonth < 10 ? shiftedMonth + 3 : shiftedMonth - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);

  return { year, month, day };
}
