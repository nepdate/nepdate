import { NepDateDataError, NepDateRangeError } from '../errors';
import type { BsData } from '../types';
import { BS_DATA } from './data/years';
import { currentBsData, useBsData } from './table';

/** The first BS month of Nepal's fiscal year: Shrawan. */
export const BS_FISCAL_YEAR_START_MONTH = 4;

/** Days a verified year may have. Projected years may be off by one (the bundled BS 2096 lists 364). */
const VERIFIED_YEAR_DAYS = [365, 366];
const PROJECTED_YEAR_DAYS = [364, 365, 366, 367];

/** Throws NepDateDataError when the table is not usable. Same rules as scripts/gen-data.ts. */
export function validateBsData(table: BsData): void {
  if (!Number.isSafeInteger(table.epochStart) || !Number.isInteger(table.firstYear)) {
    throw new NepDateDataError(
      'BAD_ANCHOR',
      'firstYear and epochStart must be whole numbers.',
    );
  }
  if (!Number.isInteger(table.verifiedThrough)) {
    throw new NepDateDataError('BAD_ANCHOR', 'verifiedThrough must be a whole number.');
  }
  if (table.years.length === 0) {
    throw new NepDateDataError('EMPTY', 'The BS table has no years.');
  }

  table.years.forEach((months, index) => {
    const year = table.firstYear + index;
    if (months.length !== 12) {
      throw new NepDateDataError(
        'BAD_MONTH_COUNT',
        `BS ${year} lists ${months.length} months, not 12.`,
        year,
      );
    }
    let total = 0;
    months.forEach((days, m) => {
      if (!Number.isInteger(days) || days < 29 || days > 32) {
        throw new NepDateDataError(
          'BAD_MONTH',
          `BS ${year} month ${m + 1} has ${String(days)} days; expected 29–32.`,
          year,
          m + 1,
        );
      }
      total += days;
    });
    const allowed =
      year <= table.verifiedThrough ? VERIFIED_YEAR_DAYS : PROJECTED_YEAR_DAYS;
    if (!allowed.includes(total)) {
      throw new NepDateDataError(
        'BAD_YEAR_TOTAL',
        `BS ${year} has ${total} days; expected ${allowed.join(' or ')}.`,
        year,
      );
    }
  });
}

/** The BS table in use (frozen). */
export function getBsData(): BsData {
  return currentBsData();
}

/** Replace the whole BS table. Only BS results change; AD functions are unaffected. */
export function setBsData(table: BsData): void {
  validateBsData(table);
  useBsData(table);
}

/**
 * Correct one year's month lengths, or add the year just before the first or
 * just after the last. Years after a corrected year move with it; earlier years
 * never move (adding a year before the first keeps every existing year in place).
 */
export function patchBsYear(year: number, months: readonly number[]): void {
  const table = currentBsData();
  const lastYear = table.firstYear + table.years.length - 1;
  let next: BsData;

  if (year >= table.firstYear && year <= lastYear) {
    next = {
      ...table,
      years: table.years.map((row, index) =>
        index === year - table.firstYear ? months : row,
      ),
    };
  } else if (year === lastYear + 1) {
    next = { ...table, years: [...table.years, months] };
  } else if (year === table.firstYear - 1) {
    const length = months.reduce((total, days) => total + days, 0);
    next = {
      ...table,
      firstYear: year,
      epochStart: table.epochStart - length,
      years: [months, ...table.years],
    };
  } else {
    throw new NepDateRangeError(
      'OUT_OF_TABLE',
      `BS ${String(year)} is not in the table and does not extend it (BS ${table.firstYear}–${lastYear}).`,
    );
  }

  setBsData(next);
}

/** Back to the table bundled with the package. */
export function resetBsData(): void {
  useBsData(BS_DATA);
}
