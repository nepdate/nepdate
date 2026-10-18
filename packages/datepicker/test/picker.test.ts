import { describe, expect, test, vi } from 'vitest';
import { createDatePicker } from '@nepdate/datepicker';
import { ad, bs, TODAY } from './helpers';

const make = (options: Parameters<typeof createDatePicker>[0] = {}) =>
  createDatePicker({ today: TODAY, ...options });

describe('typing (TEST-026)', () => {
  test('a BS date sets the AD value and the panel', () => {
    const onChange = vi.fn();
    const picker = make({ onChange });
    picker.actions.type('2083-06-24');
    const state = picker.getState();

    expect(state.value).toBe('2026-10-10');
    expect(state.date?.bs).toEqual(bs('2083-06-24'));
    expect(state.date?.ad).toEqual(ad('2026-10-10'));
    expect(state.error).toBeNull();
    expect(state.equivalentText).toBe('10 October 2026 AD');
    expect(state.calendarState.title).toBe('Ashwin 2083');
    expect(state.calendarState.selected).toEqual(bs('2083-06-24'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('2026-10-10', {
      ad: ad('2026-10-10'),
      bs: bs('2083-06-24'),
    });
  });

  test('Devanagari digits and other separators work', () => {
    const picker = make();
    picker.actions.type('२०८३-०६-२४');
    expect(picker.getState().value).toBe('2026-10-10');
    picker.actions.type('2083/6/4');
    expect(picker.getState().value).toBe('2026-09-20');
  });

  test('a fixed AD calendar reads AD text and hides the switch', () => {
    const picker = make({ calendar: 'AD' });
    picker.actions.type('2026-10-10');
    expect(picker.getState()).toMatchObject({
      value: '2026-10-10',
      calendar: 'AD',
      canSwitchCalendar: false,
      equivalentText: '24 Ashwin 2083 BS',
      placeholder: 'YYYY-MM-DD (AD)',
    });
  });

  test('bad text gives a format error and clears the value', () => {
    const onChange = vi.fn();
    const picker = make({ onChange, defaultValue: '2026-10-10' });
    picker.actions.type('24-06-2083');
    expect(picker.getState().error).toEqual({
      code: 'format',
      message: 'Enter a BS date as YYYY-MM-DD.',
    });
    expect(picker.getState().value).toBe('');
    expect(picker.getState().equivalentText).toBeNull();
    expect(picker.getState().calendarState.selected).toBeNull();
    expect(onChange).toHaveBeenCalledWith('', null);
    picker.actions.type('2083-06-3'); // still typing; not a full valid change
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test.each([
    [
      { min: '2026-10-01', max: '2026-10-31' },
      'Choose a date from 2083-06-15 to 2083-07-14.',
    ],
    [{ min: '2026-10-01' }, 'Choose 2083-06-15 or later.'],
    [{ max: '2026-10-31' }, 'Choose 2083-07-14 or earlier.'],
  ])('out of range with %o', (limits, message) => {
    const picker = make(limits);
    picker.actions.type('min' in limits ? '2083-06-01' : '2083-08-01');
    expect(picker.getState().error).toEqual({ code: 'range', message });
    expect(picker.getState().value).toBe('');
  });

  test('outside the BS table is out of range', () => {
    const picker = make({ calendar: 'AD' });
    picker.actions.type('1800-01-01');
    expect(picker.getState().error?.code).toBe('range');
  });

  test('disabled days and Nepali messages', () => {
    const picker = make({ isDateDisabled: (date) => date.day === 13 });
    picker.actions.type('2083-07-13');
    expect(picker.getState().error).toEqual({
      code: 'disabled',
      message: 'This date is not available.',
    });

    const ne = make({ locale: 'ne' });
    ne.actions.type('abc');
    expect(ne.getState().error?.message).toBe(
      'वि.सं. मिति YYYY-MM-DD ढाँचामा लेख्नुहोस्।',
    );
    expect(ne.getState().placeholder).toBe('YYYY-MM-DD (वि.सं.)');
  });

  test('empty text clears without an error', () => {
    const picker = make({ defaultValue: '2026-10-10' });
    picker.actions.type('   ');
    expect(picker.getState()).toMatchObject({ value: '', error: null });
  });

  test('blur tidies valid text and leaves invalid text alone', () => {
    const picker = make();
    picker.actions.type('2083/6/4');
    picker.actions.blur();
    expect(picker.getState().text).toBe('2083-06-04');
    picker.actions.type('2083-6');
    picker.actions.blur();
    expect(picker.getState().text).toBe('2083-6');
  });

  test('display format and locale digits', () => {
    expect(
      make({ defaultValue: '2026-10-10', displayFormat: 'long' }).getState().text,
    ).toBe('24 Ashwin 2083');
    expect(make({ defaultValue: '2026-10-10', locale: 'ne' }).getState().text).toBe(
      '२०८३-०६-२४',
    );
    expect(make({ defaultValue: 'not a date' }).getState().value).toBe('');
  });
});

describe('BS/AD switch (TEST-027)', () => {
  test('switching changes the text and the panel, never the value', () => {
    const onCalendarChange = vi.fn();
    const onChange = vi.fn();
    const picker = make({ defaultValue: '2026-10-10', onCalendarChange, onChange });
    picker.actions.switchCalendar('AD');

    expect(picker.getState()).toMatchObject({
      value: '2026-10-10',
      text: '2026-10-10',
      calendar: 'AD',
      equivalentText: '24 Ashwin 2083 BS',
    });
    expect(picker.getState().calendarState.calendar).toBe('AD');
    expect(onCalendarChange).toHaveBeenCalledWith('AD');
    expect(onChange).not.toHaveBeenCalled();

    picker.actions.switchCalendar('AD'); // no change
    expect(onCalendarChange).toHaveBeenCalledOnce();
  });

  test('invalid text is kept when switching', () => {
    const picker = make();
    picker.actions.type('2083-13-01');
    picker.actions.switchCalendar('AD');
    expect(picker.getState().text).toBe('2083-13-01');
  });

  test('a fixed calendar ignores switching; setOptions can change it', () => {
    const picker = make({ calendar: 'BS', defaultValue: '2026-10-10' });
    picker.actions.switchCalendar('AD');
    expect(picker.getState().calendar).toBe('BS');
    picker.setOptions({ calendar: 'AD' });
    expect(picker.getState()).toMatchObject({ calendar: 'AD', text: '2026-10-10' });
  });
});

describe('outside values and the echo guard (TEST-028)', () => {
  test('passing back the value the user typed keeps their text', () => {
    const picker = make({ onChange: (value) => picker.setOptions({ value }) });
    picker.actions.type('2083/6/24');
    expect(picker.getState()).toMatchObject({ value: '2026-10-10', text: '2083/6/24' });
  });

  test('a different outside value replaces the text without onChange', () => {
    const onChange = vi.fn();
    const picker = make({ onChange });
    picker.actions.type('2083/6/24');
    picker.setOptions({ value: '2026-12-25' });
    expect(picker.getState()).toMatchObject({
      value: '2026-12-25',
      text: '2083-09-10',
      error: null,
    });
    picker.actions.setValue('');
    expect(picker.getState().text).toBe('');
    expect(onChange).toHaveBeenCalledOnce();
  });

  test('changing locale or format re-renders the text', () => {
    const picker = make({ defaultValue: '2026-10-10' });
    picker.setOptions({ locale: 'ne' });
    expect(picker.getState().text).toBe('२०८३-०६-२४');
    picker.setOptions({ displayFormat: 'long' });
    expect(picker.getState().text).toBe('२४ असोज २०८३');
  });
});

describe('panel, today, clear and reset (TEST-029)', () => {
  test('opening shows the value’s month; picking sets the value and closes', () => {
    const onChange = vi.fn();
    const picker = make({ defaultValue: '2026-12-25', onChange });
    picker.actions.open();
    expect(picker.getState().open).toBe(true);
    expect(picker.getState().calendarState.title).toBe('Poush 2083');

    expect(picker.actions.select(bs('2083-09-12'))).toBe(true);
    expect(picker.getState()).toMatchObject({
      value: '2026-12-27',
      text: '2083-09-12',
      open: false,
    });
    expect(onChange).toHaveBeenCalledWith(
      '2026-12-27',
      expect.objectContaining({ bs: bs('2083-09-12') }),
    );
  });

  test('opening without a value shows today; toggle closes', () => {
    const picker = make();
    picker.actions.toggle();
    expect(picker.getState().calendarState.title).toBe('Kartik 2083');
    picker.actions.toggle();
    expect(picker.getState().open).toBe(false);
  });

  test('closeOnSelect false keeps the panel open; adapters may use the calendar store directly', () => {
    const picker = make({ closeOnSelect: false });
    picker.actions.open();
    picker.calendar.actions.select(bs('2083-07-05'));
    expect(picker.getState()).toMatchObject({ value: '2026-10-22', open: true });
  });

  test('disabled days cannot be picked; today respects limits', () => {
    const picker = make({ max: '2026-10-01' });
    expect(picker.actions.select(bs('2083-07-05'))).toBe(false);
    expect(picker.actions.selectToday()).toBe(false);
    const open = make();
    expect(open.actions.selectToday()).toBe(true);
    expect(open.getState().value).toBe('2026-10-18');
  });

  test('clear and reset report the change', () => {
    const onChange = vi.fn();
    const picker = make({ defaultValue: '2026-10-10', onChange });
    picker.actions.clear();
    expect(picker.getState().value).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('', null);
    picker.actions.reset();
    expect(picker.getState()).toMatchObject({ value: '2026-10-10', text: '2083-06-24' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('store behaviour', () => {
  test('one action notifies once, after the state is updated', () => {
    const picker = make();
    const seen: string[] = [];
    picker.subscribe(() => seen.push(picker.getState().value));
    picker.actions.type('2083-06-24');
    expect(seen).toEqual(['2026-10-10']);
    picker.calendar.actions.next(); // panel moves notify the picker too
    expect(seen).toHaveLength(2);
  });

  test('unsubscribe stops notifications', () => {
    const picker = make();
    const listener = vi.fn();
    const unsubscribe = picker.subscribe(listener);
    unsubscribe();
    picker.actions.type('2083-06-24');
    expect(listener).not.toHaveBeenCalled();
  });

  test('onChange runs after listeners see the new state', () => {
    const order: string[] = [];
    const picker = make({ onChange: () => order.push('change') });
    picker.subscribe(() => order.push('listener'));
    picker.actions.type('2083-06-24');
    expect(order).toEqual(['listener', 'change']);
  });

  test('destroy stops everything', () => {
    const listener = vi.fn();
    const picker = make();
    picker.subscribe(listener);
    picker.destroy();
    picker.actions.type('2083-06-24');
    picker.setOptions({ value: '2026-10-10' });
    picker.actions.switchCalendar('AD');
    expect(picker.actions.select(bs('2083-07-05'))).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(picker.getState().value).toBe('');
  });
});
