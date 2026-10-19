import type {
  CalendarDate,
  CalendarSystem,
  EpochDay,
  LocaleCode,
  MonthNumber,
  Weekday,
} from '@nepdate/core';

/** 'fiscal' shows Nepal's fiscal years (1 Shrawan – end of Asar) as tiles. */
export type CalendarView = 'day' | 'month' | 'year' | 'fiscal';
export type SelectionMode = 'single' | 'range' | 'multiple';

/** A range being chosen or chosen. `end` is null after the first click. */
export interface DateRange {
  readonly start: CalendarDate | null;
  readonly end: CalendarDate | null;
}

/** A day (single mode), a range (range mode) or the chosen days, sorted (multiple mode). */
export type CalendarSelection = CalendarDate | DateRange | readonly CalendarDate[];

export interface HolidayInfo {
  readonly label?: string;
}

/** A holiday given as data: a date, or a date with a label. */
export type HolidayInput =
  CalendarDate | { readonly date: CalendarDate; readonly label?: string };

/** What the app says about a day: true/an object = holiday, false/null = not. */
export type HolidayLookup = (
  date: CalendarDate,
) => HolidayInfo | boolean | null | undefined;

/** A small marker under a day (the Figma "Event dot"). */
export interface EventMarker {
  readonly id?: string;
  readonly color?: string;
  readonly label?: string;
}

export type FocusKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown';

/** One string per day for styling; matches the Figma Day Cell variants. */
export type DayState =
  | 'default'
  | 'today'
  | 'selected'
  | 'range-start'
  | 'range-middle'
  | 'range-end'
  | 'disabled'
  | 'outside'
  | 'holiday';

export interface DayCell {
  /** Stable key for lists: "BS-2083-06-24". */
  readonly key: string;
  readonly date: CalendarDate;
  /** The same day in the other calendar; null when hidden or outside the BS table. */
  readonly otherDate: CalendarDate | null;
  readonly epoch: EpochDay;
  readonly weekday: Weekday;
  /** The day number in the locale's digits. */
  readonly label: string;
  /** The other calendar's day number, or null. */
  readonly subLabel: string | null;
  /** "Saturday, 24 Ashwin 2083 (10 October 2026 AD)" plus the holiday name when there is one. */
  readonly ariaLabel: string;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isRangeStart: boolean;
  readonly isRangeMiddle: boolean;
  readonly isRangeEnd: boolean;
  /** Between the range start and the hovered day while the end is being chosen. */
  readonly isInRangePreview: boolean;
  readonly isDisabled: boolean;
  /** Belongs to the previous or next month. */
  readonly isOutside: boolean;
  readonly isWeekend: boolean;
  readonly isHoliday: boolean;
  readonly holidayLabel: string | null;
  readonly events: readonly EventMarker[];
  /** The one day that takes keyboard focus (roving tabindex). */
  readonly isFocusTarget: boolean;
  readonly state: DayState;
}

export interface WeekdayCell {
  readonly index: Weekday;
  /** "Sun" */
  readonly label: string;
  /** "Su" */
  readonly narrowLabel: string;
  /** "Sunday" */
  readonly longLabel: string;
  readonly isWeekend: boolean;
}

/** A month or year tile; matches the Figma Picker Option variants. */
export interface PickerCell {
  /** Month number (1–12) in the month view, the year in the year view. */
  readonly value: number;
  /** "Ashwin" / "2083" in locale digits */
  readonly label: string;
  /** The other calendar's span: "Sep / Oct", "2026/27". Null outside the BS table. */
  readonly subLabel: string | null;
  readonly isSelected: boolean;
  readonly isCurrent: boolean;
  readonly isDisabled: boolean;
}

