import {
  fromIsoDate,
  toIsoDate,
  type CalendarDate,
  type CalendarSystem,
  type Weekday,
} from '@nepdate/core';
import {
  createCalendar as createCalendarStore,
  type CalendarOptions,
  type CalendarStore,
  type DateRange,
  type EventMarker,
  type HolidayInput,
  type HolidayLookup,
} from '@nepdate/calendar';
import type { RangePreset, SinglePreset } from '@nepdate/datepicker';
import { CalendarView } from './calendar-view';
import { DatePickerView, type DatePickerViewOptions, type Theme } from './picker-view';
import { DateRangePickerView, type DateRangePickerViewOptions } from './range-view';

/** Lets this module load during server rendering, where HTMLElement does not exist. */
const Base: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (Object as unknown as typeof HTMLElement)
    : HTMLElement;

/** Options that cannot be attributes: functions and lists. Set them as properties. */
interface RichProps {
  holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  events?: ((date: CalendarDate) => readonly EventMarker[]) | undefined;
  isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
}

function str(element: Element, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}
function bool(element: Element, name: string): boolean {
  return element.hasAttribute(name);
}
/** An attribute that is on unless set to "false". */
function onUnlessFalse(element: Element, name: string): boolean | undefined {
  const value = element.getAttribute(name);
  return value === null ? undefined : value !== 'false';
}
function calendarAttr(element: Element, name: string): CalendarSystem | undefined {
  const value = element.getAttribute(name)?.toUpperCase();
  return value === 'BS' || value === 'AD' ? value : undefined;
}
function weekday(element: Element, name: string): Weekday | undefined {
  const value = Number(element.getAttribute(name) ?? NaN);
  return Number.isInteger(value) && value >= 0 && value <= 6
    ? (value as Weekday)
    : undefined;
}
function int(element: Element, name: string): number | undefined {
  const value = Number(element.getAttribute(name) ?? NaN);
  return Number.isInteger(value) ? value : undefined;
}
function theme(element: Element): Theme | undefined {
  const value = element.getAttribute('theme');
  return value === 'light' || value === 'dark' || value === 'auto' ? value : undefined;
}

/** presets="today, last7Days" → ['today', 'last7Days']; unknown ids show as disabled. */
function presetIds(element: Element): readonly string[] | undefined {
  const value = element.getAttribute('presets');
  return value === null
    ? undefined
    : value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
}

