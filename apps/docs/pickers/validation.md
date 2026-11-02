# Limits and validation

[[toc]]

## Introduction

Pickers check dates as people type and pick. A bad date shows a translated message under the
field, and the value stays empty, so a bad date can't be submitted. Pickers never throw on bad
input.

<ClientOnly>
  <div class="demo">
    <label class="demo__label" for="v-demo">Choose a day in 2026 (try typing 2082-01-01)</label>
    <nep-date-picker input-id="v-demo" min="2026-01-01" max="2026-12-31"></nep-date-picker>
  </div>
</ClientOnly>

## Earliest and latest dates

`min` and `max` are AD strings, in every picker:

::: code-group

```tsx [React]
<DatePicker min="2026-01-01" max="2026-12-31" />;
```

```html [HTML]
<nep-date-picker min="2026-01-01" max="2026-12-31"></nep-date-picker>
```

:::

If you think in BS, convert with `toIsoDate`:

```ts
import { bsDate, toIsoDate } from '@nepdate/core';

toIsoDate(bsDate(2083, 1, 1)); // → '2026-04-14'
```

Days outside the limits are greyed out, and the panel won't move past them.

## Disabling days

`isDateDisabled` gets each date and returns `true` to rule it out:

```tsx
import { dayOfWeek } from '@nepdate/core';
import { DatePicker } from '@nepdate/react';

const closed = new Set(['2083-07-15']);

export function Booking() {
  return (
    <DatePicker
      isDateDisabled={(date) =>
        dayOfWeek(date) === 6 || closed.has(formatDate(toCalendar(date, 'BS')))
      }
    />
  );
}
```

On an element, set it as a property:

```js
document.querySelector('nep-date-picker').isDateDisabled = (date) => date.day === 1;
```

It's called for every visible day, so keep it fast.

## Required fields

`required` works like it does on an `<input>`: an empty field stops the form from submitting.

```html
<form>
  <nep-date-picker name="dob" required></nep-date-picker>
  <button>Save</button>
</form>
```

## Errors

A picker's state has an `error` that is `null`, or an object with a `code` and a `message`. The
message is already translated.

| Code | When | English message |
|---|---|---|
| `format` | The text isn't a date | Enter a BS date as YYYY-MM-DD. |
| `range` | Before `min` or after `max` | Choose 2083-06-15 or later. |
| `disabled` | `isDateDisabled` said no | This date is not available. |
| `tooShort` | Range under `minDays` | Choose at least 2 days. |
| `tooLong` | Range over `maxDays` | Choose at most 15 days. |
| `tooMany` | More than `maxDates` | Choose at most 5 dates. |

The same check in code, with the framework-free store:

```ts
import { createDatePicker } from '@nepdate/datepicker';

const picker = createDatePicker({ min: '2026-01-01' });

picker.actions.type('hello');
picker.getState().error?.code; // → 'format'
picker.getState().value; // → ''

picker.actions.type('2083-06-24');
picker.getState().error; // → null
picker.getState().value; // → '2026-10-10'
```

### Changing the messages

Messages live in the locale, so you can [change them](/guide/locales#translating-messages) in one
place.

### Showing your own error

For a server error, pass `aria-invalid` and `aria-describedby`, and show the message yourself:

```tsx
<>
  <DatePicker aria-invalid aria-describedby="date-error" />
  <p id="date-error">That day is already booked.</p>
</>;
```

## Validating on the server

Client checks can be skipped, so always check again on your server. Since the value is a plain AD
date, your usual tools work with no knowledge of BS. For example, in
[Laravel](/integrations/laravel#validating):

```php
$request->validate([
    'dob' => ['required', 'date_format:Y-m-d', 'before:today'],
]);
```

Or in Node, with the same library:

```ts
import { fromIsoDate } from '@nepdate/core';

function isValidDay(input: unknown) {
  return typeof input === 'string' && fromIsoDate(input) !== null;
}

isValidDay('2026-10-10'); // → true
isValidDay('2026-02-30'); // → false
```
