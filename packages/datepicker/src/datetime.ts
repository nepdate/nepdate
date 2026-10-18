import {
  formatNumber,
  formatTime,
  fromIsoDateTime,
  getConfig,
  getLocale,
  now,
  parseTime,
  toIsoDate,
  toIsoDateTime,
  type AdDate,
  type BsDate,
  type CalendarDate,
  type CalendarSystem,
  type TimeOfDay,
} from '@nepdate/core';
import type { CalendarState, CalendarStore } from '@nepdate/calendar';
import { createEmitter, localeOf } from './base';
import { createDatePicker } from './picker';
import type { PresetState, SinglePreset } from './presets';
import type { DateError, PickerBaseOptions } from './types';

export interface DateTimeDetail {
  readonly ad: AdDate;
  readonly bs: BsDate;
  readonly time: TimeOfDay;
  /** The same instant as the value. */
  readonly iso: string;
}

export interface DateTimePickerOptions extends PickerBaseOptions {
  /** An ISO timestamp with offset ("2026-10-18T14:30:00+05:45"), a local "YYYY-MM-DDTHH:MM", or "". */
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onChange?:
    ((value: string, detail: DateTimeDetail | null) => void) | undefined;
  /** The zone the date and time are read in, and whose offset the value carries. Default: core config (Nepal). */
  readonly timeZone?: string | undefined;
  /** Show 12-hour times (2:30 PM). Default false (14:30). */
  readonly hour12?: boolean | undefined;
  /** Minutes offered in the column: 1–30. Default 5. Any minute can still be typed. */
  readonly minuteStep?: number | undefined;
  /** The time used when a date is picked before any time. Default "00:00". */
  readonly defaultTime?: string | undefined;
  readonly presets?: readonly SinglePreset[] | undefined;
}

/** One hour or minute in the time columns (Figma "Time Item"). */
export interface TimeCell {
  readonly value: number;
  readonly label: string;
  readonly isSelected: boolean;
}

export interface DateTimePickerState {
  /** ISO timestamp with the zone's offset, or "" until both date and time are valid. */
  readonly value: string;
  readonly detail: DateTimeDetail | null;
  readonly dateText: string;
  readonly timeText: string;
  readonly time: TimeOfDay | null;
  readonly calendar: CalendarSystem;
  readonly canSwitchCalendar: boolean;
  readonly open: boolean;
  readonly error: (DateError & { readonly field: 'date' | 'time' }) | null;
  readonly equivalentText: string | null;
  readonly placeholder: string;
  readonly timePlaceholder: string;
  readonly hours: readonly TimeCell[];
  readonly minutes: readonly TimeCell[];
  readonly presets: readonly PresetState[];
  readonly calendarState: CalendarState;
}

export interface DateTimePickerActions {
  typeDate(text: string): void;
  typeTime(text: string): void;
  blurDate(): void;
  blurTime(): void;
  /** Pick a day; the time stays (or becomes defaultTime). Returns false when disabled. */
  selectDate(date: CalendarDate): boolean;
  selectHour(hour: number): void;
  selectMinute(minute: number): void;
  /** Today and the current time in the zone. Returns false when today is not allowed. */
  selectNow(): boolean;
  applyPreset(id: string): boolean;
  open(): void;
  close(): void;
  toggle(): void;
  clear(): void;
  setValue(value: string): void;
  switchCalendar(calendar: CalendarSystem): void;
  reset(): void;
}

export interface DateTimePickerStore {
  getState(): DateTimePickerState;
  subscribe(listener: () => void): () => void;
  setOptions(changes: Partial<DateTimePickerOptions>): void;
  readonly actions: DateTimePickerActions;
  readonly calendar: CalendarStore;
  destroy(): void;
}

/**
 * A BS/AD date and time picker without UI. The date half is a regular date
 * picker; the value is the instant as an ISO timestamp carrying the zone's
 * offset, so servers store one unambiguous moment.
 */
