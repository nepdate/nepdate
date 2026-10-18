import {
  NepCalendarElement,
  NepDatePickerElement,
  NepDateRangePickerElement,
  NepDateTimePickerElement,
} from './elements';

/** The tag names this package registers. */
export const ELEMENT_NAMES: {
  readonly datePicker: 'nep-date-picker';
  readonly calendar: 'nep-calendar';
  readonly dateRangePicker: 'nep-date-range-picker';
  readonly dateTimePicker: 'nep-date-time-picker';
} = Object.freeze({
  datePicker: 'nep-date-picker',
  calendar: 'nep-calendar',
  dateRangePicker: 'nep-date-range-picker',
  dateTimePicker: 'nep-date-time-picker',
});

/** Register the custom elements (skips any already defined). Safe to call more than once. */
export function defineElements(registry?: CustomElementRegistry): void {
  const target =
    registry ?? (typeof customElements === 'undefined' ? undefined : customElements);
  if (target === undefined) {
    return;
  }
  const entries: [string, CustomElementConstructor][] = [
    [ELEMENT_NAMES.datePicker, NepDatePickerElement],
    [ELEMENT_NAMES.calendar, NepCalendarElement],
    [ELEMENT_NAMES.dateRangePicker, NepDateRangePickerElement],
    [ELEMENT_NAMES.dateTimePicker, NepDateTimePickerElement],
  ];
  for (const [name, element] of entries) {
    if (!target.get(name)) {
      target.define(name, element);
    }
  }
}
