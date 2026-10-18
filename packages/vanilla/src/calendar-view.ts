import { getLocale, type CalendarDate, type LocaleCode } from '@nepdate/core';
import type {
  CalendarState,
  CalendarStore,
  DayCell,
  FocusKey,
  PickerCell,
} from '@nepdate/calendar';
import { el, icon, setAttrs, setText } from './dom';

const FOCUS_KEYS: ReadonlySet<string> = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

export interface CalendarViewOptions {
  /** The locale for labels; read on every render so a change applies at once. */
  readonly locale?: (() => LocaleCode | undefined) | undefined;
  /** Called for a day click or Enter/Space; defaults to store.actions.select. */
  readonly onDayActivate?: ((date: CalendarDate) => void) | undefined;
}

/**
 * Renders a calendar store into `root` with the @nepdate/styles markup and
 * keeps it in step. Elements are updated in place, so a click or focus never
 * lands on a replaced button; only switching view or row count rebuilds the body.
 */
export class CalendarView {
  readonly element: HTMLDivElement;
  private readonly store: CalendarStore;
  private readonly options: CalendarViewOptions;
  private readonly prev: HTMLButtonElement;
  private readonly next: HTMLButtonElement;
  private readonly title: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private bodyKey = '';
  private cells: (DayCell | null)[] = [];
  private tiles: PickerCell[] = [];
  private focusAfterRender = false;
  private readonly unsubscribe: () => void;

