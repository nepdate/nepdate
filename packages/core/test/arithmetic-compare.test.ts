import { describe, expect, test } from 'vitest';
import {
  adDate,
  addDays,
  addMonths,
  addYears,
  bsDate,
  clampDate,
  compareDates,
  dayOfWeek,
  daysInMonth,
  differenceInDays,
  eachDayOfInterval,
  eachDayOfMonth,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameYear,
  isWeekend,
  isWithin,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from '@nepdate/core';
import { ad, bs, ymd } from './helpers';

describe('arithmetic (CORE-050..057)', () => {
  test('addDays stays in the date’s calendar', () => {
    expect(ymd(addDays(bs('2082-12-30'), 1))).toBe('2083-01-01');
    expect(ymd(addDays(ad('2026-01-01'), -1))).toBe('2025-12-31');
    expect(() => addDays(ad('2026-01-01'), 0.5)).toThrow(/whole number/);
  });

  test('addMonths caps the day to the new month', () => {
    expect(ymd(addMonths(ad('2024-01-31'), 1))).toBe('2024-02-29');
    expect(ymd(addMonths(ad('2024-11-15'), 3))).toBe('2025-02-15');
    expect(ymd(addMonths(ad('2024-11-15'), -14))).toBe('2023-09-15');
    // A 32-day BS month into a shorter one.
    const long = bs(`2082-03-${daysInMonth('BS', 2082, 3)}`);
    const next = addMonths(long, 1);
    expect(next.month).toBe(4);
    expect(next.day).toBe(Math.min(long.day, daysInMonth('BS', 2082, 4)));
    expect(ymd(addMonths(bs('2082-12-15'), 1))).toBe('2083-01-15');
  });

  test('addYears handles 29 February and stays in the table', () => {
    expect(ymd(addYears(ad('2024-02-29'), 1))).toBe('2025-02-28');
    expect(ymd(addYears(bs('2082-04-01'), -1))).toBe('2081-04-01');
    expect(() => addYears(bs('2099-01-01'), 1)).toThrow(
      expect.objectContaining({ code: 'OUT_OF_TABLE' }),
    );
  });

  test('start and end of month and year', () => {
    expect(ymd(startOfMonth(bs('2083-06-24')))).toBe('2083-06-01');
    expect(ymd(endOfMonth(ad('2026-02-10')))).toBe('2026-02-28');
    expect(ymd(startOfYear(bs('2083-06-24')))).toBe('2083-01-01');
    expect(ymd(endOfYear(ad('2026-06-24')))).toBe('2026-12-31');
    expect(endOfYear(bs('2083-06-24')).month).toBe(12);
  });

  test('weeks start on Sunday by default (Kartik 1, 2083 is a Sunday)', () => {
    const wednesday = ad('2026-10-21');
    expect(ymd(startOfWeek(wednesday))).toBe('2026-10-18');
    expect(ymd(endOfWeek(wednesday))).toBe('2026-10-24');
    expect(ymd(startOfWeek(wednesday, 1))).toBe('2026-10-19');
    expect(ymd(startOfWeek(bs('2083-07-04')))).toBe('2083-07-01');
    expect(() => startOfWeek(wednesday, 7 as 0)).toThrow(/not a weekday/);
  });

  test('differenceInDays works across calendars', () => {
    expect(differenceInDays(bs('2083-01-01'), ad('2026-04-13'))).toBe(1);
    expect(differenceInDays(ad('2026-01-01'), ad('2026-12-31'))).toBe(-364);
  });

  test('eachDayOfInterval is inclusive and empty when reversed', () => {
    const days = [...eachDayOfInterval(bs('2082-12-29'), ad('2026-04-15'))];
    expect(days.map(ymd)).toEqual([
      '2082-12-29',
      '2082-12-30',
      '2083-01-01',
      '2083-01-02',
    ]);
    expect([...eachDayOfInterval(ad('2026-01-02'), ad('2026-01-01'))]).toEqual([]);
    expect(eachDayOfMonth(bs('2083-06-10'))).toHaveLength(daysInMonth('BS', 2083, 6));
  });
});

describe('compare (CORE-060..068)', () => {
  const bsDay = bs('2083-07-01');
  const adSame = ad('2026-10-18');

  test('dates in different calendars compare by the day they fall on', () => {
    expect(compareDates(bsDay, adSame)).toBe(0);
    expect(compareDates(bsDay, ad('2026-10-19'))).toBe(-1);
    expect(compareDates(ad('2026-10-19'), bsDay)).toBe(1);
    expect(isSameDay(bsDay, adSame)).toBe(true);
    expect(isSameDay(bsDay, null)).toBe(false);
    expect(isSameDay(undefined, adSame)).toBe(false);
    expect(isBefore(bsDay, ad('2026-10-19'))).toBe(true);
    expect(isAfter(bsDay, ad('2026-10-19'))).toBe(false);
  });

  test('isSameMonth and isSameYear judge in the first date’s calendar', () => {
    expect(isSameMonth(bsDay, ad('2026-11-16'))).toBe(true); // last day of Kartik 2083
    expect(isSameMonth(adSame, bs('2083-08-01'))).toBe(false); // 2026-11-17
    expect(isSameYear(bs('2083-01-01'), ad('2027-04-13'))).toBe(true);
    expect(isSameYear(ad('2026-01-01'), bs('2083-09-17'))).toBe(false);
  });

  test('isWithin and clampDate treat missing bounds as open', () => {
    const min = ad('2026-10-01');
    const max = bs('2083-07-30');
    expect(isWithin(bsDay, min, max)).toBe(true);
    expect(isWithin(ad('2026-09-30'), min, max)).toBe(false);
    expect(isWithin(ad('2030-01-01'), null, undefined)).toBe(true);
    expect(clampDate(ad('2026-09-01'), min, max)).toEqual(min);
    expect(ymd(clampDate(bs('2083-09-01'), min, max))).toBe('2083-07-30');
    expect(clampDate(ad('2026-09-01'), undefined, max)).toEqual(ad('2026-09-01'));
    expect(clampDate(bs('2083-05-01'), min).calendar).toBe('BS');
  });

  test('weekday and weekend', () => {
    expect(dayOfWeek(bsDay)).toBe(0);
    expect(isWeekend(ad('2026-10-24'))).toBe(true);
    expect(isWeekend(ad('2026-10-18'))).toBe(false);
    expect(isWeekend(ad('2026-10-18'), [0, 6])).toBe(true);
    expect(dayOfWeek(adDate(1970, 1, 1))).toBe(4);
    expect(dayOfWeek(bsDate(1970, 1, 1))).toBe(0); // 1913-04-13 was a Sunday
  });
});
