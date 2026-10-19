import { getLocale } from '@nepdate/core';
import {
  createMultiDatePicker,
  type MultiDatePickerOptions,
  type MultiDatePickerState,
  type MultiDatePickerStore,
} from '@nepdate/datepicker';
import {
  onBackdropPointer,
  onEscape,
  onOutsidePointer,
  restoreFocus,
  trackPosition,
  type PanelLayout,
} from '@nepdate/dom';
import { CalendarView } from './calendar-view';
import { el, icon, setAttrs, setPopupMode, setText, uid } from './dom';
import type { Theme } from './picker-view';
import { PANEL_WIDTH } from './preset-list';

/** Everything the multiple-date picker DOM needs on top of the store's options. */
export interface MultiDatePickerViewOptions extends MultiDatePickerOptions {
  /** Submit each day under this name (one hidden input per day). */
  readonly name?: string | undefined;
  /** Render hidden inputs for `name`. Off for the form-associated custom element. */
  readonly hiddenInput?: boolean | undefined;
  readonly id?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  /** Show the × button. Default true. */
  readonly clearable?: boolean | undefined;
  /** 'sheet' opens a bottom sheet; 'popover' sits beside the field; 'auto' (default) uses the sheet below 480px. */
  readonly panelLayout?: PanelLayout | undefined;
  readonly theme?: Theme | undefined;
  readonly ariaLabel?: string | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

const VIEW_KEYS = new Set([
  'name',
  'hiddenInput',
  'id',
  'placeholder',
  'required',
  'disabled',
  'clearable',
  'panelLayout',
  'theme',
  'ariaLabel',
  'onOpenChange',
  'onChange',
]);

/**
 * The multiple-date picker field and panel (PICK-001), rendered with the
 * @nepdate/styles markup into `host`. Used by <nep-multi-date-picker> and by
 * createMultiDatePicker().
 */
export class MultiDatePickerView {
  readonly store: MultiDatePickerStore;
  readonly input: HTMLInputElement;
  private options: MultiDatePickerViewOptions;
  private readonly field: HTMLDivElement;
  private readonly box: HTMLDivElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly hint: HTMLParagraphElement;
  private readonly panel: HTMLDivElement;
  private readonly segment: HTMLDivElement;
  private readonly doneButton: HTMLButtonElement;
  private readonly hiddenInputs: HTMLSpanElement;
  private readonly calendarView: CalendarView;
  private readonly unsubscribe: () => void;
  private closePanel: (() => void) | null = null;
  private wasOpen = false;

