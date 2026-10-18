import { isProjectedBsYear } from './bs/table';
import { toCalendar } from './convert';
import type { CalendarDate } from './types';

/** Whether the date's BS year is after the last year checked against a published calendar. */
export function isProjected(date: CalendarDate): boolean {
  return isProjectedBsYear(toCalendar(date, 'BS').year);
}
