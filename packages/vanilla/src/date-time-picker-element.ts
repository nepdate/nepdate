import type { SinglePreset } from '@nepdate/datepicker';
import { DateTimePickerView, type DateTimePickerViewOptions } from './datetime-view';
import {
  Base,
  str,
  bool,
  calendarAttr,
  int,
  onUnlessFalse,
  panelLayout,
  theme,
  presetIds,
  swallowInnerChange,
  type RichProps,
} from './element-utils';

/**
 * <nep-date-time-picker name="starts-at" minute-step="15"></nep-date-time-picker>
 *
 * A form-associated BS/AD date + time field. The form receives one instant as
 * an ISO timestamp with the zone's offset ("2026-10-18T14:30:00+05:45").
 * Fires `change` with { value, ad, bs, time }.
 */
export class NepDateTimePickerElement extends Base {
  static readonly formAssociated = true;
  static readonly observedAttributes: readonly string[] = [
    'value',
    'min',
    'max',
    'calendar',
    'default-calendar',
    'locale',
    'name',
    'required',
    'disabled',
    'theme',
    'panel-layout',
    'mask',
    'time-zone',
    'hour12',
    'minute-step',
    'default-time',
    'label',
    'time-label',
    'presets',
  ];

  view: DateTimePickerView | null = null;
  private readonly internals: ElementInternals | null;
  private rich: RichProps = {};
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.internals =
      typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    swallowInnerChange(this);
  }

  get value(): string {
    return this.view?.getState().value ?? '';
  }
  set value(next: string) {
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

  connectedCallback(): void {
    if (this.view) {
      return;
    }
    const view = new DateTimePickerView(this, {
      ...this.readOptions(),
      defaultValue: str(this, 'value'),
      onChange: (value, detail) => {
        this.dispatchEvent(
          new CustomEvent('change', {
            bubbles: true,
            detail: {
              value,
              ad: detail?.ad ?? null,
              bs: detail?.bs ?? null,
              time: detail?.time ?? null,
            },
          }),
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

  override focus(options?: FocusOptions): void {
    this.view?.dateInput.focus(options);
  }

  private readOptions(): DateTimePickerViewOptions {
    return {
      ...this.rich,
      min: str(this, 'min'),
      max: str(this, 'max'),
      calendar: calendarAttr(this, 'calendar'),
      defaultCalendar: calendarAttr(this, 'default-calendar'),
      locale: str(this, 'locale'),
      name: str(this, 'name'),
      hiddenInput: this.internals === null,
      required: bool(this, 'required'),
      disabled: bool(this, 'disabled'),
      theme: theme(this),
      panelLayout: panelLayout(this),
      mask: onUnlessFalse(this, 'mask'),
      timeZone: str(this, 'time-zone'),
      hour12: bool(this, 'hour12'),
      minuteStep: int(this, 'minute-step'),
      defaultTime: str(this, 'default-time'),
      ariaLabel: str(this, 'label'),
      timeLabel: str(this, 'time-label'),
      presets: presetIds(this) as readonly SinglePreset[] | undefined,
    };
  }

  private syncForm(): void {
    const view = this.view;
    if (!view || !this.internals) {
      return;
    }
    const state = view.getState();
    this.internals.setFormValue(state.value === '' ? null : state.value);
    if (state.error) {
      this.internals.setValidity(
        { customError: true },
        state.error.message,
        state.error.field === 'time' ? view.timeInput : view.dateInput,
      );
    } else if (bool(this, 'required') && state.value === '') {
      this.internals.setValidity(
        { valueMissing: true },
        'Please choose a date and time.',
        view.dateInput,
      );
    } else {
      this.internals.setValidity({});
    }
  }
}
