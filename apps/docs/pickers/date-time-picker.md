# Date and time picker

[[toc]]

## Introduction

This picker chooses a calendar day and a time of day. Its panel has the calendar and two
scrolling columns, one for hours and one for minutes.

<ClientOnly>
  <div class="demo">
    <nep-date-time-picker label="Starts at" minute-step="15" default-time="09:00"></nep-date-time-picker>
  </div>
</ClientOnly>

## Basic usage

The value is one instant, as an ISO timestamp with the time zone's offset. It's Nepal time by
default.

::: code-group

```tsx [React]
import { useState } from 'react';
import { DateTimePicker } from '@nepdatejs/react';

export function Meeting() {
  const [startsAt, setStartsAt] = useState('');

  return (
    <DateTimePicker
      value={startsAt}
      onChange={setStartsAt}
      minuteStep={15}
      defaultTime="09:00"
      aria-label="Starts at"
    />
  );
}
```

```html [HTML]
<nep-date-time-picker
  name="starts-at"
  minute-step="15"
  default-time="09:00"
  label="Starts at"
></nep-date-time-picker>
```

:::

Choosing 1 Kartik 2083 at 2:30 PM gives:

```text
2026-10-18T14:30:00+05:45
```

The value stays `''` until both the date and the time are valid. If someone picks a day first,
the time becomes `defaultTime`, which is midnight unless you set it.

## Reading the value

The callback's second argument splits the value into parts:

```tsx
<DateTimePicker
  onChange={(value, detail) => {
    console.log(value); // "2026-10-18T14:30:00+05:45"
    console.log(detail?.ad, detail?.bs); // the day in both calendars
    console.log(detail?.time); // { hour: 14, minute: 30 }
  }}
/>;
```

On the element, `change` has `event.detail` with `value`, `ad`, `bs` and `time`.

## Time options

| Prop | Attribute | Default | Meaning |
|---|---|---|---|
| `hour12` | `hour12` | `false` | Show 2:30 PM instead of 14:30 |
| `minuteStep` | `minute-step` | `5` | Minutes between choices, 1 to 30 |
| `defaultTime` | `default-time` | `'00:00'` | The time used when a day is picked first |
| `timeZone` | `time-zone` | Nepal | The zone shown and stored |
| `timeLabel` | `time-label` | | Accessible name of the time input |

::: code-group

```tsx [React]
<DateTimePicker hour12 minuteStep={30} />;
```

```html [HTML]
<nep-date-time-picker hour12 minute-step="30"></nep-date-time-picker>
```

:::

The time field accepts typing too, such as `14:30`, `2:30 pm`, `1430` or `२:३० अपराह्न`. See
[`parseTime`](/guide/time#parsing-and-formatting-times).

## Time zones

The value carries its offset, so it's a real instant that any server can read. To show and store
a different zone, use `timeZone`:

::: code-group

```tsx [React]
<DateTimePicker timeZone="Asia/Dubai" />;
```

```html [HTML]
<nep-date-time-picker time-zone="Asia/Dubai"></nep-date-time-picker>
```

:::

A value with no offset, such as `2026-10-18T14:30`, is read as a wall-clock time in that zone.
A value with an offset or `Z` is converted to it.

## Forms

The `name` field submits the whole timestamp:

```html
<nep-date-time-picker name="starts-at"></nep-date-time-picker>
```

```text
starts-at=2026-10-18T14:30:00+05:45
```

## Options

`DateTimePicker` also takes the shared `calendar`, `defaultCalendar`, `min`, `max`,
`isDateDisabled`, `holidays`, `presets`, `locale`, `weekStartsOn`, `mask`, `inline`,
`panelLayout`, `name`, `id`, `required`, `disabled`, `theme`, `className` and `today`.

`min` and `max` limit the **day**, not the time. Use your own check if you need to limit the
time as well.
