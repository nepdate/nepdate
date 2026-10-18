/**
 * The Bikram Sambat calendar, from its table only. Nothing here reads or
 * produces an AD year: BS dates map to and from day counts (EpochDay) through
 * `epochStart` and the month lengths (docs/plan D-001).
 */
import { NepDateRangeError } from '../errors';
import type { BsData } from '../types';
import { BS_DATA } from './data/years';

interface BsTable {
  readonly data: BsData;
  readonly lastYear: number;
  /** yearStart[i] = day count of 1 Baisakh of firstYear + i; one extra entry for the end. */
  readonly yearStart: Float64Array;
  /** monthOffset[i * 12 + m] = days from 1 Baisakh to the first of month m + 1 in year i. */
  readonly monthOffset: Uint16Array;
}

let data: BsData = freezeData(BS_DATA);
let table: BsTable | null = null;

/** Replace the data the table is built from. Callers validate first (data-api.ts). */
export function useBsData(next: BsData): void {
  data = freezeData(next);
  table = null;
}

function freezeData(source: BsData): BsData {
  return Object.freeze({
    firstYear: source.firstYear,
    epochStart: source.epochStart,
    verifiedThrough: source.verifiedThrough,
    years: Object.freeze(source.years.map((months) => Object.freeze([...months]))),
  });
}

export function currentBsData(): BsData {
  return data;
}

function buildTable(): BsTable {
  const count = data.years.length;
  const yearStart = new Float64Array(count + 1);
  const monthOffset = new Uint16Array(count * 12);
  let start = data.epochStart;

  for (let i = 0; i < count; i++) {
    yearStart[i] = start;
    const months = data.years[i] ?? [];
    let offset = 0;
    for (let m = 0; m < 12; m++) {
      monthOffset[i * 12 + m] = offset;
      offset += months[m] ?? 0;
    }
    start += offset;
  }
  yearStart[count] = start;

  return { data, lastYear: data.firstYear + count - 1, yearStart, monthOffset };
}

function bsTable(): BsTable {
  return (table ??= buildTable());
}

export function bsFirstYear(): number {
  return data.firstYear;
}

export function bsLastYear(): number {
  return bsTable().lastYear;
}

/** The first and last day counts the table covers. */
export function bsEpochRange(): { first: number; last: number } {
  const { yearStart } = bsTable();

  return { first: yearStart[0] ?? 0, last: (yearStart[yearStart.length - 1] ?? 0) - 1 };
}

/** Days in a BS month. Throws when the year is outside the table or the month is not 1–12. */
export function bsMonthLength(year: number, month: number): number {
  const { lastYear } = bsTable();
  if (!Number.isInteger(year) || year < data.firstYear || year > lastYear) {
    throw new NepDateRangeError(
      'OUT_OF_TABLE',
      `BS year ${String(year)} is outside the supported range (BS ${data.firstYear}–${lastYear}).`,
    );
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new NepDateRangeError(
      'INVALID_DATE',
      `BS month ${String(month)} does not exist.`,
    );
  }

  return data.years[year - data.firstYear]?.[month - 1] ?? 0;
}

export function isValidBsDate(year: number, month: number, day: number): boolean {
  try {
    return Number.isInteger(day) && day >= 1 && day <= bsMonthLength(year, month);
  } catch {
    return false;
  }
}

/** Day count of a valid BS date. */
export function bsToEpoch(year: number, month: number, day: number): number {
  const { yearStart, monthOffset } = bsTable();
  const index = year - data.firstYear;

  return (yearStart[index] ?? 0) + (monthOffset[index * 12 + month - 1] ?? 0) + day - 1;
}

/** The BS year, month and day of a day count. Throws when it is outside the table. */
export function epochToBs(epoch: number): { year: number; month: number; day: number } {
  const { yearStart, monthOffset } = bsTable();
  const { first, last } = bsEpochRange();
  if (epoch < first || epoch > last) {
    throw new NepDateRangeError(
      'OUT_OF_TABLE',
      `Day ${epoch} is outside the BS table (BS ${data.firstYear}–${bsLastYear()}).`,
    );
  }

  // Last year whose start is on or before the day.
  let low = 0;
  let high = yearStart.length - 2;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((yearStart[middle] ?? 0) <= epoch) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  const dayOfYear = epoch - (yearStart[low] ?? 0);
  let month = 11;
  while (month > 0 && (monthOffset[low * 12 + month] ?? 0) > dayOfYear) {
    month--;
  }

  return {
    year: data.firstYear + low,
    month: month + 1,
    day: dayOfYear - (monthOffset[low * 12 + month] ?? 0) + 1,
  };
}

/** Whether a BS year is after the last year checked against a published calendar. */
export function isProjectedBsYear(year: number): boolean {
  return year > data.verifiedThrough;
}
