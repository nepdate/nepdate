import type {
  CalendarDate,
  CalendarSystem,
  EpochDay,
  LocaleCode,
  MonthNumber,
  Weekday,
} from '@nepdate/core';

export type CalendarView = 'day' | 'month' | 'year';
export type SelectionMode = 'single' | 'range';

/** A range being chosen or chosen. `end` is null after the first click. */
export interface DateRange {
  readonly start: CalendarDate | null;
  readonly end: CalendarDate | null;
}

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
  readonly calendar?: CalendarSystem;
  /** Names and digits. Default: core's configured default locale. */
  readonly locale?: LocaleCode;
  readonly selectionMode?: SelectionMode;
  /** A date in single mode, a range in range mode. */
  readonly selected?: CalendarDate | DateRange | null;
  /** The month shown first (any day in it). Default: selected ?? today. */
  readonly defaultVisibleMonth?: CalendarDate;
  /** Show this month; pass again through setOptions to move it (controlled). */
  readonly visibleMonth?: CalendarDate;
  /** Earliest and latest selectable days, in either calendar. */
  readonly min?: CalendarDate | null;
  readonly max?: CalendarDate | null;
  readonly isDateDisabled?: (date: CalendarDate) => boolean;
  readonly holidays?: readonly HolidayInput[] | HolidayLookup;
  readonly events?: (date: CalendarDate) => readonly EventMarker[];
  /** Show the other calendar's day number under each day. Default true. */
  readonly showOtherCalendar?: boolean;
  /** Fill leading/trailing cells with days of the next/previous months. Default true. */
  readonly showOutsideDays?: boolean;
  /** Always six rows. Default false. */
  readonly fixedWeeks?: boolean;
  readonly weekStartsOn?: Weekday;
  readonly weekendDays?: readonly Weekday[];
  /** Override "today" (tests, server rendering). Default: core's today() in the configured zone. */
  readonly today?: CalendarDate;
  readonly onSelect?: (selection: CalendarDate | DateRange) => void;
  readonly onVisibleMonthChange?: (month: CalendarDate) => void;
  readonly onViewChange?: (view: CalendarView) => void;
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
  readonly canPrev: boolean;
  readonly canNext: boolean;
  readonly selectionMode: SelectionMode;
  /** In single mode the selected day; in range mode the range (either end may be null). */
  readonly selected: CalendarDate | DateRange | null;
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
