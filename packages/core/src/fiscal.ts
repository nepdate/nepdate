import { BS_FISCAL_YEAR_START_MONTH } from './bs/data-api';
import { compareDates } from './compare';
import { toCalendar } from './convert';
import { bsDate, daysInMonth } from './create';
import { formatNumber } from './locale/index';
import type { CalendarDate, FiscalYear, LocaleCode } from './types';

/** The fiscal year a date falls in: 1 Shrawan to the end of Asar. */
export function fiscalYear(date: CalendarDate): FiscalYear {
  const bs = toCalendar(date, 'BS');

  return fiscalYearRange(bs.month >= BS_FISCAL_YEAR_START_MONTH ? bs.year : bs.year - 1);
}

/** The fiscal year that starts in BS `startYear` (2083 → FY 2083/84). */
export function fiscalYearRange(startYear: number): FiscalYear {
  const endYear = startYear + 1;
  const lastMonth = BS_FISCAL_YEAR_START_MONTH - 1;

  return Object.freeze({
    startYear,
    label: `${startYear}/${String(endYear % 100).padStart(2, '0')}`,
    firstDay: bsDate(startYear, BS_FISCAL_YEAR_START_MONTH, 1),
    lastDay: bsDate(endYear, lastMonth, daysInMonth('BS', endYear, lastMonth)),
  });
}

/**
 * label "2083/84" · full "2083/2084" · cbms "2083.084" (the form Nepal's tax
 * system uses). Digits follow the locale.
 */
export function formatFiscalYear(
  fy: FiscalYear,
  style: 'label' | 'full' | 'cbms' = 'label',
  locale?: LocaleCode,
): string {
  const end = fy.startYear + 1;
  const text =
    style === 'full'
      ? `${fy.startYear}/${end}`
      : style === 'cbms'
        ? `${fy.startYear}.${String(end % 1000).padStart(3, '0')}`
        : fy.label;

  return formatNumber(text, locale);
}

export function isInFiscalYear(date: CalendarDate, fy: FiscalYear): boolean {
  return compareDates(date, fy.firstDay) >= 0 && compareDates(date, fy.lastDay) <= 0;
}
