# React

[[toc]]

## Introduction

`@nepdatejs/react` has styled components and, if you want your own markup,
[headless hooks](./headless-react). It works with React 18 and 19, and with
[server rendering](./nextjs).

```bash
npm install @nepdatejs/react @nepdatejs/styles
```

Import the stylesheet once, in your app's entry file:

```ts
import '@nepdatejs/styles';
```

## A first component

```tsx
import { useState } from 'react';
import { DatePicker } from '@nepdatejs/react';

export function Profile() {
  const [dob, setDob] = useState('');

  return (
    <label>
      Date of birth
      <DatePicker value={dob} onChange={setDob} max="2026-12-31" />
    </label>
  );
}
```

`value` and `onChange` use the AD date as `YYYY-MM-DD`, the same as `<input type="date">`.

## Components

| Component | Page |
|---|---|
| `<DatePicker>` | [Date picker](/pickers/date-picker) |
| `<DateRangePicker>` | [Date range picker](/pickers/range-picker) |
| `<DateTimePicker>` | [Date and time picker](/pickers/date-time-picker) |
| `<MultiDatePicker>` | [Multiple dates](/pickers/multi-date-picker) |
| `<Calendar>` | [Calendar](/pickers/calendar) |
| `<DateText>`, `<ShortDate>` | [Showing dates](#showing-dates), below |

## Showing dates

Your server sends AD dates. These helpers show them in BS.

### `<DateText>`

```tsx
import { DateText } from '@nepdatejs/react';

export function Row() {
  return <DateText value="2026-09-26" />;
}
```

This renders "10 Ashwin 2083 · 26 Sep 2026", inside a `<time>` element. It accepts a date or an
ISO timestamp.

| Prop | Default | Meaning |
|---|---|---|
| `value` | | The AD date or timestamp |
| `calendar` | `'BS'` | The calendar shown first |
| `withEquivalent` | `true` | Also show the other calendar |
| `format` | `'long'` | A [format](/guide/formatting) |
| `locale` | `'en'` | Names and digits |
| `fallback` | `'—'` | Shown when there's no date |
| `className` | | Class for the element |

### `<ShortDate>`

For a table cell or list row. It shows the BS date and keeps the AD date as a hover hint:

```tsx
import { ShortDate } from '@nepdatejs/react';

export function Cell() {
  return <ShortDate value="2026-09-26" />;
}
```

### `shortDate` and `bothDates`

The same as plain text, for places that need a string, such as an export or a chart label:

```ts
import { bothDates, shortDate } from '@nepdatejs/react';

shortDate('2026-09-26'); // → '10 Ashwin 2083'
shortDate('2026-09-26T09:00:00Z'); // → '10 Ashwin 2083, 14:45'
bothDates('2026-09-26'); // → '10 Ashwin 2083 (26 Sep 2026)'
```

## Inline options

You can write options inline. Values are compared by content and callbacks are wrapped once, so
new arrays and functions on each render don't cause extra work or re-render loops:

```tsx
<DatePicker
  presets={['today', 'yesterday']}
  isDateDisabled={(date) => date.day === 1}
/>;
```

## Language

`locale` sets the language. The `<DatePicker>` also follows the page: it uses Nepali when the page
has `<html lang="ne">`.

## TypeScript

Each component exports its props type, such as `DatePickerProps`:

```tsx
import { DatePicker, type DatePickerProps } from '@nepdatejs/react';

export function MyDateField(props: DatePickerProps) {
  return <DatePicker clearable={false} {...props} />;
}
```

## Dark mode and theming

Components follow the system theme. `theme="dark"` forces one. See [Theming](/guide/theming).
