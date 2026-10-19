import { maskDateText } from './mask';
import {
  getConfig,
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
  isSingleDay,
  localeOf,
  panelOptions,
  todayOf,
} from './base';
import {
  describePreset,
  resolveSinglePreset,
  type PresetContext,
  type PresetState,
} from './presets';
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
  DatePickerActions,
  DatePickerOptions,
  DatePickerState,
  DatePickerStore,
} from './types';

/**
 * A BS/AD date picker without UI: typed text ⇄ value, validation, the BS/AD
 * switch and open/close, plus the panel's calendar store. The value is always
 * an AD "YYYY-MM-DD" string (docs/plan D-003); all date work goes through core.
 *
 * Like the calendar, the picker keeps its own value; passing `value` through
 * setOptions replaces it (controlled use). Passing back the value the user just
 * typed leaves their text alone, so the cursor does not jump.
 */
export function createDatePicker(initial: DatePickerOptions = {}): DatePickerStore {
  let options: DatePickerOptions = { ...initial };
  let calendar: CalendarSystem = options.calendar ?? options.defaultCalendar ?? 'BS';
  let date: AdDate | null = readIso(options.value ?? options.defaultValue);
  let value = date ? toIsoDate(date) : '';
  let text = formatInput(date, calendar, formatOf(options), localeOf(options));
  let error: DateError | null = null;
  let open = false;
  let destroyed = false;

  const panel = createCalendar({
    ...panelOptions(options, calendar),
    selectionMode: 'single',
    selected: date,
    onSelect: (selection) => {
      if (isSingleDay(selection)) {
        pick(selection);
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

  function build(): DatePickerState {
    const locale = localeOf(options);

    return Object.freeze({
      value,
      date: detailOf(date),
      text,
      calendar,
      canSwitchCalendar: options.calendar === undefined,
      open: open || options.inline === true,
      inline: options.inline === true,
      error,
      equivalentText: error ? null : equivalentText(date, calendar, locale),
      placeholder: placeholderText(calendar, locale),
      presets: presetStates(),
      calendarState: panel.getState(),
    });
  }

  function presetContext(): PresetContext {
    return {
      today: toCalendar(todayOf(options), 'AD'),
      calendar,
      weekStartsOn: options.weekStartsOn ?? getConfig().weekStartsOn,
    };
  }

  /** Each shortcut's date, or null when it cannot be used now. */
  function resolvedPresets(): { id: string; label: string; date: CalendarDate | null }[] {
    const context = presetContext();
    const limits = inputLimits(options, panel);

    return (options.presets ?? []).map((preset) => {
      const entry = describePreset(preset, options.locale, resolveSinglePreset);
      const date = ((): CalendarDate | null => {
        try {
          const candidate = entry.resolve(context);
          return checkDate(candidate, calendar, limits, localeOf(options))
            ? null
            : candidate;
        } catch {
          return null; // e.g. outside the BS table
        }
      })();

      return { id: entry.id, label: entry.label, date };
    });
  }

  function presetStates(): PresetState[] {
    return resolvedPresets().map(({ id, label, date }) =>
      Object.freeze({
        id,
        label,
        isActive: date !== null && toIsoDate(date) === value,
        isDisabled: date === null,
      }),
    );
  }

  function syncPanel(showDate: boolean): void {
    panel.setOptions({
      ...panelOptions(options, calendar),
      selected: date,
      ...(showDate && date ? { visibleMonth: date } : {}),
    });
  }

  /** Change the value; queue onChange when it differs and the user caused it. */
  function setDate(next: AdDate | null, byUser: boolean): void {
    const nextValue = next ? toIsoDate(next) : '';
    const changed = nextValue !== value;
    date = next;
    value = nextValue;
    syncPanel(next !== null);
    if (changed && byUser) {
      const detail = detailOf(next);
      emitter.after(() => options.onChange?.(nextValue, detail));
    }
  }

  function format(next: AdDate | null): string {
    return formatInput(next, calendar, formatOf(options), localeOf(options));
  }

  function pick(selection: Parameters<DatePickerActions['select']>[0]): void {
    emitter.act(() => {
      const next = toCalendar(selection, 'AD');
      error = null;
      text = format(next);
      setDate(next, true);
      if (options.closeOnSelect ?? true) {
        open = false;
      }
    });
  }

  const actions: DatePickerActions = {
    type(next) {
      if (destroyed) {
        return;
      }
      emitter.act(() => {
        text = options.mask === false ? next : maskDateText(next, text);
        const result = parseInput(
          text,
          calendar,
          inputLimits(options, panel),
          localeOf(options),
          formatOf(options),
        );
        error = result.kind === 'error' ? result.error : null;
        setDate(result.kind === 'date' ? result.date : null, true);
      });
    },
    blur() {
      emitter.act(() => {
        if (!error) {
          text = format(date);
        }
      });
    },
    clear() {
      emitter.act(() => {
        text = '';
        error = null;
        setDate(null, true);
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
        panel.actions.goTo(date ?? todayOf(options));
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
          text = format(date);
        }
        syncPanel(date !== null);
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
    selectToday() {
      return actions.select(todayOf(options));
    },
    reset() {
      emitter.act(() => {
        const next = readIso(options.defaultValue);
        error = null;
        text = format(next);
        setDate(next, true);
      });
    },
    applyPreset(id) {
      const preset = resolvedPresets().find((entry) => entry.id === id);
      if (destroyed || !preset?.date) {
        return false;
      }
      pick(preset.date);

      return true;
    },
  };

  /** An outside value: replaces the text only when it is a different value (echo guard). */
  function applyValue(next: string | undefined): void {
    const nextDate = readIso(next);
    if ((nextDate ? toIsoDate(nextDate) : '') === value) {
      return;
    }
    error = null;
    text = format(nextDate);
    setDate(nextDate, false);
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
          text = format(date);
        }
        syncPanel(false);
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
