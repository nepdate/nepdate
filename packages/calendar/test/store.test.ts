import { describe, expect, test, vi } from 'vitest';
import {
  addDays,
  daysInMonth,
  isSameDay,
  maxDate,
  type CalendarDate,
} from '@nepdate/core';
import { createCalendar, isDayList, type DateRange } from '@nepdate/calendar';
import { ad, bs, cell, cells, TODAY, ymd } from './helpers';

describe('defaults and navigation (CAL-001, CAL-002, CAL-007)', () => {
  test('starts on the month of the selection, else today, in BS', () => {
    expect(ymd(createCalendar({ today: TODAY }).getState().visibleMonth)).toBe(
      '2083-07-01',
    );
    const withSelection = createCalendar({
      today: TODAY,
      selected: ad('2026-01-05'),
    }).getState();
    expect(withSelection.calendar).toBe('BS');
    expect(withSelection.view).toBe('day');
    expect(ymd(withSelection.visibleMonth)).toBe('2082-09-01');
    expect(
      ymd(
        createCalendar({ today: TODAY, defaultVisibleMonth: bs('2080-02-09') }).getState()
          .visibleMonth,
      ),
    ).toBe('2080-02-01');
  });

  test('next/prev move by month and report the change', () => {
    const onVisibleMonthChange = vi.fn();
    const store = createCalendar({ today: TODAY, onVisibleMonthChange });
    store.actions.next();
    expect(store.getState().title).toBe('Mangsir 2083');
    store.actions.prev();
    store.actions.prev();
    expect(store.getState().title).toBe('Ashwin 2083');
    expect(onVisibleMonthChange).toHaveBeenCalledTimes(3);
    expect(onVisibleMonthChange).toHaveBeenLastCalledWith(bs('2083-06-01'));
  });

  test('goTo shows and focuses a day in either calendar; goToToday returns', () => {
    const store = createCalendar({ today: TODAY });
    store.actions.goTo(ad('2027-04-14'));
    expect(ymd(store.getState().visibleMonth)).toBe('2084-01-01');
    expect(ymd(store.getState().focused)).toBe('2084-01-01');
    store.actions.goToToday();
    expect(ymd(store.getState().focused)).toBe('2083-07-01');
  });

  test('navigation stops at the table edges', () => {
    const store = createCalendar({ today: TODAY, visibleMonth: bs('1970-01-15') });
    expect(store.getState().canPrev).toBe(false);
    const before = store.getState();
    store.actions.prev();
    expect(store.getState()).toBe(before);

    store.actions.goTo(ad('1800-01-01'));
    expect(ymd(store.getState().visibleMonth)).toBe('1970-01-01');
    store.actions.goTo(ad('2200-01-01'));
    expect(ymd(store.getState().visibleMonth)).toBe('2099-12-01');
  });

  test('the AD grid offers only whole months of the table', () => {
    const store = createCalendar({
      calendar: 'AD',
      today: TODAY,
      visibleMonth: ad('1900-01-01'),
    });
    expect(ymd(store.getState().visibleMonth)).toBe('1913-05-01');
    expect(store.getState().canPrev).toBe(false);
    store.actions.goTo(maxDate('AD'));
    expect(store.getState().canNext).toBe(false);
    expect(isSameDay(addDays(store.getState().maxDate, 1), maxDate('AD'))).toBe(false);
  });
});

