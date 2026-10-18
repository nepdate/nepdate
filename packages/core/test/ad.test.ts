import { describe, expect, test } from 'vitest';
import {
  adDate,
  daysInMonth,
  fromEpoch,
  isAdLeapYear,
  isValidDate,
  toEpoch,
  toEpochDay,
} from '@nepdate/core';

const DAY_MS = 86_400_000;

describe('AD arithmetic needs no table (TEST-004)', () => {
  test('matches Date.UTC for every day from 1800 to 2200', () => {
    const start = Date.UTC(1800, 0, 1) / DAY_MS;
    const end = Date.UTC(2200, 11, 31) / DAY_MS;
    for (let epoch = start; epoch <= end; epoch++) {
      const js = new Date(epoch * DAY_MS);
      const date = fromEpoch(toEpochDay(epoch), 'AD');
      if (
        date.year !== js.getUTCFullYear() ||
        date.month !== js.getUTCMonth() + 1 ||
        date.day !== js.getUTCDate()
      ) {
        throw new Error(`Day ${epoch}: got ${date.year}-${date.month}-${date.day}`);
      }
      expect(toEpoch(date)).toBe(epoch);
    }
  }, 30_000);

  test('works far outside the BS table, including year 0 and BC years', () => {
    for (const [year, month, day] of [
      [1, 1, 1],
      [0, 2, 29],
      [-1, 12, 31],
      [-400, 3, 1],
      [9999, 12, 31],
      [200_000, 6, 15],
    ] as const) {
      const date = adDate(year, month, day);
      expect(fromEpoch(toEpoch(date), 'AD')).toEqual(date);
    }
    expect(toEpoch(adDate(0, 3, 1))).toBe(-719_468);
  });
});

describe('leap years and month lengths', () => {
  test.each([
    [2024, true],
    [2025, false],
    [1900, false],
    [2000, true],
    [0, true],
    [-4, true],
  ])('isAdLeapYear(%i) is %s', (year, leap) => {
    expect(isAdLeapYear(year)).toBe(leap);
  });

  test('February has 29 days only in leap years', () => {
    expect(daysInMonth('AD', 2024, 2)).toBe(29);
    expect(daysInMonth('AD', 2025, 2)).toBe(28);
    expect(daysInMonth('AD', 2025, 4)).toBe(30);
    expect(isValidDate('AD', 2023, 2, 29)).toBe(false);
  });

  test('daysInMonth rejects months that do not exist', () => {
    expect(() => daysInMonth('AD', 2025, 13)).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE' }),
    );
  });
});
