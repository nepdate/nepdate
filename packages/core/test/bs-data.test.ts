import { afterEach, describe, expect, test } from 'vitest';
import {
  adDate,
  addDays,
  bsDate,
  bsFirstYear,
  bsLastYear,
  bsToAd,
  getBsData,
  isProjected,
  NepDateDataError,
  patchBsYear,
  resetBsData,
  setBsData,
  toEpoch,
  validateBsData,
  type BsData,
} from '@nepdate/core';
import { BS_DATA } from '@nepdate/core/data';
import { bsMonthLength, epochToBs } from '../src/bs/table';
import { ymd } from './helpers';

afterEach(() => {
  resetBsData();
});

const months2082 = [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30];
const small = (years: number[][], verifiedThrough = 2090): BsData => ({
  firstYear: 2082,
  epochStart: 20_192, // 2025-04-14
  verifiedThrough,
  years,
});

describe('bad tables are rejected with a clear error (TEST-010)', () => {
  test.each([
    ['no years', small([]), 'EMPTY', undefined, undefined],
    [
      'eleven months',
      small([months2082.slice(0, 11)]),
      'BAD_MONTH_COUNT',
      2082,
      undefined,
    ],
    [
      'a 33-day month',
      small([[31, 31, 33, ...months2082.slice(3)]]),
      'BAD_MONTH',
      2082,
      3,
    ],
    [
      'a 28-day month',
      small([months2082, [28, ...months2082.slice(1)]]),
      'BAD_MONTH',
      2083,
      1,
    ],
    [
      'a 364-day verified year',
      small([[30, ...months2082.slice(1)]]),
      'BAD_YEAR_TOTAL',
      2082,
      undefined,
    ],
    [
      'a fractional anchor',
      { ...small([months2082]), epochStart: 1.5 },
      'BAD_ANCHOR',
      undefined,
      undefined,
    ],
    [
      'a fractional verifiedThrough',
      small([months2082], 2082.5),
      'BAD_ANCHOR',
      undefined,
      undefined,
    ],
  ])('%s', (_name, table, code, year, month) => {
    let error: unknown;
    try {
      validateBsData(table);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(NepDateDataError);
    expect(error).toMatchObject({ code, year, month, name: 'NepDateDataError' });
    expect(() => setBsData(table)).toThrow(NepDateDataError);
    expect(getBsData().firstYear).toBe(1970);
  });

  test('a 364-day year is allowed only after verifiedThrough', () => {
    expect(() =>
      validateBsData(small([[30, ...months2082.slice(1)]], 2081)),
    ).not.toThrow();
  });

  test('the bundled table is valid', () => {
    expect(() => validateBsData(BS_DATA)).not.toThrow();
  });
});

describe('projected years (TEST-011)', () => {
  test('dates after BS 2083 are projections', () => {
    expect(isProjected(bsDate(2084, 1, 1))).toBe(true);
    expect(isProjected(bsDate(2083, 12, 30))).toBe(false);
    expect(isProjected(adDate(2026, 10, 18))).toBe(false);
  });
});

describe('changing BS data never changes AD results (TEST-012)', () => {
  test('patchBsYear shifts only later years; earlier BS days and AD maths stay the same', () => {
    const earlier = bsDate(2050, 6, 15);
    const earlierAd = ymd(bsToAd(earlier));
    const laterEpoch = toEpoch(bsDate(2061, 1, 1));
    const adBefore = addDays(adDate(2040, 1, 1), 100);

    // Make BS 2060 one day longer (365 → 366) or shorter (366 → 365).
    const row = [...(BS_DATA.years[2060 - 1970] ?? [])];
    const total = row.reduce((a, b) => a + b, 0);
    const delta = total === 365 ? 1 : -1;
    const index = row.findIndex((days) => (delta === 1 ? days < 32 : days > 29));
    row[index] = (row[index] ?? 30) + delta;
    patchBsYear(2060, row);

    expect(getBsData().years[2060 - 1970]).toEqual(row);
    expect(ymd(bsToAd(earlier))).toBe(earlierAd);
    expect(toEpoch(bsDate(2061, 1, 1)) - laterEpoch).toBe(delta);
    expect(addDays(adDate(2040, 1, 1), 100)).toEqual(adBefore);
  });

  test('a year can be added after the last and before the first', () => {
    patchBsYear(2100, months2082);
    expect(bsLastYear()).toBe(2100);
    expect(bsDate(2100, 12, 30).year).toBe(2100);

    const anchor = toEpoch(bsDate(1970, 1, 1));
    patchBsYear(1969, months2082);
    expect(bsFirstYear()).toBe(1969);
    expect(toEpoch(bsDate(1970, 1, 1))).toBe(anchor);
    expect(toEpoch(bsDate(1969, 12, 30))).toBe(anchor - 1);
  });

  test('a year far outside the table cannot be patched', () => {
    expect(() => patchBsYear(2150, months2082)).toThrow(
      expect.objectContaining({ code: 'OUT_OF_TABLE' }),
    );
  });

  test('setBsData replaces the table and stores a frozen copy', () => {
    const rows = [months2082];
    setBsData(small(rows));
    rows[0] = [];
    expect(bsFirstYear()).toBe(2082);
    expect(bsLastYear()).toBe(2082);
    expect(ymd(bsToAd(bsDate(2082, 1, 1)))).toBe('2025-04-14');
    expect(Object.isFrozen(getBsData().years[0])).toBe(true);
    expect(() => bsDate(2083, 1, 1)).toThrow(
      expect.objectContaining({ code: 'OUT_OF_TABLE' }),
    );
  });
});

describe('table internals', () => {
  test('epochToBs refuses day counts outside the table', () => {
    expect(() => epochToBs(-30_000)).toThrow(
      expect.objectContaining({ code: 'OUT_OF_TABLE' }),
    );
  });

  test('bsMonthLength names the supported range', () => {
    expect(() => bsMonthLength(1900, 1)).toThrow(/BS 1970–2099/);
  });
});
