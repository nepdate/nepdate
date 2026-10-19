import { getLocale, type CalendarSystem } from '@nepdate/core';
import {
  createDatePicker,
  type DateDetail,
  type DatePickerOptions,
  type DatePickerState,
  type DatePickerStore,
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
import { el, icon, setAttrs, setText, uid } from './dom';
import { PANEL_WIDTH, PANEL_WIDTH_WITH_PRESETS, PresetList } from './preset-list';

export type Theme = 'light' | 'dark' | 'auto';

/** Everything the date picker DOM needs on top of the store's options. */
export interface DatePickerViewOptions extends DatePickerOptions {
  /** Submit the AD value with a plain form under this name (hidden input). */
  readonly name?: string | undefined;
  /** Render a hidden input for `name`. Off for the form-associated custom element. */
  readonly hiddenInput?: boolean | undefined;
  readonly id?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  /** Show the × button. Default true. */
  readonly clearable?: boolean | undefined;
  /** Show the same day in the other calendar under the field. Default true. */
  readonly showEquivalent?: boolean | undefined;
  /** 'sheet' opens a bottom sheet; 'popover' sits beside the field; 'auto' (default) uses the sheet below 480px. */
  readonly panelLayout?: PanelLayout | undefined;
  readonly theme?: Theme | undefined;
  /** Remember the viewer's BS/AD choice in localStorage under this key. */
  readonly persistCalendar?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** Called on every keystroke with the current text. */
  readonly onInput?: ((text: string) => void) | undefined;
}

const VIEW_KEYS = new Set([
  'name',
  'hiddenInput',
  'id',
  'placeholder',
  'required',
  'disabled',
  'clearable',
  'showEquivalent',
  'theme',
  'panelLayout',
  'persistCalendar',
  'ariaLabel',
  'onOpenChange',
  'onInput',
]);

/**
 * The date picker field and panel, rendered with the @nepdate/styles markup
 * into `host`. Used by <nep-date-picker> and by createDatePicker().
 */
export class DatePickerView {
  readonly store: DatePickerStore;
  readonly input: HTMLInputElement;
  private options: DatePickerViewOptions;
  private readonly field: HTMLDivElement;
  private readonly box: HTMLDivElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly switchButton: HTMLButtonElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly hint: HTMLParagraphElement;
  private readonly panel: HTMLDivElement;
  private readonly segment: HTMLDivElement;
  private readonly todayButton: HTMLButtonElement;
  private readonly hidden: HTMLInputElement;
  private readonly calendarView: CalendarView;
  private readonly presetList: PresetList;
  private readonly unsubscribe: () => void;
  private closePanel: (() => void) | null = null;
  private wasOpen = false;

  constructor(host: HTMLElement, options: DatePickerViewOptions = {}) {
    this.options = { ...options };
    this.store = createDatePicker({
      ...storeOptions(options),
      onChange: (value, detail) => {
        this.options.onChange?.(value, detail);
      },
      onCalendarChange: (calendar) => {
        this.remember(calendar);
        this.options.onCalendarChange?.(calendar);
      },
    });

    const inputId = options.id ?? uid('ndp-input');
    const panelId = `${inputId}-panel`;
    this.input = el('input', {
      class: 'ndp-input__control',
      id: inputId,
      role: 'combobox',
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-haspopup': 'dialog',
      'aria-controls': panelId,
    });
    this.clearButton = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'clear' },
      [icon('close')],
    );
    this.switchButton = el('button', {
      type: 'button',
      class: 'ndp-input__switch',
      'data-action': 'switch',
    });
    this.toggleButton = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'toggle' },
      [icon('calendar')],
    );
    this.box = el('div', { class: 'ndp-input' }, [
      this.input,
      el('span', { class: 'ndp-input__actions' }, [
        this.clearButton,
        this.switchButton,
        this.toggleButton,
      ]),
    ]);
    this.hint = el('p', {
      class: 'ndp-hint',
      id: `${inputId}-hint`,
      'aria-live': 'polite',
      hidden: true,
    });
    this.hidden = el('input', { type: 'hidden' });
    this.segment = el('div', { class: 'ndp-segment', role: 'group' }, [
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'BS' }),
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'AD' }),
    ]);
    this.todayButton = el('button', {
      type: 'button',
      class: 'ndp-button',
      'data-action': 'today',
    });
    const calendarRoot = el('div', { class: 'ndp-panel__calendar' });
    this.presetList = new PresetList((id) => {
      if (this.store.actions.applyPreset(id) && !this.store.getState().open) {
        restoreFocus(this.input);
      }
    });
    this.panel = el(
      'div',
      {
        class: 'ndp-panel',
        id: panelId,
        role: 'dialog',
        popover: 'manual',
        hidden: true,
      },
      [
        el('div', { class: 'ndp-panel__body' }, [this.presetList.element, calendarRoot]),
        el('div', { class: 'ndp-panel__footer' }, [this.segment, this.todayButton]),
      ],
    );
    this.field = el('div', { class: 'ndp-field' }, [
      this.box,
      this.hint,
      this.panel,
      this.hidden,
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

    this.input.addEventListener('input', this.onTextInput);
    this.input.addEventListener('blur', () => {
      this.store.actions.blur();
    });
    this.input.addEventListener('keydown', this.onInputKeyDown);
    this.field.addEventListener('click', this.onClick);

    this.unsubscribe = this.store.subscribe(() => {
      this.render();
    });
    this.restoreCalendar();
    this.render();
  }

  getState(): DatePickerState {
    return this.store.getState();
  }

  /** Change view or store options. Unknown keys are ignored. */
  setOptions(changes: Partial<DatePickerViewOptions>): void {
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
    const hintText =
      state.error?.message ??
      ((this.options.showEquivalent ?? true) ? state.equivalentText : null);

    if (this.input.value !== state.text) {
      this.input.value = state.text;
    }
    this.input.setCustomValidity(state.error?.message ?? '');
    setAttrs(this.input, {
      placeholder: this.options.placeholder ?? state.placeholder,
      disabled,
      required: this.options.required ?? false,
      'aria-label': this.options.ariaLabel ?? null,
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-invalid': state.error ? 'true' : null,
      'aria-describedby': hintText ? this.hint.id : null,
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
    this.switchButton.hidden = !state.canSwitchCalendar;
    setText(this.switchButton, locale.calendarNames[state.calendar]);
    const other: CalendarSystem = state.calendar === 'BS' ? 'AD' : 'BS';
    setAttrs(this.switchButton, {
      disabled,
      'aria-label': `${locale.labels.calendar}: ${locale.calendarNames[state.calendar]} → ${locale.calendarNames[other]}`,
    });
    setAttrs(this.toggleButton, {
      disabled,
      'aria-label': locale.labels.openCalendar,
      'aria-expanded': state.open ? 'true' : 'false',
    });

    this.hint.hidden = hintText === null;
    setText(this.hint, hintText ?? '');
    setAttrs(this.hint, { 'data-error': state.error !== null });

    this.segment.hidden = !state.canSwitchCalendar;
    setAttrs(this.segment, { 'aria-label': locale.labels.calendar });
    for (const button of this.segment.querySelectorAll<HTMLButtonElement>('button')) {
      const calendar = button.dataset['calendar'] as CalendarSystem;
      setText(button, locale.calendarNames[calendar]);
      setAttrs(button, {
        'aria-pressed': calendar === state.calendar ? 'true' : 'false',
      });
    }
    setText(this.todayButton, locale.labels.today);
    this.presetList.render(state.presets, locale.labels.presets);

    const name = this.options.hiddenInput === false ? undefined : this.options.name;
    setAttrs(this.hidden, { name: name ?? null, value: state.value });
    this.hidden.value = state.value;
    this.hidden.disabled = name === undefined || disabled;

    this.syncPanel(state.open);
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
        width:
          this.store.getState().presets.length > 0
            ? PANEL_WIDTH_WITH_PRESETS
            : PANEL_WIDTH,
        layout: this.options.panelLayout,
      });
      const stopOutside = onOutsidePointer([this.field, this.panel], () => {
        this.store.actions.close();
      });
      const stopBackdrop = onBackdropPointer(this.panel, () => {
        this.store.actions.close();
      });
      const stopEscape = onEscape(() => {
        this.store.actions.close();
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

  private readonly onTextInput = (): void => {
    this.store.actions.type(this.input.value);
    this.options.onInput?.(this.input.value);
  };

  private readonly onInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowDown' && (event.altKey || this.input.value === '')) {
      event.preventDefault();
      this.open();
    }
  };

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
      case 'switch':
        this.store.actions.switchCalendar(
          this.store.getState().calendar === 'BS' ? 'AD' : 'BS',
        );
        break;
      case 'toggle':
        if (this.store.getState().open) {
          this.close();
        } else {
          this.open();
        }
        break;
      case 'today':
        if (this.store.actions.selectToday()) {
          restoreFocus(this.input);
        }
        break;
      default:
        break;
    }
  };

  private remember(calendar: CalendarSystem): void {
    const key = this.options.persistCalendar;
    if (!key) {
      return;
    }
    try {
      window.localStorage.setItem(key, calendar);
    } catch {
      // Storage can be blocked (private mode); the choice then lasts for this page only.
    }
  }

  private restoreCalendar(): void {
    const key = this.options.persistCalendar;
    if (!key) {
      return;
    }
    const stored = readStorage(key);
    if (stored === 'BS' || stored === 'AD') {
      this.store.actions.switchCalendar(stored);
    }
  }
}

/** Only the keys the picker store understands, minus the view's own callbacks. */
function storeOptions(
  options: Partial<DatePickerViewOptions>,
): Partial<DatePickerOptions> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!VIEW_KEYS.has(key) && key !== 'onChange' && key !== 'onCalendarChange') {
      out[key] = value;
    }
  }

  return out;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage blocked
  }
}

export type { DateDetail };
