# Date picker

[[toc]]

## Introduction

The date picker is a text field with a calendar. People type a date or pick one, in BS or AD,
and you get the AD date.

<ClientOnly>
  <div class="demo">
    <label class="demo__label" for="dp-basic">Date of birth</label>
    <nep-date-picker input-id="dp-basic" name="dob" value="2026-10-10"></nep-date-picker>
  </div>
</ClientOnly>

## Basic usage

::: code-group

```tsx [React]
import { useState } from 'react';
import { DatePicker } from '@nepdatejs/react';

export function BirthDate() {
  const [value, setValue] = useState('');

  return (
    <label>
      Date of birth
      <DatePicker value={value} onChange={setValue} />
    </label>
  );
}
```

```html [HTML]
<label for="dob">Date of birth</label>
<nep-date-picker name="dob" input-id="dob"></nep-date-picker>
```

:::

## Reading the value

The value is the AD date as `YYYY-MM-DD`, or an empty string when the field is empty or
invalid. The change callback also gives you both calendars as date objects:

::: code-group

```tsx [React]
<DatePicker
  onChange={(value, date) => {
    console.log(value); // "2026-10-10"
    console.log(date?.ad); // { calendar: 'AD', year: 2026, month: 10, day: 10 }
    console.log(date?.bs); // { calendar: 'BS', year: 2083, month: 6, day: 24 }
  }}
/>;
```

```html [HTML]
<nep-date-picker id="date"></nep-date-picker>

<script>
  document.querySelector('#date').addEventListener('change', (event) => {
    console.log(event.detail.value); // "2026-10-10"
    console.log(event.detail.ad);
    console.log(event.detail.bs);
  });
</script>
```

:::

## Setting a starting value

Values you pass in are AD too:

::: code-group

```tsx [React]
<DatePicker defaultValue="2026-10-10" />;
```

```html [HTML]
<nep-date-picker value="2026-10-10"></nep-date-picker>
```

:::

## Fixing the calendar

By default the picker starts in BS and shows a switch. Use `calendar` to fix one calendar and
hide the switch, or `defaultCalendar` to choose which one comes first.

::: code-group

```tsx [React]
<>
  <DatePicker calendar="BS" />
  <DatePicker defaultCalendar="AD" />
</>;
```

```html [HTML]
<nep-date-picker calendar="BS"></nep-date-picker>
<nep-date-picker default-calendar="AD"></nep-date-picker>
```

:::

The value is AD in every case. Fixing the calendar to BS only changes what's shown.

### Remembering the choice

`persistCalendar` saves the person's BS/AD choice in `localStorage` under the key you give, and
restores it next time:

::: code-group

```tsx [React]
<DatePicker persistCalendar="date-calendar" />;
```

```html [HTML]
<nep-date-picker persist-calendar="date-calendar"></nep-date-picker>
```

:::

To react to the switch yourself, use `onCalendarChange` in React, or the `nep-calendar-change`
event on the element.

## Limits

`min` and `max` are AD strings. `isDateDisabled` rules out individual days, such as Saturdays:

::: code-group

```tsx [React]
<DatePicker
  min="2026-01-01"
  max="2026-12-31"
  isDateDisabled={(date) => isWeekend(date)}
/>;
```

```html [HTML]
<nep-date-picker id="date" min="2026-01-01" max="2026-12-31"></nep-date-picker>

<script type="module">
  import { isWeekend } from '@nepdatejs/core';

  document.querySelector('#date').isDateDisabled = (date) => isWeekend(date);
</script>
```

:::

See [Limits and validation](./validation) for error messages and more.

## Showing the other calendar

Under the field, the picker shows the same day in the other calendar, such as "10 October 2026
AD". It helps people check they have the right date. To hide it:

::: code-group

```tsx [React]
<DatePicker showEquivalent={false} />;
```

```html [HTML]
<nep-date-picker show-equivalent="false"></nep-date-picker>
```

