import { fromIsoDate, parseDate, type AdDate, type BsDate } from '@nepdate/core';

export function bs(text: string): BsDate {
  const date = parseDate(text, 'BS');
  if (!date) {
    throw new Error(`Bad BS fixture ${text}`);
  }
  return date;
}

export function ad(text: string): AdDate {
  const date = fromIsoDate(text);
  if (!date) {
    throw new Error(`Bad AD fixture ${text}`);
  }
  return date;
}

/** Kartik 1, 2083 BS = 2026-10-18 AD. */
export const TODAY: AdDate = ad('2026-10-18');
