# Date range picker

[[toc]]

## Introduction

The range picker chooses a start and an end date with two fields and one calendar. It's for
things like leave, bookings and report filters.

<ClientOnly>
  <div class="demo">
    <nep-date-range-picker start-label="From" end-label="To"></nep-date-range-picker>
  </div>
</ClientOnly>

The first click sets the start and the second sets the end. While the end is being chosen, the
days in between are highlighted.

## Basic usage

The value is an object with `start` and `end`, both AD strings.

::: code-group

```tsx [React]
import { useState } from 'react';
import { DateRangePicker } from '@nepdatejs/react';

export function Leave() {
  const [range, setRange] = useState({ start: '', end: '' });

  return (
    <DateRangePicker
      value={range}
      onChange={setRange}
      startLabel="From"
      endLabel="To"
    />
  );
}
```

```html [HTML]
<nep-date-range-picker id="leave" start-label="From" end-label="To"></nep-date-range-picker>

<script>
  document.querySelector('#leave').addEventListener('change', (event) => {
    console.log(event.detail.value); // { start: "2026-10-22", end: "2026-10-25" }
  });
</script>
```

:::

The callback's second argument has both dates in both calendars. Either end can be `null`
until it has been chosen:

```tsx
<DateRangePicker
  onChange={(value, detail) => {
    console.log(detail.start?.bs, detail.end?.bs);
  }}
/>;
```

A date typed in the end field that's before the start simply swaps the two.

## Limiting the length

`minDays` and `maxDays` count both ends, so a range from the 1st to the 3rd is three days.

::: code-group

```tsx [React]
<DateRangePicker minDays={2} maxDays={15} />;
```

```html [HTML]
<nep-date-range-picker min-days="2" max-days="15"></nep-date-range-picker>
```

:::

A range outside those limits shows an error such as "Choose at most 15 days."

`min`, `max` and `isDateDisabled` also work, as on the [date picker](./validation).

## Fiscal years

Reports in Nepal usually run by fiscal year, so the range picker has two ways to pick one.

### A fiscal-year view

`fiscalYearView` adds a **Fiscal year** button to the panel. It shows the years as tiles, and
one click selects the whole year, from 1 Shrawan to the end of Asar.

::: code-group

```tsx [React]
<DateRangePicker fiscalYearView />;
```

```html [HTML]
<nep-date-range-picker fiscal-years></nep-date-range-picker>
```

:::

<ClientOnly>
  <div class="demo">
    <nep-date-range-picker fiscal-years start-label="From" end-label="To"></nep-date-range-picker>
  </div>
</ClientOnly>

### Shortcuts

```tsx
<DateRangePicker presets={['thisFiscalYear', 'lastFiscalYear']} />;
```

See [Shortcuts](./presets).

## Forms

In React, use `startName` and `endName`. On the element, `name="leave"` submits `leave-start`
and `leave-end`, or you can set `start-name` and `end-name` yourself.

::: code-group

```tsx [React]
<DateRangePicker startName="from" endName="to" />;
```

```html [HTML]
<nep-date-range-picker name="leave"></nep-date-range-picker>
```

:::

## Options

`DateRangePicker` takes these, as well as the shared `calendar`, `defaultCalendar`, `min`,
`max`, `isDateDisabled`, `holidays`, `locale`, `weekStartsOn`, `weekendDays`,
`showOtherCalendar`, `mask`, `inline`, `panelLayout`, `disabled`, `theme`, `className` and
`today` from the [date picker](./date-picker#options).

| Prop | Type | Meaning |
|---|---|---|
| `value`, `defaultValue` | `{ start, end }` | AD strings; `''` when not chosen |
| `onChange` | `(value, detail) => void` | `detail` is `{ start, end }`, each with `ad` and `bs` |
| `minDays`, `maxDays` | `number` | Shortest and longest range, counting both ends |
| `presets` | `RangePreset[]` | [Shortcuts](./presets) beside the calendar |
| `fiscalYearView` | `boolean` | Show the **Fiscal year** button |
| `startName`, `endName` | `string` | Field names for plain forms |
| `startLabel`, `endLabel` | `string` | Accessible names for the two inputs |
