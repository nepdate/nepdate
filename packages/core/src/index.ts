/**
 * @nepdate/core: the source of truth for Bikram Sambat (BS) and AD dates.
 * No package dependencies; built-ins only (docs/plan D-004).
 */
export type {
  AdDate,
  BsData,
  BsDate,
  CalendarDate,
  CalendarSystem,
  DateOf,
  EpochDay,
  FiscalYear,
  LocaleCode,
  MonthNumber,
  Weekday,
} from './types';

export {
  NepDateDataError,
  NepDateRangeError,
  type NepDateDataErrorCode,
  type NepDateRangeErrorCode,
} from './errors';

export { toEpochDay, weekdayOf } from './epoch';
export { configure, getConfig, resetConfig, type NepDateConfig } from './config';

export { isAdLeapYear, MAX_AD_YEAR } from './ad/calendar';
export { bsFirstYear, bsLastYear } from './bs/table';
export {
  BS_FISCAL_YEAR_START_MONTH,
  getBsData,
  patchBsYear,
  resetBsData,
  setBsData,
  validateBsData,
} from './bs/data-api';

export {
  adDate,
  bsDate,
  createDate,
  daysInMonth,
  isAdDate,
  isBsDate,
  isCalendarDate,
  isValidDate,
} from './create';

export {
  adToBs,
  bsToAd,
  fromEpoch,
  fromIsoDate,
  fromIsoTimestamp,
  fromJsDate,
  isConvertible,
  maxDate,
  minDate,
  toCalendar,
  toEpoch,
  toIsoDate,
} from './convert';
export { isProjected } from './projected';
export { now, today } from './clock';

export {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  eachDayOfInterval,
  eachDayOfMonth,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from './arithmetic';

export {
  clampDate,
  compareDates,
  dayOfWeek,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameYear,
  isWeekend,
  isWithin,
} from './compare';

export {
  formatMessage,
  formatNumber,
  getLocale,
  hasLocale,
  monthNames,
  registerLocale,
  toAsciiDigits,
  toDevanagariDigits,
  weekdayNames,
  type LocaleData,
} from './locale/index';

export {
  DATE_FORMATS,
  formatDate,
  type DateFormatPattern,
  type NamedFormat,
} from './format';
export { parseDate, parseDateStrict, parseFiscalYear } from './parse';
export { fiscalYear, fiscalYearRange, formatFiscalYear, isInFiscalYear } from './fiscal';
export {
  compareTimes,
  formatTime,
  fromIsoDateTime,
  isValidTime,
  parseTime,
  timeOfDay,
  toIsoDateTime,
  type TimeOfDay,
} from './time';
