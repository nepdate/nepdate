import {
  addMonths,
  addYears,
  compareDates,
  createDate,
  daysInMonth,
  formatDate,
  fiscalYear,
  formatNumber,
  getConfig,
  getLocale,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  toCalendar,
  toEpoch,
  today as coreToday,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';
import { nextFocus } from './focus';
import { buildMonthGrid, buildWeekdays, isDayList, type HolidayResolver } from './grid';
import { computeLimits, isInLimits, type Limits } from './limits';
import {
  buildFiscalYearTiles,
  buildMonthTiles,
  buildYearTiles,
  isFiscalYearAllowed,
  safeFiscalYear,
  yearPageStart,
} from './tiles';
import type {
  CalendarActions,
  CalendarOptions,
  CalendarState,
  CalendarStore,
  CalendarView,
  CalendarSelection,
  DateRange,
  FocusKey,
  HolidayInput,
  HolidayLookup,
  SelectionMode,
} from './types';

/**
 * A framework-free calendar: give it options, read `getState()`, call
 * `actions`, and `subscribe` to re-render. React, Web Components, React Native
 * and Angular adapters all wrap this same store (docs/plan 01-architecture).
 *
 * The selection and visible month live in the store so a range can be picked
 * with two clicks; passing `selected` or `visibleMonth` through setOptions
 * replaces them (controlled use).
 */
export function createCalendar(initial: CalendarOptions = {}): CalendarStore {
  let options: CalendarOptions = { ...initial };
  let calendar: CalendarSystem = options.calendar ?? 'BS';
  let mode: SelectionMode = options.selectionMode ?? 'single';
  let todayDate: CalendarDate = toCalendar(options.today ?? coreToday('AD'), 'AD');
  let limits: Limits = computeLimits(calendar, options.min, options.max);
  let selection = normalizeSelection(options.selected ?? null, mode, calendar);
  let view: CalendarView = 'day';
  let rangeHover: CalendarDate | null = null;
  let holiday = makeHolidayResolver(options.holidays);
  const start =
    options.visibleMonth ??
    options.defaultVisibleMonth ??
    anchorOf(selection) ??
    todayDate;
  let visibleMonth = clampMonth(start);
  let focused = clampDay(anchorOf(selection) ?? todayDate);
  let snapshot = build();
  const listeners = new Set<() => void>();
  let destroyed = false;

  function locale(): LocaleCode {
    return options.locale ?? getConfig().defaultLocale;
  }
  function weekStartsOn(): Weekday {
    return options.weekStartsOn ?? getConfig().weekStartsOn;
  }
  function weekendDays(): readonly Weekday[] {
    return options.weekendDays ?? getConfig().weekendDays;
  }

  /** Day 1 of the month containing `date`, kept within the months that may be shown. */
  function clampMonth(date: CalendarDate): CalendarDate {
    if (isBefore(date, limits.lowMonth)) {
      return limits.lowMonth;
    }
    if (isAfter(date, limits.highDay)) {
      return limits.highMonth;
    }

    return startOfMonth(toCalendar(date, calendar));
  }

  function clampDay(date: CalendarDate): CalendarDate {
    if (isBefore(date, limits.lowDay)) {
      return limits.lowDay;
    }
    if (isAfter(date, limits.highDay)) {
      return limits.highDay;
    }

    return toCalendar(date, calendar);
  }

  /** The focused day if it is in the visible month, else the same day number there. */
  function focusTarget(): CalendarDate {
    if (isSameMonth(visibleMonth, focused)) {
      return focused;
    }
    const day = Math.min(
      toCalendar(focused, calendar).day,
      daysInMonth(calendar, visibleMonth.year, visibleMonth.month),
    );

    return createDate(calendar, visibleMonth.year, visibleMonth.month, day);
  }

  function isSelectable(date: CalendarDate): boolean {
    return isInLimits(date, limits) && !(options.isDateDisabled?.(date) ?? false);
  }

  function build(): CalendarState {
    const loc = locale();
    const target = focusTarget();
    const selectedDay = anchorOf(selection);
    const year = visibleMonth.year;
    const pageStart = yearPageStart(year);
    const fiscalStart = fiscalStartOf(visibleMonth);
    const fiscalPage = yearPageStart(fiscalStart);
    const labels = getLocale(loc).labels;
    const range = rangeOf(selection);
    const tileInput = {
      calendar,
      year,
      limits,
      locale: loc,
      selected: selectedDay,
      today: todayDate,
    };

    return Object.freeze({
      calendar,
      view,
      visibleMonth,
      focused: target,
      title:
        view === 'day'
          ? formatDate(visibleMonth, 'F Y', loc)
          : view === 'month'
            ? formatNumber(year, loc)
            : view === 'year'
              ? `${formatNumber(pageStart, loc)}–${formatNumber(pageStart + 11, loc)}`
              : `${labels.fiscalYear} ${formatNumber(`${fiscalPage}/${String((fiscalPage + 1) % 100).padStart(2, '0')}–${fiscalPage + 11}/${String((fiscalPage + 12) % 100).padStart(2, '0')}`, loc)}`,
      weekdays: buildWeekdays(loc, weekStartsOn(), weekendDays()),
      weeks: buildMonthGrid({
        calendar,
        month: visibleMonth,
        limits,
        locale: loc,
        today: todayDate,
        selectionMode: mode,
        selected: selection,
        rangeHover,
        focusTarget: target,
        showOtherCalendar: options.showOtherCalendar ?? true,
        showOutsideDays: options.showOutsideDays ?? true,
        fixedWeeks: options.fixedWeeks ?? false,
        weekStartsOn: weekStartsOn(),
        weekendDays: weekendDays(),
        isDateDisabled: options.isDateDisabled,
        holiday,
        events: options.events,
      }),
      months: buildMonthTiles(tileInput),
      years: buildYearTiles(tileInput),
      fiscalYears: buildFiscalYearTiles({
        ...tileInput,
        year: fiscalStart,
        selectedRange: range,
      }),
      canPrev:
        view === 'day'
          ? isAfter(visibleMonth, limits.lowMonth)
          : view === 'month'
            ? year > limits.lowMonth.year
            : view === 'year'
              ? pageStart > limits.lowMonth.year
              : fiscalPage > fiscalStartOf(limits.lowDay),
      canNext:
        view === 'day'
          ? isBefore(visibleMonth, limits.highMonth)
          : view === 'month'
            ? year < limits.highMonth.year
            : view === 'year'
              ? pageStart + 11 < limits.highMonth.year
              : fiscalPage + 11 < fiscalStartOf(limits.highDay),
      selectionMode: mode,
      selected: selection,
      rangeHover,
      minDate: limits.lowDay,
      maxDate: limits.highDay,
    });
  }

  function emit(): void {
    snapshot = build();
    for (const listener of [...listeners]) {
      listener();
    }
  }

  /** Apply a change made by an action, then rebuild and notify if anything moved. */
  function update(change: () => void): void {
    if (destroyed) {
      return;
    }
    const before = { month: visibleMonth, view, key: stateKey() };
    change();
    if (stateKey() === before.key) {
      return;
    }
    emit();
    if (!isSameDay(before.month, visibleMonth)) {
      options.onVisibleMonthChange?.(visibleMonth);
    }
    if (before.view !== view) {
      options.onViewChange?.(view);
    }
  }

  function stateKey(): string {
    const range = rangeOf(selection);
    const single = selection && 'calendar' in selection ? selection : null;
    const days = isDayList(selection)
      ? selection.map((day) => toEpoch(day)).join(',')
      : '';

    return [
      view,
      toEpoch(visibleMonth),
      toEpoch(focused),
      single ? toEpoch(single) : '',
      range?.start ? toEpoch(range.start) : '',
      range?.end ? toEpoch(range.end) : '',
      rangeHover ? toEpoch(rangeHover) : '',
      days,
    ].join('|');
  }

  /** Move the visible month by a number of months, stopping at the limits. */
  function shiftMonths(months: number): void {
    let target: CalendarDate;
    try {
      target = addMonths(visibleMonth, months);
    } catch {
      target = months > 0 ? limits.highMonth : limits.lowMonth;
    }
    visibleMonth = clampMonth(target);
  }

  const actions: CalendarActions = {
    next() {
      update(() => {
        shiftMonths(view === 'day' ? 1 : view === 'month' ? 12 : 144);
      });
    },
    prev() {
      update(() => {
        shiftMonths(view === 'day' ? -1 : view === 'month' ? -12 : -144);
      });
    },
    goTo(date) {
      update(() => {
        visibleMonth = clampMonth(date);
        focused = clampDay(date);
      });
    },
    goToToday() {
      actions.goTo(todayDate);
    },
    setView(next) {
      update(() => {
        view = next;
      });
    },
    chooseMonth(month) {
      update(() => {
        visibleMonth = clampMonth(createDate(calendar, visibleMonth.year, month, 1));
        focused = focusTarget();
        view = 'day';
      });
    },
    chooseFiscalYear(startYear) {
      const fy = safeFiscalYear(startYear);
      if (destroyed || !fy || !isFiscalYearAllowed(startYear, limits)) {
        return false;
      }
      const first = toCalendar(fy.firstDay, calendar);
      const last = toCalendar(fy.lastDay, calendar);
      const range: DateRange | null =
        mode === 'range' ? Object.freeze({ start: first, end: last }) : null;
      update(() => {
        visibleMonth = clampMonth(first);
        focused = first;
        view = 'day';
        if (range) {
          selection = range;
          rangeHover = null;
        }
      });
      if (range) {
        options.onSelect?.(range);
      }

      return true;
    },
    chooseYear(year) {
      update(() => {
        let target: CalendarDate;
        try {
          target = addYears(visibleMonth, year - visibleMonth.year);
        } catch {
          target = year < visibleMonth.year ? limits.lowMonth : limits.highMonth;
        }
        visibleMonth = clampMonth(target);
        view = 'month';
      });
    },
    focus(date) {
      update(() => {
        focused = clampDay(date);
        visibleMonth = clampMonth(focused);
      });
    },
    moveFocus(key: FocusKey, modifiers = {}) {
      update(() => {
        focused = nextFocus(focusTarget(), key, limits, {
          weekStartsOn: weekStartsOn(),
          ...(modifiers.shift === undefined ? {} : { shift: modifiers.shift }),
        });
        if (!isSameMonth(visibleMonth, focused)) {
          visibleMonth = clampMonth(focused);
        }
      });
    },
    select(date) {
      if (destroyed || !isSelectable(date)) {
        return false;
      }
      const day = toCalendar(date, calendar);
      let result: CalendarSelection = day;
      update(() => {
        focused = day;
        if (!isSameMonth(visibleMonth, day)) {
          visibleMonth = clampMonth(day);
        }
        if (mode === 'single') {
          selection = day;
        } else if (mode === 'multiple') {
          result = toggleDay(isDayList(selection) ? selection : [], day);
          selection = result;
        } else {
          const range = (selection as DateRange | null) ?? { start: null, end: null };
          const next: DateRange =
            range.start === null || range.end !== null
              ? { start: day, end: null }
              : compareDates(day, range.start) < 0
                ? { start: day, end: range.start }
                : { start: range.start, end: day };
          selection = Object.freeze(next);
          rangeHover = null;
          result = next;
        }
      });
      options.onSelect?.(result);

      return true;
    },
    hover(date) {
      update(() => {
        const range = mode === 'range' ? (selection as DateRange | null) : null;
        rangeHover =
          date && range?.start && range.end === null && isInLimits(date, limits)
            ? toCalendar(date, calendar)
            : null;
      });
    },
  };

  return {
    getState: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setOptions(changes) {
      if (destroyed) {
        return;
      }
      options = { ...options, ...changes };
      calendar = options.calendar ?? 'BS';
      mode = options.selectionMode ?? 'single';
      todayDate = toCalendar(options.today ?? coreToday('AD'), 'AD');
      limits = computeLimits(calendar, options.min, options.max);
      holiday = makeHolidayResolver(options.holidays);
      const reselect = 'selected' in changes || 'selectionMode' in changes;
      selection = normalizeSelection(
        'selected' in changes ? (changes.selected ?? null) : selection,
        mode,
        calendar,
      );
      if (reselect) {
        rangeHover = null;
      }
      visibleMonth = clampMonth(changes.visibleMonth ?? visibleMonth);
      focused = clampDay(focused);
      emit();
    },
    actions,
    destroy() {
      destroyed = true;
      listeners.clear();
    },
  };
}

/** The selection in the shape the mode needs, with its dates in the calendar on screen. */
/** The BS start year of the fiscal year a date falls in (or the nearest one at the table edges). */
function fiscalStartOf(date: CalendarDate): number {
  try {
    return fiscalYear(date).startYear;
  } catch {
    return date.year;
  }
}

function normalizeSelection(
  selected: CalendarSelection | null,
  mode: SelectionMode,
  calendar: CalendarSystem,
): CalendarSelection | null {
  const inCalendar = (date: CalendarDate | null): CalendarDate | null => {
    if (date === null) {
      return null;
    }
    try {
      return toCalendar(date, calendar);
    } catch {
      return date; // outside the BS table: keep it as given
    }
  };
  if (mode === 'multiple') {
    const days = isDayList(selected)
      ? selected
      : selected === null
        ? []
        : 'calendar' in selected
          ? [selected]
          : [selected.start, selected.end].filter((day) => day !== null);

    return sortDays(days.map((day) => inCalendar(day) ?? day));
  }
  if (selected === null) {
    return mode === 'range' ? Object.freeze({ start: null, end: null }) : null;
  }
  if (isDayList(selected)) {
    const [first = null, second = null] = sortDays(selected);
    return mode === 'range'
      ? Object.freeze({ start: inCalendar(first), end: inCalendar(second) })
      : inCalendar(first);
  }
  if ('calendar' in selected) {
    return mode === 'range'
      ? Object.freeze({ start: inCalendar(selected), end: null })
      : inCalendar(selected);
  }

  return mode === 'range'
    ? Object.freeze({ start: inCalendar(selected.start), end: inCalendar(selected.end) })
    : inCalendar(selected.start);
}

/** The day the selection points at: the date, the range start, or the first chosen day. */
function anchorOf(selection: CalendarSelection | null): CalendarDate | null {
  if (selection === null) {
    return null;
  }
  if (isDayList(selection)) {
    return selection[0] ?? null;
  }

  return 'calendar' in selection ? selection : selection.start;
}

function rangeOf(selection: CalendarSelection | null): DateRange | null {
  return selection && !isDayList(selection) && !('calendar' in selection)
    ? selection
    : null;
}

/** Add the day, or remove it when it is already chosen. */
function toggleDay(
  days: readonly CalendarDate[],
  day: CalendarDate,
): readonly CalendarDate[] {
  const kept = days.filter((other) => !isSameDay(other, day));

  return sortDays(kept.length === days.length ? [...kept, day] : kept);
}

function sortDays(days: readonly CalendarDate[]): readonly CalendarDate[] {
  return Object.freeze([...days].sort(compareDates));
}

function makeHolidayResolver(
  holidays: readonly HolidayInput[] | HolidayLookup | undefined,
): HolidayResolver | undefined {
  if (holidays === undefined) {
    return undefined;
  }
  if (typeof holidays === 'function') {
    return (date) => {
      const info = holidays(date);
      if (info === true) {
        return { label: null };
      }

      return info ? { label: info.label ?? null } : null;
    };
  }
  const byDay = new Map<number, string | null>();
  for (const item of holidays) {
    const date = 'calendar' in item ? item : item.date;
    byDay.set(toEpoch(date), 'calendar' in item ? null : (item.label ?? null));
  }

  return (date) => {
    const label = byDay.get(toEpoch(date));

    return label === undefined ? null : { label };
  };
}
