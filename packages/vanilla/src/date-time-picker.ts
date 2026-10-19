/** `@nepdate/vanilla/date-time-picker`: just the date + time picker. */
import { NepDateTimePickerElement } from './date-time-picker-element';
import { DateTimePickerView, type DateTimePickerViewOptions } from './datetime-view';
import { defineElement, ELEMENT_NAMES } from './registry';

export { NepDateTimePickerElement };
export { DateTimePickerView, type DateTimePickerViewOptions } from './datetime-view';

/** Register <nep-date-time-picker> (skipped if already defined). */
export function defineDateTimePicker(registry?: CustomElementRegistry): void {
  defineElement(ELEMENT_NAMES.dateTimePicker, NepDateTimePickerElement, registry);
}

/** Mount a date + time picker into a container. */
export function createDateTimePicker(
  container: HTMLElement,
  options: DateTimePickerViewOptions = {},
): DateTimePickerView {
  return new DateTimePickerView(container, options);
}
