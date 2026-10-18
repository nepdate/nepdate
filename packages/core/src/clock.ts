import { getConfig } from './config';
import { fromIsoTimestamp, fromJsDate, toCalendar } from './convert';
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

/** The current calendar day and time (HH:MM) in `timeZone` (Nepal by default). */
export function now(timeZone: string = getConfig().timeZone): {
  readonly date: AdDate;
  readonly time: { readonly hour: number; readonly minute: number };
} {
  const current = fromIsoTimestamp(new Date().toISOString(), timeZone);
  const [hour = 0, minute = 0] = (current?.time ?? '00:00').split(':').map(Number);

  return {
    date: current?.date ?? fromJsDate(new Date(), timeZone),
    time: Object.freeze({ hour, minute }),
  };
}
