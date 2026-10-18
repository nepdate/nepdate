/**
 * @nepdate/holidays: Nepal's fixed-date national days, plus a validated loader
 * for each year's official holiday list (festivals change every year with the
 * lunar calendar, so they come from the published list, not from a rule).
 */
export type {
  Holiday,
  HolidayEntry,
  HolidayFile,
  HolidayName,
  HolidayType,
} from './types';
export { HolidayDataError } from './errors';
export { FIXED_NATIONAL_DAYS, type FixedHolidayRule } from './fixed';
export {
  clearHolidays,
  fixedHolidaysFor,
  loadHolidayFile,
  parseHolidayFile,
  registerHolidays,
  registeredYears,
} from './registry';
export {
  holidayName,
  holidaysBetween,
  holidaysFor,
  holidaysOn,
  isHoliday,
  toCalendarHolidays,
  type HolidayQuery,
} from './query';
