import { MultiDatePickerView, type MultiDatePickerViewOptions } from './multi-view';
import {
  Base,
  bool,
  calendarAttr,
  int,
  onUnlessFalse,
  panelLayout,
  str,
  swallowInnerChange,
  theme,
  type RichProps,
} from './element-utils';

/**
 * <nep-multi-date-picker name="holidays" value="2026-10-18,2026-10-20"></nep-multi-date-picker>
 *
 * A form-associated field for several separate BS/AD days (PICK-001). The form
 * receives one entry per day under `name`, each an AD "YYYY-MM-DD". Fires
 * `change` with { value: string[], dates: { ad, bs }[] }.
 */
export class NepMultiDatePickerElement extends Base {
  static readonly formAssociated = true;
  static readonly observedAttributes: readonly string[] = [
    'value',
    'min',
    'max',
    'max-dates',
    'calendar',
    'default-calendar',
    'locale',
    'name',
    'required',
    'disabled',
    'clearable',
    'close-on-select',
    'theme',
    'panel-layout',
    'mask',
    'inline',
    'label',
  ];

  view: MultiDatePickerView | null = null;
  private readonly internals: ElementInternals | null;
  private rich: RichProps = {};
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.internals =
      typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    swallowInnerChange(this);
  }

  get value(): readonly string[] {
    return this.view?.getState().value ?? [];
  }
  set value(next: readonly string[]) {
    this.view?.store.actions.setValue(next);
  }
  set holidays(next: RichProps['holidays']) {
    this.rich = { ...this.rich, holidays: next };
    this.view?.setOptions({ holidays: next });
  }
  set events(next: RichProps['events']) {
    this.rich = { ...this.rich, events: next };
    this.view?.setOptions({ events: next });
  }
  set isDateDisabled(next: RichProps['isDateDisabled']) {
    this.rich = { ...this.rich, isDateDisabled: next };
    this.view?.setOptions({ isDateDisabled: next });
  }

  connectedCallback(): void {
    if (this.view) {
      return;
    }
    const view = new MultiDatePickerView(this, {
      ...this.readOptions(),
      defaultValue: list(str(this, 'value')),
      onChange: (value, dates) => {
        this.dispatchEvent(
          new CustomEvent('change', { bubbles: true, detail: { value, dates } }),
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
      this.view.store.actions.setValue(list(next ?? ''));
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

  override focus(options?: FocusOptions): void {
    this.view?.input.focus(options);
  }

  private readOptions(): MultiDatePickerViewOptions {
    return {
      ...this.rich,
      min: str(this, 'min'),
      max: str(this, 'max'),
      maxDates: int(this, 'max-dates'),
      calendar: calendarAttr(this, 'calendar'),
      defaultCalendar: calendarAttr(this, 'default-calendar'),
      locale: str(this, 'locale'),
      name: str(this, 'name'),
      hiddenInput: this.internals === null,
      required: bool(this, 'required'),
      disabled: bool(this, 'disabled'),
      clearable: onUnlessFalse(this, 'clearable'),
      closeOnSelect: bool(this, 'close-on-select'),
      theme: theme(this),
      panelLayout: panelLayout(this),
      mask: onUnlessFalse(this, 'mask'),
      inline: bool(this, 'inline'),
      ariaLabel: str(this, 'label'),
    };
  }

  private syncForm(): void {
    const view = this.view;
    if (!view || !this.internals) {
      return;
    }
    const state = view.getState();
    const name = str(this, 'name');
    const data = new FormData();
    if (name !== undefined) {
      for (const day of state.value) {
        data.append(name, day);
      }
    }
    this.internals.setFormValue(state.value.length === 0 ? null : data);
    if (state.error) {
      this.internals.setValidity({ customError: true }, state.error.message, view.input);
    } else if (bool(this, 'required') && state.value.length === 0) {
      this.internals.setValidity(
        { valueMissing: true },
        'Please choose at least one date.',
        view.input,
      );
    } else {
      this.internals.setValidity({});
    }
  }
}

/** "2026-10-18, 2026-10-20" → ['2026-10-18', '2026-10-20'] */
function list(value: string | undefined): readonly string[] {
  return (value ?? '').split(/[\s,]+/).filter((day) => day !== '');
}
