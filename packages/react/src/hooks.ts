import { useId, type ChangeEvent, type KeyboardEvent } from 'react';
import { getLocale, type CalendarSystem } from '@nepdate/core';
import {
  createCalendar,
  type CalendarOptions,
  type CalendarState,
  type CalendarStore,
} from '@nepdate/calendar';
import {
  createDatePicker,
  createDateRangePicker,
  type DatePickerOptions,
  type DatePickerState,
  type DatePickerStore,
  type DateRangePickerOptions,
  type DateRangePickerState,
  type DateRangePickerStore,
  type RangeField,
} from '@nepdate/datepicker';
import { useCalendarBindings, type ButtonProps, type CalendarBindings } from './bindings';
import { useStore } from './use-store';

/** A standalone calendar: state, actions and prop getters. */
export function useCalendar(
  options: CalendarOptions = {},
): CalendarBindings & { store: CalendarStore } {
  const { store, state } = useStore<CalendarOptions, CalendarState, CalendarStore>(
    createCalendar,
    options,
  );
  const bindings = useCalendarBindings(state, store.actions, options.locale, {
    getSnapshot: () => store.getState(),
  });

  return { ...bindings, store };
}

export interface InputProps {
  id: string;
  role: 'combobox';
  type: 'text';
  inputMode: 'numeric';
  autoComplete: 'off';
  value: string;
  placeholder: string;
  'aria-haspopup': 'dialog';
  'aria-expanded': boolean;
  'aria-controls': string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export interface PanelProps {
  id: string;
  role: 'dialog';
  'aria-label': string;
}

export interface DatePickerBindings {
  readonly state: DatePickerState;
  readonly actions: DatePickerStore['actions'];
  readonly store: DatePickerStore;
  /** Prop getters for the panel's calendar. */
  readonly calendar: CalendarBindings;
  readonly ids: { input: string; panel: string; hint: string };
  getInputProps(extra?: { id?: string | undefined }): InputProps;
  getToggleProps(): ButtonProps & { 'aria-expanded': boolean; 'aria-controls': string };
  getClearProps(): ButtonProps;
  /** The BS/AD switch inside the input. */
  getSwitchProps(): ButtonProps;
  /** One button of the BS/AD segment in the panel footer. */
  getCalendarOptionProps(calendar: CalendarSystem): ButtonProps;
  getTodayProps(): ButtonProps;
  getPanelProps(): PanelProps;
}

/** A BS/AD date picker without markup: wire the getters to your own elements. */
export function useDatePicker(
  options: DatePickerOptions & { id?: string | undefined } = {},
): DatePickerBindings {
  const { id: givenId, ...storeOptions } = options;
  const { store, state } = useStore<DatePickerOptions, DatePickerState, DatePickerStore>(
    createDatePicker,
    storeOptions,
  );
  const generated = useId();
  const input = givenId ?? `ndp${generated.replace(/:/g, '')}`;
  const ids = { input, panel: `${input}-panel`, hint: `${input}-hint` };
  const labels = getLocale(options.locale);
  const calendar = useCalendarBindings(
    state.calendarState,
    store.calendar.actions,
    options.locale,
    {
      getSnapshot: () => store.calendar.getState(),
      onDayActivate: (date) => {
        store.actions.select(date);
      },
    },
  );
  const hasHint = state.error !== null || state.equivalentText !== null;

  return {
    state,
    actions: store.actions,
    store,
    calendar,
    ids,
    getInputProps: () => ({
      id: ids.input,
      role: 'combobox',
      type: 'text',
      inputMode: 'numeric',
      autoComplete: 'off',
      value: state.text,
      placeholder: state.placeholder,
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open,
      'aria-controls': ids.panel,
      ...(state.error ? { 'aria-invalid': true as const } : {}),
      ...(hasHint ? { 'aria-describedby': ids.hint } : {}),
      onChange: (event) => {
        store.actions.type(event.target.value);
      },
      onBlur: () => {
        store.actions.blur();
      },
      onKeyDown: (event) => {
        if (event.key === 'ArrowDown' && (event.altKey || state.text === '')) {
          event.preventDefault();
          store.actions.open();
        }
      },
    }),
    getToggleProps: () => ({
      type: 'button',
      'aria-label': labels.labels.openCalendar,
      'aria-expanded': state.open,
      'aria-controls': ids.panel,
      onClick: () => {
        store.actions.toggle();
      },
    }),
    getClearProps: () => ({
      type: 'button',
      'aria-label': labels.labels.clear,
      onClick: () => {
        store.actions.clear();
      },
    }),
    getSwitchProps: () => {
      const other: CalendarSystem = state.calendar === 'BS' ? 'AD' : 'BS';

      return {
        type: 'button',
        'aria-label': `${labels.labels.calendar}: ${labels.calendarNames[state.calendar]} → ${labels.calendarNames[other]}`,
        onClick: () => {
          store.actions.switchCalendar(other);
        },
      };
    },
    getCalendarOptionProps: (option) => ({
      type: 'button',
      'aria-pressed': state.calendar === option,
      onClick: () => {
        store.actions.switchCalendar(option);
      },
    }),
    getTodayProps: () => ({
      type: 'button',
      onClick: () => {
        store.actions.selectToday();
      },
    }),
    getPanelProps: () => ({
      id: ids.panel,
      role: 'dialog',
      'aria-label': labels.labels.chooseDate,
    }),
  };
}

export interface DateRangePickerBindings {
  readonly state: DateRangePickerState;
  readonly actions: DateRangePickerStore['actions'];
  readonly store: DateRangePickerStore;
  readonly calendar: CalendarBindings;
  readonly ids: { start: string; end: string; panel: string; hint: string };
  getInputProps(field: RangeField): Omit<InputProps, 'onChange' | 'onBlur'> & {
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
  };
  getToggleProps(): ButtonProps & { 'aria-expanded': boolean; 'aria-controls': string };
  getCalendarOptionProps(calendar: CalendarSystem): ButtonProps;
  getPanelProps(): PanelProps;
}

/** A BS/AD date range picker without markup. */
export function useDateRangePicker(
  options: DateRangePickerOptions = {},
): DateRangePickerBindings {
  const { store, state } = useStore<
    DateRangePickerOptions,
    DateRangePickerState,
    DateRangePickerStore
  >(createDateRangePicker, options);
  const base = `ndp${useId().replace(/:/g, '')}`;
  const ids = {
    start: `${base}-start`,
    end: `${base}-end`,
    panel: `${base}-panel`,
    hint: `${base}-hint`,
  };
  const labels = getLocale(options.locale);
  const calendar = useCalendarBindings(
    state.calendarState,
    store.calendar.actions,
    options.locale,
    {
      getSnapshot: () => store.calendar.getState(),
      onDayActivate: (date) => {
        store.actions.select(date);
      },
    },
  );
  const texts: Record<RangeField, string> = {
    start: state.startText,
    end: state.endText,
  };

  return {
    state,
    actions: store.actions,
    store,
    calendar,
    ids,
    getInputProps: (field) => {
      const invalid =
        state.error !== null &&
        (state.error.field === field || state.error.field === 'range');

      return {
        id: ids[field],
        role: 'combobox',
        type: 'text',
        inputMode: 'numeric',
        autoComplete: 'off',
        value: texts[field],
        placeholder: state.placeholder,
        'aria-haspopup': 'dialog',
        'aria-expanded': state.open,
        'aria-controls': ids.panel,
        ...(invalid ? { 'aria-invalid': true as const } : {}),
        ...(state.error ? { 'aria-describedby': ids.hint } : {}),
        onChange: (event) => {
          store.actions.type(field, event.target.value);
        },
        onBlur: () => {
          store.actions.blur(field);
        },
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown' && (event.altKey || texts[field] === '')) {
            event.preventDefault();
            store.actions.open();
          }
        },
      };
    },
    getToggleProps: () => ({
      type: 'button',
      'aria-label': labels.labels.openCalendar,
      'aria-expanded': state.open,
      'aria-controls': ids.panel,
      onClick: () => {
        store.actions.toggle();
      },
    }),
    getCalendarOptionProps: (option) => ({
      type: 'button',
      'aria-pressed': state.calendar === option,
      onClick: () => {
        store.actions.switchCalendar(option);
      },
    }),
    getPanelProps: () => ({
      id: ids.panel,
      role: 'dialog',
      'aria-label': labels.labels.chooseDate,
    }),
  };
}
