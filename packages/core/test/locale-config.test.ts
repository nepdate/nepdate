import { afterEach, describe, expect, test } from 'vitest';
import {
  adDate,
  bsDate,
  configure,
  createDate,
  formatDate,
  formatMessage,
  formatNumber,
  getConfig,
  getLocale,
  hasLocale,
  isAdDate,
  isBsDate,
  isCalendarDate,
  isValidDate,
  monthNames,
  registerLocale,
  resetConfig,
  toAsciiDigits,
  toDevanagariDigits,
  toEpochDay,
  weekdayNames,
  weekdayOf,
  type LocaleData,
} from '@nepdate/core';

afterEach(() => {
  resetConfig();
});

describe('config (CORE-004)', () => {
  test('defaults', () => {
    expect(getConfig()).toEqual({
      timeZone: 'Asia/Kathmandu',
      weekStartsOn: 0,
      weekendDays: [6],
      defaultLocale: 'en',
    });
    expect(Object.isFrozen(getConfig())).toBe(true);
  });

  test('changes apply and reset', () => {
    configure({ weekStartsOn: 1, weekendDays: [0, 6], defaultLocale: 'ne' });
    expect(getConfig().weekStartsOn).toBe(1);
    expect(formatDate(bsDate(2082, 4, 1), 'long')).toBe('१ साउन २०८२');
    resetConfig();
    expect(getConfig().defaultLocale).toBe('en');
  });

  test.each([
    [{ timeZone: 'Nowhere/City' }, /not a time zone/],
    [{ weekStartsOn: 7 as 0 }, /weekStartsOn/],
    [{ weekendDays: [6, 6] as const }, /weekendDays/],
    [{ weekendDays: [9 as 0] }, /weekendDays/],
    [{ defaultLocale: 'fr' }, /not registered/],
  ])('rejects %o and keeps the old settings', (changes, message) => {
    expect(() => configure(changes)).toThrow(message);
    expect(getConfig().timeZone).toBe('Asia/Kathmandu');
  });
});

describe('locales (CORE-070..076)', () => {
  test('names', () => {
    expect(monthNames('BS')[0]).toBe('Baisakh');
    expect(monthNames('BS', 'ne')[11]).toBe('चैत');
    expect(monthNames('AD', 'en', 'short')[8]).toBe('Sep');
    expect(weekdayNames()[6]).toBe('Saturday');
    expect(weekdayNames('ne', 'narrow')[0]).toBe('आ');
    expect(getLocale('ne').calendarNames.BS).toBe('वि.सं.');
  });

  test('unknown locales fall back to English', () => {
    expect(hasLocale('fr')).toBe(false);
    expect(getLocale('fr')).toBe(getLocale('en'));
  });

  test('digits', () => {
    expect(toAsciiDigits('२०८३-०६-२४')).toBe('2083-06-24');
    expect(toDevanagariDigits(2083)).toBe('२०८३');
    expect(formatNumber('12/3', 'ne')).toBe('१२/३');
    expect(formatNumber(7)).toBe('7');
  });

  test('messages fill placeholders and leave unknown ones', () => {
    expect(
      formatMessage(getLocale('en').messages.outOfRange, { min: 'A', max: 'B' }),
    ).toBe('Choose a date from A to B.');
    expect(formatMessage('{min} and {other}', { min: 'A' })).toBe('A and {other}');
  });

  test('registerLocale adds a language and checks list lengths', () => {
    const en = getLocale('en');
    const custom: LocaleData = {
      ...en,
      digits: ['𑁦', '𑁧', '𑁨', '𑁩', '𑁪', '𑁫', '𑁬', '𑁭', '𑁮', '𑁯'],
    };
    registerLocale('x-test', custom);
    expect(hasLocale('x-test')).toBe(true);
    expect(formatNumber(10, 'x-test')).toBe('𑁧𑁦');

    expect(() => registerLocale('x-bad', { ...en, digits: ['0'] })).toThrow(/10 entries/);
    expect(() =>
      registerLocale('x-bad', { ...en, weekdays: { ...en.weekdays, narrow: [] } }),
    ).toThrow(/weekdays.narrow/);
  });
});

describe('construction helpers (CORE-030..033)', () => {
  test('createDate and isValidDate dispatch by calendar', () => {
    expect(createDate('AD', 2026, 10, 18)).toEqual(adDate(2026, 10, 18));
    expect(createDate('BS', 2083, 7, 1)).toEqual(bsDate(2083, 7, 1));
    expect(isValidDate('BS', 2083, 7, 1)).toBe(true);
    expect(isValidDate('BS', 2083, 7, 40)).toBe(false);
    expect(isValidDate('BS', 2200, 1, 1)).toBe(false);
  });

  test('type guards accept valid plain objects, e.g. from JSON', () => {
    const fromJson: unknown = JSON.parse(
      '{"calendar":"BS","year":2083,"month":7,"day":1}',
    );
    expect(isBsDate(fromJson)).toBe(true);
    expect(isAdDate(fromJson)).toBe(false);
    expect(isCalendarDate(fromJson)).toBe(true);
    expect(isCalendarDate({ calendar: 'AD', year: 2026, month: 2, day: 30 })).toBe(false);
    expect(isCalendarDate({ calendar: 'AD', year: '2026', month: 2, day: 1 })).toBe(
      false,
    );
    expect(isCalendarDate(null)).toBe(false);
    expect(isCalendarDate('2026-10-18')).toBe(false);
  });

  test('day counts and weekdays', () => {
    expect(weekdayOf(toEpochDay(0))).toBe(4);
    expect(weekdayOf(toEpochDay(-1))).toBe(3);
    expect(() => toEpochDay(1.5)).toThrow(/whole number/);
  });
});
