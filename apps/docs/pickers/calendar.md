# Calendar

[[toc]]

## Introduction

The calendar is a month view with no input field. Use it to show dates, to pick a date in a page
layout, or as a base for something bigger. Each day shows the other calendar's day number
underneath.

<ClientOnly>
  <div class="demo">
    <nep-calendar value="2026-10-18"></nep-calendar>
  </div>
</ClientOnly>

Click the month or year in the header to jump through month and year tiles.

## Basic usage

::: code-group

```tsx [React]
import { Calendar } from '@nepdatejs/react';

export function Schedule() {
  return <Calendar onSelect={(selection) => console.log(selection)} />;
}
```

```html [HTML]
<nep-calendar id="schedule"></nep-calendar>

<script>
  document.querySelector('#schedule').addEventListener('nep-select', (event) => {
    console.log(event.detail.date); // the day, in the calendar on screen
    console.log(event.detail.value); // its AD "YYYY-MM-DD"
  });
</script>
```

:::

## Selecting

`selectionMode` can be `'single'`, `'range'` or `'multiple'`, and `selected` sets the current
selection:

```tsx
import { useState } from 'react';
import { bsDate, type CalendarDate } from '@nepdatejs/core';
import { Calendar } from '@nepdatejs/react';

export function Picker() {
  const [selected, setSelected] = useState<CalendarDate>(bsDate(2083, 7, 1));

  return (
    <Calendar
      selected={selected}
      onSelect={(selection) => {
        if ('calendar' in selection) {
          setSelected(selection);
        }
      }}
    />
  );
}
```

`onSelect` receives whatever matches the mode:

| Mode | `onSelect` receives |
|---|---|
| `'single'` | The day |
| `'range'` | `{ start, end }`. `end` is `null` after the first click |
| `'multiple'` | The list of chosen days, after the click added or removed one |

On the element, the `range` attribute turns on range mode. `nep-select` then has
`event.detail.range`. Multiple mode is only on the React component and the store.

## Which month is shown

The calendar opens on the selected day's month, or else today's. To control the month, pair
`month` with `onMonthChange`:

```tsx
import { useState } from 'react';
import { bsDate, type CalendarDate } from '@nepdatejs/core';
import { Calendar } from '@nepdatejs/react';

export function Controlled() {
  const [month, setMonth] = useState<CalendarDate>(bsDate(2083, 1, 1));

  return <Calendar month={month} onMonthChange={setMonth} />;
}
```

Any day in the month works as `month`. To set only the starting month, use `defaultVisibleMonth`.

## Calendar and language

```tsx
<Calendar calendar="AD" locale="ne" />;
```

```html
<nep-calendar calendar="AD" locale="ne"></nep-calendar>
```

Unlike the pickers, the calendar has no BS/AD switch.

## Display options

| Prop | Default | Meaning |
|---|---|---|
| `showOtherCalendar` | `true` | The other calendar's day number under each day |
| `showOutsideDays` | `true` | Days from the previous and next months |
| `fixedWeeks` | `false` | Always six rows, so the height never changes |
| `weekStartsOn` | `0` | First day of the week |
| `weekendDays` | `[6]` | Days shown as weekend |

## Limits, holidays and events

`min`, `max` and `isDateDisabled` work as on the pickers, except that on the React component and
the store they take **date objects**, not strings:

```tsx
<Calendar min={bsDate(2083, 1, 1)} max={bsDate(2083, 12, 30)} />;
```

```html
<nep-calendar min="2026-04-14" max="2027-04-13"></nep-calendar>
```

See [Holidays and events](./holidays-events) for marking days.

## Options

| Prop | Type | Meaning |
|---|---|---|
| `calendar` | `'BS' \| 'AD'` | Default `'BS'` |
| `locale` | `string` | Names and digits |
| `selectionMode` | `'single' \| 'range' \| 'multiple'` | Default `'single'` |
| `selected` | date, range or list | The selection |
| `onSelect` | `(selection) => void` | Called on a pick |
| `month`, `onMonthChange` | | Control the visible month |
| `defaultVisibleMonth` | `CalendarDate` | The month shown first |
| `onViewChange` | `(view) => void` | Called when the day, month or year view changes |
| `min`, `max` | `CalendarDate` | Earliest and latest selectable days |
| `isDateDisabled` | `(date) => boolean` | Rule out individual days |
| `holidays`, `events` | | See [Holidays and events](./holidays-events) |
| `today` | `CalendarDate` | Override "today" |
| `theme`, `className` | | Styling |
