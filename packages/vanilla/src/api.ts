import {
  createCalendar as createCalendarStore,
  type CalendarOptions,
  type CalendarStore,
} from '@nepdate/calendar';
import type { DatePickerState } from '@nepdate/datepicker';
import { CalendarView } from './calendar-view';
import { DatePickerView, type DatePickerViewOptions } from './picker-view';
import { DateRangePickerView, type DateRangePickerViewOptions } from './range-view';

export interface DatePickerHandle {
  readonly view: DatePickerView;
  getValue(): string;
  getState(): DatePickerState;
  setValue(value: string): void;
  setOptions(changes: Partial<DatePickerViewOptions>): void;
  open(): void;
  close(): void;
  destroy(): void;
}

/**
 * Mount a date picker without custom elements.
 *
 * - Given a container, renders the field into it.
 * - Given an <input>, hides it and keeps its value in step with the picker
 *   (AD "YYYY-MM-DD"), so existing forms and server code keep working.
 */
export function createDatePicker(
  target: HTMLElement,
  options: DatePickerViewOptions = {},
): DatePickerHandle {
  const enhanced = target instanceof HTMLInputElement ? target : null;
  let host = target;
  if (enhanced) {
    host = document.createElement('span');
    enhanced.after(host);
    enhanced.hidden = true;
  }
  const view = new DatePickerView(host, {
    ...(enhanced
      ? {
          defaultValue: enhanced.value,
          name: undefined,
          required: enhanced.required,
          disabled: enhanced.disabled,
        }
      : {}),
    ...options,
    onChange: (value, detail) => {
      if (enhanced) {
        enhanced.value = value;
        enhanced.dispatchEvent(new Event('input', { bubbles: true }));
        enhanced.dispatchEvent(new Event('change', { bubbles: true }));
      }
      options.onChange?.(value, detail);
    },
  });

  return {
    view,
    getValue: () => view.getState().value,
    getState: () => view.getState(),
    setValue: (value) => {
      view.store.actions.setValue(value);
      if (enhanced) {
        enhanced.value = view.getState().value;
      }
    },
    setOptions: (changes) => {
      view.setOptions(changes);
    },
    open: () => {
      view.open();
    },
    close: () => {
      view.close();
    },
    destroy: () => {
      view.destroy();
      if (enhanced) {
        host.remove();
        enhanced.hidden = false;
      }
    },
  };
}

export interface CalendarHandle {
  readonly store: CalendarStore;
  readonly view: CalendarView;
  setOptions(changes: Partial<CalendarOptions>): void;
  destroy(): void;
}

/** Mount a standalone calendar into a container. */
export function createCalendar(
  container: HTMLElement,
  options: CalendarOptions = {},
): CalendarHandle {
  const store = createCalendarStore(options);
  const view = new CalendarView(container, store, { locale: () => options.locale });

  return {
    store,
    view,
    setOptions: (changes) => {
      store.setOptions(changes);
    },
    destroy: () => {
      view.destroy();
      store.destroy();
    },
  };
}

/** Mount a date range picker into a container. */
export function createDateRangePicker(
  container: HTMLElement,
  options: DateRangePickerViewOptions = {},
): DateRangePickerView {
  return new DateRangePickerView(container, options);
}