  constructor(
    root: HTMLElement,
    store: CalendarStore,
    options: CalendarViewOptions = {},
  ) {
    this.store = store;
    this.options = options;
    this.prev = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'prev' },
      [icon('chevron-left')],
    );
    this.next = el(
      'button',
      { type: 'button', class: 'ndp-icon-button', 'data-action': 'next' },
      [icon('chevron-right')],
    );
    this.title = el('div', { class: 'ndp-calendar__title', 'aria-live': 'polite' });
    this.body = el('div');
    this.element = el('div', { class: 'ndp-calendar' }, [
      el('div', { class: 'ndp-calendar__header' }, [this.prev, this.title, this.next]),
      this.body,
    ]);
    this.element.addEventListener('click', this.onClick);
    this.element.addEventListener('keydown', this.onKeyDown);
    this.element.addEventListener('mouseover', this.onMouseOver);
    this.element.addEventListener('mouseleave', this.onMouseLeave);
    this.element.addEventListener('focusin', this.onFocusIn);
    root.append(this.element);
    this.unsubscribe = store.subscribe(() => {
      this.render();
    });
    this.render();
  }

  /** Move keyboard focus to the day that should have it. */
  focusGrid(): void {
    this.element
      .querySelector<HTMLElement>('.ndp-day[tabindex="0"], .ndp-option[tabindex="0"]')
      ?.focus();
  }

  destroy(): void {
    this.unsubscribe();
    this.element.remove();
  }

  render(): void {
    const state = this.store.getState();
    const labels = getLocale(this.options.locale?.()).labels;
    const stepLabels =
      state.view === 'day'
        ? [labels.previousMonth, labels.nextMonth]
        : [labels.previousYear, labels.nextYear];
    setAttrs(this.prev, { 'aria-label': stepLabels[0], disabled: !state.canPrev });
    setAttrs(this.next, { 'aria-label': stepLabels[1], disabled: !state.canNext });
    this.renderTitle(state, labels.month, labels.year);

    const key = `${state.view}:${state.view === 'day' ? state.weeks.length : 12}`;
    if (key !== this.bodyKey) {
      this.bodyKey = key;
      this.body.replaceChildren(
        state.view === 'day' ? this.buildGrid(state) : this.buildOptions(),
      );
    }
    if (state.view === 'day') {
      this.patchGrid(state);
    } else {
      this.patchOptions(
        state.view === 'month'
          ? state.months
          : state.view === 'year'
            ? state.years
            : state.fiscalYears,
      );
    }
    this.flushFocus();
  }

  /** Focus the grid if a keyboard move or view change asked for it. */
  private flushFocus(): void {
    if (this.focusAfterRender) {
      this.focusAfterRender = false;
      this.focusGrid();
    }
  }

  private renderTitle(state: CalendarState, monthLabel: string, yearLabel: string): void {
    const [monthName, yearText] =
      state.view === 'day' ? splitTitle(state.title) : ['', state.title];
    const wanted =
      state.view === 'day'
        ? [
            {
              action: 'view-month',
              text: monthName,
              label: `${monthLabel}: ${monthName}`,
            },
            { action: 'view-year', text: yearText, label: `${yearLabel}: ${yearText}` },
          ]
        : [
            {
              action: state.view === 'month' ? 'view-year' : 'view-day',
              text: state.title,
              label:
                state.view === 'fiscal' ? state.title : `${yearLabel}: ${state.title}`,
            },
          ];
    const buttons = [...this.title.children] as HTMLButtonElement[];
    if (buttons.length !== wanted.length) {
      this.title.replaceChildren(
        ...wanted.map(() =>
          el('button', { type: 'button', class: 'ndp-calendar__title-button' }),
        ),
      );
    }
    wanted.forEach((item, index) => {
      const button = this.title.children[index] as HTMLButtonElement;
      setAttrs(button, { 'data-action': item.action, 'aria-label': item.label });
      setText(button, item.text);
    });
  }

  private buildGrid(state: CalendarState): HTMLTableElement {
    const head = el('tr', { role: 'row' });
    for (let i = 0; i < 7; i++) {
      head.append(el('th', { class: 'ndp-weekday', scope: 'col', role: 'columnheader' }));
    }
    const rows = state.weeks.map(() => {
      const row = el('tr', { role: 'row' });
      for (let i = 0; i < 7; i++) {
        row.append(
          el('td', { role: 'gridcell' }, [
            el('button', { type: 'button', class: 'ndp-day' }, [
              el('span', { class: 'ndp-sr-only' }),
              el('span', { class: 'ndp-day__label', 'aria-hidden': 'true' }),
              el('span', { class: 'ndp-day__sub', 'aria-hidden': 'true' }),
              el('span', { class: 'ndp-day__dot', 'aria-hidden': 'true', hidden: true }),
            ]),
          ]),
        );
      }
      return row;
    });

    return el('table', { class: 'ndp-grid', role: 'grid' }, [
      el('thead', {}, [head]),
      el('tbody', {}, rows),
    ]);
  }

  private patchGrid(state: CalendarState): void {
    const table = this.body.firstElementChild as HTMLTableElement;
    setAttrs(table, { 'aria-label': state.title });
    const headers = table.querySelectorAll('th');
    state.weekdays.forEach((weekday, index) => {
      const th = headers[index];
      if (th) {
        setAttrs(th, { abbr: weekday.longLabel, 'data-weekend': weekday.isWeekend });
        setText(th, weekday.label);
      }
    });
    this.cells = state.weeks.flat();
    const buttons = table.querySelectorAll<HTMLButtonElement>('.ndp-day');
    this.cells.forEach((cell, index) => {
      const button = buttons[index];
      if (button) {
        patchDay(button, cell);
      }
    });
  }

  private buildOptions(): HTMLDivElement {
    const buttons = Array.from({ length: 12 }, () =>
      el('button', { type: 'button', class: 'ndp-option' }, [
        el('span', { class: 'ndp-sr-only' }),
        el('span', { class: 'ndp-option__label', 'aria-hidden': 'true' }),
        el('span', { class: 'ndp-option__sub', 'aria-hidden': 'true' }),
      ]),
    );

    return el('div', { class: 'ndp-options', role: 'group' }, buttons);
  }

  private patchOptions(tiles: readonly PickerCell[]): void {
    this.tiles = [...tiles];
    const focusIndex = Math.max(
      0,
      tiles.findIndex((tile) => tile.isSelected) === -1
        ? tiles.findIndex((tile) => tile.isCurrent)
        : tiles.findIndex((tile) => tile.isSelected),
    );
    const buttons = this.body.querySelectorAll<HTMLButtonElement>('.ndp-option');
    tiles.forEach((tile, index) => {
      const button = buttons[index];
      if (!button) {
        return;
      }
      setAttrs(button, {
        'data-state': tile.isSelected
          ? 'selected'
          : tile.isCurrent
            ? 'current'
            : 'default',
        'aria-pressed': tile.isSelected ? 'true' : 'false',
        tabindex: index === focusIndex ? 0 : -1,
        disabled: tile.isDisabled,
      });
      const [name, label, sub] = button.children;
      if (name && label && sub) {
        setText(name, tile.subLabel ? `${tile.label} (${tile.subLabel})` : tile.label);
        setText(label, tile.label);
        setText(sub, tile.subLabel ?? '');
      }
    });
  }

  private cellOf(target: EventTarget | null): DayCell | null {
    const button =
      target instanceof Element ? target.closest<HTMLButtonElement>('.ndp-day') : null;
    if (!button || !this.element.contains(button)) {
      return null;
    }
    const index = [...this.element.querySelectorAll('.ndp-day')].indexOf(button);

    return this.cells[index] ?? null;
  }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest<HTMLElement>('[data-action]')?.dataset['action'];
    const { actions } = this.store;
    switch (action) {
      case 'prev':
        actions.prev();
        return;
      case 'next':
        actions.next();
        return;
      case 'view-month':
        actions.setView('month');
        this.focusAfterRender = true;
        this.render();
        return;
      case 'view-year':
        actions.setView('year');
        this.focusAfterRender = true;
        this.render();
        return;
      case 'view-day':
        actions.setView('day');
        return;
      default:
        break;
    }
    const option = target?.closest<HTMLButtonElement>('.ndp-option');
    if (option) {
      const index = [...this.body.querySelectorAll('.ndp-option')].indexOf(option);
      const tile = this.tiles[index];
      if (tile && !tile.isDisabled) {
        this.focusAfterRender = true;
        const view = this.store.getState().view;
        if (view === 'month') {
          actions.chooseMonth(tile.value as 1);
        } else if (view === 'year') {
          actions.chooseYear(tile.value);
        } else {
          actions.chooseFiscalYear(tile.value);
        }
        this.render();
      }
      return;
    }
    const cell = this.cellOf(target);
    if (cell && !cell.isDisabled) {
      (this.options.onDayActivate ?? ((date: CalendarDate) => actions.select(date)))(
        cell.date,
      );
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!FOCUS_KEYS.has(event.key) || !this.cellOf(event.target)) {
      return;
    }
    event.preventDefault();
    this.focusAfterRender = true;
    this.store.actions.moveFocus(event.key as FocusKey, { shift: event.shiftKey });
    // A move that changes nothing (at a limit) still keeps focus where it is.
    this.flushFocus();
  };

  private readonly onMouseOver = (event: MouseEvent): void => {
    const cell = this.cellOf(event.target);
    if (cell && this.store.getState().selectionMode === 'range') {
      this.store.actions.hover(cell.isDisabled ? null : cell.date);
    }
  };

  private readonly onMouseLeave = (): void => {
    if (this.store.getState().selectionMode === 'range') {
      this.store.actions.hover(null);
    }
  };

  private readonly onFocusIn = (event: FocusEvent): void => {
    const cell = this.cellOf(event.target);
    if (cell && !cell.isFocusTarget) {
      this.store.actions.focus(cell.date);
    }
  };
}

