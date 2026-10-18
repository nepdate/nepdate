import { getConfig } from './config';
import { fromJsDate, toCalendar } from './convert';
import type { AdDate, CalendarSystem, DateOf } from './types';

/**
 * Today's date by the calendar day in `timeZone` (Nepal by default), not the
 * device's zone. The only function in the library that reads the clock.
 */
export function today(): AdDate;
export function today<C extends CalendarSystem>(
  calendar: C,
  timeZone?: string,
): DateOf<C>;
export function today(
  calendar: CalendarSystem = 'AD',
  timeZone: string = getConfig().timeZone,
): AdDate | DateOf<CalendarSystem> {
  return toCalendar(fromJsDate(new Date(), timeZone), calendar);
}
