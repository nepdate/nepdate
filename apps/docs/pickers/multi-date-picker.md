# Multiple dates

[[toc]]

## Introduction

This picker chooses several separate days in one field, such as days off or class dates.
Clicking a day adds it, and clicking it again removes it. The panel stays open while you choose,
and **Done** closes it.

<ClientOnly>
  <div class="demo">
    <nep-multi-date-picker label="Days off" max-dates="5"></nep-multi-date-picker>
  </div>
</ClientOnly>

If the days form a continuous stretch, the [range picker](./range-picker) is a better fit.

## Basic usage

The value is a list of AD strings, sorted, with no repeats.

::: code-group

```tsx [React]
import { useState } from 'react';
import { MultiDatePicker } from '@nepdate/react';

export function DaysOff() {
  const [days, setDays] = useState<readonly string[]>([]);

  return <MultiDatePicker value={days} onChange={setDays} aria-label="Days off" />;
}
```

```html [HTML]
<nep-multi-date-picker id="days" label="Days off"></nep-multi-date-picker>

<script>
  document.querySelector('#days').addEventListener('change', (event) => {
    console.log(event.detail.value); // ["2026-10-22", "2026-10-25"]
  });
</script>
```

:::

The second callback argument has each day in both calendars, as a list of `{ ad, bs }`.

## Typing

The field lists the days as `YYYY-MM-DD`, separated by commas, and it can be typed too. Commas
or spaces both work, and only the day being typed gets [dashes added](./typing):

```text
2083-07-01, 2083-07-05
```

A bad day shows its error and keeps the good ones. The field always writes dates as
`YYYY-MM-DD` so they can be typed back, which means `displayFormat` isn't used here.

## Limiting the count

`maxDates` stops a click past the limit and shows a message such as "Choose at most 5 dates."
Removing a day always works.

::: code-group

```tsx [React]
<MultiDatePicker maxDates={5} />;
```

```html [HTML]
<nep-multi-date-picker max-dates="5"></nep-multi-date-picker>
```

:::

## Forms

With `name`, the form gets one entry per day, in the same way as checkboxes that share a name:

```html
<nep-multi-date-picker name="days-off" value="2026-10-18,2026-10-20"></nep-multi-date-picker>
```

```text
days-off=2026-10-18&days-off=2026-10-20
```

In HTML, the `value` attribute is a list separated by commas. In JavaScript, `element.value` is
an array.

For a back end such as PHP that expects `[]` for lists, set `name="days_off[]"`.

## Options

`MultiDatePicker` takes these, as well as the shared `calendar`, `defaultCalendar`,
`onCalendarChange`, `min`, `max`, `isDateDisabled`, `holidays`, `events`, `locale`,
`weekStartsOn`, `weekendDays`, `showOtherCalendar`, `mask`, `inline`, `panelLayout`, `id`,
`placeholder`, `required`, `disabled`, `clearable`, `theme`, `className`, `aria-label` and
`today`.

| Prop | Type | Meaning |
|---|---|---|
| `value`, `defaultValue` | `readonly string[]` | AD strings |
| `onChange` | `(value, dates) => void` | `dates` is a list of `{ ad, bs }` |
| `maxDates` | `number` | The most days that may be chosen |
| `closeOnSelect` | `boolean` | Close after each click. Default `false` |
| `name` | `string` | Submit each day under this name |
