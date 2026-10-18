import {
  compareDates,
  createDate,
  fiscalYear,
  fiscalYearRange,
  formatFiscalYear,
  endOfMonth,
  endOfYear,
  formatNumber,
  isAfter,
  isBefore,
  isValidDate,
  monthNames,
  startOfYear,
  toCalendar,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
} from '@nepdate/core';
import type { Limits } from './limits';
import type { PickerCell } from './types';

export interface TileInput {
  readonly calendar: CalendarSystem;
  /** The year whose months are shown, or any year in the page of years. */
  readonly year: number;
  readonly limits: Limits;
  readonly locale: LocaleCode;
  /** The selected day (range start in range mode), in any calendar. */
  readonly selected: CalendarDate | null;
  readonly today: CalendarDate;
}

/** Twelve month tiles: "Ashwin" with "Sep / Oct" under it. */
export function buildMonthTiles(input: TileInput): PickerCell[] {
  const { calendar, year, limits, locale } = input;
  const other: CalendarSystem = calendar === 'BS' ? 'AD' : 'BS';
  const long = monthNames(calendar, locale, 'long');
  const otherShort = monthNames(other, locale, 'short');
  const selected = input.selected ? safeConvert(input.selected, calendar) : null;
  const today = safeConvert(input.today, calendar);

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const valid = isValidDate(calendar, year, month, 1);
    let subLabel: string | null = null;
    let isDisabled = true;
    if (valid) {
      const first = createDate(calendar, year, month, 1);
      const last = endOfMonth(first);
      const from = safeConvert(first, other);
      const to = safeConvert(last, other);
      if (from && to) {
        const a = otherShort[from.month - 1] ?? '';
        const b = otherShort[to.month - 1] ?? '';
        subLabel = a === b ? a : `${a} / ${b}`;
      }
      isDisabled =
        limits.empty || isBefore(last, limits.lowDay) || isAfter(first, limits.highDay);
    }

    return Object.freeze({
      value: month,
      label: long[index] ?? '',
      subLabel,
      isSelected: selected?.year === year && selected.month === month,
      isCurrent: today?.year === year && today.month === month,
      isDisabled,
    });
  });
}

/** The first year of the page of twelve that contains `year`. */
export function yearPageStart(year: number): number {
  return Math.floor(year / 12) * 12;
}

/** Twelve year tiles: "2083" with "2026/27" under it. */
export function buildYearTiles(input: TileInput): PickerCell[] {
  const { calendar, limits, locale } = input;
  const other: CalendarSystem = calendar === 'BS' ? 'AD' : 'BS';
  const start = yearPageStart(input.year);
  const selected = input.selected ? safeConvert(input.selected, calendar) : null;
  const today = safeConvert(input.today, calendar);

  return Array.from({ length: 12 }, (_, index) => {
    const year = start + index;
    let subLabel: string | null = null;
    if (isValidDate(calendar, year, 1, 1)) {
      const first = createDate(calendar, year, 1, 1);
      const from = safeConvert(startOfYear(first), other);
      const to = safeConvert(endOfYear(first), other);
      if (from && to) {
        subLabel = formatNumber(
          from.year === to.year
            ? `${from.year}`
            : `${from.year}/${String(to.year % 100).padStart(2, '0')}`,
          locale,
        );
      }
    }

    return Object.freeze({
      value: year,
      label: formatNumber(year, locale),
      subLabel,
      isSelected: selected?.year === year,
      isCurrent: today?.year === year,
      isDisabled: limits.empty || year < limits.lowDay.year || year > limits.highDay.year,
    });
  });
}

function safeConvert(date: CalendarDate, calendar: CalendarSystem): CalendarDate | null {
  try {
    return toCalendar(date, calendar);
  } catch {
    return null;
  }
}

/** The fiscal year that starts in BS `startYear`, or null outside the BS table. */
export function safeFiscalYear(
  startYear: number,
): ReturnType<typeof fiscalYearRange> | null {
  try {
    return fiscalYearRange(startYear);
  } catch {
    return null;
  }
}

/** Whether a whole fiscal year lies inside the limits. */
export function isFiscalYearAllowed(startYear: number, limits: Limits): boolean {
  const fy = safeFiscalYear(startYear);

  return (
    fy !== null &&
    !limits.empty &&
    compareDates(fy.firstDay, limits.lowDay) >= 0 &&
    compareDates(fy.lastDay, limits.highDay) <= 0
  );
}

/** Twelve fiscal-year tiles: "2083/84" with the AD years "2026/27" under it. */
export function buildFiscalYearTiles(
  input: TileInput & {
    readonly selectedRange: {
      start: CalendarDate | null;
      end: CalendarDate | null;
    } | null;
  },
): PickerCell[] {
  const { limits, locale } = input;
  const anchor = safeConvert(input.today, 'BS');
  const pageStart = yearPageStart(input.year);
  const currentStart = anchor ? fiscalYear(anchor).startYear : null;
  const range = input.selectedRange;

  return Array.from({ length: 12 }, (_, index) => {
    const startYear = pageStart + index;
    const fy = safeFiscalYear(startYear);
    const from = fy ? safeConvert(fy.firstDay, 'AD') : null;
    const to = fy ? safeConvert(fy.lastDay, 'AD') : null;
    const isSelected =
      fy !== null &&
      range?.start != null &&
      range.end != null &&
      compareDates(range.start, fy.firstDay) === 0 &&
      compareDates(range.end, fy.lastDay) === 0;

    return Object.freeze({
      value: startYear,
      label: fy
        ? formatFiscalYear(fy, 'label', locale)
        : formatNumber(
            `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`,
            locale,
          ),
      subLabel:
        from && to
          ? formatNumber(`${from.year}/${String(to.year % 100).padStart(2, '0')}`, locale)
          : null,
      isSelected,
      isCurrent: currentStart === startYear,
      isDisabled: !isFiscalYearAllowed(startYear, limits),
    });
  });
}
