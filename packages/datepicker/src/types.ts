import type {
  AdDate,
  BsDate,
  CalendarDate,
  CalendarSystem,
  DateFormatPattern,
  LocaleCode,
  Weekday,
} from '@nepdate/core';
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

export type DateErrorCode = 'format' | 'range' | 'disabled' | 'tooShort' | 'tooLong';

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
  readonly open: boolean;
  readonly error: DateError | null;
  /** The same day in the other calendar, e.g. "10 October 2026 AD". */
  readonly equivalentText: string | null;
  /** "YYYY-MM-DD (BS)" */
  readonly placeholder: string;
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
}

export type RangeField = 'start' | 'end';

export interface DateRangePickerState {
  readonly value: RangeValue;
  readonly date: RangeDetail;
  readonly startText: string;
  readonly endText: string;
  readonly calendar: CalendarSystem;
  readonly canSwitchCalendar: boolean;
  readonly open: boolean;
  /** The first problem, and which field it belongs to ('range' for length problems). */
  readonly error: (DateError & { readonly field: RangeField | 'range' }) | null;
  readonly equivalentText: { readonly start: string | null; readonly end: string | null };
  readonly placeholder: string;
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
}

export interface DateRangePickerStore {
  getState(): DateRangePickerState;
  subscribe(listener: () => void): () => void;
  setOptions(changes: Partial<DateRangePickerOptions>): void;
  readonly actions: DateRangePickerActions;
  readonly calendar: CalendarStore;
  destroy(): void;
}
