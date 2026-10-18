import { bsDate, isBsDate, parseDate, type BsDate } from '@nepdate/core';
import { HolidayDataError } from './errors';
import { FIXED_NATIONAL_DAYS } from './fixed';
import type {
  Holiday,
  HolidayEntry,
  HolidayFile,
  HolidayName,
  HolidayType,
} from './types';

const TYPES: ReadonlySet<string> = new Set([
  'national',
  'festival',
  'observance',
  'custom',
]);
const registered = new Map<number, Holiday[]>();

/** Check a yearly list (e.g. parsed JSON) and return it typed. Throws HolidayDataError. */
export function parseHolidayFile(input: unknown): HolidayFile {
  const file = record(input, '$');
  const year = file['year'];
  if (typeof year !== 'number' || !Number.isInteger(year)) {
    throw new HolidayDataError('year', 'must be a whole BS year');
  }
  const source = file['source'];
  if (typeof source !== 'string' || source.trim() === '') {
    throw new HolidayDataError('source', 'must say where the list comes from');
  }
  const list = file['holidays'];
  if (!Array.isArray(list)) {
    throw new HolidayDataError('holidays', 'must be a list');
  }
  const ids = new Set<string>();
  const holidays = list.map((item: unknown, index): HolidayEntry => {
    const path = `holidays[${index}]`;
    const entry = record(item, path);
    const id = entry['id'];
    if (typeof id !== 'string' || id.trim() === '') {
      throw new HolidayDataError(`${path}.id`, 'must be a non-empty string');
    }
    if (ids.has(id)) {
      throw new HolidayDataError(`${path}.id`, `"${id}" is listed twice`);
    }
    ids.add(id);
    const date = entry['date'];
    const parsed = typeof date === 'string' ? parseDate(date, 'BS') : null;
    if (!parsed) {
      throw new HolidayDataError(`${path}.date`, 'must be a valid BS date as YYYY-MM-DD');
    }
    if (parsed.year !== year) {
      throw new HolidayDataError(`${path}.date`, `is not in BS ${year}`);
    }
    const type = entry['type'];
    if (type !== undefined && (typeof type !== 'string' || !TYPES.has(type))) {
      throw new HolidayDataError(
        `${path}.type`,
        'must be national, festival, observance or custom',
      );
    }

    return {
      id,
      date: date as string,
      name: holidayName(entry['name'], `${path}.name`),
      ...(type === undefined ? {} : { type: type as HolidayType }),
    };
  });

  return { year, source, holidays };
}

/** Load a yearly list (validated). Replaces anything registered for that year before. */
export function loadHolidayFile(input: unknown): void {
  const file = parseHolidayFile(input);
  registerHolidays(file.year, file.holidays);
}

/**
 * Register holidays for a BS year, replacing earlier ones for that year. Dates
 * are BS "YYYY-MM-DD" strings or BsDate objects. Use this for school or
 * company holidays too (type 'custom').
 */
export function registerHolidays(
  year: number,
  holidays: readonly (Omit<HolidayEntry, 'date'> & { readonly date: string | BsDate })[],
): void {
  const list = holidays.map((entry, index): Holiday => {
    const date =
      typeof entry.date === 'string' ? parseDate(entry.date, 'BS') : entry.date;
    if (!date || !isBsDate(date) || date.year !== year) {
      throw new HolidayDataError(
        `holidays[${index}].date`,
        `must be a valid date in BS ${year}`,
      );
    }

    return Object.freeze({
      id: entry.id,
      date,
      name: Object.freeze({ ...entry.name }),
      type: entry.type ?? 'festival',
      source: 'registered',
    });
  });
  registered.set(year, list);
}

/** Forget registered holidays for one year, or for every year. Fixed national days stay. */
export function clearHolidays(year?: number): void {
  if (year === undefined) {
    registered.clear();
  } else {
    registered.delete(year);
  }
}

/** The years that have a registered list. */
export function registeredYears(): number[] {
  return [...registered.keys()].sort((a, b) => a - b);
}

/** Fixed national days that fall in a BS year (none outside the BS table). */
export function fixedHolidaysFor(year: number): Holiday[] {
  const out: Holiday[] = [];
  for (const rule of FIXED_NATIONAL_DAYS) {
    if (rule.since !== undefined && year < rule.since) {
      continue;
    }
    try {
      out.push(
        Object.freeze({
          id: rule.id,
          date: bsDate(year, rule.month, rule.day),
          name: rule.name,
          type: 'national',
          source: 'fixed',
        }),
      );
    } catch {
      return [];
    }
  }

  return out;
}

export function registeredHolidaysFor(year: number): readonly Holiday[] {
  return registered.get(year) ?? [];
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HolidayDataError(path, 'must be an object');
  }

  return value as Record<string, unknown>;
}

function holidayName(value: unknown, path: string): HolidayName {
  const name = record(value, path);
  const en = name['en'];
  const ne = name['ne'];
  if (typeof en !== 'string' || en === '' || typeof ne !== 'string' || ne === '') {
    throw new HolidayDataError(path, 'needs both en and ne names');
  }

  return { en, ne };
}
