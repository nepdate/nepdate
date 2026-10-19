import type {
  AdDate,
  BsDate,
  CalendarDate,
  CalendarSystem,
  DateFormatPattern,
  LocaleCode,
  Weekday,
} from '@nepdate/core';
import type { PresetState, RangePreset, SinglePreset } from './presets';
import type {
  CalendarState,
  CalendarStore,
  EventMarker,
  HolidayInput,
  HolidayLookup,
} from '@nepdate/calendar';

/** The same day in both calendars, sent with every change. */
export interface DateDetail {
  readonly ad: AdDate;
  readonly bs: BsDate;
}

export type DateErrorCode =
  'format' | 'range' | 'disabled' | 'tooShort' | 'tooLong' | 'tooMany';

export interface DateError {
  readonly code: DateErrorCode;
  /** Already translated for the picker's locale. */
  readonly message: string;
}

/** Options both pickers share. Dates in options are AD "YYYY-MM-DD" strings (docs/plan D-003). */
export interface PickerBaseOptions {
  /** Show and type dates in this calendar only, and hide the BS/AD switch. */
  readonly calendar?: CalendarSystem | undefined;
  /** The calendar shown first when switching is allowed. Default 'BS'. */
  readonly defaultCalendar?: CalendarSystem | undefined;
  /** Called when the user switches BS/AD (adapters may remember it). */
  readonly onCalendarChange?: ((calendar: CalendarSystem) => void) | undefined;
  /** Earliest and latest allowed days, as AD "YYYY-MM-DD". */
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  readonly isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
  readonly locale?: LocaleCode | undefined;
  /** How the input shows a date. Default 'iso' (YYYY-MM-DD), which can be typed back. */
  readonly displayFormat?: DateFormatPattern | undefined;
  /** Close the panel after a pick. Default true. */
  readonly closeOnSelect?: boolean | undefined;
  /** Show the calendar in the page, always open, instead of in a popover. Default false. */
  readonly inline?: boolean | undefined;
  /** Add the dashes of YYYY-MM-DD while the user types digits. Default true. */
  readonly mask?: boolean | undefined;
  // Passed through to the panel's calendar.
  readonly holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  readonly events?: ((date: CalendarDate) => readonly EventMarker[]) | undefined;
  readonly showOtherCalendar?: boolean | undefined;
  readonly weekStartsOn?: Weekday | undefined;
  readonly weekendDays?: readonly Weekday[] | undefined;
  /** Override "today" (tests, server rendering). */
  readonly today?: CalendarDate | undefined;
}

export interface DatePickerOptions extends PickerBaseOptions {
  /** AD "YYYY-MM-DD" or "". Passing it again through setOptions replaces the value. */
  readonly value?: string | undefined;
  /** The starting value when the picker keeps its own state. */
  readonly defaultValue?: string | undefined;
  readonly onChange?: ((value: string, detail: DateDetail | null) => void) | undefined;
  /** Shortcuts shown in the panel: 'today', 'yesterday', 'tomorrow' or your own. */
  readonly presets?: readonly SinglePreset[] | undefined;
}

export interface DatePickerState {
  /** AD "YYYY-MM-DD", or "" when empty or invalid. Never a BS date. */
  readonly value: string;
  readonly date: DateDetail | null;
  /** What the input shows. */
  readonly text: string;
  /** The calendar the input and panel use. */
  readonly calendar: CalendarSystem;
  readonly canSwitchCalendar: boolean;
  /** The panel is showing. Always true for an inline picker. */
  readonly open: boolean;
  /** The calendar sits in the page and never closes (option `inline`). */
  readonly inline: boolean;
  readonly error: DateError | null;
  /** The same day in the other calendar, e.g. "10 October 2026 AD". */
  readonly equivalentText: string | null;
  /** "YYYY-MM-DD (BS)" */
  readonly placeholder: string;
  readonly presets: readonly PresetState[];
  readonly calendarState: CalendarState;
}

export interface DatePickerActions {
  /** The user typed. Updates the value when the text is a valid, allowed date. */
  type(text: string): void;
  /** Tidy the text ("2083/6/4" → "2083-06-04") unless it has an error. */
  blur(): void;
  clear(): void;
  /** Set the value from outside; does not call onChange. */
  setValue(value: string): void;
  open(): void;
  close(): void;
  toggle(): void;
  /** Show BS or AD. The value does not change. Ignored when the calendar is fixed. */
  switchCalendar(calendar: CalendarSystem): void;
  /** Pick a day (e.g. from the panel). Returns false when the day is disabled. */
  select(date: CalendarDate): boolean;
  /** Returns false when today is not allowed. */
  selectToday(): boolean;
  /** Back to defaultValue (form reset). */
  reset(): void;
  /** Apply a shortcut by id. Returns false when it is disabled or unknown. */
  applyPreset(id: string): boolean;
}

