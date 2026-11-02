# Testing

[[toc]]

## Introduction

Dates make tests flaky when they depend on the real date. nepdate gives you a simple way to fix
"today", and date objects are easy to compare.

## Fixing "today"

Every calendar and picker takes a `today` option. Use it, and tests give the same result on any day:

```tsx
import { render, screen } from '@testing-library/react';
import { test } from 'vitest';
import { adDate } from '@nepdate/core';
import { DatePicker } from '@nepdate/react';

test('shows the day', () => {
  render(<DatePicker today={adDate(2026, 10, 18)} aria-label="Date" />);
  screen.getByRole('combobox', { name: 'Date' });
});
```

Stores take it too:

```ts
import { createCalendar } from '@nepdate/calendar';

const calendar = createCalendar({ today: adDate(2026, 10, 18) });

calendar.getState().title; // → 'Kartik 2083'
```

For code that calls `today()` directly, use your test runner's fake timers, such as
`vi.setSystemTime`.

## Comparing dates

Dates are plain objects, so a deep comparison works:

```ts
import { expect, test } from 'vitest';
import { adDate, adToBs, bsDate } from '@nepdate/core';

test('converts', () => {
  expect(adToBs(adDate(2026, 10, 18))).toEqual(bsDate(2083, 7, 1));
});
```

## Testing components

### Picking a day

Each day button is named with its full date, so tests read clearly:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { adDate } from '@nepdate/core';
import { DatePicker } from '@nepdate/react';

test('picks a day', () => {
  const onChange = vi.fn();
  render(<DatePicker today={adDate(2026, 10, 18)} onChange={onChange} aria-label="Date" />);

  fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
  fireEvent.click(screen.getByRole('button', { name: /^Thursday, 5 Kartik/ }));

  expect(onChange).toHaveBeenCalledWith('2026-10-22', expect.anything());
});
```

### Typing

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { DatePicker } from '@nepdate/react';

test('types a date', () => {
  const onChange = vi.fn();
  render(<DatePicker onChange={onChange} aria-label="Date" />);

  fireEvent.change(screen.getByRole('combobox'), { target: { value: '2083-06-24' } });

  expect(onChange).toHaveBeenCalledWith('2026-10-10', expect.anything());
});
```

## Test environments

The components run in jsdom and happy-dom. Neither has a real top layer or layout, and the panel
falls back to fixed positioning, which is fine for tests.

Web Components need the elements registered first:

```js
import '@nepdate/vanilla/define';
```

happy-dom doesn't call `formResetCallback` on `form.reset()`. Call it yourself in a test, as
browsers do this for you.

## Resetting global state

If a test calls `configure`, `patchBsYear` or `registerHolidays`, clean up afterwards:

```ts
import { afterEach } from 'vitest';
import { resetBsData, resetConfig } from '@nepdate/core';
import { clearHolidays } from '@nepdate/holidays';

afterEach(() => {
  resetConfig();
  resetBsData();
  clearHolidays();
});
```
