import { defineCalendar } from './calendar';
import { defineDatePicker } from './date-picker';
import { defineDateRangePicker } from './date-range-picker';
import { defineDateTimePicker } from './date-time-picker';

export { ELEMENT_NAMES } from './registry';

/** Register all four custom elements (skips any already defined). Safe to call more than once. */
export function defineElements(registry?: CustomElementRegistry): void {
  defineDatePicker(registry);
  defineCalendar(registry);
  defineDateRangePicker(registry);
  defineDateTimePicker(registry);
}
