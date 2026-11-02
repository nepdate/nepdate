# Creating dates

[[toc]]

## Introduction

A date in nepdate is a frozen object with a calendar, a year, a month and a day. You make one
with `bsDate` or `adDate`, and every function in the library accepts it.

```ts
import { adDate, bsDate } from '@nepdatejs/core';

const ad = adDate(2026, 10, 18);
const bs = bsDate(2083, 7, 1);

ad.year; // → 2026
bs.month; // → 7
bs.calendar; // → 'BS'
```

## Creating a date

### `bsDate(year, month, day)`

Months run from 1 (Baisakh) to 12 (Chaitra). The date must exist in the BS table.

```ts
import { bsDate } from '@nepdatejs/core';

bsDate(2083, 1, 1); // → { calendar: 'BS', year: 2083, month: 1, day: 1 }
bsDate(2083, 2, 33); // → throws INVALID_DATE
bsDate(1960, 1, 1); // → throws OUT_OF_TABLE
```

### `adDate(year, month, day)`

Months run from 1 (January) to 12 (December). Any year works, because the AD calendar is
arithmetic and needs no table.

```ts
import { adDate } from '@nepdatejs/core';

adDate(2024, 2, 29); // → { calendar: 'AD', year: 2024, month: 2, day: 29 }
adDate(2023, 2, 29); // → throws INVALID_DATE
adDate(1800, 1, 1).year; // → 1800
```

### `createDate(calendar, year, month, day)`

Use this when the calendar is a variable:

```ts
import { createDate } from '@nepdatejs/core';

const calendar = 'BS';

createDate(calendar, 2083, 7, 1); // → { calendar: 'BS', year: 2083, month: 7, day: 1 }
```

## Today

`today` gives you today's date. It uses the date **in Nepal**, not on the device, so a
visitor in New York sees the same "today" as someone in Kathmandu.

<!-- no-check -->
```ts
import { today } from '@nepdatejs/core';

today(); // today as an AD date
today('BS'); // today as a BS date
today('BS', 'America/New_York'); // today in another zone
```

See [Today, time and time zones](./time).

## Checking a date

### `isValidDate`

Check numbers before you build a date, instead of catching an error:

```ts
import { isValidDate } from '@nepdatejs/core';

isValidDate('BS', 2083, 3, 32); // → true
isValidDate('BS', 2083, 2, 32); // → false
isValidDate('AD', 2026, 2, 30); // → false
```

### `daysInMonth`

```ts
import { daysInMonth } from '@nepdatejs/core';

daysInMonth('BS', 2083, 1); // → 31
daysInMonth('AD', 2024, 2); // → 29
```

### `isAdLeapYear`

```ts
import { isAdLeapYear } from '@nepdatejs/core';

isAdLeapYear(2024); // → true
isAdLeapYear(1900); // → false
```

BS has no leap-year rule. A year has however many days its months add up to, so there is no
BS version of this function.

### Dates from JSON

A date that has been through JSON is a plain object. Check it with `isBsDate`, `isAdDate` or
`isCalendarDate` before you trust it:

```ts
import { isBsDate, isCalendarDate } from '@nepdatejs/core';

const value: unknown = JSON.parse('{"calendar":"BS","year":2083,"month":7,"day":1}');

isBsDate(value); // → true
isCalendarDate({ calendar: 'BS', year: 2083, month: 13, day: 1 }); // → false
```

## The range

`minDate` and `maxDate` tell you the earliest and latest dates that can be converted:

```ts
import { maxDate, minDate } from '@nepdatejs/core';

minDate('BS'); // → { calendar: 'BS', year: 1970, month: 1, day: 1 }
minDate('AD'); // → { calendar: 'AD', year: 1913, month: 4, day: 13 }
maxDate('BS').year; // → 2099
```

## Types

| Type | What it is |
|---|---|
| `BsDate` | A BS date |
| `AdDate` | An AD date |
| `CalendarDate` | Either one |
| `CalendarSystem` | `'BS'` or `'AD'` |
| `DateOf<C>` | The date type of a calendar: `DateOf<'BS'>` is `BsDate` |
| `MonthNumber` | `1` to `12` |
| `Weekday` | `0` (Sunday) to `6` (Saturday) |

Use the narrow type when a function needs one calendar, and `CalendarDate` when either is fine:

```ts
import { formatDate, type AdDate, type CalendarDate } from '@nepdatejs/core';

function toRecord(date: AdDate) {
  return { year: date.year, month: date.month, day: date.day };
}

function label(date: CalendarDate) {
  return formatDate(date, 'long');
}
```
