// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { bsDate, type CalendarDate } from '@nepdate/core';
import {
  bothDates,
  Calendar,
  DateTimePicker,
  DatePicker,
  DateRangePicker,
  DateText,
  shortDate,
  ShortDate,
  type DatePickerProps,
} from '@nepdate/react';

const TODAY: CalendarDate = { calendar: 'AD', year: 2026, month: 10, day: 18 };

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function field(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>('combobox');
}

describe('<DatePicker> (REACT-010, TEST-041)', () => {
  test('uncontrolled: typing sets the hidden AD value and calls onChange', () => {
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <DatePicker
          name="dob"
          today={TODAY}
          onChange={onChange}
          aria-label="Date of birth"
        />
      </form>,
    );
    fireEvent.change(field(), { target: { value: '2083-06-24' } });

    expect(onChange).toHaveBeenCalledWith(
      '2026-10-10',
      expect.objectContaining({ bs: bsDate(2083, 6, 24) }),
    );
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe(
      '2026-10-10',
    );
    expect(screen.getByText('10 October 2026 AD')).toBeDefined();
    expect(field().getAttribute('aria-describedby')).toContain('-hint');
  });

  test('controlled: the parent keeps the value; typed text is not reformatted mid-typing', () => {
    function Controlled(): ReactElement {
      const [value, setValue] = useState('');
      return (
        <>
          <DatePicker today={TODAY} value={value} onChange={setValue} aria-label="When" />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.change(field(), { target: { value: '2083/6/24' } });
    expect(screen.getByRole('status').textContent).toBe('2026-10-10');
    expect(field().value).toBe('2083/6/24');
    fireEvent.blur(field());
    expect(field().value).toBe('2083-06-24');
  });

  test('controlled value changes from outside replace the text', () => {
    const { rerender } = render(
      <DatePicker today={TODAY} value="2026-10-10" aria-label="When" />,
    );
    expect(field().value).toBe('2083-06-24');
    rerender(<DatePicker today={TODAY} value="2026-12-25" aria-label="When" />);
    expect(field().value).toBe('2083-09-10');
  });

  test('errors mark the field invalid and set its validity message', () => {
    render(<DatePicker today={TODAY} min="2026-10-01" aria-label="When" />);
    fireEvent.change(field(), { target: { value: '2083-06-01' } });
    expect(screen.getByText('Choose 2083-06-15 or later.')).toBeDefined();
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(field().validationMessage).toBe('Choose 2083-06-15 or later.');
  });

  test('opens a dialog, moves focus with arrows, picks a day, closes and refocuses the input', () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        today={TODAY}
        defaultValue="2026-10-10"
        onChange={onChange}
        aria-label="When"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));

    const dialog = screen.getByRole('dialog');
    const selected = within(dialog).getByRole('button', {
      name: /^Saturday, 24 Ashwin 2083/,
    });
    expect(document.activeElement).toBe(selected);
    fireEvent.keyDown(selected, { key: 'ArrowDown' });
    const next = within(dialog).getByRole('button', {
      name: /^Saturday, 31 Ashwin 2083/,
    });
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);

    expect(onChange).toHaveBeenLastCalledWith('2026-10-17', expect.anything());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(field());
  });

  test('grid ARIA: one tab stop, pressed and current day, labelled navigation', () => {
    render(<DatePicker today={TODAY} defaultValue="2026-10-10" aria-label="When" />);
    fireEvent.keyDown(field(), { key: 'ArrowDown', altKey: true });
    const grid = screen.getByRole('grid', { name: 'Ashwin 2083' });
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(within(grid).getByRole('button', { pressed: true }).textContent).toMatch(
      /^Saturday, 24 Ashwin/,
    );
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(
      screen
        .getByRole('grid', { name: 'Kartik 2083' })
        .querySelector('[aria-current="date"]'),
    ).not.toBeNull();
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('When: Calendar');
  });

  test('Escape and outside clicks close; Today picks today', () => {
    const onChange = vi.fn();
    render(<DatePicker today={TODAY} onChange={onChange} aria-label="When" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenCalledWith('2026-10-18', expect.anything());
  });

  test('BS/AD switch, remembered choice, and a fixed calendar', () => {
    const { unmount } = render(
      <DatePicker
        today={TODAY}
        defaultValue="2026-10-10"
        persistCalendar="ndp-react"
        aria-label="When"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Calendar: BS → AD/ }));
    expect(field().value).toBe('2026-10-10');
    expect(localStorage.getItem('ndp-react')).toBe('AD');
    unmount();

    render(
      <DatePicker
        today={TODAY}
        defaultValue="2026-10-10"
        persistCalendar="ndp-react"
        aria-label="When"
      />,
    );
    expect(field().value).toBe('2026-10-10');
    cleanup();

    render(<DatePicker today={TODAY} calendar="AD" aria-label="When" />);
    expect(screen.queryByRole('button', { name: /^Calendar:/ })).toBeNull();
    expect(field().placeholder).toBe('YYYY-MM-DD (AD)');
  });

  test('the panel segment switches calendars; month and year views drill down', () => {
    render(<DatePicker today={TODAY} defaultValue="2026-10-10" aria-label="When" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.click(screen.getByRole('button', { name: 'AD', pressed: false }));
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'BS', pressed: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Year: 2083' }));
    fireEvent.click(screen.getByRole('button', { name: /^2080/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Baisakh/ }));
    expect(screen.getByRole('grid', { name: 'Baisakh 2080' })).toBeDefined();
  });

  test('clear, form reset and disabled', () => {
    const { container } = render(
      <form>
        <DatePicker
          name="dob"
          today={TODAY}
          defaultValue="2026-10-10"
          aria-label="When"
        />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(field().value).toBe('');
    expect(document.activeElement).toBe(field());
    act(() => {
      container.querySelector('form')?.dispatchEvent(new Event('reset'));
    });
    expect(field().value).toBe('2083-06-24');
    cleanup();
    render(<DatePicker today={TODAY} disabled aria-label="When" />);
    expect(field().disabled).toBe(true);
  });

  test('inline objects, arrays and functions do not re-render forever', () => {
    let renders = 0;
    function Inline(props: Partial<DatePickerProps>): ReactElement {
      renders += 1;
      return (
        <DatePicker
          today={{ calendar: 'AD', year: 2026, month: 10, day: 18 }}
          holidays={[
            { date: { calendar: 'BS', year: 2083, month: 7, day: 3 }, label: 'Holiday' },
          ]}
          weekendDays={[6]}
          isDateDisabled={(date) => date.day === 13}
          aria-label="When"
          {...props}
        />
      );
    }
    render(<Inline />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(renders).toBeLessThan(5);
    expect(
      screen
        .getByRole('button', { name: /3 Kartik 2083.*Holiday$/ })
        .getAttribute('data-state'),
    ).toBe('holiday');
    expect(
      screen.getByRole('button', { name: /13 Kartik 2083/ }).hasAttribute('disabled'),
    ).toBe(true);
  });
});

describe('<Calendar> (REACT-011)', () => {
  test('selects a day and reports month changes', () => {
    const onSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <Calendar
        today={TODAY}
        onSelect={onSelect}
        onMonthChange={onMonthChange}
        locale="ne"
        theme="dark"
      />,
    );
    expect(screen.getByRole('grid', { name: 'कार्तिक २०८३' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /^बिहिबार, ५ कार्तिक/ }));
    expect(onSelect).toHaveBeenCalledWith(bsDate(2083, 7, 5));
    fireEvent.click(screen.getByRole('button', { name: 'अर्को महिना' }));
    expect(onMonthChange).toHaveBeenCalledWith(bsDate(2083, 8, 1));
  });

  test('range mode previews on hover', () => {
    const { container } = render(<Calendar today={TODAY} selectionMode="range" />);
    fireEvent.click(screen.getByRole('button', { name: /^Thursday, 5 Kartik/ }));
    fireEvent.mouseEnter(screen.getByRole('button', { name: /^Sunday, 8 Kartik/ }));
    expect(container.querySelectorAll('[data-preview]').length).toBe(3);
    fireEvent.mouseLeave(screen.getByRole('grid'));
    expect(container.querySelectorAll('[data-preview]').length).toBe(0);
  });
});