export interface DatePickerStore {
  getState(): DatePickerState;
  subscribe(listener: () => void): () => void;
  setOptions(changes: Partial<DatePickerOptions>): void;
  readonly actions: DatePickerActions;
  /** The panel's calendar store, for adapters (keyboard moves, views, hover). */
  readonly calendar: CalendarStore;
  destroy(): void;
}

export interface RangeValue {
  readonly start: string;
  readonly end: string;
}

export interface RangeDetail {
  readonly start: DateDetail | null;
  readonly end: DateDetail | null;
}

export interface DateRangePickerOptions extends PickerBaseOptions {
  readonly value?: RangeValue | undefined;
  readonly defaultValue?: RangeValue | undefined;
  readonly onChange?: ((value: RangeValue, detail: RangeDetail) => void) | undefined;
  /** Shortest and longest allowed range, in days, counting both ends. */
  readonly minDays?: number | undefined;
  readonly maxDays?: number | undefined;
  /** Shortcuts: 'last7Days', 'thisMonth', 'thisFiscalYear', … or your own. */
  readonly presets?: readonly RangePreset[] | undefined;
}

export type RangeField = 'start' | 'end';

export interface DateRangePickerState {
  readonly value: RangeValue;
  readonly date: RangeDetail;
  readonly startText: string;
  readonly endText: string;
  readonly calendar: CalendarSystem;
  readonly canSwitchCalendar: boolean;
  /** The panel is showing. Always true for an inline picker. */
  readonly open: boolean;
  /** The calendar sits in the page and never closes (option `inline`). */
  readonly inline: boolean;
  /** The first problem, and which field it belongs to ('range' for length problems). */
  readonly error: (DateError & { readonly field: RangeField | 'range' }) | null;
  readonly equivalentText: { readonly start: string | null; readonly end: string | null };
  readonly placeholder: string;
  readonly presets: readonly PresetState[];
  readonly calendarState: CalendarState;
}

export interface DateRangePickerActions {
  type(field: RangeField, text: string): void;
  blur(field: RangeField): void;
  clear(): void;
  setValue(value: RangeValue): void;
  open(): void;
  close(): void;
  toggle(): void;
  switchCalendar(calendar: CalendarSystem): void;
  /** A click in the panel: first sets the start, second the end. */
  select(date: CalendarDate): boolean;
  reset(): void;
  /** Apply a shortcut by id. Returns false when it is disabled or unknown. */
  applyPreset(id: string): boolean;
}

export interface DateRangePickerStore {
  getState(): DateRangePickerState;
  subscribe(listener: () => void): () => void;
  setOptions(changes: Partial<DateRangePickerOptions>): void;
  readonly actions: DateRangePickerActions;
  readonly calendar: CalendarStore;
  destroy(): void;
}

export interface MultiDatePickerOptions extends PickerBaseOptions {
  /** AD "YYYY-MM-DD" days. Passing it again through setOptions replaces the value. */
  readonly value?: readonly string[] | undefined;
  readonly defaultValue?: readonly string[] | undefined;
  readonly onChange?:
    ((value: readonly string[], dates: readonly DateDetail[]) => void) | undefined;
  /** The most days that may be chosen. */
  readonly maxDates?: number | undefined;
}

export interface MultiDatePickerState {
  /** AD "YYYY-MM-DD" days, sorted, no repeats. Never BS dates. */
  readonly value: readonly string[];
  readonly dates: readonly DateDetail[];
  /** What the input shows: the days as YYYY-MM-DD, separated by ", ". */
  readonly text: string;
  readonly calendar: CalendarSystem;
  readonly canSwitchCalendar: boolean;
  /** The panel is showing. Always true for an inline picker. */
  readonly open: boolean;
  readonly inline: boolean;
  readonly error: DateError | null;
  readonly placeholder: string;
  readonly calendarState: CalendarState;
}

export interface MultiDatePickerActions {
  /** The user typed days separated by commas or spaces. */
  type(text: string): void;
  /** Tidy the text unless it has an error. */
  blur(): void;
  clear(): void;
  /** Set the value from outside; does not call onChange. */
  setValue(value: readonly string[]): void;
  open(): void;
  close(): void;
  toggle(): void;
  switchCalendar(calendar: CalendarSystem): void;
  /** Add the day, or remove it when chosen. Returns false when disabled or over maxDates. */
  select(date: CalendarDate): boolean;
  /** Remove one day, by its AD "YYYY-MM-DD" value. */
  remove(value: string): void;
  /** Back to defaultValue (form reset). */
  reset(): void;
}

export interface MultiDatePickerStore {
  getState(): MultiDatePickerState;
  subscribe(listener: () => void): () => void;
  setOptions(changes: Partial<MultiDatePickerOptions>): void;
  readonly actions: MultiDatePickerActions;
  readonly calendar: CalendarStore;
  destroy(): void;
}