export function createDateTimePicker(
  initial: DateTimePickerOptions = {},
): DateTimePickerStore {
  let options: DateTimePickerOptions = { ...initial };
  const start = fromIsoDateTime(options.value ?? options.defaultValue, zone());
  let time: TimeOfDay | null = start?.time ?? null;
  let timeText = time ? fmt(time) : '';
  let timeError: DateError | null = null;
  let value = '';
  let destroyed = false;

  const datePicker = createDatePicker({
    ...dateOptions(),
    defaultValue: start ? toIsoDay(start.date) : '',
    closeOnSelect: false,
    onChange: () => {
      emitter.act(() => {
        if (datePicker.getState().date && !time) {
          time = parseTime(options.defaultTime) ?? Object.freeze({ hour: 0, minute: 0 });
          timeText = fmt(time);
          timeError = null;
        }
        commit(true);
      });
    },
  });
  value = compose();
  let snapshot = build();
  const emitter = createEmitter(() => {
    snapshot = build();
  });
  datePicker.subscribe(() => {
    emitter.notify();
  });

  function zone(): string {
    return options.timeZone ?? getConfig().timeZone;
  }

  function fmt(t: TimeOfDay): string {
    return formatTime(t, { hour12: options.hour12 ?? false, locale: localeOf(options) });
  }

  function dateOptions(): PickerBaseOptions & {
    presets?: readonly SinglePreset[] | undefined;
  } {
    const {
      value: _value,
      defaultValue: _default,
      onChange: _onChange,
      timeZone: _zone,
      hour12: _hour12,
      minuteStep: _step,
      defaultTime: _defaultTime,
      ...rest
    } = options;

    return rest;
  }

  function compose(): string {
    const day = datePicker.getState().date;

    return day && time ? toIsoDateTime(day.ad, time, zone()) : '';
  }

  function detail(): DateTimeDetail | null {
    const day = datePicker.getState().date;

    return day && time && value
      ? Object.freeze({ ad: day.ad, bs: day.bs, time, iso: value })
      : null;
  }

  /** Recompute the value; queue onChange when it changed and the user caused it. */
  function commit(byUser: boolean): void {
    const next = compose();
    if (next === value) {
      return;
    }
    value = next;
    if (byUser) {
      const info = detail();
      emitter.after(() => options.onChange?.(next, info));
    }
  }

  function build(): DateTimePickerState {
    const inner = datePicker.getState();
    const locale = localeOf(options);
    const step = Math.min(30, Math.max(1, Math.floor(options.minuteStep ?? 5)));
    const { am, pm } = getLocale(locale).time;
    const hour12 = options.hour12 ?? false;

    return Object.freeze({
      value,
      detail: detail(),
      dateText: inner.text,
      timeText,
      time,
      calendar: inner.calendar,
      canSwitchCalendar: inner.canSwitchCalendar,
      open: inner.open,
      error: inner.error
        ? { ...inner.error, field: 'date' as const }
        : timeError
          ? { ...timeError, field: 'time' as const }
          : null,
      equivalentText: inner.equivalentText,
      placeholder: inner.placeholder,
      timePlaceholder: hour12 ? `h:mm ${am}` : 'HH:MM',
      hours: Array.from({ length: 24 }, (_, hour) =>
        Object.freeze({
          value: hour,
          label: hour12
            ? `${formatNumber(hour % 12 === 0 ? 12 : hour % 12, locale)} ${hour < 12 ? am : pm}`
            : formatNumber(String(hour).padStart(2, '0'), locale),
          isSelected: time?.hour === hour,
        }),
      ),
      minutes: Array.from({ length: Math.ceil(60 / step) }, (_, index) =>
        Object.freeze({
          value: index * step,
          label: formatNumber(String(index * step).padStart(2, '0'), locale),
          isSelected: time?.minute === index * step,
        }),
      ),
      presets: inner.presets,
      calendarState: inner.calendarState,
    });
  }

  function setTime(next: TimeOfDay | null, text: string, byUser: boolean): void {
    time = next;
    timeText = text;
    timeError = null;
    commit(byUser);
  }

  const actions: DateTimePickerActions = {
    typeDate(text) {
      datePicker.actions.type(text);
    },
    blurDate() {
      datePicker.actions.blur();
    },
    typeTime(text) {
      if (destroyed) {
        return;
      }
      emitter.act(() => {
        const parsed = parseTime(text);
        if (text.trim() === '' || parsed) {
          setTime(parsed, text, true);
        } else {
          time = null;
          timeText = text;
          timeError = {
            code: 'format',
            message: getLocale(localeOf(options)).messages.invalidTime,
          };
          commit(true);
        }
      });
    },
    blurTime() {
      emitter.act(() => {
        if (!timeError && time) {
          timeText = fmt(time);
        }
      });
    },
    selectDate(date) {
      return !destroyed && datePicker.actions.select(date);
    },
    selectHour(hour) {
      emitter.act(() => {
        const next = Object.freeze({ hour, minute: time?.minute ?? 0 });
        setTime(next, fmt(next), true);
      });
    },
    selectMinute(minute) {
      emitter.act(() => {
        const next = Object.freeze({ hour: time?.hour ?? 0, minute });
        setTime(next, fmt(next), true);
      });
    },
    selectNow() {
      if (destroyed) {
        return false;
      }
      const current = now(zone());
      let picked = false;
      emitter.act(() => {
        time = current.time;
        timeText = fmt(current.time);
        timeError = null;
        picked = datePicker.actions.select(current.date);
        commit(true);
      });

      return picked;
    },
    applyPreset(id) {
      return !destroyed && datePicker.actions.applyPreset(id);
    },
    open() {
      datePicker.actions.open();
    },
    close() {
      datePicker.actions.close();
    },
    toggle() {
      datePicker.actions.toggle();
    },
    clear() {
      emitter.act(() => {
        datePicker.actions.setValue('');
        setTime(null, '', true);
      });
    },
    setValue(next) {
      emitter.act(() => {
        applyValue(next);
      });
    },
    switchCalendar(calendar) {
      datePicker.actions.switchCalendar(calendar);
    },
    reset() {
      emitter.act(() => {
        const start = fromIsoDateTime(options.defaultValue, zone());
        datePicker.actions.setValue(start ? toIsoDay(start.date) : '');
        setTime(start?.time ?? null, start ? fmt(start.time) : '', true);
      });
    },
  };

  /** An outside value; ignored when it is the instant already shown (echo guard). */
  function applyValue(next: string | undefined): void {
    const parsed = fromIsoDateTime(next, zone());
    const incoming = parsed ? toIsoDateTime(parsed.date, parsed.time, zone()) : '';
    if (incoming === value) {
      return;
    }
    datePicker.actions.setValue(parsed ? toIsoDay(parsed.date) : '');
    time = parsed?.time ?? null;
    timeText = time ? fmt(time) : '';
    timeError = null;
    commit(false);
  }

  return {
    getState: () => snapshot,
    subscribe: (listener) => emitter.subscribe(listener),
    setOptions(changes) {
      if (destroyed) {
        return;
      }
      emitter.act(() => {
        options = { ...options, ...changes };
        datePicker.setOptions(dateOptions());
        if ('value' in changes) {
          applyValue(changes.value);
        }
        if (time && !timeError) {
          timeText = fmt(time);
        }
        commit(false);
      });
    },
    actions,
    calendar: datePicker.calendar,
    destroy() {
      destroyed = true;
      datePicker.destroy();
      emitter.clear();
    },
  };
}

function toIsoDay(date: CalendarDate): string {
  return toIsoDate(date);
}
