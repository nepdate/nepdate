import { describe, expect, test } from 'vitest';
import {
  checkDate,
  equivalentText,
  formatInput,
  parseInput,
  placeholderText,
} from '@nepdate/datepicker';
import { ad, bs } from './helpers';

const limits = { min: bs('2083-01-01'), max: bs('2083-12-30') };

describe('pure input helpers', () => {
  test('parseInput returns empty, a date or an error', () => {
    expect(parseInput('', 'BS', limits, 'en')).toEqual({ kind: 'empty' });
    expect(parseInput('2083-06-24', 'BS', limits, 'en')).toEqual({
      kind: 'date',
      date: ad('2026-10-10'),
    });
    expect(parseInput('x', 'AD', limits, 'en')).toMatchObject({
      kind: 'error',
      error: { code: 'format' },
    });
    expect(parseInput('2084-01-01', 'BS', limits, 'en')).toMatchObject({
      kind: 'error',
      error: { message: 'Choose a date from 2083-01-01 to 2083-12-30.' },
    });
  });

  test('checkDate, formatInput, equivalentText and placeholders', () => {
    expect(checkDate(bs('2083-05-05'), 'BS', limits, 'en')).toBeNull();
    expect(formatInput(null, 'BS', 'iso', 'en')).toBe('');
    expect(formatInput(ad('2026-10-10'), 'BS', 'long', 'ne')).toBe('२४ असोज २०८३');
    expect(equivalentText(null, 'BS', 'en')).toBeNull();
    expect(equivalentText(bs('2083-06-24'), 'BS', 'ne')).toBe('१० अक्टोबर २०२६ ई.सं.');
    expect(placeholderText('AD', 'en')).toBe('YYYY-MM-DD (AD)');
  });
});
