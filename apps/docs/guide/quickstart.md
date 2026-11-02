# Quick start

[[toc]]

This page takes you from nothing to a working conversion and a working date picker. If you
haven't installed anything yet, start with [Installation](./installation).

## Your first conversion

Create an AD date, convert it to BS, and show it:

```ts
import { adDate, adToBs, formatDate } from '@nepdate/core';

const ad = adDate(2026, 10, 18);
const bs = adToBs(ad);

bs; // → { calendar: 'BS', year: 2083, month: 7, day: 1 }
formatDate(bs, 'long'); // → '1 Kartik 2083'
formatDate(bs, 'full', 'ne'); // → 'आइतबार, १ कार्तिक २०८३'
```

A date is a small frozen object. It says which calendar it belongs to, so a BS date can't be
mistaken for an AD one.

Going the other way works the same:

```ts
import { bsDate, bsToAd, toIsoDate } from '@nepdate/core';

const ad = bsToAd(bsDate(2083, 6, 24));

ad; // → { calendar: 'AD', year: 2026, month: 10, day: 10 }
toIsoDate(ad); // → '2026-10-10'
```

`toIsoDate` gives you the AD day as text, ready to save.

## Your first date picker

### In React

```tsx
import '@nepdate/styles';
import { useState } from 'react';
import { DatePicker } from '@nepdate/react';

export function BirthDate() {
  const [value, setValue] = useState('');

  return (
    <label>
      Date of birth
      <DatePicker value={value} onChange={setValue} max="2026-12-31" />
    </label>
  );
}
```

### In plain HTML

```html
<link rel="stylesheet" href="https://unpkg.com/@nepdate/styles/index.css" />
<script src="https://unpkg.com/@nepdate/vanilla/dist/nepdate-picker.global.js"></script>

<form action="/save" method="post">
  <label for="dob">Date of birth</label>
  <nep-date-picker name="dob" input-id="dob" max="2026-12-31" required></nep-date-picker>
  <button>Save</button>
</form>
```

### Try it

<ClientOnly>
  <div class="demo">
    <label class="demo__label" for="quick-dob">Date of birth</label>
    <nep-date-picker input-id="quick-dob" name="dob"></nep-date-picker>
  </div>
</ClientOnly>

Type a date such as `20830624`, or open the calendar. The switch in the field changes between
BS and AD.

## The one rule to remember

**The value is always the AD date as `YYYY-MM-DD`.** People see and type BS, but your code,
your form and your database get `2026-10-10`.

So nothing about your back end has to change. Keep your `date` column, keep your validation,
and convert only when you show a date to someone:

```ts
import { formatDate, fromIsoDate, toCalendar } from '@nepdate/core';

const stored = '2026-10-10'; // from your database
const date = fromIsoDate(stored);

date && formatDate(toCalendar(date, 'BS'), 'long'); // → '24 Ashwin 2083'
```

## Where to go next

- [How it works](./concepts): the ideas behind the library.
- [Date picker](/pickers/date-picker): every option of the picker.
- [Formatting](./formatting): all the ways to show a date.
- [Laravel and Blade](/integrations/laravel), [Next.js](/integrations/nextjs) or
  [Vue](/integrations/vue): guides for your stack.