:::

Each day in the panel also shows the other calendar's day number. Turn that off with
`showOtherCalendar={false}`.

## How the date is shown

The field shows `YYYY-MM-DD` by default, which can also be typed back. `displayFormat` takes any
[format](/guide/formatting):

::: code-group

```tsx [React]
<DatePicker displayFormat="long" />;
```

```html [HTML]
<nep-date-picker display-format="long"></nep-date-picker>
```

:::

<ClientOnly>
  <div class="demo">
    <nep-date-picker display-format="long" value="2026-10-10" label="Formatted date"></nep-date-picker>
  </div>
</ClientOnly>

## Language

::: code-group

```tsx [React]
<DatePicker locale="ne" />;
```

```html [HTML]
<nep-date-picker locale="ne"></nep-date-picker>
```

:::

<ClientOnly>
  <div class="demo">
    <nep-date-picker locale="ne" value="2026-10-10" label="मिति"></nep-date-picker>
  </div>
</ClientOnly>

## Keeping the panel open

The panel closes after a pick. To keep it open:

::: code-group

```tsx [React]
<DatePicker closeOnSelect={false} />;
```

```html [HTML]
<nep-date-picker close-on-select="false"></nep-date-picker>
```

:::

To keep the calendar on the page all the time, see [inline mode](./layouts#inline).

## Options

These are React props. In HTML, each one is an attribute in kebab-case, such as
`default-calendar`. Functions and lists are set as properties on the element. The full list is
in the [Web Components reference](/reference/vanilla#nep-date-picker).

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `value` | `string` | | The AD date, when you control the value |
| `defaultValue` | `string` | `''` | The starting AD date |
| `onChange` | `(value, date) => void` | | Called when the person changes the value |
| `calendar` | `'BS' \| 'AD'` | | Fix the calendar and hide the switch |
| `defaultCalendar` | `'BS' \| 'AD'` | `'BS'` | The calendar shown first |
| `onCalendarChange` | `(calendar) => void` | | Called when the person switches |
| `persistCalendar` | `string` | | `localStorage` key for the BS/AD choice |
| `min`, `max` | `string` | | Earliest and latest AD dates |
| `isDateDisabled` | `(date) => boolean` | | Rule out individual days |
| `holidays` | list or function | | [Holidays](./holidays-events) to mark |
| `events` | `(date) => EventMarker[]` | | [Event dots](./holidays-events#event-dots) |
| `presets` | `SinglePreset[]` | | [Shortcuts](./presets) beside the calendar |
| `locale` | `'en' \| 'ne' \| string` | page language | Names, digits and messages |
| `displayFormat` | `string` | `'iso'` | How the field shows a date |
| `showEquivalent` | `boolean` | `true` | Show the other calendar under the field |
| `showOtherCalendar` | `boolean` | `true` | Show the other day number in each cell |
| `clearable` | `boolean` | `true` | Show the clear button |
| `closeOnSelect` | `boolean` | `true` | Close the panel after a pick |
| `weekStartsOn` | `0`–`6` | `0` | First day of the week |
| `weekendDays` | `Weekday[]` | `[6]` | Days shown as weekend |
| `mask` | `boolean` | `true` | [Add dashes while typing](./typing) |
| `inline` | `boolean` | `false` | [Always show the calendar](./layouts#inline) |
| `panelLayout` | `'auto' \| 'popover' \| 'sheet'` | `'auto'` | [Panel layout](./layouts) |
| `name` | `string` | | Submit the value with a form |
| `id`, `placeholder`, `required`, `disabled` | | | As on an `<input>` |
| `aria-label`, `aria-invalid`, `aria-describedby` | | | Passed to the input |
| `theme` | `'light' \| 'dark' \| 'auto'` | | Force a theme |
| `className` | `string` | | Class for the field |
| `today` | `CalendarDate` | | Override "today", for tests and server rendering |
