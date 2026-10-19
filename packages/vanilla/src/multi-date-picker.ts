/** `@nepdate/vanilla/multi-date-picker`: just the multiple-date picker (element, view and mount function). */
import type { MultiDatePickerState } from '@nepdate/datepicker';
import { NepMultiDatePickerElement } from './multi-date-picker-element';
import { MultiDatePickerView, type MultiDatePickerViewOptions } from './multi-view';
import { defineElement, ELEMENT_NAMES } from './registry';

export { NepMultiDatePickerElement };
export { MultiDatePickerView, type MultiDatePickerViewOptions } from './multi-view';

/** Register <nep-multi-date-picker> (skipped if already defined). */
export function defineMultiDatePicker(registry?: CustomElementRegistry): void {
  defineElement(ELEMENT_NAMES.multiDatePicker, NepMultiDatePickerElement, registry);
}

export interface MultiDatePickerHandle {
  readonly view: MultiDatePickerView;
  getValue(): readonly string[];
  getState(): MultiDatePickerState;
  setValue(value: readonly string[]): void;
  setOptions(changes: Partial<MultiDatePickerViewOptions>): void;
  open(): void;
  close(): void;
  destroy(): void;
}

/** Mount a multiple-date picker into a container, without custom elements. */
export function createMultiDatePicker(
  container: HTMLElement,
  options: MultiDatePickerViewOptions = {},
): MultiDatePickerHandle {
  const view = new MultiDatePickerView(container, options);

  return {
    view,
    getValue: () => view.getState().value,
    getState: () => view.getState(),
    setValue: (value) => {
      view.store.actions.setValue(value);
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
    },
  };
}
