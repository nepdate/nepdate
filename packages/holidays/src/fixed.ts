import type { HolidayName } from './types';

export interface FixedHolidayRule {
  readonly id: string;
  readonly month: number;
  readonly day: number;
  readonly name: HolidayName;
  /** First BS year the day is observed, when it began within the table's range. */
  readonly since?: number;
}

/**
 * National days on fixed BS dates. Whether the government declares each one a
 * public holiday can change from year to year, so load the official yearly
 * list (loadHolidayFile) for leave decisions. Lunar festivals are not here:
 * their dates change every year and must come from the published list.
 */
export const FIXED_NATIONAL_DAYS: readonly FixedHolidayRule[] = Object.freeze([
  { id: 'new-year', month: 1, day: 1, name: { en: 'Nepali New Year', ne: 'नयाँ वर्ष' } },
  {
    id: 'loktantra-day',
    month: 1,
    day: 11,
    name: { en: 'Loktantra Day', ne: 'लोकतन्त्र दिवस' },
    since: 2063,
  },
  {
    id: 'republic-day',
    month: 2,
    day: 15,
    name: { en: 'Republic Day', ne: 'गणतन्त्र दिवस' },
    since: 2065,
  },
  {
    id: 'constitution-day',
    month: 6,
    day: 3,
    name: { en: 'Constitution Day', ne: 'संविधान दिवस' },
    since: 2072,
  },
  {
    id: 'prithvi-jayanti',
    month: 9,
    day: 27,
    name: {
      en: 'Prithvi Jayanti (National Unity Day)',
      ne: 'पृथ्वी जयन्ती (राष्ट्रिय एकता दिवस)',
    },
  },
  {
    id: 'martyrs-day',
    month: 10,
    day: 16,
    name: { en: "Martyrs' Day", ne: 'शहीद दिवस' },
  },
  {
    id: 'democracy-day',
    month: 11,
    day: 7,
    name: { en: 'Democracy Day', ne: 'प्रजातन्त्र दिवस' },
    since: 2008,
  },
]);
