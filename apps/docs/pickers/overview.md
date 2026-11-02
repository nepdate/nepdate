# Pickers

[[toc]]

## Introduction

nepdate has four pickers and a calendar. All of them come as React components and as Web
Components, and they look and behave the same in both.

| I want people to choose | Use | React | HTML |
|---|---|---|---|
| One day | [Date picker](./date-picker) | `<DatePicker>` | `<nep-date-picker>` |
| A start and an end | [Date range picker](./range-picker) | `<DateRangePicker>` | `<nep-date-range-picker>` |
| A day and a time | [Date and time picker](./date-time-picker) | `<DateTimePicker>` | `<nep-date-time-picker>` |
| Several separate days | [Multiple dates](./multi-date-picker) | `<MultiDatePicker>` | `<nep-multi-date-picker>` |
| A day, with no input field | [Calendar](./calendar) | `<Calendar>` | `<nep-calendar>` |

<ClientOnly>
  <div class="demo">
    <label class="demo__label" for="overview-date">Try one</label>
    <nep-date-picker input-id="overview-date"></nep-date-picker>
  </div>
</ClientOnly>

## What they share

- **The value is AD.** Every picker gives you AD dates, whatever the person sees. See
  [How it works](/guide/concepts#the-value-is-always-ad).
- **Typing or clicking.** Pickers accept typed dates in ASCII or Devanagari digits, or
  a click on the calendar. See [Typing and input masking](./typing).
- **A BS/AD switch.** People can change calendars at any time, and the value stays the same.
  Set `calendar` to fix one and hide the switch.
- **Limits.** `min`, `max` and `isDateDisabled` work everywhere. See
  [Limits and validation](./validation).
- **Forms.** Set `name` and the value is submitted with a plain form. See [Forms](./forms).
- **Phones.** Below 480px the panel becomes a bottom sheet. See
  [Layouts](./layouts).
- **Accessibility.** Keyboard control, screen-reader labels and contrast are built in. See
  [Accessibility](./accessibility).

## Controlled or not

Every React picker can work in two ways.

**Controlled:** you hold the value, as with any React input.

```tsx
import { useState } from 'react';
import { DatePicker } from '@nepdate/react';

export function Controlled() {
  const [value, setValue] = useState('2026-10-18');

  return <DatePicker value={value} onChange={setValue} aria-label="Date" />;
}
```

**Uncontrolled:** the picker holds it, and a plain form reads it through `name`.

```tsx
import { DatePicker } from '@nepdate/react';

export function Uncontrolled() {
  return <DatePicker name="date" defaultValue="2026-10-18" aria-label="Date" />;
}
```

## Using the stylesheet

The components need `@nepdate/styles`. Import it once:

```ts
import '@nepdate/styles';
```

To change how they look, see [Theming](/guide/theming).
