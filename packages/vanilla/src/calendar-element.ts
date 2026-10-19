import { fromIsoDate } from '@nepdate/core';
import {
  createCalendar as createCalendarStore,
  type CalendarOptions,
  type CalendarStore,
  type DateRange,
} from '@nepdate/calendar';
import { CalendarView } from './calendar-view';
import {
  Base,
  str,
  bool,
  onUnlessFalse,
  calendarAttr,
  weekday,
  theme,
  isoOf,
  type RichProps,
} from './element-utils';

/**
 * <nep-calendar value="2026-10-18"></nep-calendar>
 *
 * A standalone month view. Fires `nep-select` with { date, value } (single) or
 * { range: { start, end } } (with the `range` attribute).
 */
export class NepCalendarElement extends Base {
  static readonly observedAttributes: readonly string[] = [
    'value',
    'calendar',
    'locale',
    'min',
    'max',
    'week-starts-on',
    'show-other-calendar',
    'show-outside-days',
    'range',
    'theme',
  ];

  store: CalendarStore | null = null;
  private view: CalendarView | null = null;
  private rich: RichProps = {};

  get holidays(): RichProps['holidays'] {
    return this.rich.holidays;
  }
  set holidays(next: RichProps['holidays']) {
    this.rich = { ...this.rich, holidays: next };
    this.store?.setOptions({ holidays: next });
  }
  get events(): RichProps['events'] {
    return this.rich.events;
  }
  set events(next: RichProps['events']) {
    this.rich = { ...this.rich, events: next };
    this.store?.setOptions({ events: next });
  }
  get isDateDisabled(): RichProps['isDateDisabled'] {
    return this.rich.isDateDisabled;
  }
  set isDateDisabled(next: RichProps['isDateDisabled']) {
    this.rich = { ...this.rich, isDateDisabled: next };
    this.store?.setOptions({ isDateDisabled: next });
  }

  connectedCallback(): void {
    if (this.store) {
      return;
    }
    const store = createCalendarStore({
      ...this.readOptions(),
      onSelect: (selection) => {
        const detail =
          'calendar' in selection
            ? { date: selection, value: isoOf(selection) }
            : {
                range: {
                  start: isoOf(selection.start),
                  end: isoOf(selection.end),
                } satisfies Record<keyof DateRange, string>,
              };
        this.dispatchEvent(new CustomEvent('nep-select', { bubbles: true, detail }));
      },
    });
    this.store = store;
    this.view = new CalendarView(this, store, { locale: () => str(this, 'locale') });
    this.applyTheme();
  }

  disconnectedCallback(): void {
    this.view?.destroy();
    this.view = null;
    this.store = null;
  }

  attributeChangedCallback(): void {
    this.store?.setOptions(this.readOptions());
    this.applyTheme();
  }

  private applyTheme(): void {
    const value = theme(this);
    if (this.view) {
      if (value) {
        this.view.element.dataset['ndpTheme'] = value;
      } else {
        delete this.view.element.dataset['ndpTheme'];
      }
    }
  }

  private readOptions(): CalendarOptions {
    return {
      ...this.rich,
      selected: fromIsoDate(this.getAttribute('value')),
      calendar: calendarAttr(this, 'calendar'),
      locale: str(this, 'locale'),
      min: fromIsoDate(this.getAttribute('min')),
      max: fromIsoDate(this.getAttribute('max')),
      weekStartsOn: weekday(this, 'week-starts-on'),
      showOtherCalendar: onUnlessFalse(this, 'show-other-calendar'),
      showOutsideDays: onUnlessFalse(this, 'show-outside-days'),
      selectionMode: bool(this, 'range') ? 'range' : 'single',
    };
  }
}
