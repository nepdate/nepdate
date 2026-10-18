// Plain Node: render on the server with no window or document (REACT-021, TEST-043).
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import type { CalendarDate } from '@nepdate/core';
import { Calendar, DatePicker } from '@nepdate/react';
import { DateText } from '@nepdate/react/server';

const TODAY: CalendarDate = { calendar: 'AD', year: 2026, month: 10, day: 18 };

describe('server rendering', () => {
  test('renders without touching window, and the same props give the same markup', () => {
    expect(typeof window).toBe('undefined');
    const page = (): string =>
      renderToString(
        <>
          <DatePicker
            today={TODAY}
            defaultValue="2026-10-10"
            name="dob"
            aria-label="When"
            persistCalendar="k"
          />
          <Calendar today={TODAY} />
          <DateText value="2026-10-10" />
        </>,
      );
    const first = page();
    expect(first).toContain('value="2083-06-24"');
    expect(first).toContain('Kartik');
    expect(first).toContain('24 Ashwin 2083');
    expect(page()).toBe(first);
  });
});
