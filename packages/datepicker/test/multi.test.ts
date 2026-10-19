import { describe, expect, test, vi } from 'vitest';
import { createMultiDatePicker } from '@nepdate/datepicker';
import { bs, TODAY } from './helpers';

const make = (options: Parameters<typeof createMultiDatePicker>[0] = {}) =>
  createMultiDatePicker({ today: TODAY, ...options });

describe('multiple dates (PICK-001)', () => {
  test('clicks add and remove days; the value stays sorted AD', () => {
    const onChange = vi.fn();
    const picker = make({ onChange });
    picker.actions.open();
    expect(picker.actions.select(bs('2083-07-08'))).toBe(true);
    expect(picker.actions.select(bs('2083-07-05'))).toBe(true);
    expect(picker.getState()).toMatchObject({
      value: ['2026-10-22', '2026-10-25'],
      text: '2083-07-05, 2083-07-08',
      open: true,
    });
    expect(picker.getState().calendarState.selected).toEqual([
      bs('2083-07-05'),
      bs('2083-07-08'),
    ]);
    const cells = picker.getState().calendarState.weeks.flat();
    expect(cells.filter((cell) => cell?.isSelected)).toHaveLength(2);
    expect(onChange).toHaveBeenLastCalledWith(
      ['2026-10-22', '2026-10-25'],
      [expect.objectContaining({ bs: bs('2083-07-05') }), expect.anything()],
    );

    picker.actions.select(bs('2083-07-05'));
    expect(picker.getState().value).toEqual(['2026-10-25']);
    picker.actions.remove('2026-10-25');
    expect(picker.getState()).toMatchObject({ value: [], text: '' });
  });

  test('typing a list: commas or spaces, repeats dropped, last day masked', () => {
    const picker = make();
    picker.actions.type('2083-07-08, 2083-07-05 2083-07-08');
    expect(picker.getState().value).toEqual(['2026-10-22', '2026-10-25']);
    picker.actions.blur();
    expect(picker.getState().text).toBe('2083-07-05, 2083-07-08');

    const typed = make();
    for (const char of '2083-07-05, 20830708') {
      typed.actions.type(typed.getState().text + char);
    }
    expect(typed.getState().text).toBe('2083-07-05, 2083-07-08');
  });

  test('a bad day shows its error and keeps the good ones', () => {
    const picker = make({ max: '2026-10-31' });
    picker.actions.type('2083-07-05, 2083-13-01');
    expect(picker.getState().error?.code).toBe('format');
    expect(picker.getState().value).toEqual(['2026-10-22']);
    picker.actions.type('2083-07-05, 2083-07-30');
    expect(picker.getState().error?.code).toBe('range');
    picker.actions.blur();
    expect(picker.getState().text).toBe('2083-07-05, 2083-07-30');
  });

  test('maxDates stops a click past the limit and flags typed extras', () => {
    const picker = make({ maxDates: 2 });
    picker.actions.select(bs('2083-07-01'));
    picker.actions.select(bs('2083-07-02'));
    expect(picker.actions.select(bs('2083-07-03'))).toBe(false);
    expect(picker.getState().error).toMatchObject({
      code: 'tooMany',
      message: 'Choose at most 2 dates.',
    });
    expect(picker.getState().calendarState.selected).toHaveLength(2);
    picker.actions.select(bs('2083-07-02')); // removing is always allowed
    expect(picker.getState()).toMatchObject({ error: null, value: ['2026-10-18'] });

    picker.actions.type('2083-07-01, 2083-07-02, 2083-07-03');
    expect(picker.getState().error?.code).toBe('tooMany');
  });

  test('controlled value, BS/AD switch, reset and clear', () => {
    const onChange = vi.fn();
    const picker = make({ defaultValue: ['2026-10-18'], onChange });
    expect(picker.getState().text).toBe('2083-07-01');
    picker.actions.switchCalendar('AD');
    expect(picker.getState().text).toBe('2026-10-18');
    picker.setOptions({ value: ['2026-10-20', '2026-10-19'] });
    expect(picker.getState().value).toEqual(['2026-10-19', '2026-10-20']);
    picker.setOptions({ value: ['2026-10-19', '2026-10-20'] }); // same value: no change
    expect(onChange).not.toHaveBeenCalled();
    picker.actions.setValue([]);
    expect(picker.getState().text).toBe('');
    picker.actions.reset();
    expect(picker.getState().value).toEqual(['2026-10-18']);
    picker.actions.clear();
    expect(picker.getState().value).toEqual([]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('open/close/toggle, inline, closeOnSelect and destroy', () => {
    const picker = make({ defaultValue: ['2026-11-20'], closeOnSelect: true });
    picker.actions.toggle();
    expect(picker.getState().calendarState.title).toBe('Mangsir 2083');
    expect(picker.getState().open).toBe(true);
    picker.actions.select(bs('2083-07-01'));
    expect(picker.getState().open).toBe(false);
    picker.actions.toggle();
    picker.actions.toggle();
    expect(picker.getState().open).toBe(false);
    picker.setOptions({ inline: true, calendar: 'AD' });
    expect(picker.getState()).toMatchObject({ open: true, inline: true, calendar: 'AD' });
    picker.actions.switchCalendar('BS'); // fixed calendar: ignored
    expect(picker.getState().calendar).toBe('AD');
    picker.destroy();
    picker.actions.type('2083-07-01');
    expect(picker.actions.select(bs('2083-07-02'))).toBe(false);
    picker.setOptions({ maxDates: 1 });
  });
});
