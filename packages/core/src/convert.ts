/**
 * The only place the AD and BS calendars meet, and only through EpochDay
 * (docs/plan D-001). Nothing here looks up a year number across calendars.
 */
import { adToEpoch, epochToAd } from './ad/calendar';
import { bsEpochRange, bsToEpoch, epochToBs } from './bs/table';
import { getConfig } from './config';
import { adDate, bsDate } from './create';
import { toEpochDay } from './epoch';
import { NepDateRangeError } from './errors';
import type {
  AdDate,
  BsDate,
  CalendarDate,
  CalendarSystem,
  DateOf,
  EpochDay,
} from './types';

/** The day count of a date in either calendar. */
export function toEpoch(date: CalendarDate): EpochDay {
  return toEpochDay(
    date.calendar === 'AD'
      ? adToEpoch(date.year, date.month, date.day)
      : bsToEpoch(date.year, date.month, date.day),
  );
}

/** The date of a day count in a calendar. BS throws OUT_OF_TABLE outside the table. */
export function fromEpoch<C extends CalendarSystem>(
  epoch: EpochDay,
  calendar: C,
): DateOf<C> {
  if (calendar === 'AD') {
    const { year, month, day } = epochToAd(epoch);

    return adDate(year, month, day) as DateOf<C>;
  }
  assertConvertible(epoch);
  const { year, month, day } = epochToBs(epoch);

  return bsDate(year, month, day) as DateOf<C>;
}

export function adToBs(date: AdDate): BsDate {
  return fromEpoch(toEpoch(date), 'BS');
}

export function bsToAd(date: BsDate): AdDate {
  return fromEpoch(toEpoch(date), 'AD');
}

/** The same day in the given calendar (the date itself when it is already in it). */
export function toCalendar<C extends CalendarSystem>(
  date: CalendarDate,
  calendar: C,
): DateOf<C> {
  if (date.calendar === calendar) {
    return date as DateOf<C>;
  }

  return fromEpoch(toEpoch(date), calendar);
}

/** The first day that can be converted, in either calendar (the start of the BS table). */
export function minDate<C extends CalendarSystem>(calendar: C): DateOf<C> {
  return fromEpoch(toEpochDay(bsEpochRange().first), calendar);
}

/** The last day that can be converted, in either calendar (the end of the BS table). */
export function maxDate<C extends CalendarSystem>(calendar: C): DateOf<C> {
  return fromEpoch(toEpochDay(bsEpochRange().last), calendar);
}

/** Whether a date can be converted to the other calendar. */
export function isConvertible(date: CalendarDate): boolean {
  const epoch = toEpoch(date);
  const { first, last } = bsEpochRange();

  return epoch >= first && epoch <= last;
}

/** The AD day as "YYYY-MM-DD", the form to store and send (docs/plan D-003). */
export function toIsoDate(date: CalendarDate): string {
  const { year, month, day } = toCalendar(date, 'AD');
  if (year < 0 || year > 9999) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `AD year ${year} cannot be written as YYYY-MM-DD.`,
    );
  }

  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/**
 * An AD date from "YYYY-MM-DD", or from a longer ISO timestamp by its date part
 * ("2026-10-18T09:30:00Z" → 2026-10-18). Null for anything else.
 */
export function fromIsoDate(value: string | null | undefined): AdDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(value ?? '');
  if (!match) {
    return null;
  }
  try {
    return adDate(Number(match[1]), Number(match[2]), Number(match[3]));
  } catch {
    return null;
  }
}

/** The AD calendar day an instant falls on in a time zone (Nepal by default). */
export function fromJsDate(
  instant: Date,
  timeZone: string = getConfig().timeZone,
): AdDate {
  if (Number.isNaN(instant.getTime())) {
    throw new NepDateRangeError('INVALID_ARGUMENT', 'The Date is invalid.');
  }
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      era: 'short',
    }).formatToParts(instant);
  } catch {
    throw new NepDateRangeError('INVALID_ARGUMENT', `"${timeZone}" is not a time zone.`);
  }
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? '';
  const year = Number(part('year'));

  return adDate(
    part('era') === 'BC' ? 1 - year : year,
    Number(part('month')),
    Number(part('day')),
  );
}

/**
 * The calendar day and time of an ISO timestamp *with a zone* ("…Z",
 * "…+05:45"), read in `timeZone` (Nepal by default). Null for anything else,
 * including plain dates, which have no instant.
 */
export function fromIsoTimestamp(
  value: string | null | undefined,
  timeZone: string = getConfig().timeZone,
): { readonly date: AdDate; readonly time: string } | null {
  if (!value || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    return null;
  }
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    return null;
  }
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant);

  return { date: fromJsDate(instant, timeZone), time };
}

function assertConvertible(epoch: number): void {
  const { first, last } = bsEpochRange();
  if (epoch < first || epoch > last) {
    const { year, month, day } = epochToAd(epoch);
    const from = epochToAd(first);
    const to = epochToAd(last);
    throw new NepDateRangeError(
      'OUT_OF_TABLE',
      `AD ${isoParts(year, month, day)} is outside the BS table (AD ${isoParts(from.year, from.month, from.day)} to ${isoParts(to.year, to.month, to.day)}).`,
    );
  }
}

function isoParts(year: number, month: number, day: number): string {
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
