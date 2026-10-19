import {
  dayOfWeek,
  daysInMonth,
  formatDate,
  formatNumber,
  fromEpoch,
  getLocale,
  startOfMonth,
  toEpoch,
  toEpochDay,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';
import { isInLimits, type Limits } from './limits';
import type {
  CalendarSelection,
  DayCell,
  DayState,
  EventMarker,
  SelectionMode,
  WeekdayCell,
} from './types';

/** Normalised holiday lookup: a label (possibly empty) for a holiday, null otherwise. */
export type HolidayResolver = (
  date: CalendarDate,
) => { readonly label: string | null } | null;

export interface GridInput {
  readonly calendar: CalendarSystem;
  /** Any day of the month to build; day 1 is used. */
  readonly month: CalendarDate;
  readonly limits: Limits;
  readonly locale: LocaleCode;
  readonly today: CalendarDate;
  readonly selectionMode: SelectionMode;
  readonly selected: CalendarSelection | null;
  readonly rangeHover: CalendarDate | null;
  readonly focusTarget: CalendarDate | null;
  readonly showOtherCalendar: boolean;
  readonly showOutsideDays: boolean;
  readonly fixedWeeks: boolean;
  readonly weekStartsOn: Weekday;
  readonly weekendDays: readonly Weekday[];
  readonly isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
  readonly holiday?: HolidayResolver | undefined;
  readonly events?: ((date: CalendarDate) => readonly EventMarker[]) | undefined;
}

const NO_EVENTS: readonly EventMarker[] = Object.freeze([]);

/** The rows of a month view. Pure: the same input always gives the same cells. */
export function buildMonthGrid(input: GridInput): (DayCell | null)[][] {
  const { calendar, month, locale } = input;
  const other: CalendarSystem = calendar === 'BS' ? 'AD' : 'BS';
  const first = startOfMonth(month);
  const firstEpoch = toEpoch(first);
  const length = daysInMonth(calendar, month.year, month.month);
  const lead = (dayOfWeek(first) - input.weekStartsOn + 7) % 7;
  const rows = input.fixedWeeks ? 6 : Math.ceil((lead + length) / 7);
  const names = getLocale(locale).calendarNames;

  const todayEpoch = toEpoch(input.today);
  const focusEpoch = input.focusTarget ? toEpoch(input.focusTarget) : null;
  const { singleEpoch, startEpoch, endEpoch, many } = selectionEpochs(
    input.selectionMode,
    input.selected,
  );
  const hoverEpoch =
    input.selectionMode === 'range' &&
    startEpoch !== null &&
    endEpoch === null &&
    input.rangeHover
      ? toEpoch(input.rangeHover)
      : null;
  const previewLow =
    hoverEpoch === null || startEpoch === null ? null : Math.min(startEpoch, hoverEpoch);
  const previewHigh =
    hoverEpoch === null || startEpoch === null ? null : Math.max(startEpoch, hoverEpoch);

  const weeks: (DayCell | null)[][] = [];
  for (let row = 0; row < rows; row++) {
    const week: (DayCell | null)[] = [];
    for (let column = 0; column < 7; column++) {
      const index = row * 7 + column;
      const isOutside = index < lead || index >= lead + length;
      const epoch = toEpochDay(firstEpoch - lead + index);
      const date =
        isOutside && !input.showOutsideDays ? null : safeFromEpoch(epoch, calendar);
      if (!date) {
        week.push(null);
        continue;
      }
      const otherDate = input.showOtherCalendar ? safeFromEpoch(epoch, other) : null;
      const weekday = dayOfWeek(date);
      const isToday = epoch === todayEpoch;
      const isRangeStart = startEpoch === epoch;
      const isRangeEnd =
        endEpoch !== null && endEpoch === epoch && endEpoch !== startEpoch;
      const isRangeMiddle =
        startEpoch !== null &&
        endEpoch !== null &&
        epoch > startEpoch &&
        epoch < endEpoch;
      const isSelected =
        singleEpoch === epoch || isRangeStart || isRangeEnd || many.has(epoch);
      const isInRangePreview =
        previewLow !== null &&
        previewHigh !== null &&
        epoch >= previewLow &&
        epoch <= previewHigh;
      const isDisabled =
        !isInLimits(date, input.limits) || (input.isDateDisabled?.(date) ?? false);
      const holiday = input.holiday?.(date) ?? null;
      const holidayLabel = holiday?.label ?? null;

      const state: DayState = isSelected
        ? input.selectionMode === 'range'
          ? isRangeEnd
            ? 'range-end'
            : endEpoch === null
              ? 'selected'
              : 'range-start'
          : 'selected'
        : isRangeMiddle
          ? 'range-middle'
          : isDisabled
            ? 'disabled'
            : isOutside
              ? 'outside'
              : isToday
                ? 'today'
                : holiday
                  ? 'holiday'
                  : 'default';

      week.push(
        Object.freeze({
          key: `${date.calendar}-${formatDate(date, 'Y-m-d', 'en')}`,
          date,
          otherDate,
          epoch,
          weekday,
          label: formatNumber(date.day, locale),
          subLabel: otherDate ? formatNumber(otherDate.day, locale) : null,
          ariaLabel:
            formatDate(date, 'full', locale) +
            (otherDate
              ? ` (${formatDate(otherDate, 'long', locale)} ${names[otherDate.calendar]})`
              : '') +
            (holidayLabel ? `, ${holidayLabel}` : ''),
          isToday,
          isSelected,
          isRangeStart: input.selectionMode === 'range' && isRangeStart,
          isRangeMiddle,
          isRangeEnd,
          isInRangePreview,
          isDisabled,
          isOutside,
          isWeekend: input.weekendDays.includes(weekday),
          isHoliday: holiday !== null,
          holidayLabel,
          events: input.events?.(date) ?? NO_EVENTS,
          isFocusTarget: focusEpoch === epoch,
          state,
        }),
      );
    }
    weeks.push(week);
  }

  return weeks;
}

/** Weekday headers in display order. */
export function buildWeekdays(
  locale: LocaleCode,
  weekStartsOn: Weekday,
  weekendDays: readonly Weekday[],
): WeekdayCell[] {
  const { weekdays } = getLocale(locale);

  return Array.from({ length: 7 }, (_, offset) => {
    const index = ((weekStartsOn + offset) % 7) as Weekday;

    return Object.freeze({
      index,
      label: weekdays.short[index] ?? '',
      narrowLabel: weekdays.narrow[index] ?? '',
      longLabel: weekdays.long[index] ?? '',
      isWeekend: weekendDays.includes(index),
    });
  });
}

const NONE: ReadonlySet<number> = new Set();

function selectionEpochs(
  mode: SelectionMode,
  selected: CalendarSelection | null,
): {
  singleEpoch: number | null;
  startEpoch: number | null;
  endEpoch: number | null;
  many: ReadonlySet<number>;
} {
  const none = { singleEpoch: null, startEpoch: null, endEpoch: null, many: NONE };
  if (selected == null) {
    return none;
  }
  if (isDayList(selected)) {
    return { ...none, many: new Set(selected.map((day) => toEpoch(day))) };
  }
  if ('calendar' in selected) {
    return mode === 'range'
      ? { ...none, startEpoch: toEpoch(selected) }
      : { ...none, singleEpoch: toEpoch(selected) };
  }
  if (mode !== 'range') {
    return { ...none, singleEpoch: selected.start ? toEpoch(selected.start) : null };
  }

  return {
    ...none,
    startEpoch: selected.start ? toEpoch(selected.start) : null,
    endEpoch: selected.end ? toEpoch(selected.end) : null,
  };
}

/** Whether a selection is the multiple-mode list of days. */
export function isDayList(
  selection: CalendarSelection | null,
): selection is readonly CalendarDate[] {
  return Array.isArray(selection);
}

function safeFromEpoch(
  epoch: ReturnType<typeof toEpochDay>,
  calendar: CalendarSystem,
): CalendarDate | null {
  try {
    return fromEpoch(epoch, calendar);
  } catch {
    return null;
  }
}
