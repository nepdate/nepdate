import { useCallback, useEffect, useRef, type KeyboardEvent, type Ref } from 'react';
import { getLocale, type CalendarDate, type LocaleCode } from '@nepdate/core';
import type {
  CalendarActions,
  CalendarState,
  DayCell,
  FocusKey,
  PickerCell,
} from '@nepdate/calendar';

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

type DataAttrs = Record<`data-${string}`, string | boolean | undefined>;

export interface ButtonProps extends DataAttrs {
  type: 'button';
  tabIndex?: number;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-current'?: 'date';
  onClick: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
}

export interface GridProps {
  role: 'grid';
  'aria-label': string;
  ref: Ref<HTMLTableElement>;
  onKeyDown: (event: KeyboardEvent) => void;
  onMouseLeave: () => void;
}

/** Prop getters that turn a calendar store into accessible markup. */
export interface CalendarBindings {
  readonly state: CalendarState;
  readonly actions: CalendarActions;
  readonly getGridProps: () => GridProps;
  readonly getDayProps: (cell: DayCell) => ButtonProps;
  readonly getPrevProps: () => ButtonProps;
  readonly getNextProps: () => ButtonProps;
  /** The title buttons: month and year in the day view, the year (or page) otherwise. */
  readonly getTitleButtons: () => { key: string; label: string; props: ButtonProps }[];
  readonly getOptionProps: (
    tile: PickerCell,
    index: number,
    tiles: readonly PickerCell[],
  ) => ButtonProps;
  /** Move focus into the grid (e.g. when a panel opens). */
  readonly focusGrid: () => void;
}

export function useCalendarBindings(
  state: CalendarState,
  actions: CalendarActions,
  locale: LocaleCode | undefined,
  options: {
    /** The store's latest snapshot, to tell whether a key press changed anything. */
    readonly getSnapshot: () => CalendarState;
    readonly onDayActivate?: ((date: CalendarDate) => void) | undefined;
  },
): CalendarBindings {
  const { getSnapshot, onDayActivate } = options;
  const grid = useRef<HTMLTableElement | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const focusRequested = useRef(false);
  const labels = getLocale(locale).labels;

  const focusGrid = useCallback((): void => {
    const scope = grid.current?.closest('.ndp-calendar') ?? grid.current ?? root.current;
    scope
      ?.querySelector<HTMLElement>('.ndp-day[tabindex="0"], .ndp-option[tabindex="0"]')
      ?.focus();
  }, []);

  useEffect(() => {
    if (focusRequested.current) {
      focusRequested.current = false;
      focusGrid();
    }
  });

  const requestFocus = (): void => {
    focusRequested.current = true;
  };

  const activate = onDayActivate ?? ((date: CalendarDate) => actions.select(date));
  const [monthName, yearText] = splitTitle(state.title);
  const focusIndex = (tiles: readonly PickerCell[]): number => {
    const selected = tiles.findIndex((tile) => tile.isSelected);
    const current = tiles.findIndex((tile) => tile.isCurrent);

    return Math.max(0, selected === -1 ? current : selected);
  };

  return {
    state,
    actions,
    focusGrid,
    getGridProps: () => ({
      role: 'grid',
      'aria-label': state.title,
      ref: (node: HTMLTableElement | null) => {
        grid.current = node;
      },
      onKeyDown: (event) => {
        if (!FOCUS_KEYS.has(event.key)) {
          return;
        }
        event.preventDefault();
        requestFocus();
        actions.moveFocus(event.key as FocusKey, { shift: event.shiftKey });
        // Nothing moved (at a limit): keep focus here. Otherwise the effect focuses after React renders.
        if (getSnapshot() === state) {
          focusRequested.current = false;
          focusGrid();
        }
      },
      onMouseLeave: () => {
        if (state.selectionMode === 'range') {
          actions.hover(null);
        }
      },
    }),
    getDayProps: (cell) => ({
      type: 'button',
      tabIndex: cell.isFocusTarget ? 0 : -1,
      disabled: cell.isDisabled,
      'aria-pressed': cell.isSelected,
      ...(cell.isToday ? { 'aria-current': 'date' as const } : {}),
      'data-state': cell.state,
      'data-weekend': cell.isWeekend || undefined,
      'data-preview': (cell.isInRangePreview && !cell.isSelected) || undefined,
      'data-outside': cell.isOutside || undefined,
      onClick: () => {
        if (!cell.isDisabled) {
          activate(cell.date);
        }
      },
      onFocus: () => {
        if (!cell.isFocusTarget) {
          actions.focus(cell.date);
        }
      },
      onMouseEnter: () => {
        if (state.selectionMode === 'range') {
          actions.hover(cell.isDisabled ? null : cell.date);
        }
      },
    }),
    getPrevProps: () => ({
      type: 'button',
      disabled: !state.canPrev,
      'aria-label': state.view === 'day' ? labels.previousMonth : labels.previousYear,
      onClick: () => {
        actions.prev();
      },
    }),
    getNextProps: () => ({
      type: 'button',
      disabled: !state.canNext,
      'aria-label': state.view === 'day' ? labels.nextMonth : labels.nextYear,
      onClick: () => {
        actions.next();
      },
    }),
    getTitleButtons: () =>
      state.view === 'day'
        ? [
            {
              key: 'month',
              label: monthName,
              props: {
                type: 'button',
                'aria-label': `${labels.month}: ${monthName}`,
                onClick: () => {
                  requestFocus();
                  actions.setView('month');
                },
              },
            },
            {
              key: 'year',
              label: yearText,
              props: {
                type: 'button',
                'aria-label': `${labels.year}: ${yearText}`,
                onClick: () => {
                  requestFocus();
                  actions.setView('year');
                },
              },
            },
          ]
        : [
            {
              key: 'up',
              label: state.title,
              props: {
                type: 'button',
                'aria-label':
                  state.view === 'fiscal'
                    ? state.title
                    : `${labels.year}: ${state.title}`,
                onClick: () => {
                  requestFocus();
                  actions.setView(state.view === 'month' ? 'year' : 'day');
                },
              },
            },
          ],
    getOptionProps: (tile, index, tiles) => ({
      type: 'button',
      tabIndex: index === focusIndex(tiles) ? 0 : -1,
      disabled: tile.isDisabled,
      'aria-pressed': tile.isSelected,
      'data-state': tile.isSelected ? 'selected' : tile.isCurrent ? 'current' : 'default',
      onClick: () => {
        requestFocus();
        if (state.view === 'month') {
          actions.chooseMonth(tile.value as 1);
        } else if (state.view === 'year') {
          actions.chooseYear(tile.value);
        } else {
          actions.chooseFiscalYear(tile.value);
        }
      },
    }),
  };
}

/** "Kartik 2083" → ["Kartik", "2083"]. */
function splitTitle(title: string): [string, string] {
  const space = title.lastIndexOf(' ');

  return space === -1 ? [title, ''] : [title.slice(0, space), title.slice(space + 1)];
}
