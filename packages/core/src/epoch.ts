import { NepDateRangeError } from './errors';
import type { EpochDay, Weekday } from './types';

/** Brand a whole number of days since 1970-01-01 as an `EpochDay`. */
export function toEpochDay(value: number): EpochDay {
  if (!Number.isSafeInteger(value)) {
    throw new NepDateRangeError(
      'INVALID_ARGUMENT',
      `${String(value)} is not a whole number of days.`,
    );
  }

  return value as EpochDay;
}

/** The weekday of a day count. 1970-01-01 was a Thursday. */
export function weekdayOf(epoch: EpochDay): Weekday {
  return ((((epoch + 4) % 7) + 7) % 7) as Weekday;
}