describe('<DateRangePicker> (REACT-012)', () => {
  test('two clicks set the range and fill both hidden fields', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateRangePicker
        today={TODAY}
        onChange={onChange}
        startName="from"
        endName="to"
        startLabel="From"
        endLabel="To"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.click(screen.getByRole('button', { name: /^Thursday, 5 Kartik/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Sunday, 8 Kartik/ }));
    expect(onChange).toHaveBeenLastCalledWith(
      { start: '2026-10-22', end: '2026-10-25' },
      expect.anything(),
    );
    const hidden = container.querySelectorAll<HTMLInputElement>('input[type="hidden"]');
    expect([...hidden].map((input) => input.value)).toEqual(['2026-10-22', '2026-10-25']);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('typing and length errors', () => {
    render(<DateRangePicker today={TODAY} maxDays={3} startLabel="From" endLabel="To" />);
    fireEvent.change(screen.getByRole('combobox', { name: 'From' }), {
      target: { value: '2083-07-01' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'To' }), {
      target: { value: '2083-07-10' },
    });
    expect(screen.getByText('Choose at most 3 days.')).toBeDefined();
    expect(
      screen.getByRole('combobox', { name: 'To' }).getAttribute('aria-invalid'),
    ).toBe('true');
  });
});

describe('presets (PRE-006)', () => {
  test('DatePicker shows shortcuts beside the calendar and applies them', () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        today={TODAY}
        presets={['today', 'yesterday']}
        onChange={onChange}
        aria-label="When"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    const group = screen.getByRole('group', { name: 'Shortcuts' });
    fireEvent.click(within(group).getByRole('button', { name: 'Yesterday' }));
    expect(onChange).toHaveBeenCalledWith('2026-10-17', expect.anything());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(field());
  });

  test('DateRangePicker presets mark the active one and disable unusable ones', () => {
    render(
      <DateRangePicker
        today={TODAY}
        max="2026-10-20"
        presets={['last7Days', 'thisWeek']}
        startLabel="From"
        endLabel="To"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(
      screen.getByRole('button', { name: 'This week' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(screen.getByRole<HTMLInputElement>('combobox', { name: 'From' }).value).toBe(
      '2083-06-26',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(
      screen.getByRole('button', { name: 'Last 7 days' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });
});

describe('fiscal-year view (FY-001)', () => {
  test('the Fiscal year button shows fiscal-year tiles; one click picks the whole year', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        today={TODAY}
        fiscalYearView
        onChange={onChange}
        startLabel="From"
        endLabel="To"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fiscal year' }));
    expect(
      screen.getByRole('button', { name: 'Fiscal year', pressed: true }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '2083/84 (2026/27)' }));
    const [value] = onChange.mock.lastCall as [{ start: string; end: string }];
    expect(value.start).toBe('2026-07-17');
    expect(value.end).toMatch(/^2027-07-1\d$/);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('<DateTimePicker> (TIME-003)', () => {
  test('type a date and time, or pick from the calendar and the time columns', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTimePicker
        today={TODAY}
        name="starts"
        onChange={onChange}
        aria-label="Starts"
        timeLabel="Start time"
        minuteStep={15}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Starts' }), {
      target: { value: '2083-06-24' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Start time' }), {
      target: { value: '9:30' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      '2026-10-10T09:30:00+05:45',
      expect.anything(),
    );
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe(
      '2026-10-10T09:30:00+05:45',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    const hours = screen.getByRole('group', { name: 'Hour' });
    fireEvent.click(within(hours).getByRole('button', { name: '17' }));
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Minute' })).getByRole('button', {
        name: '45',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: /^Sunday, 25 Ashwin/ }));
    expect(onChange).toHaveBeenLastCalledWith(
      '2026-10-11T17:45:00+05:45',
      expect.anything(),
    );
    expect(screen.getByRole('dialog')).toBeDefined(); // stays open to adjust the time
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('invalid times are shown on the time field', () => {
    render(
      <DateTimePicker
        today={TODAY}
        defaultValue="2026-10-10T09:00:00+05:45"
        aria-label="Starts"
      />,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Time' }), {
      target: { value: '99' },
    });
    expect(screen.getByText('Enter a time as HH:MM.')).toBeDefined();
    expect(
      screen.getByRole('textbox', { name: 'Time' }).getAttribute('aria-invalid'),
    ).toBe('true');
  });
});

describe('inline mode (PICK-004)', () => {
  test('the calendar is in the page from the start and stays after a pick', () => {
    const onChange = vi.fn();
    render(<DatePicker today={TODAY} inline onChange={onChange} aria-label="When" />);
    const panel = screen.getByRole('group', { name: 'When: Calendar' });
    expect(panel.dataset['layout']).toBe('inline');
    expect(panel.hasAttribute('popover')).toBe(false);
    expect(panel.style.getPropertyValue('--ndp-panel-width')).toBe('320px');
    // A plain text field, no toggle, and focus is not moved on mount.
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'When' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Open calendar' })).toBeNull();
    expect(document.activeElement).toBe(document.body);

    fireEvent.click(within(panel).getByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenCalledWith('2026-10-18', expect.anything());
    fireEvent.keyDown(document.body, { key: 'Escape' });
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('group', { name: 'When: Calendar' })).toBeDefined();
  });

  test('range and date-time pickers render inline too', () => {
    render(<DateRangePicker today={TODAY} inline />);
    expect(screen.getByRole('group', { name: 'Choose a date' }).dataset['layout']).toBe(
      'inline',
    );
    expect(screen.queryByRole('combobox')).toBeNull();
    cleanup();

    render(<DateTimePicker today={TODAY} inline aria-label="Starts" />);
    const panel = screen.getByRole('group', { name: 'Choose a date' });
    expect(panel.style.getPropertyValue('--ndp-panel-width')).toBe('456px');
    expect(screen.queryByRole('button', { name: 'Open calendar' })).toBeNull();
  });
});

describe('input masking (PICK-006)', () => {
  test('typing digits fills in the dashes; mask={false} turns it off', () => {
    const onChange = vi.fn();
    render(<DatePicker today={TODAY} onChange={onChange} aria-label="When" />);
    for (const char of '20830624') {
      fireEvent.change(field(), { target: { value: field().value + char } });
    }
    expect(field().value).toBe('2083-06-24');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-10', expect.anything());
    cleanup();

    render(<DatePicker today={TODAY} mask={false} aria-label="When" />);
    fireEvent.change(field(), { target: { value: '2083' } });
    expect(field().value).toBe('2083');
  });
});

describe('bottom sheet (PICK-007)', () => {
  const backdropTap = (panel: HTMLElement): void => {
    // happy-dom lays nothing out, so the panel box is 0×0 and any point is outside it.
    fireEvent.pointerDown(panel, { clientX: 100, clientY: 100 });
  };

  test('panelLayout="sheet" opens a bottom sheet; a backdrop tap closes it', () => {
    render(<DatePicker today={TODAY} panelLayout="sheet" aria-label="When" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    const panel = screen.getByRole('dialog');
    expect(panel.dataset['layout']).toBe('sheet');
    expect(panel.style.top).toBe('');
    fireEvent.click(within(panel).getByRole('button', { name: 'Today' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    backdropTap(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('auto keeps the popover on wide screens; range and date-time take the prop too', () => {
    render(<DatePicker today={TODAY} aria-label="When" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog').dataset['layout']).toBe('popover');
    cleanup();

    render(<DateRangePicker today={TODAY} panelLayout="sheet" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog').dataset['layout']).toBe('sheet');
    backdropTap(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();

    render(<DateTimePicker today={TODAY} panelLayout="sheet" aria-label="Starts" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog').dataset['layout']).toBe('sheet');
  });
});

describe('dates as text (REACT-013, REACT-014)', () => {
  test('DateText, ShortDate, shortDate and bothDates', () => {
    render(
      <>
        <DateText value="2026-09-26" />
        <DateText value="2026-09-26" calendar="AD" locale="ne" withEquivalent={false} />
        <DateText value={null} fallback="none" />
        <ShortDate value="2026-08-16" />
        <ShortDate value="" />
      </>,
    );
    expect(screen.getByText('10 Ashwin 2083').closest('time')?.textContent).toBe(
      '10 Ashwin 2083 · 26 Sep 2026',
    );
    expect(screen.getByText('२६ सेप्टेम्बर २०२६')).toBeDefined();
    expect(screen.getByText('none')).toBeDefined();
    expect(screen.getByText('31 Shrawan 2083').getAttribute('title')).toBe('16 Aug 2026');
    expect(shortDate('2026-04-13T20:00:00Z')).toBe('1 Baisakh 2083, 01:45');
    expect(shortDate('2026-10-18 09:30')).toBe('1 Kartik 2083, 09:30');
    expect(shortDate('soon')).toBe('soon');
    expect(shortDate(null)).toBeNull();
    expect(bothDates('2026-08-16')).toBe('31 Shrawan 2083 (16 Aug 2026)');
    expect(bothDates('n/a')).toBe('n/a');
  });
});
