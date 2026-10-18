import { getConfig } from './config';
import { fromIsoTimestamp, toCalendar } from './convert';
import { adDate } from './create';
import { NepDateRangeError } from './errors';
import { formatNumber, getLocale, toAsciiDigits } from './locale/index';
import type { AdDate, CalendarDate, LocaleCode } from './types';

/** A time of day, 00:00–23:59. Frozen like dates. */
export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
}

export function timeOfDay(hour: number, minute = 0): TimeOfDay {
  if (!isValidTime(hour, minute)) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `${String(hour)}:${String(minute)} is not a time of day.`,
    );
  }

  return Object.freeze({ hour, minute });
}

export function isValidTime(hour: number, minute: number): boolean {
  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

/** -1, 0 or 1. */
export function compareTimes(a: TimeOfDay, b: TimeOfDay): -1 | 0 | 1 {
  return Math.sign(a.hour * 60 + a.minute - (b.hour * 60 + b.minute)) as -1 | 0 | 1;
}

/**
 * "14:30", "2:30 pm", "2 PM", "1430", "१४:३०", "२:३० अपराह्न" → TimeOfDay.
 * Null when the text is not a time.
 */
export function parseTime(text: string | null | undefined): TimeOfDay | null {
  let value = toAsciiDigits(text ?? '')
    .trim()
    .toLowerCase();
  let meridiem: 'am' | 'pm' | null = null;
  for (const code of ['en', 'ne'] as const) {
    const { am, pm } = getLocale(code).time;
    for (const [word, kind] of [
      [am.toLowerCase(), 'am'],
      [pm.toLowerCase(), 'pm'],
      [am.toLowerCase().replace(/(.)/g, '$1.'), 'am'],
      [pm.toLowerCase().replace(/(.)/g, '$1.'), 'pm'],
    ] as const) {
      if (value.endsWith(word)) {
        meridiem = kind;
        value = value.slice(0, -word.length).trim();
        break;
      }
    }
    if (meridiem) {
      break;
    }
  }
  const match =
    /^(\d{1,2})(?:[:.](\d{2}))?$/.exec(value) ?? /^(\d{2})(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    hour = (hour % 12) + (meridiem === 'pm' ? 12 : 0);
  }

  return isValidTime(hour, minute) ? timeOfDay(hour, minute) : null;
}

/** "14:30" (24-hour) or "2:30 PM" (hour12), in the locale's digits and words. */
export function formatTime(
  time: TimeOfDay,
  options: { readonly hour12?: boolean; readonly locale?: LocaleCode } = {},
): string {
  const minute = String(time.minute).padStart(2, '0');
  if (!options.hour12) {
    return formatNumber(
      `${String(time.hour).padStart(2, '0')}:${minute}`,
      options.locale,
    );
  }
  const { am, pm } = getLocale(options.locale).time;
  const hour = time.hour % 12 === 0 ? 12 : time.hour % 12;

  return `${formatNumber(`${hour}:${minute}`, options.locale)} ${time.hour < 12 ? am : pm}`;
}

/**
 * The instant of a calendar day and time in a zone (Nepal by default), as an
 * ISO timestamp with that zone's offset: "2026-10-18T14:30:00+05:45".
 */
export function toIsoDateTime(
  date: CalendarDate,
  time: TimeOfDay,
  timeZone: string = getConfig().timeZone,
): string {
  const { year, month, day } = toCalendar(date, 'AD');
  if (year < 0 || year > 9999) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `AD year ${year} cannot be written in ISO form.`,
    );
  }
  const wall = Date.UTC(year, month - 1, day, time.hour, time.minute);
  const first = offsetMinutes(wall, timeZone);
  const offset = offsetMinutes(wall - first * 60_000, timeZone);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(time.hour)}:${pad(time.minute)}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/**
 * The day and time of an ISO timestamp in a zone (Nepal by default). A value
 * without an offset ("2026-10-18T14:30", as from <input type="datetime-local">)
 * is read as a wall time already in that zone. Null for anything else.
 */
export function fromIsoDateTime(
  value: string | null | undefined,
  timeZone: string = getConfig().timeZone,
): { readonly date: AdDate; readonly time: TimeOfDay } | null {
  const zoned = fromIsoTimestamp(value, timeZone);
  if (zoned) {
    const time = parseTime(zoned.time);
    return time ? { date: zoned.date, time } : null;
  }
  const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(
    value ?? '',
  );
  if (!local) {
    return null;
  }
  try {
    return {
      date: adDate(Number(local[1]), Number(local[2]), Number(local[3])),
      time: timeOfDay(Number(local[4]), Number(local[5])),
    };
  } catch {
    return null;
  }
}

/** Minutes the zone is ahead of UTC at an instant. */
function offsetMinutes(instant: number, timeZone: string): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(new Date(instant));
  } catch {
    throw new NepDateRangeError('INVALID_ARGUMENT', `"${timeZone}" is not a time zone.`);
  }
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((item) => item.type === type)?.value ?? 0);
  const wall = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
  );

  return Math.round((wall - Math.floor(instant / 60_000) * 60_000) / 60_000);
}
