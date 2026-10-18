import { describe, expect, test } from 'vitest';
import {
  addDays,
  bsDate,
  bsToAd,
  fiscalYear,
  fiscalYearRange,
  isInFiscalYear,
} from '@nepdate/core';
import { FISCAL_YEAR_STARTS } from './fixtures/known-conversions';
import { ad, ymd } from './helpers';

describe('fiscal years start on 1 Shrawan as published (TEST-013)', () => {
  test.each(FISCAL_YEAR_STARTS)('FY %i starts on AD %s', (startYear, adText) => {
    const first = ad(adText);
    const fy = fiscalYear(first);

    expect(fy.startYear).toBe(startYear);
    expect(fy.label).toBe(
      `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`,
    );
    expect(ymd(bsToAd(fy.firstDay))).toBe(adText);
    expect(fiscalYear(addDays(first, -1)).startYear).toBe(startYear - 1);
    expect(ymd(bsToAd(fiscalYearRange(startYear).firstDay))).toBe(adText);
  });

  test('the fiscal year ends on the last day of Asar', () => {
    const fy = fiscalYearRange(2082);
    expect(ymd(fy.lastDay)).toBe('2083-03-32');
    expect(isInFiscalYear(fy.lastDay, fy)).toBe(true);
    expect(isInFiscalYear(addDays(fy.lastDay, 1), fy)).toBe(false);
    expect(isInFiscalYear(addDays(fy.firstDay, -1), fy)).toBe(false);
    expect(isInFiscalYear(bsDate(2082, 10, 1), fy)).toBe(true);
    expect(Object.isFrozen(fy)).toBe(true);
  });
});
