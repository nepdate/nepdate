import { describe, expect, test, vi } from 'vitest';
import {
  createDateRangePicker,
  type RangeDetail,
  type RangeValue,
} from '@nepdate/datepicker';
import { bs, TODAY } from './helpers';

const make = (options: Parameters<typeof createDateRangePicker>[0] = {}) =>
  createDateRangePicker({ today: TODAY, ...options });

describe('range picker (DP-012, TEST-029)', () => {
  test('two clicks set start then end and close the panel', () => {
    const onChange = vi.fn<(value: RangeValue, detail: RangeDetail) => void>();
    const picker = make({ onChange });
    picker.actions.open();
    picker.actions.select(bs('2083-07-05'));
    expect(picker.getState()).toMatchObject({
      value: { start: '2026-10-22', end: '' },
      startText: '2083-07-05',
      endText: '',
      open: true,
    });
    picker.actions.select(bs('2083-07-10'));
    expect(picker.getState()).toMatchObject({
      value: { start: '2026-10-22', end: '2026-10-27' },
      endText: '2083-07-10',
      open: false,
    });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.lastCall?.[0]).toEqual({
      start: '2026-10-22',
      end: '2026-10-27',
    });
    expect(onChange.mock.lastCall?.[1].end?.bs).toEqual(bs('2083-07-10'));
    expect(picker.getState().equivalentText).toEqual({
      start: '22 October 2026 AD',
      end: '27 October 2026 AD',
    });
  });

  test('typing either field; an end before the start swaps them', () => {
    const picker = make();
    picker.actions.type('start', '2083-07-10');
    picker.actions.type('end', '2083-07-05');
    expect(picker.getState()).toMatchObject({
      value: { start: '2026-10-22', end: '2026-10-27' },
      startText: '2083-07-05',
      endText: '2083-07-10',
      error: null,
    });
  });

  test('blur tidies the end field; listeners hear each change once', () => {
    const picker = make();
    const listener = vi.fn();
    picker.subscribe(listener);
    picker.actions.type('end', '2083/7/9');
    picker.actions.blur('end');
    expect(picker.getState().endText).toBe('2083-07-09');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test('format errors belong to their field', () => {
    const picker = make();
    picker.actions.type('end', '2083-99-01');
    expect(picker.getState().error).toMatchObject({ code: 'format', field: 'end' });
    picker.actions.blur('end');
    expect(picker.getState().endText).toBe('2083-99-01');
    picker.actions.type('start', '2083/7/5');
    expect(picker.getState().error).toBeNull();
    picker.actions.blur('start');
    expect(picker.getState().startText).toBe('2083-07-05');
  });

  test('an out-of-range other field is reported', () => {
    const picker = make({ defaultValue: { start: '2026-10-22', end: '' } });
    picker.setOptions({ max: '2026-10-20' });
    picker.actions.type('end', '2083-07-02');
    expect(picker.getState().error).toMatchObject({ field: 'start', code: 'range' });
  });

  test.each([
    [{ minDays: 7 }, 'tooShort', 'Choose at least 7 days.'],
    [{ maxDays: 3 }, 'tooLong', 'Choose at most 3 days.'],
  ] as const)('length limits %o', (limits, code, message) => {
    const picker = make(limits);
    picker.actions.select(bs('2083-07-05'));
    picker.actions.select(bs('2083-07-08')); // 4 days
    expect(picker.getState().error).toEqual({ field: 'range', code, message });
    expect(picker.getState().value.end).toBe('');
    picker.actions.blur('end');
    expect(picker.getState().endText).toBe('2083-07-08');
  });

  test('outside values, echo guard, clear, reset and switching', () => {
    const onChange = vi.fn();
    const picker = make({
      defaultValue: { start: '2026-10-27', end: '2026-10-22' },
      onChange,
    });
    expect(picker.getState().value).toEqual({ start: '2026-10-22', end: '2026-10-27' });

    picker.actions.type('start', '2083/7/1');
    picker.setOptions({ value: { start: '2026-10-18', end: '2026-10-27' } });
    expect(picker.getState().startText).toBe('2083/7/1');

    picker.actions.setValue({ start: '2026-12-25', end: '2026-12-31' });
    expect(picker.getState().startText).toBe('2083-09-10');

    picker.actions.switchCalendar('AD');
    expect(picker.getState()).toMatchObject({
      startText: '2026-12-25',
      endText: '2026-12-31',
    });
    expect(picker.getState().calendarState.calendar).toBe('AD');

    picker.actions.clear();
    expect(picker.getState().value).toEqual({ start: '', end: '' });
    picker.actions.reset();
    expect(picker.getState().value).toEqual({ start: '2026-10-22', end: '2026-10-27' });
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  test('choosing a fiscal year in the panel sets the whole year (FY-001)', () => {
    const picker = make();
    picker.actions.open();
    expect(picker.calendar.actions.chooseFiscalYear(2083)).toBe(true);
    expect(picker.getState().value.start).toBe('2026-07-17');
    expect(picker.getState().startText).toBe('2083-04-01');
    expect(picker.getState().open).toBe(false);
  });

  test('opening shows the start month; toggle; fixed calendar; destroy', () => {
    const picker = make({
      calendar: 'AD',
      defaultValue: { start: '2026-12-25', end: '' },
    });
    picker.actions.toggle();
    expect(picker.getState().calendarState.title).toBe('December 2026');
    picker.actions.toggle();
    expect(picker.getState().open).toBe(false);
    picker.actions.switchCalendar('BS');
    expect(picker.getState().canSwitchCalendar).toBe(false);
    expect(picker.getState().calendar).toBe('AD');
    picker.setOptions({ locale: 'ne' });
    expect(picker.getState().startText).toBe('२०२६-१२-२५');
    picker.destroy();
    picker.actions.type('start', '2026-01-01');
    picker.setOptions({ locale: 'en' });
    expect(picker.actions.select(bs('2083-07-05'))).toBe(false);
    expect(picker.getState().startText).toBe('२०२६-१२-२५');
  });
});
