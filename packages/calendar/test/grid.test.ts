import { describe, expect, test } from 'vitest';
import { daysInMonth, getLocale } from '@nepdate/core';
import { buildMonthGrid, computeLimits, createCalendar } from '@nepdate/calendar';
import { ad, bs, cell, cells, TODAY, ymd } from './helpers';

describe('grid shapes (TEST-020)', () => {
  test.each([
    ['2026-02-10', 0, false, 4, 0],
    ['2026-02-10', 0, true, 6, 0],
    ['2026-08-10', 0, false, 6, 6],
    ['2026-10-10', 0, false, 5, 4],
    ['2026-10-10', 1, false, 5, 3],
  ] as const)(
    'AD %s, week starts %i, fixed %s → %i rows, %i leading days',
    (day, start, fixed, rows, lead) => {
      const { weeks } = createCalendar({
        calendar: 'AD',
        today: TODAY,
        visibleMonth: ad(day),
        weekStartsOn: start,
        fixedWeeks: fixed,
      }).getState();

      expect(weeks).toHaveLength(rows);
      expect(weeks.every((week) => week.length === 7)).toBe(true);
      expect(weeks.flat().findIndex((c) => c !== null && !c.isOutside)).toBe(lead);
    },
  );

  test('BS Kartik 2083 starts on Sunday; with Monday first it has 6 leading days', () => {
    const sunday = createCalendar({
      today: TODAY,
      visibleMonth: bs('2083-07-15'),
    }).getState();
    expect(sunday.weeks[0]?.[0]?.date).toEqual(bs('2083-07-01'));
    expect(sunday.weekdays.map((w) => w.label)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);

    const monday = createCalendar({
      today: TODAY,
      visibleMonth: bs('2083-07-15'),
      weekStartsOn: 1,
    }).getState();
    expect(monday.weeks[0]?.slice(0, 6).every((c) => c?.isOutside)).toBe(true);
    expect(monday.weeks[0]?.[6]?.date).toEqual(bs('2083-07-01'));
    expect(monday.weekdays[0]).toEqual({
      index: 1,
      label: 'Mon',
      narrowLabel: 'Mo',
      longLabel: 'Monday',
      isWeekend: false,
    });
    expect(monday.weekdays[5]?.isWeekend).toBe(true);
  });

  test('outside days are the neighbouring months, or empty when hidden', () => {
    const shown = createCalendar({
      calendar: 'AD',
      today: TODAY,
      visibleMonth: ad('2026-10-01'),
    }).getState();
    expect(shown.weeks[0]?.slice(0, 4).map((c) => c && ymd(c.date))).toEqual([
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
    ]);
    expect(shown.weeks[0]?.[0]?.state).toBe('outside');

    const hidden = createCalendar({
      calendar: 'AD',
      today: TODAY,
      visibleMonth: ad('2026-10-01'),
      showOutsideDays: false,
    }).getState();
    expect(hidden.weeks[0]?.slice(0, 4)).toEqual([null, null, null, null]);
    expect(cells(hidden)).toHaveLength(31);
  });

  test('days carry the other calendar, labels and an accessible name', () => {
    const state = createCalendar({
      today: TODAY,
      visibleMonth: bs('2083-07-01'),
    }).getState();
    const first = cell(state, 1);

    expect(first.otherDate).toEqual(ad('2026-10-18'));
    expect(first.subLabel).toBe('18');
    expect(first.label).toBe('1');
    expect(first.key).toBe('BS-2083-07-01');
    expect(first.weekday).toBe(0);
    expect(first.ariaLabel).toBe('Sunday, 1 Kartik 2083 (18 October 2026 AD)');
    expect(first.isToday).toBe(true);
    expect(first.state).toBe('today');
    expect(first.isFocusTarget).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
  });

  test('Nepali locale and hidden other calendar', () => {
    const state = createCalendar({
      today: TODAY,
      visibleMonth: bs('2083-07-01'),
      locale: 'ne',
      showOtherCalendar: false,
    }).getState();
    const day = cell(state, 24);

    expect(state.title).toBe('कार्तिक २०८३');
    expect(day.label).toBe('२४');
    expect(day.subLabel).toBeNull();
    expect(day.otherDate).toBeNull();
    expect(
      day.ariaLabel.startsWith(getLocale('ne').weekdays.long[day.weekday] ?? '?'),
    ).toBe(true);
  });

  test('cells outside the BS table are empty', () => {
    const last = createCalendar({
      today: TODAY,
      visibleMonth: bs('2099-12-01'),
    }).getState();
    const length = daysInMonth('BS', 2099, 12);
    const flat = last.weeks.flat();
    const lastIndex = flat.findIndex((c) => c?.date.day === length && !c.isOutside);

    expect(flat.slice(lastIndex + 1).every((c) => c === null)).toBe(true);
    expect(last.canNext).toBe(false);
  });
});

describe('pure helpers', () => {
  test('buildMonthGrid reads a range start as the single selection', () => {
    const limits = computeLimits('BS');
    const weeks = buildMonthGrid({
      calendar: 'BS',
      month: bs('2083-07-01'),
      limits,
      locale: 'en',
      today: TODAY,
      selectionMode: 'single',
      selected: { start: bs('2083-07-09'), end: null },
      rangeHover: null,
      focusTarget: null,
      showOtherCalendar: true,
      showOutsideDays: true,
      fixedWeeks: false,
      weekStartsOn: 0,
      weekendDays: [6],
    });
    const selected = weeks.flat().filter((c) => c?.isSelected);
    expect(selected.map((c) => c && ymd(c.date))).toEqual(['2083-07-09']);
    expect(weeks.flat().some((c) => c?.isFocusTarget)).toBe(false);
  });
});
