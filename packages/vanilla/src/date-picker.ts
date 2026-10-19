/** `@nepdate/vanilla/date-picker`: just the date picker (element, view and mount function). */
import type { DatePickerState } from '@nepdate/datepicker';
import { NepDatePickerElement } from './date-picker-element';
import { DatePickerView, type DatePickerViewOptions } from './picker-view';
import { defineElement, ELEMENT_NAMES } from './registry';

export { NepDatePickerElement };
export { DatePickerView, type DatePickerViewOptions, type Theme } from './picker-view';

/** Register <nep-date-picker> (skipped if already defined). */
export function defineDatePicker(registry?: CustomElementRegistry): void {
  defineElement(ELEMENT_NAMES.datePicker, NepDatePickerElement, registry);
}

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
