/** Attribute parsing and shared helpers for the custom elements. */
import {
  toIsoDate,
  type CalendarDate,
  type CalendarSystem,
  type Weekday,
} from '@nepdate/core';
import type { EventMarker, HolidayInput, HolidayLookup } from '@nepdate/calendar';
import type { PanelLayout } from '@nepdate/dom';
import type { Theme } from './picker-view';

/** Lets this module load during server rendering, where HTMLElement does not exist. */
export const Base: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (Object as unknown as typeof HTMLElement)
    : HTMLElement;

/** Options that cannot be attributes: functions and lists. Set them as properties. */
export interface RichProps {
  holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  events?: ((date: CalendarDate) => readonly EventMarker[]) | undefined;
  isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
}

export function str(element: Element, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}
export function bool(element: Element, name: string): boolean {
  return element.hasAttribute(name);
}
/** An attribute that is on unless set to "false". */
export function onUnlessFalse(element: Element, name: string): boolean | undefined {
  const value = element.getAttribute(name);
  return value === null ? undefined : value !== 'false';
}
export function calendarAttr(element: Element, name: string): CalendarSystem | undefined {
  const value = element.getAttribute(name)?.toUpperCase();
  return value === 'BS' || value === 'AD' ? value : undefined;
}
export function weekday(element: Element, name: string): Weekday | undefined {
  const value = Number(element.getAttribute(name) ?? NaN);
  return Number.isInteger(value) && value >= 0 && value <= 6
    ? (value as Weekday)
    : undefined;
}
export function int(element: Element, name: string): number | undefined {
  const value = Number(element.getAttribute(name) ?? NaN);
  return Number.isInteger(value) ? value : undefined;
}
export function theme(element: Element): Theme | undefined {
  const value = element.getAttribute('theme');
  return value === 'light' || value === 'dark' || value === 'auto' ? value : undefined;
}

export function panelLayout(element: Element): PanelLayout | undefined {
  const value = element.getAttribute('panel-layout');
  return value === 'auto' || value === 'popover' || value === 'sheet' ? value : undefined;
}

/** presets="today, last7Days" → ['today', 'last7Days']; unknown ids show as disabled. */
export function presetIds(element: Element): readonly string[] | undefined {
  const value = element.getAttribute('presets');
  return value === null
    ? undefined
    : value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
}

/** Stop the inner inputs' native change events: the element fires its own. */
export function swallowInnerChange(host: HTMLElement): void {
  host.addEventListener(
    'change',
    (event) => {
      if (event.target !== host) {
        event.stopPropagation();
      }
    },
    true,
  );
}

export function isoOf(date: CalendarDate | null): string {
  return date ? toIsoDate(date) : '';
}
