import {
  compareDates,
  differenceInDays,
  formatMessage,
  getLocale,
  toCalendar,
  toIsoDate,
  type AdDate,
  type CalendarDate,
  type CalendarSystem,
} from '@nepdate/core';
import { createCalendar } from '@nepdate/calendar';
import {
  createEmitter,
  formatOf,
  inputLimits,
  isRange,
  localeOf,
  panelOptions,
  todayOf,
} from './base';
import {
  checkDate,
  detailOf,
  equivalentText,
  formatInput,
  parseInput,
  placeholderText,
  readIso,
} from './input';
import type {
  DateError,
  DateRangePickerActions,
  DateRangePickerOptions,
  DateRangePickerState,
  DateRangePickerStore,
  RangeField,
  RangeValue,
} from './types';

type RangeError = DateError & { readonly field: RangeField | 'range' };

/**
 * A BS/AD date range picker without UI: two typed fields (start, end), a panel
 * calendar in range mode, minDays/maxDays checks and the BS/AD switch. Values
 * are AD "YYYY-MM-DD" strings; an unfinished or invalid end is "".
 */
export function createDateRangePicker(
  initial: DateRangePickerOptions = {},
): DateRangePickerStore {
  let options: DateRangePickerOptions = { ...initial };
  let calendar: CalendarSystem = options.calendar ?? options.defaultCalendar ?? 'BS';
  let start: AdDate | null = readIso(options.value?.start ?? options.defaultValue?.start);
  let end: AdDate | null = readIso(options.value?.end ?? options.defaultValue?.end);
  [start, end] = ordered(start, end);
  let value = valueOf(start, end);
  let startText = format(start);
  let endText = format(end);
  let error: RangeError | null = null;
  let open = false;
  let destroyed = false;

  const panel = createCalendar({
    ...panelOptions(options, calendar),
    selectionMode: 'range',
    selected: { start, end },
    onSelect: (selection) => {
      if (isRange(selection)) {
        pick(selection.start, selection.end);
      }
    },
  });
  let snapshot = build();
  const emitter = createEmitter(() => {
    snapshot = build();
  });
  panel.subscribe(() => {
    emitter.notify();
  });

  function format(date: CalendarDate | null): string {
    return formatInput(date, calendar, formatOf(options), localeOf(options));
  }

  function build(): DateRangePickerState {
    const locale = localeOf(options);

    return Object.freeze({
      value,
      date: Object.freeze({ start: detailOf(start), end: detailOf(end) }),
      startText,
      endText,
      calendar,
      canSwitchCalendar: options.calendar === undefined,
      open,
      error,
      equivalentText: Object.freeze({
        start: error?.field === 'start' ? null : equivalentText(start, calendar, locale),
        end: error?.field === 'end' ? null : equivalentText(end, calendar, locale),
      }),
      placeholder: placeholderText(calendar, locale),
      calendarState: panel.getState(),
    });
  }

  function syncPanel(): void {
    panel.setOptions({
      ...panelOptions(options, calendar),
      selected: { start, end },
      ...(start ? { visibleMonth: start } : {}),
    });
  }

  /** Too short or too long, or null. Counts both ends. */
  function lengthError(from: AdDate, to: AdDate): RangeError | null {
    const days = differenceInDays(to, from) + 1;
    const messages = getLocale(localeOf(options)).messages;
    if (options.minDays !== undefined && days < options.minDays) {
      return {
        field: 'range',
        code: 'tooShort',
        message: formatMessage(messages.rangeTooShort, { min: String(options.minDays) }),
      };
    }
    if (options.maxDays !== undefined && days > options.maxDays) {
      return {
        field: 'range',
        code: 'tooLong',
        message: formatMessage(messages.rangeTooLong, { max: String(options.maxDays) }),
      };
    }

    return null;
  }

  /** Store the dates, keep the panel in step, and queue onChange when the value moved. */
  function commit(
    nextStart: AdDate | null,
    nextEnd: AdDate | null,
    byUser: boolean,
  ): void {
    start = nextStart;
    end = nextEnd;
    const next = valueOf(start, end);
    const changed = next.start !== value.start || next.end !== value.end;
    value = next;
    syncPanel();
    if (changed && byUser) {
      const detail = Object.freeze({ start: detailOf(start), end: detailOf(end) });
      emitter.after(() => options.onChange?.(next, detail));
    }
  }

  /** Put the ends in order, check the length, then commit. False when the length is not allowed. */
  function settle(nextStart: AdDate | null, nextEnd: AdDate | null): boolean {
    const [a, b] = ordered(nextStart, nextEnd);
    if (a !== nextStart) {
      [startText, endText] = [endText, startText];
    }
    const tooFar = a && b ? lengthError(a, b) : null;
    error = tooFar ?? error;
    commit(a, tooFar ? null : b, true);

    return tooFar === null;
  }

  function pick(from: CalendarDate | null, to: CalendarDate | null): void {
    emitter.act(() => {
      const a = from ? toCalendar(from, 'AD') : null;
      const b = to ? toCalendar(to, 'AD') : null;
      error = null;
      startText = format(a);
      endText = format(b);
      const allowed = settle(a, b);
      if (b && allowed && (options.closeOnSelect ?? true)) {
        open = false;
      }
    });
  }

  const actions: DateRangePickerActions = {
    type(field, text) {
      if (destroyed) {
        return;
      }
      emitter.act(() => {
        if (field === 'start') {
          startText = text;
        } else {
          endText = text;
        }
        const result = parseInput(
          text,
          calendar,
          inputLimits(options, panel),
          localeOf(options),
          formatOf(options),
        );
        const date = result.kind === 'date' ? result.date : null;
        error = result.kind === 'error' ? { ...result.error, field } : null;
        const other = field === 'start' ? end : start;
        const otherError = other
          ? checkDate(other, calendar, inputLimits(options, panel), localeOf(options))
          : null;
        if (!error && otherError) {
          error = { ...otherError, field: field === 'start' ? 'end' : 'start' };
        }
        if (field === 'start') {
          settle(date, end);
        } else {
          settle(start, date);
        }
      });
    },
    blur(field) {
      emitter.act(() => {
        if (error?.field === field) {
          return;
        }
        if (field === 'start') {
          startText = format(start);
        } else if (end || error?.field !== 'range') {
          endText = format(end);
        }
      });
    },
    clear() {
      emitter.act(() => {
        startText = '';
        endText = '';
        error = null;
        commit(null, null, true);
      });
    },
    setValue(next) {
      emitter.act(() => {
        applyValue(next);
      });
    },
    open() {
      emitter.act(() => {
        open = true;
        panel.actions.goTo(start ?? todayOf(options));
      });
    },
    close() {
      emitter.act(() => {
        open = false;
      });
    },
    toggle() {
      if (open) {
        actions.close();
      } else {
        actions.open();
      }
    },
    switchCalendar(next) {
      if (options.calendar !== undefined || next === calendar || destroyed) {
        return;
      }
      emitter.act(() => {
        calendar = next;
        if (!error) {
          startText = format(start);
          endText = format(end);
        }
        syncPanel();
        emitter.after(() => options.onCalendarChange?.(next));
      });
    },
    select(day) {
      let picked = false;
      if (!destroyed) {
        emitter.act(() => {
          picked = panel.actions.select(day);
        });
      }

      return picked;
    },
    reset() {
      emitter.act(() => {
        const [a, b] = ordered(
          readIso(options.defaultValue?.start),
          readIso(options.defaultValue?.end),
        );
        error = null;
        startText = format(a);
        endText = format(b);
        commit(a, b, true);
      });
    },
  };

  /** An outside value: replaces the texts only when the value differs (echo guard). */
  function applyValue(next: RangeValue | undefined): void {
    const [a, b] = ordered(readIso(next?.start), readIso(next?.end));
    const incoming = valueOf(a, b);
    if (incoming.start === value.start && incoming.end === value.end) {
      return;
    }
    error = null;
    startText = format(a);
    endText = format(b);
    commit(a, b, false);
  }

  return {
    getState: () => snapshot,
    subscribe: (listener) => emitter.subscribe(listener),
    setOptions(changes) {
      if (destroyed) {
        return;
      }
      emitter.act(() => {
        const before = { calendar, locale: localeOf(options), format: formatOf(options) };
        options = { ...options, ...changes };
        if (options.calendar !== undefined) {
          calendar = options.calendar;
        }
        if ('value' in changes) {
          applyValue(changes.value);
        }
        const looksChanged =
          before.calendar !== calendar ||
          before.locale !== localeOf(options) ||
          before.format !== formatOf(options);
        if (looksChanged && !error) {
          startText = format(start);
          endText = format(end);
        }
        syncPanel();
      });
    },
    actions,
    calendar: panel,
    destroy() {
      destroyed = true;
      panel.destroy();
      emitter.clear();
    },
  };
}

function ordered(a: AdDate | null, b: AdDate | null): [AdDate | null, AdDate | null] {
  return a && b && compareDates(b, a) < 0 ? [b, a] : [a, b];
}

function valueOf(start: AdDate | null, end: AdDate | null): RangeValue {
  return Object.freeze({
    start: start ? toIsoDate(start) : '',
    end: end ? toIsoDate(end) : '',
  });
}
