/**
 * @nepdate/vanilla: the BS/AD date picker and calendar for plain JavaScript,
 * as custom elements and as a small imperative API. No side effects; import
 * '@nepdate/vanilla/define' (or call defineElements) to register the elements.
 */
export {
  NepCalendarElement,
  NepDatePickerElement,
  NepDateRangePickerElement,
} from './elements';
export { defineElements, ELEMENT_NAMES } from './define';
export {
  createCalendar,
  createDatePicker,
  createDateRangePicker,
  type CalendarHandle,
  type DatePickerHandle,
} from './api';
export { CalendarView, type CalendarViewOptions } from './calendar-view';
export { DatePickerView, type DatePickerViewOptions, type Theme } from './picker-view';
export { DateRangePickerView, type DateRangePickerViewOptions } from './range-view';
