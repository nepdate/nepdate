import { NepDateRangeError } from '../errors';
import type { LocaleCode } from '../types';
import { en } from './en';
import { ne } from './ne';

type Names12 = readonly string[];

/** Everything a language needs: digits, names, UI labels and validation messages. */
export interface LocaleData {
  /** Ten digit characters, 0–9. */
  readonly digits: readonly string[];
  /** Seven names each, Sunday first. */
  readonly weekdays: {
    readonly long: readonly string[];
    readonly short: readonly string[];
    readonly narrow: readonly string[];
  };
  /** Twelve names each, first month first. */
  readonly months: {
    readonly AD: { readonly long: Names12; readonly short: Names12 };
    readonly BS: { readonly long: Names12; readonly short: Names12 };
  };
  /** How each calendar is named in this language: "BS" / "वि.सं.". */
  readonly calendarNames: { readonly AD: string; readonly BS: string };
  readonly labels: {
    readonly today: string;
    readonly clear: string;
    readonly previousMonth: string;
    readonly nextMonth: string;
    readonly previousYear: string;
    readonly nextYear: string;
    readonly month: string;
    readonly year: string;
    readonly openCalendar: string;
    readonly chooseDate: string;
    readonly calendar: string;
  };
  /** Messages may use {min} and {max} placeholders. */
  readonly messages: {
    readonly invalidFormat: { readonly AD: string; readonly BS: string };
    readonly outOfRange: string;
    readonly onOrAfter: string;
    readonly onOrBefore: string;
    readonly unavailable: string;
    /** Range pickers: {min} / {max} are day counts. */
    readonly rangeTooShort: string;
    readonly rangeTooLong: string;
  };
}

const locales = new Map<string, LocaleData>([
  ['en', en],
  ['ne', ne],
]);

/** Add or replace a language. Lists must have the right lengths (10 digits, 7 weekdays, 12 months). */
export function registerLocale(code: LocaleCode, data: LocaleData): void {
  const checks: [string, readonly string[], number][] = [
    ['digits', data.digits, 10],
    ['weekdays.long', data.weekdays.long, 7],
    ['weekdays.short', data.weekdays.short, 7],
    ['weekdays.narrow', data.weekdays.narrow, 7],
    ['months.AD.long', data.months.AD.long, 12],
    ['months.AD.short', data.months.AD.short, 12],
    ['months.BS.long', data.months.BS.long, 12],
    ['months.BS.short', data.months.BS.short, 12],
  ];
  for (const [name, list, length] of checks) {
    if (list.length !== length) {
      throw new NepDateRangeError(
        'INVALID_ARGUMENT',
        `Locale "${code}": ${name} must have ${length} entries, not ${list.length}.`,
      );
    }
  }
  locales.set(code, data);
}

export function hasLocale(code: LocaleCode): boolean {
  return locales.has(code);
}

/** The data for a locale, or English when the locale is not registered. */
export function localeData(code: LocaleCode): LocaleData {
  return locales.get(code) ?? en;
}