describe('keyboard (TEST-021)', () => {
  const start = (extra = {}) => createCalendar({ today: TODAY, ...extra });

  test.each([
    ['ArrowLeft', false, '2083-06-31'],
    ['ArrowRight', false, '2083-07-02'],
    ['ArrowUp', false, '2083-06-25'],
    ['ArrowDown', false, '2083-07-08'],
    ['Home', false, '2083-07-01'],
    ['End', false, '2083-07-07'],
    ['PageDown', false, '2083-08-01'],
    ['PageUp', false, '2083-06-01'],
    ['PageDown', true, '2084-07-01'],
    ['PageUp', true, '2082-07-01'],
  ] as const)('%s (shift %s) from Kartik 1, 2083 → %s', (key, shift, expected) => {
    const store = start();
    store.actions.moveFocus(key, { shift });
    const { focused, visibleMonth } = store.getState();
    expect(ymd(focused)).toBe(expected);
    expect(visibleMonth.month).toBe(focused.month);
  });

  test('Ashwin 2083 has 31 days, so ArrowLeft lands on the 31st', () => {
    expect(daysInMonth('BS', 2083, 6)).toBe(31);
  });

  test('PageDown keeps the day, capped to the next month', () => {
    const length = daysInMonth('BS', 2083, 3);
    const store = start({ visibleMonth: bs('2083-03-01') });
    store.actions.focus(bs(`2083-03-${length}`));
    store.actions.moveFocus('PageDown');
    expect(store.getState().focused.day).toBe(
      Math.min(length, daysInMonth('BS', 2083, 4)),
    );
  });

  test('moves stop at min and max', () => {
    const store = start({ min: bs('2083-07-03'), max: ad('2026-10-27') });
    store.actions.moveFocus('ArrowLeft');
    expect(ymd(store.getState().focused)).toBe('2083-07-03');
    store.actions.moveFocus('PageDown');
    expect(ymd(store.getState().focused)).toBe('2083-07-10');
    expect(store.getState().canNext).toBe(false);
  });

  test('moves never throw at the table edge', () => {
    const store = start({ visibleMonth: bs('2099-12-01') });
    store.actions.focus(bs('2099-12-20'));
    expect(() => {
      store.actions.moveFocus('PageDown', { shift: true });
    }).not.toThrow();
    expect(ymd(store.getState().focused)).toBe(ymd(store.getState().maxDate));

    const first = start({ visibleMonth: bs('1970-01-01') });
    first.actions.focus(bs('1970-01-05'));
    first.actions.moveFocus('PageUp', { shift: true });
    expect(ymd(first.getState().focused)).toBe('1970-01-01');
  });

  test('the focus target follows the visible month', () => {
    const store = start();
    store.actions.focus(bs('2083-07-30'));
    store.actions.prev();
    const target = cells(store.getState()).filter((c) => c.isFocusTarget);
    expect(target).toHaveLength(1);
    expect(ymd(store.getState().focused)).toBe(
      `2083-06-${Math.min(30, daysInMonth('BS', 2083, 6))}`,
    );
  });
});

