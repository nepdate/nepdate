import {
  addDays,
  addMonths,
  clampDate,
  endOfWeek,
  startOfWeek,
  type CalendarDate,
  type Weekday,
} from '@nepdate/core';
import type { Limits } from './limits';
import type { FocusKey } from './types';

const FORWARD: ReadonlySet<FocusKey> = new Set([
  'ArrowRight',
  'ArrowDown',
  'End',
  'PageDown',
]);

/**
 * The day a key moves focus to. Never throws: a move past min/max or the end
 * of the BS table lands on the nearest allowed day (docs/plan CAL-009, CAL-010).
 */
export function nextFocus(
  focused: CalendarDate,
  key: FocusKey,
  limits: Limits,
  options: { readonly shift?: boolean; readonly weekStartsOn: Weekday },
): CalendarDate {
  const months = options.shift ? 12 : 1;
  let target: CalendarDate;
  try {
    switch (key) {
      case 'ArrowLeft':
        target = addDays(focused, -1);
        break;
      case 'ArrowRight':
        target = addDays(focused, 1);
        break;
      case 'ArrowUp':
        target = addDays(focused, -7);
        break;
      case 'ArrowDown':
        target = addDays(focused, 7);
        break;
      case 'Home':
        target = startOfWeek(focused, options.weekStartsOn);
        break;
      case 'End':
        target = endOfWeek(focused, options.weekStartsOn);
        break;
      case 'PageUp':
        target = addMonths(focused, -months);
        break;
      case 'PageDown':
        target = addMonths(focused, months);
        break;
    }
  } catch {
    target = FORWARD.has(key) ? limits.highDay : limits.lowDay;
  }

  return clampDate(target, limits.lowDay, limits.highDay);
}
