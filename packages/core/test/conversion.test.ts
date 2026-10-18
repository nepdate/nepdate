import { describe, expect, test } from 'vitest';
import {
  adDate,
  adToBs,
  bsDate,
  bsFirstYear,
  bsLastYear,
  bsToAd,
  daysInMonth,
  fromEpoch,
  fromIsoDate,
  isConvertible,
  maxDate,
  minDate,
  NepDateRangeError,
  toCalendar,
  toEpoch,
  toEpochDay,
  toIsoDate,
} from '@nepdate/core';
import { BS_NEW_YEAR_AD, KNOWN_CONVERSIONS } from './fixtures/known-conversions';
import { ad, bs, ymd } from './helpers';

describe('known conversions (TEST-002)', () => {
  test.each(KNOWN_CONVERSIONS)('%s: BS %s = AD %s', (_label, bsText, adText) => {
    expect(ymd(bsToAd(bs(bsText)))).toBe(adText);
    expect(ymd(adToBs(ad(adText)))).toBe(bsText);
  });
});

describe('independent 1 Baisakh dates (TEST-003)', () => {
  test.each(Object.entries(BS_NEW_YEAR_AD))('1 Baisakh %s = AD %s', (year, adText) => {
    expect(ymd(bsToAd(bsDate(Number(year), 1, 1)))).toBe(adText);
  });
});

describe('every day in the table (TEST-001)', () => {
  test('BS → AD → BS returns the same day, and days are consecutive', () => {
    let previous = toEpoch(bsDate(bsFirstYear(), 1, 1)) - 1;
    for (let year = bsFirstYear(); year <= bsLastYear(); year++) {
      for (let month = 1; month <= 12; month++) {
        const length = daysInMonth('BS', year, month);
        for (let day = 1; day <= length; day++) {
          const date = bsDate(year, month, day);
          const epoch = toEpoch(date);
          expect(epoch).toBe(previous + 1);
          const back = adToBs(bsToAd(date));
          if (back.year !== year || back.month !== month || back.day !== day) {
            throw new Error(`${ymd(date)} came back as ${ymd(back)}`);
          }
          previous = epoch;
        }
      }
    }
  });

  test('AD → BS → AD returns the same day across the whole range', () => {
    const first = toEpoch(minDate('AD'));
    const last = toEpoch(maxDate('AD'));
    for (let epoch = first; epoch <= last; epoch++) {
      const date = fromEpoch(toEpochDay(epoch), 'AD');
      expect(toEpoch(bsToAd(adToBs(date)))).toBe(epoch);
    }
  });
});

describe('year boundaries (TEST-005)', () => {
  test('the last day of Chaitra is followed by 1 Baisakh, both ways', () => {
    for (const year of [2000, 2080, 2081, 2082, 2083]) {
      const lastDay = bsDate(year, 12, daysInMonth('BS', year, 12));
      const newYear = bsDate(year + 1, 1, 1);
      expect(toEpoch(newYear) - toEpoch(lastDay)).toBe(1);
      expect(adToBs(fromEpoch(toEpochDay(toEpoch(lastDay) + 1), 'AD'))).toEqual(newYear);
    }
  });

  test('31 December → 1 January, and 29 February, convert both ways', () => {
    for (const text of [
      '2024-12-31',
      '2025-01-01',
      '2024-02-29',
      '2000-02-29',
      '2025-03-01',
    ]) {
      expect(ymd(bsToAd(adToBs(ad(text))))).toBe(text);
    }
    expect(ymd(adToBs(ad('2024-12-31')))).toBe('2081-09-16');
    expect(ymd(adToBs(ad('2025-01-01')))).toBe('2081-09-17');
  });
});

describe('an AD year is never read as the same-numbered BS year (TEST-006)', () => {
  test('AD 2025-01-01 is BS 2081-09-17; BS 2025-01-01 is AD 1968-04-13', () => {
    expect(ymd(adToBs(adDate(2025, 1, 1)))).toBe('2081-09-17');
    expect(ymd(bsToAd(bsDate(2025, 1, 1)))).toBe('1968-04-13');
  });
});

