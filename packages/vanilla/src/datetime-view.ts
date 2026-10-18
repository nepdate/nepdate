import { getLocale, type CalendarSystem } from '@nepdate/core';
import {
  createDateTimePicker,
  type DateTimePickerOptions,
  type DateTimePickerState,
  type DateTimePickerStore,
  type TimeCell,
} from '@nepdate/datepicker';
import { onEscape, onOutsidePointer, restoreFocus, trackPosition } from '@nepdate/dom';
import { CalendarView } from './calendar-view';
import { el, icon, setAttrs, setText, uid } from './dom';
import type { Theme } from './picker-view';
import {
  PANEL_WIDTH,
  PANEL_WIDTH_WITH_PRESETS,
  PresetList,
  TIME_COLUMNS_WIDTH,
} from './preset-list';

export interface DateTimePickerViewOptions extends DateTimePickerOptions {
  readonly name?: string | undefined;
  readonly hiddenInput?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly theme?: Theme | undefined;
  readonly ariaLabel?: string | undefined;
  readonly timeLabel?: string | undefined;
  readonly id?: string | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

const VIEW_KEYS = new Set([
  'name',
  'hiddenInput',
  'required',
  'disabled',
  'theme',
  'ariaLabel',
  'timeLabel',
  'id',
  'onOpenChange',
  'onChange',
]);

/** A date input and a time input sharing one panel: calendar plus hour/minute columns. */
export class DateTimePickerView {
  readonly store: DateTimePickerStore;
  readonly dateInput: HTMLInputElement;
  readonly timeInput: HTMLInputElement;
  private options: DateTimePickerViewOptions;
  private readonly field: HTMLDivElement;
  private readonly row: HTMLDivElement;
  private readonly dateBox: HTMLDivElement;
  private readonly timeBox: HTMLDivElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly hint: HTMLParagraphElement;
  private readonly panel: HTMLDivElement;
  private readonly segment: HTMLDivElement;
  private readonly nowButton: HTMLButtonElement;
  private readonly doneButton: HTMLButtonElement;
  private readonly hours: HTMLDivElement;
  private readonly minutes: HTMLDivElement;
  private readonly time: HTMLDivElement;
  private readonly hidden: HTMLInputElement;
  private readonly calendarView: CalendarView;
  private readonly presetList: PresetList;
  private readonly unsubscribe: () => void;
  private closePanel: (() => void) | null = null;
  private wasOpen = false;

