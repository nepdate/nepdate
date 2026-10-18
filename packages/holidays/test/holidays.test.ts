import { afterEach, describe, expect, test } from 'vitest';
import { adDate, bsDate, formatDate, toIsoDate } from '@nepdate/core';
import {
  clearHolidays,
  FIXED_NATIONAL_DAYS,
  fixedHolidaysFor,
  holidayName,
  holidaysBetween,
  holidaysFor,
  holidaysOn,
  HolidayDataError,
  isHoliday,
  loadHolidayFile,
  parseHolidayFile,
  registerHolidays,
  registeredYears,
  toCalendarHolidays,
} from '@nepdate/holidays';

afterEach(() => {
  clearHolidays();
});

const file = {
  year: 2083,
  source: 'https://example.org/notice-2083',
  holidays: [
    {
      id: 'test-festival',
      date: '२०८३-०६-२४',
      name: { en: 'Test Festival', ne: 'परीक्षण पर्व' },
    },
    {
      id: 'constitution-day',
      date: '2083-06-04',
      name: { en: 'Constitution Day', ne: 'संविधान दिवस' },
      type: 'national',
    },
  ],
};

describe('fixed national days (HOL-001)', () => {
  test('seven fixed BS dates in a recent year, in date order', () => {
    expect(holidaysFor(2083).map((h) => `${formatDate(h.date)} ${h.id}`)).toEqual([
      '2083-01-01 new-year',
      '2083-01-11 loktantra-day',
      '2083-02-15 republic-day',
      '2083-06-03 constitution-day',
      '2083-09-27 prithvi-jayanti',
      '2083-10-16 martyrs-day',
      '2083-11-07 democracy-day',
    ]);
    expect(FIXED_NATIONAL_DAYS).toHaveLength(7);
    expect(
      holidaysFor(2083).every((h) => h.type === 'national' && h.source === 'fixed'),
    ).toBe(true);
  });

  test('days are only listed from the year they began', () => {
    expect(fixedHolidaysFor(2060).map((h) => h.id)).toEqual([
      'new-year',
      'prithvi-jayanti',
      'martyrs-day',
      'democracy-day',
    ]);
    expect(fixedHolidaysFor(2007).map((h) => h.id)).not.toContain('democracy-day');
  });

  test('years outside the BS table have none', () => {
    expect(holidaysFor(2200)).toEqual([]);
    expect(holidaysOn(adDate(1800, 1, 1))).toEqual([]);
  });
});

describe('looking up days (HOL-002)', () => {
  test('works with AD dates; Constitution Day 2083 is 19 September 2026', () => {
    const [constitution] = holidaysOn(adDate(2026, 9, 19));
    expect(constitution?.id).toBe('constitution-day');
    expect(toIsoDate(constitution?.date ?? bsDate(2083, 1, 1))).toBe('2026-09-19');
    expect(isHoliday(adDate(2026, 4, 14))).toBe(true); // Nepali New Year 2083
    expect(isHoliday(adDate(2026, 4, 15))).toBe(false);
    expect(isHoliday(adDate(2026, 4, 14), { types: ['festival'] })).toBe(false);
  });

  test('ranges cross BS years', () => {
    const found = holidaysBetween(bsDate(2082, 11, 1), bsDate(2083, 1, 15));
    expect(found.map((h) => `${h.date.year}:${h.id}`)).toEqual([
      '2082:democracy-day',
      '2083:new-year',
      '2083:loktantra-day',
    ]);
  });

  test('a calendar lookup with labels in either language', () => {
    const lookup = toCalendarHolidays();
    expect(lookup(bsDate(2083, 6, 3))).toEqual({ label: 'Constitution Day' });
    expect(lookup(bsDate(2083, 6, 4))).toBeNull();
    expect(toCalendarHolidays({ locale: 'ne' })(bsDate(2083, 1, 1))).toEqual({
      label: 'नयाँ वर्ष',
    });
    registerHolidays(2083, [
      { id: 'extra', date: '2083-01-01', name: { en: 'Extra', ne: 'थप' } },
    ]);
    expect(lookup(bsDate(2083, 1, 1))).toEqual({ label: 'Nepali New Year, Extra' });
    const [first] = holidaysFor(2083);
    expect(first && holidayName(first, 'ne')).toBe('नयाँ वर्ष');
  });
});

describe('yearly lists (HOL-002, HOL-003)', () => {
  test('loading a list adds festivals and can move a fixed day for that year', () => {
    loadHolidayFile(file);
    expect(registeredYears()).toEqual([2083]);
    const year = holidaysFor(2083);
    expect(year.find((h) => h.id === 'test-festival')).toMatchObject({
      type: 'festival',
      source: 'registered',
    });
    expect(
      year.filter((h) => h.id === 'constitution-day').map((h) => formatDate(h.date)),
    ).toEqual(['2083-06-04']);
    expect(holidaysFor(2083, { includeFixed: false }).map((h) => h.id)).toEqual([
      'constitution-day',
      'test-festival',
    ]);
    expect(holidaysFor(2084).find((h) => h.id === 'constitution-day')?.date.day).toBe(3);

    registerHolidays(2081, []);
    expect(registeredYears()).toEqual([2081, 2083]);
    clearHolidays(2083);
    expect(registeredYears()).toEqual([2081]);
  });

  test.each([
    [null, '$'],
    [{ ...file, year: '2083' }, 'year'],
    [{ ...file, source: ' ' }, 'source'],
    [{ ...file, holidays: {} }, 'holidays'],
    [{ ...file, holidays: [42] }, 'holidays[0]'],
    [{ ...file, holidays: [{ ...file.holidays[0], id: '' }] }, 'holidays[0].id'],
    [{ ...file, holidays: [file.holidays[0], file.holidays[0]] }, 'holidays[1].id'],
    [
      { ...file, holidays: [{ ...file.holidays[0], date: '2083-13-01' }] },
      'holidays[0].date',
    ],
    [
      { ...file, holidays: [{ ...file.holidays[0], date: 20830101 }] },
      'holidays[0].date',
    ],
    [
      { ...file, holidays: [{ ...file.holidays[0], date: '2084-01-01' }] },
      'holidays[0].date',
    ],
    [{ ...file, holidays: [{ ...file.holidays[0], type: 'party' }] }, 'holidays[0].type'],
    [
      { ...file, holidays: [{ ...file.holidays[0], name: { en: 'Only English' } }] },
      'holidays[0].name',
    ],
  ])('rejects a bad list (%#) at %s', (input, path) => {
    expect(() => parseHolidayFile(input)).toThrow(HolidayDataError);
    expect(() => parseHolidayFile(input)).toThrow(expect.objectContaining({ path }));
  });

  test('registerHolidays accepts BsDate objects and rejects dates in another year', () => {
    registerHolidays(2083, [
      {
        id: 'school',
        date: bsDate(2083, 3, 1),
        name: { en: 'School day', ne: 'विद्यालय' },
        type: 'custom',
      },
    ]);
    expect(holidaysOn(bsDate(2083, 3, 1))[0]?.type).toBe('custom');
    expect(() =>
      registerHolidays(2083, [
        { id: 'x', date: '2082-01-01', name: { en: 'X', ne: 'X' } },
      ]),
    ).toThrow(/BS 2083/);
  });
});