describe('conversion range (TEST-008)', () => {
  test('the range is the BS table, shown in both calendars', () => {
    expect(ymd(minDate('BS'))).toBe('1970-01-01');
    expect(ymd(minDate('AD'))).toBe('1913-04-13');
    expect(maxDate('BS').year).toBe(2099);
    expect(toEpoch(maxDate('AD'))).toBe(toEpoch(maxDate('BS')));
  });

  test.each(['1913-04-12', '2044-01-01'])('AD %s cannot be converted', (text) => {
    const date = ad(text);
    expect(isConvertible(date)).toBe(false);
    expect(() => adToBs(date)).toThrow(
      expect.objectContaining({ code: 'OUT_OF_TABLE', name: 'NepDateRangeError' }),
    );
    expect(() => adToBs(date)).toThrow(/outside the BS table \(AD 1913-04-13 to/);
  });

  test('AD dates outside the table are still valid AD dates', () => {
    expect(isConvertible(ad('1913-04-13'))).toBe(true);
    expect(ymd(adDate(1800, 1, 1))).toBe('1800-01-01');
  });

  test.each([
    ['day past month end', () => bsDate(2082, 1, 32), 'INVALID_DATE'],
    ['month 13', () => bsDate(2082, 13, 1), 'INVALID_DATE'],
    ['year before the table', () => bsDate(1969, 12, 30), 'OUT_OF_TABLE'],
    ['year after the table', () => bsDate(2100, 1, 1), 'OUT_OF_TABLE'],
    ['fractional day', () => bsDate(2082, 1, 1.5), 'INVALID_ARGUMENT'],
    ['fractional year', () => bsDate(2082.5, 1, 1), 'OUT_OF_TABLE'],
    ['AD 30 February', () => adDate(2025, 2, 30), 'INVALID_DATE'],
    ['AD fractional month', () => adDate(2025, 1.5, 1), 'INVALID_ARGUMENT'],
    ['AD year too large', () => adDate(1_000_000, 1, 1), 'INVALID_DATE'],
  ])('rejects %s', (_name, create, code) => {
    expect(create).toThrow(NepDateRangeError);
    expect(create).toThrow(expect.objectContaining({ code }));
  });

  test('the too-large AD year names the limit', () => {
    expect(() => adDate(-1_000_000, 1, 1)).toThrow(/outside ±999999/);
  });
});

describe('toCalendar and day counts', () => {
  test('returns the same object when already in the calendar', () => {
    const date = bs('2083-06-24');
    expect(toCalendar(date, 'BS')).toBe(date);
    expect(ymd(toCalendar(date, 'AD'))).toBe('2026-10-10');
  });

  test('1970-01-01 AD is day 0', () => {
    expect(toEpoch(adDate(1970, 1, 1))).toBe(0);
    expect(fromEpoch(toEpochDay(0), 'AD')).toEqual(adDate(1970, 1, 1));
  });

  test('dates are frozen', () => {
    expect(Object.isFrozen(bs('2083-06-24'))).toBe(true);
    expect(Object.isFrozen(adToBs(ad('2026-10-10')))).toBe(true);
  });
});

describe('ISO strings (CORE-044, CORE-045)', () => {
  test('toIsoDate always writes the AD day', () => {
    expect(toIsoDate(bs('2083-06-24'))).toBe('2026-10-10');
    expect(toIsoDate(adDate(5, 3, 9))).toBe('0005-03-09');
  });

  test('toIsoDate rejects years that do not fit YYYY', () => {
    expect(() => toIsoDate(adDate(10_000, 1, 1))).toThrow(/cannot be written/);
    expect(() => toIsoDate(adDate(-1, 1, 1))).toThrow(NepDateRangeError);
  });

  test.each([
    ['2026-10-18', '2026-10-18'],
    ['2026-10-18T23:30:00+05:45', '2026-10-18'],
    ['2026-10-18 09:00', '2026-10-18'],
  ])('fromIsoDate(%s)', (text, expected) => {
    expect(ymd(fromIsoDate(text) ?? adDate(1, 1, 1))).toBe(expected);
  });

  test.each([
    null,
    undefined,
    '',
    '2026-13-01',
    '2026-02-30',
    '18-10-2026',
    '2026-10-18x',
  ])('fromIsoDate(%s) is null', (text) => {
    expect(fromIsoDate(text)).toBeNull();
  });
});
