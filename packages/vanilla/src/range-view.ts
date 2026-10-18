import { getLocale, type CalendarSystem } from '@nepdate/core';
import {
  createDateRangePicker,
  type DateRangePickerOptions,
  type DateRangePickerState,
  type DateRangePickerStore,
  type RangeField,
} from '@nepdate/datepicker';
import { onEscape, onOutsidePointer, restoreFocus, trackPosition } from '@nepdate/dom';
import { CalendarView } from './calendar-view';
import { el, icon, setAttrs, setText, uid } from './dom';
import type { Theme } from './picker-view';

export interface DateRangePickerViewOptions extends DateRangePickerOptions {
  /** Field names for plain form posts; hidden inputs are rendered when set. */
  readonly startName?: string | undefined;
  readonly endName?: string | undefined;
  readonly hiddenInput?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly theme?: Theme | undefined;
  readonly startLabel?: string | undefined;
  readonly endLabel?: string | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

const VIEW_KEYS = new Set([
  'startName',
  'endName',
  'hiddenInput',
  'disabled',
  'required',
  'theme',
  'startLabel',
  'endLabel',
  'onOpenChange',
  'onChange',
  'onCalendarChange',
]);

/** Two date fields (start, end) sharing one panel calendar in range mode. */
export class DateRangePickerView {
  readonly store: DateRangePickerStore;
  readonly inputs: Record<RangeField, HTMLInputElement>;
  private options: DateRangePickerViewOptions;
  private readonly field: HTMLDivElement;
  private readonly boxes: Record<RangeField, HTMLDivElement>;
  private readonly toggleButton: HTMLButtonElement;
  private readonly hint: HTMLParagraphElement;
  private readonly panel: HTMLDivElement;
  private readonly segment: HTMLDivElement;
  private readonly hidden: Record<RangeField, HTMLInputElement>;
  private readonly calendarView: CalendarView;
  private readonly unsubscribe: () => void;
  private closePanel: (() => void) | null = null;
  private wasOpen = false;