/** Stop the inner inputs' native change events: the element fires its own. */
function swallowInnerChange(host: HTMLElement): void {
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

/**
 * <nep-date-picker name="dob" min="2020-01-01"></nep-date-picker>
 *
 * A form-associated BS/AD date field: the form receives the AD "YYYY-MM-DD"
 * value under `name`. Fires `change` with { value, ad, bs }, plus `nep-open`,
 * `nep-close` and `nep-calendar-change`.
 */
export class NepDatePickerElement extends Base {
  static readonly formAssociated = true;
  static readonly observedAttributes: readonly string[] = [
    'value',
    'min',
    'max',
    'calendar',
    'default-calendar',
    'locale',
    'name',
    'placeholder',
    'required',
    'disabled',
    'clearable',
    'show-equivalent',
    'theme',
    'persist-calendar',
    'week-starts-on',
    'display-format',
    'label',
    'close-on-select',
    'input-id',
  ];

  /** The view, once connected. */
  view: DatePickerView | null = null;
  private readonly internals: ElementInternals | null;
  private rich: RichProps = {};
  private customPresets: readonly SinglePreset[] | undefined;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.internals =
      typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    swallowInnerChange(this);
  }

  get value(): string {
    return this.view?.getState().value ?? isoOf(fromIsoDate(this.getAttribute('value')));
  }
  set value(next: string) {
    this.view?.store.actions.setValue(next);
  }
  get holidays(): RichProps['holidays'] {
    return this.rich.holidays;
  }
  set holidays(next: RichProps['holidays']) {
    this.setRich({ holidays: next });
  }
  get events(): RichProps['events'] {
    return this.rich.events;
  }
  set events(next: RichProps['events']) {
    this.setRich({ events: next });
  }
  get isDateDisabled(): RichProps['isDateDisabled'] {
    return this.rich.isDateDisabled;
  }
  set isDateDisabled(next: RichProps['isDateDisabled']) {
    this.setRich({ isDateDisabled: next });
  }
  /** Shortcuts, including custom { id, label, resolve } ones. Overrides the presets attribute. */
  get presets(): readonly SinglePreset[] | undefined {
    return this.customPresets ?? (presetIds(this) as readonly SinglePreset[] | undefined);
  }
  set presets(next: readonly SinglePreset[] | undefined) {
    this.customPresets = next;
    this.view?.setOptions({ presets: this.presets });
  }
  get form(): HTMLFormElement | null {
    return this.internals?.form ?? null;
  }
  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }
  get validationMessage(): string {
    return this.internals?.validationMessage ?? '';
  }
  checkValidity(): boolean {
    return this.internals?.checkValidity() ?? true;
  }
  reportValidity(): boolean {
    return this.internals?.reportValidity() ?? true;
  }

  connectedCallback(): void {
    if (this.view) {
      return;
    }
    const view = new DatePickerView(this, {
      ...this.readOptions(),
      defaultValue: str(this, 'value'),
      onChange: (value, detail) => {
        this.dispatchEvent(
          new CustomEvent('change', {
            bubbles: true,
            detail: { value, ad: detail?.ad ?? null, bs: detail?.bs ?? null },
          }),
        );
      },
      onCalendarChange: (calendar) => {
        this.dispatchEvent(
          new CustomEvent('nep-calendar-change', { bubbles: true, detail: { calendar } }),
        );
      },
      onOpenChange: (open) => {
        this.dispatchEvent(
          new CustomEvent(open ? 'nep-open' : 'nep-close', { bubbles: true }),
        );
      },
    });
    this.view = view;
    this.unsubscribe = view.store.subscribe(() => {
      this.syncForm();
    });
    this.syncForm();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.view?.destroy();
    this.view = null;
  }

  attributeChangedCallback(
    name: string,
    previous: string | null,
    next: string | null,
  ): void {
    if (!this.view || previous === next) {
      return;
    }
    if (name === 'value') {
      this.view.store.actions.setValue(next ?? '');
    }
    this.view.setOptions(this.readOptions());
    this.syncForm();
  }

  formResetCallback(): void {
    this.view?.store.actions.reset();
  }

  formDisabledCallback(disabled: boolean): void {
    this.view?.setOptions({ disabled: disabled || bool(this, 'disabled') });
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.view?.store.actions.setValue(state);
    }
  }

  override focus(options?: FocusOptions): void {
    this.view?.input.focus(options);
  }

  open(): void {
    this.view?.open();
  }

  close(): void {
    this.view?.close();
  }

  private setRich(changes: RichProps): void {
    this.rich = { ...this.rich, ...changes };
    this.view?.setOptions(changes);
  }

  private readOptions(): DatePickerViewOptions {
    return {
      ...this.rich,
      min: str(this, 'min'),
      max: str(this, 'max'),
      calendar: calendarAttr(this, 'calendar'),
      defaultCalendar: calendarAttr(this, 'default-calendar'),
      locale: str(this, 'locale'),
      name: str(this, 'name'),
      hiddenInput: this.internals === null,
      placeholder: str(this, 'placeholder'),
      required: bool(this, 'required'),
      disabled: bool(this, 'disabled'),
      clearable: onUnlessFalse(this, 'clearable'),
      showEquivalent: onUnlessFalse(this, 'show-equivalent'),
      closeOnSelect: onUnlessFalse(this, 'close-on-select'),
      theme: theme(this),
      persistCalendar: str(this, 'persist-calendar'),
      weekStartsOn: weekday(this, 'week-starts-on'),
      displayFormat: str(this, 'display-format'),
      ariaLabel: str(this, 'label'),
      id: str(this, 'input-id'),
      presets: this.presets,
    };
  }

  private syncForm(): void {
    const view = this.view;
    if (!view || !this.internals) {
      return;
    }
    const state = view.getState();
    this.internals.setFormValue(state.value === '' ? null : state.value, state.value);
    if (state.error) {
      this.internals.setValidity({ customError: true }, state.error.message, view.input);
    } else if (bool(this, 'required') && state.value === '') {
      this.internals.setValidity(
        { valueMissing: true },
        view.input.validationMessage || 'Please choose a date.',
        view.input,
      );
    } else {
      this.internals.setValidity({});
    }
  }
}

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

/**
 * <nep-date-range-picker name="leave" min-days="1"></nep-date-range-picker>
 *
 * Two BS/AD fields sharing one panel. The form receives `${name}-start` and
 * `${name}-end` (or `start-name` / `end-name`). Fires `change` with { value }.
 */
