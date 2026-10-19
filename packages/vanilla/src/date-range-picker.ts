/** `@nepdate/vanilla/date-range-picker`: just the range picker. */
import { NepDateRangePickerElement } from './date-range-picker-element';
import { DateRangePickerView, type DateRangePickerViewOptions } from './range-view';
import { defineElement, ELEMENT_NAMES } from './registry';

export { NepDateRangePickerElement };
export { DateRangePickerView, type DateRangePickerViewOptions } from './range-view';

/** Register <nep-date-range-picker> (skipped if already defined). */
export function defineDateRangePicker(registry?: CustomElementRegistry): void {
  defineElement(ELEMENT_NAMES.dateRangePicker, NepDateRangePickerElement, registry);
}

/** Mount a date range picker into a container. */
export function createDateRangePicker(
  container: HTMLElement,
  options: DateRangePickerViewOptions = {},
): DateRangePickerView {
  return new DateRangePickerView(container, options);
}
