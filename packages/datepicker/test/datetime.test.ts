import { afterEach, describe, expect, test, vi } from 'vitest';
import { bsDate } from '@nepdate/core';
import { createDateTimePicker, type DateTimeDetail } from '@nepdate/datepicker';
import { TODAY } from './helpers';

const make = (options: Parameters<typeof createDateTimePicker>[0] = {}) =>
  createDateTimePicker({ today: TODAY, ...options });

afterEach(() => {
  vi.useRealTimers();
});

describe('date and time picker (TIME-002)', () => {
  test('a date alone gets the default time; typing a time completes the instant', () => {
    const onChange = vi.fn<(value: string, detail: DateTimeDetail | null) => void>();
    const picker = make({ onChange });
    picker.actions.typeDate('2083-06-24');
    expect(picker.getState()).toMatchObject({
      value: '2026-10-10T00:00:00+05:45',
      timeText: '00:00',
    });

    picker.actions.typeTime('2:30 pm');
    expect(picker.getState().value).toBe('2026-10-10T14:30:00+05:45');
    expect(picker.getState().timeText).toBe('2:30 pm');
    picker.actions.blurTime();
    expect(picker.getState().timeText).toBe('14:30');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.lastCall?.[1]).toMatchObject({
      bs: bsDate(2083, 6, 24),
      time: { hour: 14, minute: 30 },
    });
  });

  test('blurring the date tidies its text', () => {
    const picker = make();
    picker.actions.typeDate('2083/6/4');
    picker.actions.blurDate();
    expect(picker.getState().dateText).toBe('2083-06-04');
  });

  test('defaultTime and 12-hour display', () => {
    const picker = make({ defaultTime: '09:00', hour12: true });
    picker.actions.selectDate(bsDate(2083, 7, 5));
    expect(picker.getState()).toMatchObject({
      value: '2026-10-22T09:00:00+05:45',
      timeText: '9:00 AM',
      timePlaceholder: 'h:mm AM',
    });
    expect(picker.getState().hours[13]?.label).toBe('1 PM');
    expect(picker.getState().open).toBe(false);
  });

  test('an invalid time is an error on the time field and clears the value', () => {
    const picker = make({ defaultValue: '2026-10-10T08:00:00+05:45' });
    picker.actions.typeTime('25:99');
    expect(picker.getState().error).toEqual({
      code: 'format',
      message: 'Enter a time as HH:MM.',
      field: 'time',
    });
    expect(picker.getState().value).toBe('');
    picker.actions.blurTime();
    expect(picker.getState().timeText).toBe('25:99');
    picker.actions.typeTime('');
    expect(picker.getState()).toMatchObject({ error: null, value: '', time: null });
  });

  test('hour and minute columns', () => {
    const picker = make({
      defaultValue: '2026-10-10T08:00:00+05:45',
      minuteStep: 15,
      locale: 'ne',
    });
    expect(picker.getState().minutes.map((m) => m.label)).toEqual([
      '००',
      '१५',
      '३०',
      '४५',
    ]);
    picker.actions.selectHour(17);
    picker.actions.selectMinute(45);
    expect(picker.getState().value).toBe('2026-10-10T17:45:00+05:45');
    expect(picker.getState().hours.find((h) => h.isSelected)?.value).toBe(17);
    expect(picker.getState().minutes.find((m) => m.isSelected)?.value).toBe(45);
    const fresh = make();
    fresh.actions.selectMinute(30);
    expect(fresh.getState().time).toEqual({ hour: 0, minute: 30 });
    expect(fresh.getState().value).toBe('');
  });

  test('values from another zone are shown in the picker zone; the value carries its offset', () => {
    const picker = make({ value: '2026-10-18T09:00:00Z' });
    expect(picker.getState()).toMatchObject({
      dateText: '2083-07-01',
      timeText: '14:45',
      value: '2026-10-18T14:45:00+05:45',
    });
    const utc = make({ timeZone: 'UTC', value: '2026-10-18T09:00' });
    expect(utc.getState().value).toBe('2026-10-18T09:00:00+00:00');
  });

  test('outside values do not call onChange; the same instant leaves the texts alone', () => {
    const onChange = vi.fn();
    const picker = make({ onChange });
    picker.actions.typeDate('2083/6/24');
    picker.actions.typeTime('9');
    onChange.mockClear();
    picker.setOptions({ value: '2026-10-10T09:00:00+05:45' });
    expect(picker.getState()).toMatchObject({ dateText: '2083/6/24', timeText: '09:00' });
    picker.actions.setValue('2026-12-25T18:30:00+05:45');
    expect(picker.getState()).toMatchObject({
      dateText: '2083-09-10',
      timeText: '18:30',
    });
    expect(onChange).not.toHaveBeenCalled();
    picker.setOptions({ hour12: true });
    expect(picker.getState().timeText).toBe('6:30 PM');
  });

  test('now, presets, clear, reset and switching calendars', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T20:00:00Z'));
    const picker = make({
      today: undefined,
      defaultValue: '2026-10-10T08:15:00+05:45',
      presets: ['yesterday'],
    });
    expect(picker.actions.selectNow()).toBe(true);
    expect(picker.getState().value).toBe('2026-04-14T01:45:00+05:45');

    picker.actions.applyPreset('yesterday');
    expect(picker.getState().value).toBe('2026-04-13T01:45:00+05:45');
    picker.actions.switchCalendar('AD');
    expect(picker.getState()).toMatchObject({ dateText: '2026-04-13', calendar: 'AD' });

    picker.actions.clear();
    expect(picker.getState()).toMatchObject({ value: '', dateText: '', timeText: '' });
    picker.actions.reset();
    expect(picker.getState().value).toBe('2026-10-10T08:15:00+05:45');
    picker.actions.open();
    expect(picker.getState().open).toBe(true);
    picker.actions.toggle();
    picker.actions.toggle();
    picker.actions.close();
    expect(picker.getState().open).toBe(false);
    expect(picker.calendar.getState().calendar).toBe('AD');
  });

  test('destroy stops everything', () => {
    const picker = make();
    const listener = vi.fn();
    picker.subscribe(listener);
    picker.destroy();
    picker.actions.typeTime('10:00');
    picker.setOptions({ hour12: true });
    expect(picker.actions.selectNow()).toBe(false);
    expect(picker.actions.selectDate(bsDate(2083, 7, 1))).toBe(false);
    expect(picker.actions.applyPreset('today')).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
