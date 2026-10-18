import type { BsDate } from '@nepdate/core';

/** national: fixed-date national days · festival: lunar festivals from the yearly list · observance: days without leave · custom: your own. */
export type HolidayType = 'national' | 'festival' | 'observance' | 'custom';

export interface HolidayName {
  readonly en: string;
  readonly ne: string;
}

export interface Holiday {
  /** Stable id, e.g. "constitution-day" or "dashain-vijaya-dashami". */
  readonly id: string;
  readonly date: BsDate;
  readonly name: HolidayName;
  readonly type: HolidayType;
  /** "fixed" = bundled rule; "registered" = loaded from a yearly list or added by the app. */
  readonly source: 'fixed' | 'registered';
}

/** One entry of a yearly list: the BS date as "YYYY-MM-DD" (ASCII or Devanagari digits). */
export interface HolidayEntry {
  readonly id: string;
  readonly date: string;
  readonly name: HolidayName;
  readonly type?: HolidayType;
}

/** A yearly holiday list as JSON, e.g. data/holidays/2083.json. */
export interface HolidayFile {
  /** The BS year the list covers. */
  readonly year: number;
  /** Where the list comes from (a link to the published notice). */
  readonly source: string;
  readonly holidays: readonly HolidayEntry[];
}