describe('selection (TEST-022)', () => {
  test('single: select fires onSelect and marks the day', () => {
    const onSelect = vi.fn();
    const store = createCalendar({ today: TODAY, onSelect });
    expect(store.actions.select(ad('2026-10-27'))).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(bs('2083-07-10'));
    expect(cell(store.getState(), 10).state).toBe('selected');
    expect(ymd(store.getState().selected as CalendarDate)).toBe('2083-07-10');
  });

  test('disabled days cannot be selected', () => {
    const onSelect = vi.fn();
    const store = createCalendar({
      today: TODAY,
      onSelect,
      isDateDisabled: (date) => date.day === 13,
      max: bs('2083-07-20'),
    });
    expect(store.actions.select(bs('2083-07-13'))).toBe(false);
    expect(store.actions.select(bs('2083-07-21'))).toBe(false);
    expect(cell(store.getState(), 13).isDisabled).toBe(true);
    expect(cell(store.getState(), 21).state).toBe('disabled');
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('selecting an outside day shows its month', () => {
    const store = createCalendar({
      calendar: 'AD',
      today: TODAY,
      visibleMonth: ad('2026-10-01'),
    });
    store.actions.select(ad('2026-09-28'));
    expect(ymd(store.getState().visibleMonth)).toBe('2026-09-01');
  });

  test('range: two clicks, order fixed, preview while hovering, third click restarts', () => {
    const onSelect = vi.fn();
    const store = createCalendar({ today: TODAY, selectionMode: 'range', onSelect });

    store.actions.select(bs('2083-07-10'));
    expect(onSelect).toHaveBeenLastCalledWith({ start: bs('2083-07-10'), end: null });
    expect(cell(store.getState(), 10).state).toBe('selected');

    store.actions.hover(bs('2083-07-05'));
    const preview = cells(store.getState()).filter(
      (c) => c.isInRangePreview && !c.isOutside,
    );
    expect(preview.map((c) => c.date.day)).toEqual([5, 6, 7, 8, 9, 10]);

    store.actions.select(bs('2083-07-05'));
    const range = store.getState().selected as DateRange;
    expect(range.start && ymd(range.start)).toBe('2083-07-05');
    expect(range.end && ymd(range.end)).toBe('2083-07-10');
    expect(store.getState().rangeHover).toBeNull();
    const state = store.getState();
    expect(cell(state, 5).state).toBe('range-start');
    expect(cell(state, 7).state).toBe('range-middle');
    expect(cell(state, 10).state).toBe('range-end');
    expect(cell(state, 10).isRangeEnd).toBe(true);
    expect(cell(state, 11).isRangeMiddle).toBe(false);

    store.actions.hover(bs('2083-07-20'));
    expect(store.getState().rangeHover).toBeNull(); // no preview once both ends are set

    store.actions.select(bs('2083-07-15'));
    expect(onSelect).toHaveBeenLastCalledWith({ start: bs('2083-07-15'), end: null });
  });

  test('range given as a single date or a range; single mode reads a range start', () => {
    const fromDate = createCalendar({
      today: TODAY,
      selectionMode: 'range',
      selected: bs('2083-07-02'),
    });
    expect(fromDate.getState().selected).toEqual({ start: bs('2083-07-02'), end: null });
    const single = createCalendar({
      today: TODAY,
      selected: { start: bs('2083-07-02'), end: bs('2083-07-04') },
    });
    expect(single.getState().selected).toEqual(bs('2083-07-02'));
    expect(cell(single.getState(), 2).isSelected).toBe(true);
    const emptyRange = createCalendar({ today: TODAY, selectionMode: 'range' });
    expect(emptyRange.getState().selected).toEqual({ start: null, end: null });
  });

  test('multiple mode toggles days and keeps them sorted (PICK-001)', () => {
    const onSelect = vi.fn();
    const store = createCalendar({ today: TODAY, selectionMode: 'multiple', onSelect });
    expect(store.getState().selected).toEqual([]);
    store.actions.select(bs('2083-07-09'));
    store.actions.select(bs('2083-07-03'));
    expect(onSelect).toHaveBeenLastCalledWith([bs('2083-07-03'), bs('2083-07-09')]);
    const state = store.getState();
    expect(cell(state, 3).isSelected).toBe(true);
    expect(cell(state, 9).state).toBe('selected');
    expect(cell(state, 4).isSelected).toBe(false);
    store.actions.select(bs('2083-07-03'));
    expect(store.getState().selected).toEqual([bs('2083-07-09')]);
    expect(store.actions.select(maxDate('BS'))).toBe(true);
    store.actions.hover(bs('2083-07-10')); // no range preview in multiple mode
    expect(store.getState().rangeHover).toBeNull();
  });

  test('multiple mode reads a day, a range or a list; other modes read a list', () => {
    const fromDay = createCalendar({
      today: TODAY,
      selectionMode: 'multiple',
      selected: ad('2026-10-20'),
    });
    expect(fromDay.getState().selected).toEqual([bs('2083-07-03')]);
    const fromRange = createCalendar({
      today: TODAY,
      selectionMode: 'multiple',
      selected: { start: bs('2083-07-05'), end: null },
    });
    expect(fromRange.getState().selected).toEqual([bs('2083-07-05')]);
    expect(fromRange.getState().visibleMonth).toEqual(bs('2083-07-01'));
    const empty = createCalendar({ today: TODAY, selectionMode: 'multiple' });
    empty.setOptions({ selected: null });
    expect(empty.getState().selected).toEqual([]);

    const list = [bs('2083-07-09'), bs('2083-07-02')];
    expect(
      createCalendar({ today: TODAY, selectionMode: 'range', selected: list }).getState()
        .selected,
    ).toEqual({ start: bs('2083-07-02'), end: bs('2083-07-09') });
    expect(createCalendar({ today: TODAY, selected: list }).getState().selected).toEqual(
      bs('2083-07-02'),
    );
    expect(createCalendar({ today: TODAY, selected: [] }).getState().selected).toBeNull();
    expect(isDayList(list)).toBe(true);
    expect(isDayList(null)).toBe(false);
  });
});

describe('holidays, events and weekends (TEST-023)', () => {
  test('holidays as data with labels', () => {
    const state = createCalendar({
      today: TODAY,
      holidays: [bs('2083-07-03'), { date: ad('2026-10-25'), label: 'Tihar' }],
    }).getState();

    expect(cell(state, 3)).toMatchObject({
      isHoliday: true,
      holidayLabel: null,
      state: 'holiday',
    });
    expect(cell(state, 8)).toMatchObject({ isHoliday: true, holidayLabel: 'Tihar' });
    expect(cell(state, 8).ariaLabel.endsWith(', Tihar')).toBe(true);
    expect(cell(state, 4).isHoliday).toBe(false);
  });

  test('holidays from a function', () => {
    const state = createCalendar({
      today: TODAY,
      holidays: (date) => (date.day === 2 ? { label: 'Dashain' } : date.day === 9),
    }).getState();
    expect(cell(state, 2).holidayLabel).toBe('Dashain');
    expect(cell(state, 9)).toMatchObject({ isHoliday: true, holidayLabel: null });
    expect(cell(state, 10).isHoliday).toBe(false);
  });

  test('events and weekends', () => {
    const marker = { id: 'exam', color: 'red' };
    const state = createCalendar({
      today: TODAY,
      events: (date) => (date.day === 4 ? [marker] : []),
    }).getState();
    expect(cell(state, 4).events).toEqual([marker]);
    expect(cell(state, 5).events).toEqual([]);
    expect(cell(state, 7).isWeekend).toBe(true); // Saturday
    expect(cell(state, 1).isWeekend).toBe(false);

    const both = createCalendar({ today: TODAY, weekendDays: [0, 6] }).getState();
    expect(cell(both, 1).isWeekend).toBe(true);
  });
});

describe('month and year views (TEST-024, CAL-018)', () => {
  test('month tiles show the AD months each BS month spans', () => {
    const { months } = createCalendar({
      today: TODAY,
      selected: bs('2083-06-24'),
    }).getState();
    expect(months).toHaveLength(12);
    expect(months[6]).toEqual({
      value: 7,
      label: 'Kartik',
      subLabel: 'Oct / Nov',
      isSelected: false,
      isCurrent: true,
      isDisabled: false,
    });
    expect(months[0]?.subLabel).toBe('Apr / May');
    expect(months[5]?.isSelected).toBe(true);
  });

  test('month tiles outside min/max are disabled', () => {
    const { months } = createCalendar({
      today: TODAY,
      min: bs('2083-05-10'),
      max: bs('2083-09-01'),
    }).getState();
    expect(months.map((m) => m.isDisabled)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  test('year tiles come in pages of twelve with the other calendar span', () => {
    const store = createCalendar({ today: TODAY });
    store.actions.setView('year');
    const { years, title } = store.getState();
    expect(title).toBe('2076–2087');
    expect(years.map((y) => y.value)).toEqual([
      2076, 2077, 2078, 2079, 2080, 2081, 2082, 2083, 2084, 2085, 2086, 2087,
    ]);
    expect(years[7]).toMatchObject({
      label: '2083',
      subLabel: '2026/27',
      isCurrent: true,
    });

    const adYears = createCalendar({ calendar: 'AD', today: TODAY }).getState().years;
    expect(adYears.find((y) => y.value === 2026)?.subLabel).toBe('2082/83');
  });

  test('years outside the table are disabled and have no span', () => {
    const store = createCalendar({ today: TODAY, visibleMonth: bs('2099-01-01') });
    const { years } = store.getState();
    expect(years.find((y) => y.value === 2099)?.isDisabled).toBe(false);
    expect(years.find((y) => y.value === 2100)).toBeUndefined();
    const low = createCalendar({
      today: TODAY,
      visibleMonth: bs('1970-01-01'),
    }).getState().years;
    expect(low.find((y) => y.value === 1969)).toMatchObject({
      isDisabled: true,
      subLabel: null,
    });
  });

  test('choosing a year then a month drills down; titles follow the view', () => {
    const onViewChange = vi.fn<(view: string) => void>();
    const store = createCalendar({ today: TODAY, onViewChange });
    store.actions.setView('year');
    store.actions.chooseYear(2080);
    expect(store.getState().view).toBe('month');
    expect(store.getState().title).toBe('2080');
    store.actions.next();
    expect(store.getState().title).toBe('2081');
    store.actions.chooseMonth(2);
    expect(store.getState().view).toBe('day');
    expect(store.getState().title).toBe('Jestha 2081');
    expect(onViewChange.mock.calls.map(([view]: [string]) => view)).toEqual([
      'year',
      'month',
      'day',
    ]);
  });

  test('year view pages move by twelve and stop at the edges', () => {
    const store = createCalendar({ today: TODAY });
    store.actions.setView('year');
    store.actions.next();
    expect(store.getState().title).toBe('2088–2099');
    expect(store.getState().canNext).toBe(false);
    store.actions.chooseYear(2300);
    expect(store.getState().visibleMonth.year).toBe(2099);
    store.actions.setView('year');
    store.actions.chooseYear(1900);
    expect(store.getState().visibleMonth.year).toBe(1970);
    store.actions.setView('year');
    expect(store.getState().canPrev).toBe(false);
  });
});

describe('fiscal-year view (FY-001)', () => {
  test('tiles list fiscal years with their AD span; choosing one selects the whole year in range mode', () => {
    const onSelect = vi.fn();
    const store = createCalendar({ today: TODAY, selectionMode: 'range', onSelect });
    store.actions.setView('fiscal');
    const state = store.getState();
    expect(state.title).toBe('Fiscal year 2076/77–2087/88');
    expect(state.fiscalYears).toHaveLength(12);
    expect(state.fiscalYears[7]).toEqual({
      value: 2083,
      label: '2083/84',
      subLabel: '2026/27',
      isSelected: false,
      isCurrent: true,
      isDisabled: false,
    });

    expect(store.actions.chooseFiscalYear(2083)).toBe(true);
    const range = store.getState().selected as DateRange;
    expect(range.start && ymd(range.start)).toBe('2083-04-01');
    expect(range.end).toMatchObject({ year: 2084, month: 3 });
    expect(store.getState().view).toBe('day');
    expect(store.getState().title).toBe('Shrawan 2083');
    expect(onSelect).toHaveBeenCalledWith(range);
    store.actions.setView('fiscal');
    expect(store.getState().fiscalYears[7]?.isSelected).toBe(true);
  });

  test('single mode shows the first month; limits disable years; pages stop at the table', () => {
    const single = createCalendar({ today: TODAY });
    expect(single.actions.chooseFiscalYear(2080)).toBe(true);
    expect(ymd(single.getState().visibleMonth)).toBe('2080-04-01');
    expect(single.getState().selected).toBeNull();

    const limited = createCalendar({
      today: TODAY,
      selectionMode: 'range',
      min: bs('2083-05-01'),
    });
    limited.actions.setView('fiscal');
    expect(limited.getState().fiscalYears.find((t) => t.value === 2083)?.isDisabled).toBe(
      true,
    );
    expect(limited.actions.chooseFiscalYear(2083)).toBe(false);
    expect(limited.actions.chooseFiscalYear(2300)).toBe(false);

    const store = createCalendar({ today: TODAY, selectionMode: 'range' });
    store.actions.setView('fiscal');
    store.actions.next();
    expect(store.getState().title).toBe('Fiscal year 2088/89–2099/00');
    expect(store.getState().canNext).toBe(false);
    expect(store.getState().fiscalYears.at(-1)).toMatchObject({
      value: 2099,
      isDisabled: true,
      subLabel: null,
    });
    store.actions.prev();
    store.actions.prev();
    expect(store.getState().canPrev).toBe(true);
    const ne = createCalendar({ today: TODAY, locale: 'ne' });
    ne.actions.setView('fiscal');
    expect(ne.getState().fiscalYears[7]?.label).toBe('२०८३/८४');
  });
});

describe('store behaviour (TEST-025, CAL-017)', () => {
  test('the snapshot is the same object until something changes', () => {
    const store = createCalendar({ today: TODAY });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const first = store.getState();

    store.actions.hover(bs('2083-07-05')); // single mode: no preview, no change
    store.actions.focus(bs('2083-07-01')); // already focused
    expect(store.getState()).toBe(first);
    expect(listener).not.toHaveBeenCalled();

    store.actions.next();
    expect(store.getState()).not.toBe(first);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.actions.next();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('destroy stops updates', () => {
    const store = createCalendar({ today: TODAY });
    const listener = vi.fn();
    store.subscribe(listener);
    store.destroy();
    const state = store.getState();
    store.actions.next();
    store.setOptions({ calendar: 'AD' });
    expect(store.actions.select(bs('2083-07-05'))).toBe(false);
    expect(store.getState()).toBe(state);
    expect(listener).not.toHaveBeenCalled();
  });

  test('setOptions switches calendar, keeps the place, and applies controlled values', () => {
    const store = createCalendar({ today: TODAY, selected: bs('2083-07-10') });
    store.setOptions({ calendar: 'AD' });
    expect(store.getState().calendar).toBe('AD');
    expect(ymd(store.getState().visibleMonth)).toBe('2026-10-01');
    expect(cell(store.getState(), 27).isSelected).toBe(true);

    store.setOptions({ selected: ad('2026-12-25'), visibleMonth: ad('2026-12-01') });
    expect(ymd(store.getState().visibleMonth)).toBe('2026-12-01');
    expect(cell(store.getState(), 25).state).toBe('selected');

    store.setOptions({ selectionMode: 'range' });
    expect(store.getState().selected).toEqual({ start: ad('2026-12-25'), end: null });
  });

  test('the selection is reported in the calendar on screen', () => {
    const store = createCalendar({ today: TODAY, selected: ad('2026-10-10') });
    expect(store.getState().selected).toEqual(bs('2083-06-24'));
    store.setOptions({ calendar: 'AD' });
    expect(store.getState().selected).toEqual(ad('2026-10-10'));
    const range = createCalendar({
      today: TODAY,
      selectionMode: 'range',
      selected: { start: ad('2026-10-10'), end: ad('2026-10-12') },
    });
    expect(range.getState().selected).toEqual({
      start: bs('2083-06-24'),
      end: bs('2083-06-26'),
    });
    const outside = createCalendar({ today: TODAY, selected: ad('1800-01-01') });
    expect(outside.getState().selected).toEqual(ad('1800-01-01'));
  });

  test('setOptions with new limits clamps the view and focus', () => {
    const store = createCalendar({ today: TODAY });
    store.setOptions({ min: bs('2084-01-01') });
    expect(ymd(store.getState().visibleMonth)).toBe('2084-01-01');
    expect(ymd(store.getState().focused)).toBe('2084-01-01');
    expect(ymd(store.getState().minDate)).toBe('2084-01-01');
  });

  test('min after max disables everything', () => {
    const store = createCalendar({
      today: TODAY,
      min: bs('2083-07-20'),
      max: bs('2083-07-10'),
    });
    expect(cells(store.getState()).every((c) => c.isDisabled)).toBe(true);
    expect(store.actions.select(bs('2083-07-15'))).toBe(false);
    expect(store.getState().months.every((m) => m.isDisabled)).toBe(true);
    expect(store.getState().years.every((y) => y.isDisabled)).toBe(true);
  });

  test('min/max entirely outside the table also mean nothing is selectable', () => {
    expect(
      createCalendar({ today: TODAY, min: ad('2100-01-01') }).getState().minDate,
    ).toEqual(createCalendar({ today: TODAY, min: ad('2100-01-01') }).getState().maxDate);
    const store = createCalendar({ today: TODAY, max: ad('1800-01-01') });
    expect(store.actions.select(bs('1970-01-02'))).toBe(false);
  });

  test('a given today is used instead of the clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const state = createCalendar({ today: TODAY }).getState();
    expect(ymd(state.visibleMonth)).toBe('2083-07-01');
    expect(cell(state, 1).isToday).toBe(true);
    const fromClock = createCalendar({ calendar: 'AD' }).getState();
    expect(ymd(fromClock.visibleMonth)).toBe('2030-01-01');
    vi.useRealTimers();
  });
});
