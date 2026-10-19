import { fromIsoDate } from '@nepdate/core';
import type { SinglePreset } from '@nepdate/datepicker';
import { DatePickerView, type DatePickerViewOptions } from './picker-view';
import {
  Base,
  str,
  bool,
  onUnlessFalse,
  calendarAttr,
  weekday,
  panelLayout,
  theme,
  presetIds,
  swallowInnerChange,
  isoOf,
  type RichProps,
} from './element-utils';

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
    'panel-layout',
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
      panelLayout: panelLayout(this),
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
