import { describe, expect, test } from 'vitest';
import {
  createDatePicker,
  createDateRangePicker,
  createDateTimePicker,
} from '@nepdate/datepicker';
import { bs, TODAY } from './helpers';

describe('inline pickers (PICK-004)', () => {
  test('always open: close, toggle and a pick never hide the calendar', () => {
    const picker = createDatePicker({ today: TODAY, inline: true });
    expect(picker.getState()).toMatchObject({ open: true, inline: true });
    picker.actions.close();
    picker.actions.toggle();
    picker.actions.select(bs('2083-06-24'));
    expect(picker.getState()).toMatchObject({ open: true, value: '2026-10-10' });

    picker.setOptions({ inline: false });
    expect(picker.getState()).toMatchObject({ open: false, inline: false });
  });

  test('range and date-time pickers report inline too', () => {
    const range = createDateRangePicker({ today: TODAY, inline: true });
    range.actions.select(bs('2083-07-05'));
    range.actions.select(bs('2083-07-08'));
    expect(range.getState()).toMatchObject({ open: true, inline: true });

    const dateTime = createDateTimePicker({ today: TODAY, inline: true });
    expect(dateTime.getState()).toMatchObject({ open: true, inline: true });
    expect(createDateTimePicker({ today: TODAY }).getState().inline).toBe(false);
  });
});
