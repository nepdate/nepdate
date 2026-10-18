import { NepDateRangeError } from './errors';
import { hasLocale } from './locale/registry';
import type { LocaleCode, Weekday } from './types';

/**
 * Settings shared by both calendars. Calendar data is not here: the BS table is
 * managed by setBsData/patchBsYear, and AD needs no data (docs/plan D-001).
 */
export interface NepDateConfig {
  /** Which time zone decides "today" and the calendar day of an instant. */
  readonly timeZone: string;
  readonly weekStartsOn: Weekday;
  readonly weekendDays: readonly Weekday[];
  readonly defaultLocale: LocaleCode;
}

const DEFAULTS: NepDateConfig = Object.freeze({
  timeZone: 'Asia/Kathmandu',
  weekStartsOn: 0,
  weekendDays: Object.freeze<Weekday[]>([6]),
  defaultLocale: 'en',
});

let current: NepDateConfig = DEFAULTS;

/** Change one or more settings. Every value is checked before any is applied. */
export function configure(changes: Partial<NepDateConfig>): void {
  const next = { ...current, ...changes };

  if (!isTimeZone(next.timeZone)) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `"${next.timeZone}" is not a time zone.`,
    );
  }
  if (!isWeekday(next.weekStartsOn)) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `weekStartsOn must be 0–6, not ${String(next.weekStartsOn)}.`,
    );
  }
  if (
    !next.weekendDays.every(isWeekday) ||
    new Set(next.weekendDays).size !== next.weekendDays.length
  ) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      'weekendDays must be different weekdays, each 0–6.',
    );
  }
  if (!hasLocale(next.defaultLocale)) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `Locale "${next.defaultLocale}" is not registered.`,
    );
  }

  current = Object.freeze({
    ...next,
    weekendDays: Object.freeze([...next.weekendDays]),
  });
}

export function getConfig(): NepDateConfig {
  return current;
}

/** Back to the defaults (Kathmandu, Sunday first, Saturday weekend, English). */
export function resetConfig(): void {
  current = DEFAULTS;
}

export function isWeekday(value: unknown): value is Weekday {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 6;
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });

    return true;
  } catch {
    return false;
  }
}