  constructor(host: HTMLElement, options: MultiDatePickerViewOptions = {}) {
    this.options = { ...options };
    this.store = createMultiDatePicker({
      ...storeOptions(options),
      onChange: (value, dates) => {
        this.options.onChange?.(value, dates);
      },
    });

    const inputId = options.id ?? uid('ndp-multi');
    const panelId = `${inputId}-panel`;
    this.input = el('input', {
      class: 'ndp-input__control',
      id: inputId,
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-controls': panelId,
    });
    this.clearButton = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'clear' },
      [icon('close')],
    );
    this.toggleButton = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'toggle' },
      [icon('calendar')],
    );
    this.box = el('div', { class: 'ndp-input' }, [
      this.input,
      el('span', { class: 'ndp-input__actions' }, [this.clearButton, this.toggleButton]),
    ]);
    this.hint = el('p', {
      class: 'ndp-hint',
      id: `${inputId}-hint`,
      'aria-live': 'polite',
      'data-error': true,
      hidden: true,
    });
    this.hiddenInputs = el('span', { hidden: true });
    this.segment = el('div', { class: 'ndp-segment', role: 'group' }, [
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'BS' }),
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'AD' }),
    ]);
    this.doneButton = el('button', {
      type: 'button',
      class: 'ndp-button',
      'data-action': 'done',
    });
    const calendarRoot = el('div', { class: 'ndp-panel__calendar' });
    this.panel = el('div', { class: 'ndp-panel', id: panelId, hidden: true }, [
      calendarRoot,
      el('div', { class: 'ndp-panel__footer' }, [this.segment, this.doneButton]),
    ]);
    this.field = el('div', { class: 'ndp-field' }, [
      this.box,
      this.hint,
      this.hiddenInputs,
      this.panel,
    ]);
    host.append(this.field);

    this.calendarView = new CalendarView(calendarRoot, this.store.calendar, {
      locale: () => this.options.locale,
      onDayActivate: (date) => {
        if (this.store.actions.select(date) && !this.store.getState().open) {
          restoreFocus(this.input);
        }
      },
    });

    this.input.addEventListener('input', () => {
      this.store.actions.type(this.input.value);
    });
    this.input.addEventListener('blur', () => {
      this.store.actions.blur();
    });
    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && (event.altKey || this.input.value === '')) {
        event.preventDefault();
        this.open();
      }
    });
    this.field.addEventListener('click', this.onClick);

    this.unsubscribe = this.store.subscribe(() => {
      this.render();
    });
    this.render();
  }

  getState(): MultiDatePickerState {
    return this.store.getState();
  }

  /** Change view or store options. Unknown keys are ignored. */
  setOptions(changes: Partial<MultiDatePickerViewOptions>): void {
    this.options = { ...this.options, ...changes };
    const forStore = storeOptions(changes);
    if (Object.keys(forStore).length > 0) {
      this.store.setOptions(forStore);
    } else {
      this.render();
    }
  }

  open(): void {
    if (!this.options.disabled) {
      this.store.actions.open();
    }
  }

  close(): void {
    this.store.actions.close();
  }

  destroy(): void {
    this.closePanel?.();
    this.unsubscribe();
    this.calendarView.destroy();
    this.field.remove();
  }

  private render(): void {
    const state = this.store.getState();
    const locale = getLocale(this.options.locale);
    const disabled = this.options.disabled ?? false;

    if (this.input.value !== state.text) {
      this.input.value = state.text;
    }
    this.input.setCustomValidity(state.error?.message ?? '');
    setAttrs(this.input, {
      placeholder: this.options.placeholder ?? state.placeholder,
      disabled,
      required: this.options.required ?? false,
      'aria-label': this.options.ariaLabel ?? null,
      'aria-invalid': state.error ? 'true' : null,
      'aria-describedby': state.error ? this.hint.id : null,
    });
    setAttrs(this.box, {
      'data-invalid': state.error !== null,
      'data-disabled': disabled,
    });
    setAttrs(this.field, { 'data-ndp-theme': this.options.theme ?? null });
    setAttrs(this.panel, {
      'data-ndp-theme': this.options.theme ?? null,
      'aria-label': this.options.ariaLabel
        ? `${this.options.ariaLabel}: ${locale.labels.calendar}`
        : locale.labels.chooseDate,
    });
    this.clearButton.hidden =
      !(this.options.clearable ?? true) || state.text === '' || disabled;
    setAttrs(this.clearButton, { 'aria-label': locale.labels.clear });
    setAttrs(this.toggleButton, { disabled, 'aria-label': locale.labels.openCalendar });
    this.hint.hidden = state.error === null;
    setText(this.hint, state.error?.message ?? '');

    this.segment.hidden = !state.canSwitchCalendar;
    setAttrs(this.segment, { 'aria-label': locale.labels.calendar });
    for (const button of this.segment.querySelectorAll<HTMLButtonElement>('button')) {
      const calendar = button.dataset['calendar'] === 'AD' ? 'AD' : 'BS';
      setText(button, locale.calendarNames[calendar]);
      setAttrs(button, { 'aria-pressed': String(calendar === state.calendar) });
    }
    setText(this.doneButton, locale.labels.done);
    this.doneButton.hidden = state.inline;

    const name = this.options.hiddenInput === false ? undefined : this.options.name;
    this.hiddenInputs.replaceChildren(
      ...(name === undefined
        ? []
        : state.value.map((value) =>
            el('input', { type: 'hidden', name, value, disabled }),
          )),
    );

    setPopupMode(state, [this.input], this.toggleButton, this.panel);
    this.syncPanel(state.open && !state.inline);
    this.panel.hidden = !state.inline && !this.wasOpen;
    this.panel.style.setProperty(
      '--ndp-panel-width',
      state.inline ? `${String(PANEL_WIDTH)}px` : null,
    );
  }

  private syncPanel(open: boolean): void {
    if (open === this.wasOpen) {
      return;
    }
    this.wasOpen = open;
    this.options.onOpenChange?.(open);
    if (open) {
      this.panel.hidden = false;
      const stopTracking = trackPosition(this.box, this.panel, {
        width: PANEL_WIDTH,
        layout: this.options.panelLayout,
      });
      const close = (): void => {
        this.store.actions.close();
      };
      const stopOutside = onOutsidePointer([this.field, this.panel], close);
      const stopBackdrop = onBackdropPointer(this.panel, close);
      const stopEscape = onEscape(() => {
        close();
        restoreFocus(this.input);
      });
      this.closePanel = () => {
        stopTracking();
        stopOutside();
        stopBackdrop();
        stopEscape();
        this.panel.hidden = true;
      };
      this.calendarView.focusGrid();
    } else {
      this.closePanel?.();
      this.closePanel = null;
    }
  }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || this.calendarView.element.contains(target)) {
      return;
    }
    const calendar = target.closest<HTMLElement>('[data-calendar]')?.dataset['calendar'];
    if (calendar === 'BS' || calendar === 'AD') {
      this.store.actions.switchCalendar(calendar);
      return;
    }
    switch (target.closest<HTMLElement>('[data-action]')?.dataset['action']) {
      case 'clear':
        this.store.actions.clear();
        this.input.focus();
        break;
      case 'toggle':
        if (this.store.getState().open) {
          this.close();
        } else {
          this.open();
        }
        break;
      case 'done':
        this.close();
        restoreFocus(this.input);
        break;
      default:
        break;
    }
  };
}

/** Only the keys the picker store understands, minus the view's own callbacks. */
function storeOptions(
  options: Partial<MultiDatePickerViewOptions>,
): Partial<MultiDatePickerOptions> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!VIEW_KEYS.has(key)) {
      out[key] = value;
    }
  }

  return out;
}
