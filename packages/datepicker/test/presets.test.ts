import { describe, expect, test, vi } from 'vitest';
import { adDate, bsDate, toIsoDate } from '@nepdate/core';
import {
  createDatePicker,
  createDateRangePicker,
  resolveRangePreset,
  resolveSinglePreset,
  type PresetContext,
  type RangePresetId,
} from '@nepdate/datepicker';
import { TODAY } from './helpers';

const bsContext: PresetContext = { today: TODAY, calendar: 'BS', weekStartsOn: 0 };
const iso = (range: {
  start: Parameters<typeof toIsoDate>[0];
  end: Parameters<typeof toIsoDate>[0];
}) => `${toIsoDate(range.start)}..${toIsoDate(range.end)}`;

describe('built-in range presets (PRE-002)', () => {
  test.each([
    ['today', '2026-10-18..2026-10-18'],
    ['yesterday', '2026-10-17..2026-10-17'],
    ['thisWeek', '2026-10-18..2026-10-24'],
    ['lastWeek', '2026-10-11..2026-10-17'],
    ['last7Days', '2026-10-12..2026-10-18'],
    ['last30Days', '2026-09-19..2026-10-18'],
    ['thisMonth', '2026-10-18..2026-11-16'], // Kartik 2083
    ['lastMonth', '2026-09-17..2026-10-17'], // Ashwin 2083
    ['thisYear', '2026-04-14..2027-04-13'], // BS 2083
  ] as [RangePresetId, string][])('%s in BS', (id, expected) => {
    expect(iso(resolveRangePreset(id, bsContext))).toBe(expected);
  });

  test('months and years follow the calendar on screen', () => {
    const ad: PresetContext = { ...bsContext, calendar: 'AD' };
    expect(iso(resolveRangePreset('thisMonth', ad))).toBe('2026-10-01..2026-10-31');
    expect(iso(resolveRangePreset('lastMonth', ad))).toBe('2026-09-01..2026-09-30');
    expect(iso(resolveRangePreset('thisYear', ad))).toBe('2026-01-01..2026-12-31');
  });

  test('fiscal years run from 1 Shrawan to the end of Asar', () => {
    const fy = resolveRangePreset('thisFiscalYear', bsContext);
    expect(fy.start).toEqual(bsDate(2083, 4, 1));
    expect(fy.end).toMatchObject({ year: 2084, month: 3 });
    expect(resolveRangePreset('lastFiscalYear', bsContext).start).toEqual(
      bsDate(2082, 4, 1),
    );
    // Before 1 Shrawan the current FY started the previous year.
    const asar: PresetContext = { ...bsContext, today: adDate(2026, 7, 16) };
    expect(resolveRangePreset('thisFiscalYear', asar).start).toEqual(bsDate(2082, 4, 1));
  });

  test('weeks respect weekStartsOn', () => {
    expect(iso(resolveRangePreset('thisWeek', { ...bsContext, weekStartsOn: 1 }))).toBe(
      '2026-10-12..2026-10-18',
    );
  });

  test('single presets', () => {
    expect(toIsoDate(resolveSinglePreset('today', bsContext))).toBe('2026-10-18');
    expect(toIsoDate(resolveSinglePreset('yesterday', bsContext))).toBe('2026-10-17');
    expect(toIsoDate(resolveSinglePreset('tomorrow', bsContext))).toBe('2026-10-19');
  });
});

describe('presets in the date picker (PRE-003, PRE-004)', () => {
  test('state lists presets with labels; applying one sets the value and marks it active', () => {
    const onChange = vi.fn();
    const picker = createDatePicker({
      today: TODAY,
      max: '2026-10-18',
      presets: [
        'today',
        'yesterday',
        'tomorrow',
        { id: 'new-year', label: 'New year', resolve: () => bsDate(2083, 1, 1) },
      ],
      onChange,
    });
    expect(picker.getState().presets).toEqual([
      { id: 'today', label: 'Today', isActive: false, isDisabled: false },
      { id: 'yesterday', label: 'Yesterday', isActive: false, isDisabled: false },
      { id: 'tomorrow', label: 'Tomorrow', isActive: false, isDisabled: true },
      { id: 'new-year', label: 'New year', isActive: false, isDisabled: false },
    ]);

    picker.actions.open();
    expect(picker.actions.applyPreset('yesterday')).toBe(true);
    expect(picker.getState()).toMatchObject({
      value: '2026-10-17',
      text: '2083-06-31',
      open: false,
    });
    expect(picker.getState().presets[1]?.isActive).toBe(true);
    expect(onChange).toHaveBeenCalledWith('2026-10-17', expect.anything());

    expect(picker.actions.applyPreset('new-year')).toBe(true);
    expect(picker.getState().value).toBe('2026-04-14');
    expect(picker.actions.applyPreset('tomorrow')).toBe(false);
    expect(picker.actions.applyPreset('nope')).toBe(false);
  });

  test('labels follow the locale; a throwing custom preset is disabled', () => {
    const picker = createDatePicker({
      today: TODAY,
      locale: 'ne',
      presets: ['today', { id: 'bad', label: 'Bad', resolve: () => bsDate(2200, 1, 1) }],
    });
    expect(picker.getState().presets.map((p) => [p.label, p.isDisabled])).toEqual([
      ['आज', false],
      ['Bad', true],
    ]);
  });
});

describe('presets in the range picker (PRE-004)', () => {
  test('applying sets both ends, closes the panel and marks the preset active', () => {
    const onChange = vi.fn();
    const picker = createDateRangePicker({
      today: TODAY,
      presets: ['last7Days', 'thisMonth', 'thisFiscalYear'],
      onChange,
    });
    picker.actions.open();
    expect(picker.actions.applyPreset('last7Days')).toBe(true);
    expect(picker.getState()).toMatchObject({
      value: { start: '2026-10-12', end: '2026-10-18' },
      startText: '2083-06-26',
      endText: '2083-07-01',
      open: false,
    });
    expect(picker.getState().presets.map((p) => p.isActive)).toEqual([
      true,
      false,
      false,
    ]);
    expect(onChange).toHaveBeenCalledOnce();
  });

  test('presets outside min/max or the allowed length are disabled', () => {
    const picker = createDateRangePicker({
      today: TODAY,
      max: '2026-10-20',
      maxDays: 10,
      presets: ['last7Days', 'thisWeek', 'thisMonth', 'lastFiscalYear'],
    });
    expect(picker.getState().presets.map((p) => [p.id, p.isDisabled])).toEqual([
      ['last7Days', false],
      ['thisWeek', true], // ends 2026-10-24, after max
      ['thisMonth', true],
      ['lastFiscalYear', true], // 365 days > maxDays
    ]);
    expect(picker.actions.applyPreset('thisWeek')).toBe(false);
  });

  test('switching to AD changes what "this month" means', () => {
    const picker = createDateRangePicker({ today: TODAY, presets: ['thisMonth'] });
    picker.actions.switchCalendar('AD');
    picker.actions.applyPreset('thisMonth');
    expect(picker.getState().value).toEqual({ start: '2026-10-01', end: '2026-10-31' });
  });
});
