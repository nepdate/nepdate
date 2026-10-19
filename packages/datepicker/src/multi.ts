import {
  formatMessage,
  getLocale,
  toCalendar,
  toIsoDate,
  type AdDate,
  type CalendarSystem,
} from '@nepdate/core';
import { createCalendar, isDayList } from '@nepdate/calendar';
import { createEmitter, inputLimits, localeOf, panelOptions } from './base';
import { formatInput, parseInput, placeholderText, readIso } from './input';
import { maskDateText } from './mask';
import type {
  DateDetail,
  DateError,
  MultiDatePickerActions,
  MultiDatePickerOptions,
  MultiDatePickerState,
  MultiDatePickerStore,
} from './types';

const SEPARATOR = /[,\s\u060c]+/;

/**
 * A picker for several separate days (PICK-001). The value is a sorted list of
 * AD "YYYY-MM-DD" strings; the input lists the days in the calendar on screen,
 * separated by ", ", and clicking a day in the panel adds or removes it. The
 * list is always written as YYYY-MM-DD so it can be typed back.
 */
export function createMultiDatePicker(
  initial: MultiDatePickerOptions = {},
): MultiDatePickerStore {
  let options: MultiDatePickerOptions = { ...initial };
  let calendar: CalendarSystem = options.calendar ?? options.defaultCalendar ?? 'BS';
  let dates = readAll(options.value ?? options.defaultValue);
  let value = valuesOf(dates);
  let text = format(dates);
  let error: DateError | null = null;
  /** False while the typed text has a problem: then it is left as typed. */
  let textOk = true;
  let open = false;
  let destroyed = false;

  const panel = createCalendar({
    ...panelOptions(options, calendar),
    selectionMode: 'multiple',
    selected: dates,
    onSelect: (selection) => {
      if (isDayList(selection)) {
        pick(selection.map((day) => toCalendar(day, 'AD')));
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

  function build(): MultiDatePickerState {
    return Object.freeze({
      value,
      dates: detailsOf(dates),
      text,
      calendar,
      canSwitchCalendar: options.calendar === undefined,
      open: open || options.inline === true,
      inline: options.inline === true,
      error,
      placeholder: placeholderText(calendar, localeOf(options)),
      calendarState: panel.getState(),
    });
  }

  function format(list: readonly AdDate[]): string {
    return list
      .map((day) => formatInput(day, calendar, 'iso', localeOf(options)))
      .join(', ');
  }

  function tooMany(count: number): DateError | null {
    const max = options.maxDates;

    return max !== undefined && count > max
      ? {
          code: 'tooMany',
          message: formatMessage(getLocale(localeOf(options)).messages.tooManyDates, {
            max: String(max),
          }),
        }
      : null;
  }

  function syncPanel(): void {
    panel.setOptions({ ...panelOptions(options, calendar), selected: dates });
  }

  /** Change the value; queue onChange when it differs and the user caused it. */
  function setDates(next: readonly AdDate[], byUser: boolean): void {
    const sorted = unique(next);
    const nextValue = valuesOf(sorted);
    const changed = nextValue.join() !== value.join();
    dates = sorted;
    value = nextValue;
    syncPanel();
    if (changed && byUser) {
      const details = detailsOf(sorted);
      emitter.after(() => options.onChange?.(nextValue, details));
    }
  }

  function pick(next: readonly AdDate[]): void {
    emitter.act(() => {
      error = tooMany(next.length);
      if (error) {
        syncPanel(); // undo the calendar's toggle
        return;
      }
      text = format(unique(next));
      textOk = true;
      setDates(next, true);
      if (options.closeOnSelect === true) {
        open = false;
      }
    });
  }

  const actions: MultiDatePickerActions = {
    type(next) {
      if (destroyed) {
        return;
      }
      emitter.act(() => {
        text = options.mask === false ? next : maskLast(next, text);
        const limits = inputLimits(options, panel);
        const parsed: AdDate[] = [];
        let firstError: DateError | null = null;
        for (const token of text.split(SEPARATOR)) {
          const result = parseInput(token, calendar, limits, localeOf(options));
          if (result.kind === 'date') {
            parsed.push(result.date);
          } else if (result.kind === 'error') {
            firstError ??= result.error;
          }
        }
        error = firstError ?? tooMany(unique(parsed).length);
        textOk = error === null;
        setDates(parsed, true);
      });
    },
    blur() {
      emitter.act(() => {
        if (textOk) {
          text = format(dates);
        }
      });
    },
    clear() {
      emitter.act(() => {
        text = '';
        error = null;
        textOk = true;
        setDates([], true);
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
        const first = dates[0];
        if (first) {
          panel.actions.goTo(first);
        }
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
        if (textOk) {
          text = format(dates);
        }
        syncPanel();
        emitter.after(() => options.onCalendarChange?.(next));
      });
    },
    select(day) {
      if (destroyed) {
        return false;
      }
      const before = value;
      emitter.act(() => {
        panel.actions.select(day);
      });

      return value !== before;
    },
    remove(iso) {
      emitter.act(() => {
        error = null;
        const next = dates.filter((day) => toIsoDate(day) !== iso);
        text = format(next);
        textOk = true;
        setDates(next, true);
      });
    },
    reset() {
      emitter.act(() => {
        const next = readAll(options.defaultValue);
        error = null;
        text = format(next);
        textOk = true;
        setDates(next, true);
      });
    },
  };

  /** An outside value: replaces the text only when it is a different value (echo guard). */
  function applyValue(next: readonly string[] | undefined): void {
    const nextDates = readAll(next);
    if (valuesOf(nextDates).join() === value.join()) {
      return;
    }
    error = null;
    text = format(nextDates);
    textOk = true;
    setDates(nextDates, false);
  }

  return {
    getState: () => snapshot,
    subscribe: (listener) => emitter.subscribe(listener),
    setOptions(changes) {
      if (destroyed) {
        return;
      }
      emitter.act(() => {
        const before = { calendar, locale: localeOf(options) };
        options = { ...options, ...changes };
        if (options.calendar !== undefined) {
          calendar = options.calendar;
        }
        if ('value' in changes) {
          applyValue(changes.value);
        }
        if (
          (before.calendar !== calendar || before.locale !== localeOf(options)) &&
          textOk
        ) {
          text = format(dates);
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

function readAll(values: readonly string[] | undefined): AdDate[] {
  return unique((values ?? []).map(readIso).filter((day) => day !== null));
}

function unique(list: readonly AdDate[]): AdDate[] {
  const byValue = new Map(list.map((day) => [toIsoDate(day), day]));

  return [...byValue.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, day]) => day);
}

function valuesOf(list: readonly AdDate[]): readonly string[] {
  return Object.freeze(list.map((day) => toIsoDate(day)));
}

function detailsOf(list: readonly AdDate[]): readonly DateDetail[] {
  return Object.freeze(
    list.map((day) => Object.freeze({ ad: day, bs: toCalendar(day, 'BS') })),
  );
}

/** Mask only the day being typed: the text after the last separator. */
function maskLast(next: string, previous: string): string {
  if (!next.startsWith(previous)) {
    return next;
  }
  const match = /^(.*[,\s\u060c])?([^,\s\u060c]*)$/.exec(next);
  const head = match?.[1] ?? '';
  const tail = match?.[2] ?? next;
  const previousTail = previous.length > head.length ? previous.slice(head.length) : '';

  return head + maskDateText(tail, previousTail);
}
