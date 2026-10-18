import { describe, expectTypeOf, test } from 'vitest';
import {
  adDate,
  addDays,
  adToBs,
  bsDate,
  bsToAd,
  clampDate,
  createDate,
  parseDate,
  toCalendar,
  today,
  type AdDate,
  type BsDate,
  type CalendarDate,
  type EpochDay,
  type MonthNumber,
} from '@nepdate/core';

// TEST-014: the type system keeps AD and BS apart.
describe('AD and BS dates cannot be swapped', () => {
  test('conversion functions take the right calendar only', () => {
    expectTypeOf(adToBs).parameter(0).toEqualTypeOf<AdDate>();
    expectTypeOf(bsToAd).parameter(0).toEqualTypeOf<BsDate>();
    // @ts-expect-error an AD date is not a BS date
    bsToAd(adDate(2026, 10, 18));
    // @ts-expect-error a BS date is not an AD date
    adToBs(bsDate(2083, 7, 1));
  });

  test('results keep their calendar', () => {
    expectTypeOf(addDays(bsDate(2083, 7, 1), 1)).toEqualTypeOf<BsDate>();
    expectTypeOf(addDays(adDate(2026, 10, 18), 1)).toEqualTypeOf<AdDate>();
    expectTypeOf(createDate('AD', 2026, 1, 1)).toEqualTypeOf<AdDate>();
    expectTypeOf(toCalendar(adDate(2026, 1, 1), 'BS')).toEqualTypeOf<BsDate>();
    expectTypeOf(parseDate('2083-07-01', 'BS')).toEqualTypeOf<BsDate | null>();
    expectTypeOf(
      clampDate(bsDate(2083, 7, 1), adDate(2026, 1, 1)),
    ).toEqualTypeOf<BsDate>();
    expectTypeOf(today()).toEqualTypeOf<AdDate>();
    expectTypeOf(today('BS')).toEqualTypeOf<BsDate>();
  });

  test('a union in gives a union out', () => {
    const date = adDate(2026, 1, 1) as CalendarDate;
    expectTypeOf(addDays(date, 1)).toEqualTypeOf<AdDate | BsDate>();
  });

  test('months are narrowed and day counts are branded', () => {
    expectTypeOf(bsDate(2083, 7, 1).month).toEqualTypeOf<MonthNumber>();
    // @ts-expect-error a plain number is not an EpochDay
    const day: EpochDay = 5;
    expectTypeOf(day).toEqualTypeOf<EpochDay>();
  });

  test('dates are read-only', () => {
    const date = bsDate(2083, 7, 1);
    // @ts-expect-error dates are frozen
    date.day = 2;
  });
});
