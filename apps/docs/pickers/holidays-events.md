# Holidays and events

[[toc]]

## Introduction

Calendars and pickers can mark days. A **holiday** turns the day red and adds its name to the label
screen readers announce. An **event** adds a small coloured dot.

Neither one stops a day being picked. To do that, use
[`isDateDisabled`](./validation#disabling-days).

## Marking holidays

The easy way is a list of dates, with or without a label:

```tsx
import { bsDate } from '@nepdate/core';
import { DatePicker } from '@nepdate/react';

const holidays = [
  { date: bsDate(2083, 6, 3), label: 'Constitution Day' },
  bsDate(2083, 7, 15),
];

export function Booking() {
  return <DatePicker holidays={holidays} />;
}
```

Or a function, which suits lists from an API. Return `true`, an object with a `label`, or
`null`:

```tsx
<DatePicker
  holidays={(date) => (date.day === 1 ? { label: 'Payday' } : null)}
/>;
```

On an element, set it as a property:

```js
document.querySelector('nep-date-picker').holidays = [
  { date: { calendar: 'BS', year: 2083, month: 6, day: 3 }, label: 'Constitution Day' },
];
```

## Nepal's national holidays

[`@nepdate/holidays`](/guide/holidays) has the fixed-date national days, and can load each
year's official list. `toCalendarHolidays` turns them into the function above:

```tsx
import { toCalendarHolidays } from '@nepdate/holidays';
import { DatePicker } from '@nepdate/react';

const holidays = toCalendarHolidays({ locale: 'ne' });

export function Booking() {
  return <DatePicker holidays={holidays} />;
}
```

## Event dots

`events` is a function that returns a list of markers for a day. The first marker shows as a
dot under the day number.

```tsx
import { Calendar } from '@nepdate/react';

export function Schedule() {
  return (
    <Calendar
      events={(date) =>
        date.day === 15 ? [{ id: 'exam', color: '#16a34a', label: 'Exam' }] : []
      }
    />
  );
}
```

A marker has an optional `id`, `color` and `label`. The built-in calendar only draws the dot, but
all the markers are on each day's `events` if you [build your own](/integrations/stores).

The function is called for every visible day, so look dates up in a `Map` or `Set` instead of
searching a long list each time.

## Weekends

Weekend days are shown in red. Saturday is the default, and you can change it for a component or
[for your whole app](/guide/configuration#week-and-weekend):

```tsx
<DatePicker weekendDays={[6, 0]} weekStartsOn={1} />;
```
