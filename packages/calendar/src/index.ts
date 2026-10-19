/**
 * @nepdate/calendar: the calendar view model, and nothing else. Builds month,
 * month-tile and year-tile grids in BS or AD, tracks navigation and focus, and
 * marks day states. Renders nothing; adapters do (docs/plan packages/calendar).
 */
export { createCalendar } from './store';
export {
  buildMonthGrid,
  buildWeekdays,
  isDayList,
  type GridInput,
  type HolidayResolver,
} from './grid';
export { buildMonthTiles, buildYearTiles, yearPageStart, type TileInput } from './tiles';
export { nextFocus } from './focus';
export { computeLimits, isInLimits, type Limits } from './limits';
export type {
  CalendarActions,
  CalendarOptions,
  CalendarSelection,
  CalendarState,
  CalendarStore,
  CalendarView,
  DateRange,
  DayCell,
  DayState,
  EventMarker,
  FocusKey,
  HolidayInfo,
  HolidayInput,
  HolidayLookup,
  PickerCell,
  SelectionMode,
  WeekdayCell,
} from './types';
