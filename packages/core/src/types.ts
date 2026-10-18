/** The two calendars this library knows. */
export type CalendarSystem = 'AD' | 'BS';

/**
 * Whole days since 1970-01-01 AD. The only value the AD and BS calendars share:
 * every conversion goes BS → EpochDay → AD and back (docs/plan D-001, D-002).
 * Branded so a year, month or day number can never be passed by mistake.
 */
export type EpochDay = number & { readonly __brand: 'EpochDay' };

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 1 = Baisakh/January … 12 = Chaitra/December. */
export type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** A Gregorian (AD) calendar day. Create with `adDate()`; always frozen. */
export interface AdDate {
  readonly calendar: 'AD';
  readonly year: number;
  readonly month: MonthNumber;
  readonly day: number;
}

/** A Bikram Sambat (BS) calendar day. Create with `bsDate()`; always frozen. */
export interface BsDate {
  readonly calendar: 'BS';
  readonly year: number;
  readonly month: MonthNumber;
  readonly day: number;
}

export type CalendarDate = AdDate | BsDate;

/** The date type of a calendar: `DateOf<'BS'>` is `BsDate`. */
export type DateOf<C extends CalendarSystem> = C extends 'AD' ? AdDate : BsDate;

/** The BS month-length table. Keyed by BS year only; holds no AD dates (D-001). */
export interface BsData {
  /** The BS year of the first row of `years`. */
  readonly firstYear: number;
  /** Days since 1970-01-01 of 1 Baisakh of `firstYear`. */
  readonly epochStart: number;
  /** Years after this one are projections, not yet checked against a published calendar. */
  readonly verifiedThrough: number;
  /** Twelve month lengths (Baisakh..Chaitra) per year, starting at `firstYear`. */
  readonly years: readonly (readonly number[])[];
}

/** A locale code: built in are `en` and `ne`; more can be added with `registerLocale`. */
export type LocaleCode = 'en' | 'ne' | (string & Record<never, never>);

/** Nepal's fiscal year: 1 Shrawan to the last day of Asar. */
export interface FiscalYear {
  /** The BS year the fiscal year starts in: 2083 for FY 2083/84. */
  readonly startYear: number;
  /** "2083/84" */
  readonly label: string;
  readonly firstDay: BsDate;
  readonly lastDay: BsDate;
}
