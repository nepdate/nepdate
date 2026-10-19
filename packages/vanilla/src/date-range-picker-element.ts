import type { RangePreset } from '@nepdate/datepicker';
import { DateRangePickerView, type DateRangePickerViewOptions } from './range-view';
import {
  Base,
  str,
  bool,
  calendarAttr,
  int,
  panelLayout,
  theme,
  presetIds,
  swallowInnerChange,
  type RichProps,
} from './element-utils';

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
    'panel-layout',
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
      panelLayout: panelLayout(this),
      startLabel: str(this, 'start-label'),
      endLabel: str(this, 'end-label'),
      fiscalYearView: bool(this, 'fiscal-years'),
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
