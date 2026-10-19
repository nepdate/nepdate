import { describe, expect, test } from 'vitest';
import {
  createDatePicker,
  createDateRangePicker,
  maskDateText,
} from '@nepdate/datepicker';
import { TODAY } from './helpers';

/** Type text one character at a time, as a keyboard would. */
function typeEach(text: string, type: (next: string) => void, read: () => string): void {
  for (const char of text) {
    type(read() + char);
  }
}

describe('maskDateText (PICK-006)', () => {
  test.each([
    ['2', '', '2'],
    ['2083', '208', '2083-'],
    ['2083-0', '2083-', '2083-0'],
    ['2083-06', '2083-0', '2083-06-'],
    ['2083-062', '2083-06', '2083-06-2'],
    ['20830', '2083', '2083-0'],
    ['20830624', '', '2083-06-24'],
    ['२०८३', '२०८', '२०८३-'],
    ['२०८३०६२४', '', '२०८३-०६-२४'],
    ['2083--', '2083-', '2083-'],
    ['2083-06-/', '2083-06-', '2083-06-'],
  ])('%s (was %s) → %s', (next, previous, expected) => {
    expect(maskDateText(next, previous)).toBe(expected);
  });

  test.each([
    ['208', '2083-', 'deleting'],
    ['2083-1', '2083-01', 'deleting'],
    ['2083/6', '2083/', 'another separator'],
    ['2083-6-4', '2083-6-', 'single-digit parts'],
    ['1-2083', '-2083', 'an edit before the end'],
    ['208306241', '20830624', 'too many digits'],
    ['abc', 'ab', 'not digits'],
  ])('%s (was %s) is left alone: %s', (next, previous) => {
    expect(maskDateText(next, previous)).toBe(next);
  });
});

describe('pickers mask typed text (PICK-006)', () => {
  test('typing the dashes yourself gives the same text', () => {
    const picker = createDatePicker({ today: TODAY });
    typeEach(
      '2083-06-24',
      (next) => {
        picker.actions.type(next);
      },
      () => picker.getState().text,
    );
    expect(picker.getState()).toMatchObject({ text: '2083-06-24', value: '2026-10-10' });
  });

  test('typing digits only fills in the dashes and sets the value', () => {
    const picker = createDatePicker({ today: TODAY });
    typeEach(
      '20830624',
      (next) => {
        picker.actions.type(next);
      },
      () => picker.getState().text,
    );
    expect(picker.getState()).toMatchObject({
      text: '2083-06-24',
      value: '2026-10-10',
      error: null,
    });
  });

  test('mask: false keeps the text as typed; compact digits still parse', () => {
    const picker = createDatePicker({ today: TODAY, mask: false });
    typeEach(
      '20830624',
      (next) => {
        picker.actions.type(next);
      },
      () => picker.getState().text,
    );
    expect(picker.getState()).toMatchObject({ text: '20830624', value: '2026-10-10' });
  });

  test('each range field is masked against its own text', () => {
    const picker = createDateRangePicker({ today: TODAY });
    picker.actions.type('start', '20830705');
    typeEach(
      '20830708',
      (next) => {
        picker.actions.type('end', next);
      },
      () => picker.getState().endText,
    );
    expect(picker.getState()).toMatchObject({
      startText: '2083-07-05',
      endText: '2083-07-08',
      value: { start: '2026-10-22', end: '2026-10-25' },
    });
  });
});
