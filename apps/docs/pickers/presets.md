# Shortcuts (presets)

[[toc]]

## Introduction

Shortcuts are buttons beside the calendar for dates people often want, such as "Today" or "This
fiscal year". On a phone they sit above the calendar.

<ClientOnly>
  <div class="demo">
    <nep-date-range-picker presets="last7Days, thisMonth, lastMonth, thisFiscalYear" start-label="From" end-label="To"></nep-date-range-picker>
  </div>
</ClientOnly>

## Using shortcuts

::: code-group

```tsx [React]
<>
  <DatePicker presets={['today', 'yesterday']} />
  <DateRangePicker presets={['last7Days', 'thisMonth', 'thisFiscalYear']} />
</>;
```

```html [HTML]
<nep-date-picker presets="today, yesterday"></nep-date-picker>
<nep-date-range-picker presets="last7Days, thisMonth, thisFiscalYear"></nep-date-range-picker>
```

:::

The button that matches the current value is highlighted. A shortcut is disabled when its date
falls outside `min` and `max`, or breaks `minDays` and `maxDays`.

## Built-in shortcuts

**Date picker and date and time picker**

| ID | Means |
|---|---|
| `today` | Today |
| `yesterday` | Yesterday |
| `tomorrow` | Tomorrow |

**Range picker**

| ID | Means |
|---|---|
| `today`, `yesterday` | That single day |
| `thisWeek`, `lastWeek` | A whole week |
| `last7Days`, `last30Days` | Ending today |
| `thisMonth`, `lastMonth` | A whole month |
| `thisYear` | A whole year |
| `thisFiscalYear`, `lastFiscalYear` | 1 Shrawan to the end of Asar |

Weeks, months and years count in the calendar on screen. "This month" is the BS month in BS
mode and the AD month in AD mode.

Names come from the locale, so they follow `locale`.

## Your own shortcuts

A custom shortcut has an `id`, a `label` and a `resolve` function that returns the date, or for
ranges `{ start, end }`.

```tsx
import { addDays, bsDate } from '@nepdatejs/core';
import { DatePicker, DateRangePicker } from '@nepdatejs/react';

export function Filters() {
  return (
    <>
      <DatePicker
        presets={[
          'today',
          { id: 'admission', label: 'Admission day', resolve: () => bsDate(2083, 1, 15) },
        ]}
      />
      <DateRangePicker
        presets={[
          {
            id: 'next-week',
            label: 'Next 7 days',
            resolve: ({ today }) => ({ start: today, end: addDays(today, 6) }),
          },
        ]}
      />
    </>
  );
}
```

`resolve` receives a context:

| Field | Meaning |
|---|---|
| `today` | Today as an AD date, in the configured time zone |
| `calendar` | The calendar on screen |
| `weekStartsOn` | The first day of the week |

On an element, custom shortcuts are objects, so set them as a property:

```js
document.querySelector('nep-date-picker').presets = [
  'today',
  {
    id: 'admission',
    label: 'Admission day',
    resolve: () => ({ calendar: 'BS', year: 2083, month: 1, day: 15 }),
  },
];
```

## Using shortcuts in code

With a store, list them from state and apply one by ID:

```ts
import { createDateRangePicker } from '@nepdatejs/datepicker';

const picker = createDateRangePicker({
  presets: ['thisFiscalYear'],
  today: adDate(2026, 10, 18),
});

picker.actions.applyPreset('thisFiscalYear'); // → true
picker.getState().value; // → { start: '2026-07-17', end: '2027-07-16' }
picker.getState().presets[0]?.isActive; // → true
```