function patchDay(button: HTMLButtonElement, cell: DayCell | null): void {
  const td = button.parentElement;
  if (!cell) {
    button.hidden = true;
    setAttrs(button, { tabindex: -1, 'data-key': null });
    if (td) {
      setAttrs(td, { 'aria-selected': null });
    }
    return;
  }
  button.hidden = false;
  setAttrs(button, {
    'data-key': cell.key,
    'data-state': cell.state,
    'data-weekend': cell.isWeekend,
    'data-preview': cell.isInRangePreview && !cell.isSelected,
    'data-outside': cell.isOutside,
    tabindex: cell.isFocusTarget ? 0 : -1,
    disabled: cell.isDisabled,
    'aria-pressed': cell.isSelected ? 'true' : 'false',
    'aria-current': cell.isToday ? 'date' : null,
  });
  if (td) {
    setAttrs(td, { 'aria-selected': cell.isSelected ? 'true' : null });
  }
  const [name, label, sub, dot] = button.children as unknown as [
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement,
  ];
  setText(name, cell.ariaLabel);
  setText(label, cell.label);
  setText(sub, cell.subLabel ?? '');
  sub.hidden = cell.subLabel === null;
  const event = cell.events[0];
  dot.hidden = !event;
  dot.style.setProperty('--ndp-dot-color', event?.color ?? null);
}

/** "Kartik 2083" → ["Kartik", "2083"]; the year is the last word in every locale we ship. */
function splitTitle(title: string): [string, string] {
  const space = title.lastIndexOf(' ');

  return space === -1 ? [title, ''] : [title.slice(0, space), title.slice(space + 1)];
}