  constructor(host: HTMLElement, options: DateTimePickerViewOptions = {}) {
    this.options = { ...options };
    this.store = createDateTimePicker({
      ...storeOptions(options),
      onChange: (value, detail) => {
        this.options.onChange?.(value, detail);
      },
    });
    const id = options.id ?? uid('ndp-datetime');
    this.dateInput = el('input', {
      class: 'ndp-input__control',
      id,
      role: 'combobox',
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      'aria-haspopup': 'dialog',
      'aria-controls': `${id}-panel`,
    });
    this.timeInput = el('input', {
      class: 'ndp-input__control',
      id: `${id}-time`,
      type: 'text',
      autocomplete: 'off',
    });
    this.toggleButton = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'toggle' },
      [icon('calendar')],
    );
    this.dateBox = el('div', { class: 'ndp-input' }, [
      this.dateInput,
      el('span', { class: 'ndp-input__actions' }, [this.toggleButton]),
    ]);
    this.timeBox = el('div', { class: 'ndp-input ndp-input--time' }, [this.timeInput]);
    this.row = el('div', { class: 'ndp-datetime' }, [this.dateBox, this.timeBox]);
    this.hint = el('p', {
      class: 'ndp-hint',
      id: `${id}-hint`,
      'aria-live': 'polite',
      hidden: true,
    });
    this.hidden = el('input', { type: 'hidden' });
    this.segment = el('div', { class: 'ndp-segment', role: 'group' }, [
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'BS' }),
      el('button', { type: 'button', class: 'ndp-segment__item', 'data-calendar': 'AD' }),
    ]);
    this.nowButton = el('button', {
      type: 'button',
      class: 'ndp-button',
      'data-action': 'now',
    });
    this.doneButton = el('button', {
      type: 'button',
      class: 'ndp-button',
      'data-variant': 'primary',
      'data-action': 'done',
    });
    this.hours = el('div', {
      class: 'ndp-time__column',
      role: 'group',
      'data-unit': 'hour',
    });
    this.minutes = el('div', {
      class: 'ndp-time__column',
      role: 'group',
      'data-unit': 'minute',
    });
    this.time = el('div', { class: 'ndp-time', role: 'group' }, [
      this.hours,
      this.minutes,
    ]);
    const calendarRoot = el('div', { class: 'ndp-panel__calendar' });
    this.presetList = new PresetList((presetId) => {
      this.store.actions.applyPreset(presetId);
    });
    this.panel = el(
      'div',
      {
        class: 'ndp-panel',
        id: `${id}-panel`,
        role: 'dialog',
        popover: 'manual',
        hidden: true,
      },
      [
        el('div', { class: 'ndp-panel__body' }, [
          this.presetList.element,
          calendarRoot,
          this.time,
        ]),
        el('div', { class: 'ndp-panel__footer' }, [
          this.segment,
          el('span', {}, [this.nowButton, this.doneButton]),
        ]),
      ],
    );
    this.field = el('div', { class: 'ndp-field' }, [
      this.row,
      this.hint,
      this.panel,
      this.hidden,
    ]);
    host.append(this.field);
    this.calendarView = new CalendarView(calendarRoot, this.store.calendar, {
      locale: () => this.options.locale,
      onDayActivate: (date) => {
        this.store.actions.selectDate(date);
      },
    });

    this.dateInput.addEventListener('input', () => {
      this.store.actions.typeDate(this.dateInput.value);
    });
    this.dateInput.addEventListener('blur', () => {
      this.store.actions.blurDate();
    });
    this.dateInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && (event.altKey || this.dateInput.value === '')) {
        event.preventDefault();
        this.open();
      }
    });
    this.timeInput.addEventListener('input', () => {
      this.store.actions.typeTime(this.timeInput.value);
    });
    this.timeInput.addEventListener('blur', () => {
      this.store.actions.blurTime();
    });
    this.field.addEventListener('click', this.onClick);
    this.unsubscribe = this.store.subscribe(() => {
      this.render();
    });
    this.render();
  }

  getState(): DateTimePickerState {
    return this.store.getState();
  }

  setOptions(changes: Partial<DateTimePickerViewOptions>): void {
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
    const hint = state.error?.message ?? state.equivalentText;

    if (this.dateInput.value !== state.dateText) {
      this.dateInput.value = state.dateText;
    }
    if (this.timeInput.value !== state.timeText) {
      this.timeInput.value = state.timeText;
    }
    this.dateInput.setCustomValidity(
      state.error?.field === 'date' ? state.error.message : '',
    );
    this.timeInput.setCustomValidity(
      state.error?.field === 'time' ? state.error.message : '',
    );
    setAttrs(this.dateInput, {
      placeholder: state.placeholder,
      disabled,
      required: this.options.required ?? false,
      'aria-label': this.options.ariaLabel ?? null,
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-invalid': state.error?.field === 'date' ? 'true' : null,
      'aria-describedby': hint ? this.hint.id : null,
    });
    setAttrs(this.timeInput, {
      placeholder: state.timePlaceholder,
      disabled,
      'aria-label': this.options.timeLabel ?? locale.labels.time,
      'aria-invalid': state.error?.field === 'time' ? 'true' : null,
      'aria-describedby': hint ? this.hint.id : null,
    });
    setAttrs(this.dateBox, {
      'data-invalid': state.error?.field === 'date',
      'data-disabled': disabled,
    });
    setAttrs(this.timeBox, {
      'data-invalid': state.error?.field === 'time',
      'data-disabled': disabled,
    });
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
    this.hint.hidden = hint === null;
    setText(this.hint, hint ?? '');
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
    setText(this.nowButton, locale.labels.now);
    setText(this.doneButton, locale.labels.done);
    setAttrs(this.time, { 'aria-label': locale.labels.time });
    setAttrs(this.hours, { 'aria-label': locale.labels.hour });
    setAttrs(this.minutes, { 'aria-label': locale.labels.minute });
    renderColumn(this.hours, state.hours);
    renderColumn(this.minutes, state.minutes);
    this.presetList.render(state.presets, locale.labels.presets);

    const name = this.options.hiddenInput === false ? undefined : this.options.name;
    setAttrs(this.hidden, { name: name ?? null });
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
      const width =
        (this.store.getState().presets.length > 0
          ? PANEL_WIDTH_WITH_PRESETS
          : PANEL_WIDTH) + TIME_COLUMNS_WIDTH;
      const stopTracking = trackPosition(this.row, this.panel, { width });
      const stopOutside = onOutsidePointer([this.field], () => {
        this.store.actions.close();
      });
      const stopEscape = onEscape(() => {
        this.store.actions.close();
        restoreFocus(this.dateInput);
      });
      this.closePanel = () => {
        stopTracking();
        stopOutside();
        stopEscape();
        this.panel.hidden = true;
      };
      for (const item of this.time.querySelectorAll<HTMLElement>(
        '[aria-pressed="true"]',
      )) {
        if (typeof item.scrollIntoView === 'function') {
          item.scrollIntoView({ block: 'nearest' });
        }
      }
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
    const item = target.closest<HTMLButtonElement>('.ndp-time-item');
    if (item) {
      const unit = item.parentElement?.dataset['unit'];
      const value = Number(item.dataset['value']);
      if (unit === 'hour') {
        this.store.actions.selectHour(value);
      } else {
        this.store.actions.selectMinute(value);
      }
      return;
    }
    const calendar = target.closest<HTMLElement>('[data-calendar]')?.dataset['calendar'];
    if (calendar === 'BS' || calendar === 'AD') {
      this.store.actions.switchCalendar(calendar);
      return;
    }
    switch (target.closest<HTMLElement>('[data-action]')?.dataset['action']) {
      case 'toggle':
        if (this.store.getState().open) {
          this.close();
        } else {
          this.open();
        }
        break;
      case 'now':
        this.store.actions.selectNow();
        break;
      case 'done':
        this.close();
        this.dateInput.focus();
        break;
      default:
        break;
    }
  };
}

function renderColumn(column: HTMLElement, cells: readonly TimeCell[]): void {
  if (column.children.length !== cells.length) {
    column.replaceChildren(
      ...cells.map((cell) =>
        el('button', {
          type: 'button',
          class: 'ndp-time-item',
          'data-value': cell.value,
        }),
      ),
    );
  }
  cells.forEach((cell, index) => {
    const button = column.children[index];
    if (button) {
      setText(button, cell.label);
      setAttrs(button, {
        'data-value': cell.value,
        'aria-pressed': cell.isSelected ? 'true' : 'false',
      });
    }
  });
}

function storeOptions(
  options: Partial<DateTimePickerViewOptions>,
): Partial<DateTimePickerOptions> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!VIEW_KEYS.has(key)) {
      out[key] = value;
    }
  }

  return out;
}
