import { getConfig } from '../config';
import type { CalendarSystem, LocaleCode } from '../types';
import { localeData, type LocaleData } from './registry';

export { hasLocale, registerLocale, type LocaleData } from './registry';

const DEVANAGARI = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/** The data for a locale (the configured default when omitted; English when unknown). */
export function getLocale(locale: LocaleCode = getConfig().defaultLocale): LocaleData {
  return localeData(locale);
}

export function monthNames(
  calendar: CalendarSystem,
  locale?: LocaleCode,
  width: 'long' | 'short' = 'long',
): readonly string[] {
  return getLocale(locale).months[calendar][width];
}

export function weekdayNames(
  locale?: LocaleCode,
  width: 'long' | 'short' | 'narrow' = 'long',
): readonly string[] {
  return getLocale(locale).weekdays[width];
}

/** Replace Devanagari digits with ASCII digits. */
export function toAsciiDigits(value: string): string {
  return value.replace(/[०-९]/g, (digit) => String(DEVANAGARI.indexOf(digit)));
}

/** Replace ASCII digits with Devanagari digits. */
export function toDevanagariDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => DEVANAGARI[Number(digit)] ?? digit);
}

/** Write a number (or digit string) with the locale's digits. */
export function formatNumber(value: string | number, locale?: LocaleCode): string {
  const { digits } = getLocale(locale);

  return String(value).replace(/[0-9]/g, (digit) => digits[Number(digit)] ?? digit);
}

/** Fill {name} placeholders in a locale message. */
export function formatMessage(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole);
}
