/** `@nepdate/vanilla/calendar`: just the standalone calendar. */
import {
  createCalendar as createCalendarStore,
  type CalendarOptions,
  type CalendarStore,
} from '@nepdate/calendar';
import { NepCalendarElement } from './calendar-element';
import { CalendarView } from './calendar-view';
import { defineElement, ELEMENT_NAMES } from './registry';

export { NepCalendarElement };
export { CalendarView, type CalendarViewOptions } from './calendar-view';

/** Register <nep-calendar> (skipped if already defined). */
export function defineCalendar(registry?: CustomElementRegistry): void {
  defineElement(ELEMENT_NAMES.calendar, NepCalendarElement, registry);
}

export interface CalendarHandle {
  readonly store: CalendarStore;
  readonly view: CalendarView;
  setOptions(changes: Partial<CalendarOptions>): void;
  destroy(): void;
}

/** Mount a standalone calendar into a container. */
export function createCalendar(
  container: HTMLElement,
  options: CalendarOptions = {},
): CalendarHandle {
  const store = createCalendarStore(options);
  const view = new CalendarView(container, store, { locale: () => options.locale });

  return {
    store,
    view,
    setOptions: (changes) => {
      store.setOptions(changes);
    },
    destroy: () => {
      view.destroy();
      store.destroy();
    },
  };
}