export class NepDateRangePickerElement extends Base {
  static readonly formAssociated = true;
  static readonly observedAttributes: readonly string[] = [
    'start',
    'end',
    'name',
    'start-name',
    'end-name',
    'min',
    'max',
    'calendar',
    'default-calendar',
    'locale',
    'min-days',
    'max-days',
    'disabled',
    'required',
    'theme',
    'start-label',
    'end-label',
  ];

  view: DateRangePickerView | null = null;
  private readonly internals: ElementInternals | null;
  private rich: RichProps = {};
  private customPresets: readonly RangePreset[] | undefined;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.internals =
      typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    swallowInnerChange(this);
  }

  get value(): { start: string; end: string } {
    return this.view?.getState().value ?? { start: '', end: '' };
  }
  set value(next: { start: string; end: string }) {
    this.view?.store.actions.setValue(next);
  }
  set holidays(next: RichProps['holidays']) {
    this.rich = { ...this.rich, holidays: next };
    this.view?.setOptions({ holidays: next });
  }
  set isDateDisabled(next: RichProps['isDateDisabled']) {
    this.rich = { ...this.rich, isDateDisabled: next };
    this.view?.setOptions({ isDateDisabled: next });
  }
  /** Shortcuts, including custom { id, label, resolve } ones. Overrides the presets attribute. */
  get presets(): readonly RangePreset[] | undefined {
    return this.customPresets ?? (presetIds(this) as readonly RangePreset[] | undefined);
  }
  set presets(next: readonly RangePreset[] | undefined) {
    this.customPresets = next;
    this.view?.setOptions({ presets: this.presets });
  }

  connectedCallback(): void {
    if (this.view) {
      return;
    }
    const view = new DateRangePickerView(this, {
      ...this.readOptions(),
      defaultValue: { start: str(this, 'start') ?? '', end: str(this, 'end') ?? '' },
      onChange: (value) => {
        this.dispatchEvent(
          new CustomEvent('change', { bubbles: true, detail: { value } }),
        );
      },
      onOpenChange: (open) => {
        this.dispatchEvent(
          new CustomEvent(open ? 'nep-open' : 'nep-close', { bubbles: true }),
        );
      },
    });
    this.view = view;
    this.unsubscribe = view.store.subscribe(() => {
      this.syncForm();
    });
    this.syncForm();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.view?.destroy();
    this.view = null;
  }

  attributeChangedCallback(): void {
    this.view?.setOptions(this.readOptions());
    this.syncForm();
  }

  formResetCallback(): void {
    this.view?.store.actions.reset();
  }

  formDisabledCallback(disabled: boolean): void {
    this.view?.setOptions({ disabled: disabled || bool(this, 'disabled') });
  }

  private names(): { start: string | undefined; end: string | undefined } {
    const name = str(this, 'name');

    return {
      start: str(this, 'start-name') ?? (name ? `${name}-start` : undefined),
      end: str(this, 'end-name') ?? (name ? `${name}-end` : undefined),
    };
  }

  private readOptions(): DateRangePickerViewOptions {
    const names = this.names();

    return {
      ...this.rich,
      startName: names.start,
      endName: names.end,
      hiddenInput: this.internals === null,
      min: str(this, 'min'),
      max: str(this, 'max'),
      calendar: calendarAttr(this, 'calendar'),
      defaultCalendar: calendarAttr(this, 'default-calendar'),
      locale: str(this, 'locale'),
      minDays: int(this, 'min-days'),
      maxDays: int(this, 'max-days'),
      disabled: bool(this, 'disabled'),
      required: bool(this, 'required'),
      theme: theme(this),
      startLabel: str(this, 'start-label'),
      endLabel: str(this, 'end-label'),
      presets: this.presets,
    };
  }

  private syncForm(): void {
    const view = this.view;
    if (!view || !this.internals) {
      return;
    }
    const state = view.getState();
    const names = this.names();
    const data = new FormData();
    if (names.start && state.value.start) {
      data.append(names.start, state.value.start);
    }
    if (names.end && state.value.end) {
      data.append(names.end, state.value.end);
    }
    this.internals.setFormValue(data);
    if (state.error) {
      this.internals.setValidity(
        { customError: true },
        state.error.message,
        view.inputs.start,
      );
    } else if (
      bool(this, 'required') &&
      (state.value.start === '' || state.value.end === '')
    ) {
      this.internals.setValidity(
        { valueMissing: true },
        'Please choose a start and end date.',
        view.inputs.start,
      );
    } else {
      this.internals.setValidity({});
    }
  }
}

function isoOf(date: CalendarDate | null): string {
  return date ? toIsoDate(date) : '';
}
