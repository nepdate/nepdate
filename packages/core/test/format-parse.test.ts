import { describe, expect, test } from 'vitest';
import {
  adDate,
  bsDate,
  DATE_FORMATS,
  fiscalYear,
  formatDate,
  formatFiscalYear,
  parseDate,
  parseDateStrict,
  parseFiscalYear,
} from '@nepdate/core';
import { bs, ymd } from './helpers';

describe('formatting (TEST-009)', () => {
  const date = bs('२०८२-०४-०१');

  test.each([
    ['iso', '2082-04-01'],
    ['cbms', '2082.04.01'],
    ['short', '1 Shr 2082'],
    ['long', '1 Shrawan 2082'],
    ['full', 'Thursday, 1 Shrawan 2082'],
    ['D, j M y \\Y', 'Thu, 1 Shr 82 Y'],
    ['n/j/Y', '4/1/2082'],
    ['d.m', '01.04'],
  ])('%s → %s', (pattern, expected) => {
    expect(formatDate(date, pattern, 'en')).toBe(expected);
  });

  test('Nepali names and digits', () => {
    expect(formatDate(date, 'long', 'ne')).toBe('१ साउन २०८२');
    expect(formatDate(date, 'full', 'ne')).toBe('बिहिबार, १ साउन २०८२');
    expect(formatDate(date, 'M', 'ne')).toBe('साउन');
  });

  test('AD dates use AD month names', () => {
    expect(formatDate(adDate(2026, 10, 18), 'full')).toBe('Sunday, 18 October 2026');
    expect(formatDate(adDate(2026, 10, 18), 'j M Y', 'ne')).toBe('१८ अक्टोबर २०२६');
    expect(formatDate(adDate(2005, 1, 9), 'y')).toBe('05');
  });

  test('default pattern is iso; a trailing backslash prints nothing more', () => {
    expect(formatDate(date)).toBe('2082-04-01');
    expect(formatDate(date, 'Y\\')).toBe('2082');
    expect(Object.keys(DATE_FORMATS)).toEqual(['iso', 'cbms', 'short', 'long', 'full']);
  });

  test('fiscal year labels', () => {
    const fy = fiscalYear(date);
    expect(formatFiscalYear(fy)).toBe('2082/83');
    expect(formatFiscalYear(fy, 'cbms')).toBe('2082.083');
    expect(formatFiscalYear(fy, 'full')).toBe('2082/2083');
    expect(formatFiscalYear(fy, 'label', 'ne')).toBe('२०८२/८३');
    expect(ymd(fy.lastDay)).toBe('2083-03-32');
  });
});

describe('parsing (CORE-090..093)', () => {
  test.each([
    ['2083-06-24', '2083-06-24'],
    ['2083/6/4', '2083-06-04'],
    ['2083.06.24', '2083-06-24'],
    ['  २०८३-०६-२४ ', '2083-06-24'],
  ])('parseDate(%s, BS)', (text, expected) => {
    const parsed = parseDate(text, 'BS');
    expect(parsed?.calendar).toBe('BS');
    expect(parsed && ymd(parsed)).toBe(expected);
  });

  test.each([
    '24-06-2083',
    '2083-6',
    '2083-06-24-1',
    'abc',
    '',
    '2083-13-01',
    '2082-01-32',
  ])('parseDate(%s) is null', (text) => {
    expect(parseDate(text, 'BS')).toBeNull();
  });

  test('null and undefined are not dates', () => {
    expect(parseDate(null, 'AD')).toBeNull();
    expect(parseDate(undefined, 'BS')).toBeNull();
  });

  test('the same text means different days in each calendar', () => {
    expect(parseDate('2025-01-01', 'AD')).toEqual(adDate(2025, 1, 1));
    expect(parseDate('2025-01-01', 'BS')).toEqual(bsDate(2025, 1, 1));
  });

  test('parseDateStrict says what is wrong', () => {
    expect(() => parseDateStrict('17 July 2025', 'BS')).toThrow(
      expect.objectContaining({ code: 'INVALID_ARGUMENT' }),
    );
    expect(() => parseDateStrict('2082-01-32', 'BS')).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE' }),
    );
    expect(() => parseDateStrict('2150-01-01', 'BS')).toThrow(
      expect.objectContaining({ code: 'OUT_OF_TABLE' }),
    );
  });

  test.each([
    '2083/84',
    '2083/2084',
    '2083-84',
    '2083.084',
    '2083.84',
    '२०८३/८४',
    '2083 / 84',
  ])('parseFiscalYear(%s) is FY 2083/84', (text) => {
    expect(parseFiscalYear(text)?.label).toBe('2083/84');
  });

  test.each(['2083/85', '2083.0084', '2083/2085', '2083', 'FY 2083/84', null, '2099/00'])(
    'parseFiscalYear(%s) is null',
    (text) => {
      expect(parseFiscalYear(text)).toBeNull();
    },
  );

  test('a century rollover label works', () => {
    expect(parseFiscalYear('2099/00')).toBeNull(); // 2100 is outside the table
    expect(parseFiscalYear('1999/00')?.startYear).toBe(1999);
  });
});
