import {
  getConfig,
  today,
  type CalendarDate,
  type DateFormatPattern,
  type LocaleCode,
} from '@nepdate/core';
import type { CalendarOptions, CalendarStore, DateRange } from '@nepdate/calendar';
import { readIso, type InputLimits } from './input';
import type { PickerBaseOptions } from './types';

/** The panel calendar's options that come straight from the picker's options. */
export function panelOptions(
  options: PickerBaseOptions,
  calendar: CalendarOptions['calendar'],
): CalendarOptions {
  return {
    calendar,
    locale: options.locale,
    min: readIso(options.min),
    max: readIso(options.max),
    isDateDisabled: options.isDateDisabled,
    holidays: options.holidays,
    events: options.events,
    showOtherCalendar: options.showOtherCalendar,
    weekStartsOn: options.weekStartsOn,
    weekendDays: options.weekendDays,
    today: options.today,
  };
}

/** What may be typed: the panel's effective range, so typing and clicking agree. */
export function inputLimits(
  options: PickerBaseOptions,
  panel: CalendarStore,
): InputLimits {
  const { minDate, maxDate } = panel.getState();

  return {
    min: minDate,
    max: maxDate,
    hasMin: readIso(options.min) !== null,
    hasMax: readIso(options.max) !== null,
    isDateDisabled: options.isDateDisabled,
  };
}

export function localeOf(options: PickerBaseOptions): LocaleCode {
  return options.locale ?? getConfig().defaultLocale;
}

export function formatOf(options: PickerBaseOptions): DateFormatPattern {
  return options.displayFormat ?? 'iso';
}

export function todayOf(options: PickerBaseOptions): CalendarDate {
  return options.today ?? today('AD');
}

export function isRange(selection: CalendarDate | DateRange): selection is DateRange {
  return !('calendar' in selection);
}

/**
 * Listener set plus batching: changes made inside `act` notify once at the end,
 * and callbacks queued with `after` run after listeners have seen the new state.
 */
export function createEmitter(rebuild: () => void): {
  subscribe(listener: () => void): () => void;
  act(change: () => void): void;
  after(callback: () => void): void;
  notify(): void;
  clear(): void;
} {
  const listeners = new Set<() => void>();
  const queued: (() => void)[] = [];
  let depth = 0;

  function notify(): void {
    rebuild();
    for (const listener of [...listeners]) {
      listener();
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    act(change) {
      depth++;
      try {
        change();
      } finally {
        depth--;
      }
      if (depth === 0) {
        notify();
        for (const callback of queued.splice(0)) {
          callback();
        }
      }
    },
    after(callback) {
      queued.push(callback);
    },
    notify() {
      if (depth === 0) {
        notify();
      }
    },
    clear() {
      listeners.clear();
    },
  };
}