export interface CalendarOptions {
  /** Which calendar the grid shows. Default 'BS'. */
  readonly calendar?: CalendarSystem | undefined;
  /** Names and digits. Default: core's configured default locale. */
  readonly locale?: LocaleCode | undefined;
  readonly selectionMode?: SelectionMode | undefined;
  /** A date in single mode, a range in range mode, a list of days in multiple mode. */
  readonly selected?: CalendarSelection | null | undefined;
  /** The month shown first (any day in it). Default: selected ?? today. */
  readonly defaultVisibleMonth?: CalendarDate | undefined;
  /** Show this month; pass again through setOptions to move it (controlled). */
  readonly visibleMonth?: CalendarDate | undefined;
  /** Earliest and latest selectable days, in either calendar. */
  readonly min?: CalendarDate | null | undefined;
  readonly max?: CalendarDate | null | undefined;
  readonly isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
  readonly holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  readonly events?: ((date: CalendarDate) => readonly EventMarker[]) | undefined;
  /** Show the other calendar's day number under each day. Default true. */
  readonly showOtherCalendar?: boolean | undefined;
  /** Fill leading/trailing cells with days of the next/previous months. Default true. */
  readonly showOutsideDays?: boolean | undefined;
  /** Always six rows. Default false. */
  readonly fixedWeeks?: boolean | undefined;
  readonly weekStartsOn?: Weekday | undefined;
  readonly weekendDays?: readonly Weekday[] | undefined;
  /** Override "today" (tests, server rendering). Default: core's today() in the configured zone. */
  readonly today?: CalendarDate | undefined;
  /** Single: the day. Range: the range so far. Multiple: every chosen day after the click toggled one. */
  readonly onSelect?: ((selection: CalendarSelection) => void) | undefined;
  readonly onVisibleMonthChange?: ((month: CalendarDate) => void) | undefined;
  readonly onViewChange?: ((view: CalendarView) => void) | undefined;
}

export interface CalendarState {
  readonly calendar: CalendarSystem;
  readonly view: CalendarView;
  /** Day 1 of the month on screen, in `calendar`. */
  readonly visibleMonth: CalendarDate;
  /** The day that has (or will get) keyboard focus, in `calendar`. */
  readonly focused: CalendarDate;
  /** "Ashwin 2083" (day view), "2083" (month view), "2076–2087" (year view). */
  readonly title: string;
  readonly weekdays: readonly WeekdayCell[];
  /** Rows of seven. A null cell is empty (outside days hidden, or before/after the BS table). */
  readonly weeks: readonly (readonly (DayCell | null)[])[];
  readonly months: readonly PickerCell[];
  readonly years: readonly PickerCell[];
  /** Fiscal-year tiles ("2083/84"), a page of twelve; value = the start year (BS). */
  readonly fiscalYears: readonly PickerCell[];
  readonly canPrev: boolean;
  readonly canNext: boolean;
  readonly selectionMode: SelectionMode;
  /** Single: the day. Range: the range (either end may be null). Multiple: the days, sorted. */
  readonly selected: CalendarSelection | null;
  readonly rangeHover: CalendarDate | null;
  /** The first and last selectable days, in `calendar`. */
  readonly minDate: CalendarDate;
  readonly maxDate: CalendarDate;
}

export interface CalendarActions {
  next(): void;
  prev(): void;
  goTo(date: CalendarDate): void;
  goToToday(): void;
  setView(view: CalendarView): void;
  chooseMonth(month: MonthNumber): void;
  chooseYear(year: number): void;
  /**
   * Pick a fiscal year by its start year (BS). Range mode selects the whole
   * year and fires onSelect; single mode shows its first month. False when
   * the year is outside the limits.
   */
  chooseFiscalYear(startYear: number): boolean;
  focus(date: CalendarDate): void;
  moveFocus(key: FocusKey, modifiers?: { readonly shift?: boolean }): void;
  /** Select a day. Returns false (and does nothing) when the day is disabled. */
  select(date: CalendarDate): boolean;
  hover(date: CalendarDate | null): void;
}

export interface CalendarStore {
  getState(): CalendarState;
  subscribe(listener: () => void): () => void;
  setOptions(changes: Partial<CalendarOptions>): void;
  readonly actions: CalendarActions;
  destroy(): void;
}
