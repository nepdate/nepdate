import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  endOfYear,
  fiscalYear,
  fiscalYearRange,
  getLocale,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toCalendar,
  type AdDate,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';

/** Built-in shortcuts for a single date. */
export type SinglePresetId = 'today' | 'yesterday' | 'tomorrow';

/** Built-in shortcuts for a range. Weeks, months and years count in the calendar on screen. */
export type RangePresetId =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'thisFiscalYear'
  | 'lastFiscalYear';

/** What a preset gets to work out its date: today (in the configured zone), the calendar on screen, the week start. */
export interface PresetContext {
  readonly today: AdDate;
  readonly calendar: CalendarSystem;
  readonly weekStartsOn: Weekday;
}

export interface PresetRange {
  readonly start: CalendarDate;
  readonly end: CalendarDate;
}

/** An app-defined shortcut, e.g. { id: 'admission', label: 'Admission day', resolve: () => bsDate(2083, 1, 15) }. */
export interface CustomPreset<R> {
  readonly id: string;
  readonly label: string;
  readonly resolve: (context: PresetContext) => R;
}

export type SinglePreset = SinglePresetId | CustomPreset<CalendarDate>;
export type RangePreset = RangePresetId | CustomPreset<PresetRange>;

/** One shortcut as the panel shows it. */
export interface PresetState {
  readonly id: string;
  readonly label: string;
  /** The current value is exactly this preset's date or range. */
  readonly isActive: boolean;
  /** Outside min/max, too short/long, or outside the BS table. */
  readonly isDisabled: boolean;
}

/** The date a built-in single preset stands for. */
export function resolveSinglePreset(
  id: SinglePresetId,
  context: PresetContext,
): CalendarDate {
  const today = toCalendar(context.today, context.calendar);
  switch (id) {
    case 'today':
      return today;
    case 'yesterday':
      return addDays(today, -1);
    case 'tomorrow':
      return addDays(today, 1);
  }
}

/** The range a built-in range preset stands for, in the calendar on screen. */
export function resolveRangePreset(
  id: RangePresetId,
  context: PresetContext,
): PresetRange {
  const today = toCalendar(context.today, context.calendar);
  const week = context.weekStartsOn;
  switch (id) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const day = addDays(today, -1);
      return { start: day, end: day };
    }
    case 'thisWeek':
      return { start: startOfWeek(today, week), end: endOfWeek(today, week) };
    case 'lastWeek': {
      const day = addDays(today, -7);
      return { start: startOfWeek(day, week), end: endOfWeek(day, week) };
    }
    case 'last7Days':
      return { start: addDays(today, -6), end: today };
    case 'last30Days':
      return { start: addDays(today, -29), end: today };
    case 'thisMonth':
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case 'lastMonth': {
      const month = addMonths(startOfMonth(today), -1);
      return { start: month, end: endOfMonth(month) };
    }
    case 'thisYear':
      return { start: startOfYear(today), end: endOfYear(today) };
    case 'thisFiscalYear': {
      const fy = fiscalYear(today);
      return { start: fy.firstDay, end: fy.lastDay };
    }
    case 'lastFiscalYear': {
      const fy = fiscalYearRange(fiscalYear(today).startYear - 1);
      return { start: fy.firstDay, end: fy.lastDay };
    }
  }
}

/** Shared by both pickers: label + resolver for a preset entry. */
export function describePreset<R, Id extends string>(
  preset: Id | CustomPreset<R>,
  locale: LocaleCode | undefined,
  resolveBuiltIn: (id: Id, context: PresetContext) => R,
): { id: string; label: string; resolve: (context: PresetContext) => R } {
  if (typeof preset === 'string') {
    const labels = getLocale(locale).presets as Record<string, string>;

    return {
      id: preset,
      label: labels[preset] ?? preset,
      resolve: (context) => resolveBuiltIn(preset, context),
    };
  }

  return preset;
}