  constructor(host: HTMLElement, options: DateRangePickerViewOptions = {}) {
    this.options = { ...options };
    this.store = createDateRangePicker({
      ...storeOptions(options),
      onChange: (value, detail) => {
        this.options.onChange?.(value, detail);
      },
      onCalendarChange: (calendar) => {
        this.options.onCalendarChange?.(calendar);
      },
    });
    const id = uid('ndp-range');
    const makeInput = (field: RangeField): HTMLInputElement => {
      const input = el('input', {
        class: 'ndp-input__control',
        id: `${id}-${field}`,
        role: 'combobox',
        type: 'text',
        inputmode: 'numeric',
        autocomplete: 'off',
        'aria-haspopup': 'dialog',
        'aria-controls': `${id}-panel`,
        'data-field': field,
      });
      input.addEventListener('input', () => {
        this.store.actions.type(field, input.value);
      });
      input.addEventListener('blur', () => {
        this.store.actions.blur(field);
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' && (event.altKey || input.value === '')) {
          event.preventDefault();
          this.open();
        }
      });
      return input;
    };
    this.inputs = { start: makeInput('start'), end: makeInput('end') };
    this.toggleButton = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'toggle' },
      [icon('calendar')],
    );
    this.boxes = {
      start: el('div', { class: 'ndp-input' }, [this.inputs.start]),
      end: el('div', { class: 'ndp-input' }, [
        this.inputs.end,
        el('span', { class: 'ndp-input__actions' }, [this.toggleButton]),
      ]),
    };
    this.hint = el('p', {
      class: 'ndp-hint',
      id: `${id}-hint`,
      'aria-live': 'polite',
      hidden: true,
    });
    this.hidden = {
      start: el('input', { type: 'hidden' }),
      end: el('input', { type: 'hidden' }),
    };
    this.segment = el('div', { class: 'ndp-segment', role: 'group' }, [
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'BS' }),
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'AD' }),
    ]);
    const calendarRoot = el('div');
    this.panel = el(
      'div',
      {
        class: 'ndp-panel',
        id: `${id}-panel`,
        role: 'dialog',
        popover: 'manual',
        hidden: true,
      },
      [calendarRoot, el('div', { class: 'ndp-panel__footer' }, [this.segment])],
    );
    const row = el('div', { class: 'ndp-range' }, [
      this.boxes.start,
      el('span', { class: 'ndp-range__separator', 'aria-hidden': 'true' }, ['→']),
      this.boxes.end,
    ]);
    this.field = el('div', { class: 'ndp-field' }, [
      row,
      this.hint,
      this.panel,
      this.hidden.start,
      this.hidden.end,
    ]);
    host.append(this.field);
    this.calendarView = new CalendarView(calendarRoot, this.store.calendar, {
      locale: () => this.options.locale,
      onDayActivate: (date) => {
        if (this.store.actions.select(date) && !this.store.getState().open) {
          restoreFocus(this.inputs.end);
        }
      },
    });
    this.field.addEventListener('click', this.onClick);
    this.unsubscribe = this.store.subscribe(() => {
      this.render();
    });
    this.render();
  }

  getState(): DateRangePickerState {
    return this.store.getState();
  }

  setOptions(changes: Partial<DateRangePickerViewOptions>): void {
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
    const hintText = state.error?.message ?? null;
    const texts: Record<RangeField, string> = {
      start: state.startText,
      end: state.endText,
    };
    const labels: Record<RangeField, string | undefined> = {
      start: this.options.startLabel,
      end: this.options.endLabel,
    };
    for (const field of ['start', 'end'] as const) {
      const input = this.inputs[field];
      if (input.value !== texts[field]) {
        input.value = texts[field];
      }
      const error = state.error;
      const fieldError =
        error !== null && (error.field === field || error.field === 'range');
      input.setCustomValidity(fieldError ? error.message : '');
      setAttrs(input, {
        placeholder: state.placeholder,
        disabled,
        required: this.options.required ?? false,
        'aria-label': labels[field] ?? null,
        'aria-expanded': state.open ? 'true' : 'false',
        'aria-invalid': fieldError ? 'true' : null,
        'aria-describedby': hintText ? this.hint.id : null,
      });
      setAttrs(this.boxes[field], {
        'data-invalid': fieldError,
        'data-disabled': disabled,
      });
      const name =
        this.options.hiddenInput === false
          ? undefined
          : field === 'start'
            ? this.options.startName
            : this.options.endName;
      setAttrs(this.hidden[field], { name: name ?? null });
      this.hidden[field].value = state.value[field];
      this.hidden[field].disabled = name === undefined || disabled;
    }
    setAttrs(this.field, { 'data-ndp-theme': this.options.theme ?? null });
    setAttrs(this.panel, {
      'data-ndp-theme': this.options.theme ?? null,
      'aria-label': locale.labels.chooseDate,
    });
    setAttrs(this.toggleButton, {
      disabled,
      'aria-label': locale.labels.openCalendar,
      'aria-expanded': state.open ? 'true' : 'false',
    });
    this.hint.hidden = hintText === null;
    setText(this.hint, hintText ?? '');
    setAttrs(this.hint, { 'data-error': hintText !== null });
    this.segment.hidden = !state.canSwitchCalendar;
    setAttrs(this.segment, { 'aria-label': locale.labels.calendar });
    for (const button of this.segment.querySelectorAll<HTMLButtonElement>('button')) {
      const calendar = button.dataset['calendar'] as CalendarSystem;
      setText(button, locale.calendarNames[calendar]);
      setAttrs(button, {
        'aria-pressed': calendar === state.calendar ? 'true' : 'false',
      });
    }
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
      const anchor = this.field.querySelector('.ndp-range') ?? this.field;
      const stopTracking = trackPosition(anchor, this.panel);
      const stopOutside = onOutsidePointer([this.field], () => {
        this.store.actions.close();
      });
      const stopEscape = onEscape(() => {
        this.store.actions.close();
        restoreFocus(this.inputs.start);
      });
      this.closePanel = () => {
        stopTracking();
        stopOutside();
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
    if (target.closest('[data-action="toggle"]')) {
      if (this.store.getState().open) {
        this.close();
      } else {
        this.open();
      }
    }
  };
}

function storeOptions(
  options: Partial<DateRangePickerViewOptions>,
): Partial<DateRangePickerOptions> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!VIEW_KEYS.has(key)) {
      out[key] = value;
    }
  }

  return out;
}
