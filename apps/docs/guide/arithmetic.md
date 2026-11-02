# Date arithmetic

[[toc]]

## Introduction

These functions work in the date's **own** calendar and return a new date. Adding a month to a
BS date gives the next BS month, not 30 days later and not the next AD month.

```ts
import { addDays, addMonths, bsDate, formatDate } from '@nepdatejs/core';

const date = bsDate(2083, 7, 1);

formatDate(addDays(date, 10)); // → '2083-07-11'
formatDate(addMonths(date, 1)); // → '2083-08-01'
```

Your original date is never changed.

## Adding and subtracting

### `addDays`

Use a negative number to go back:

```ts
import { addDays, bsDate, formatDate } from '@nepdatejs/core';

formatDate(addDays(bsDate(2083, 7, 1), -1)); // → '2083-06-31'
formatDate(addDays(bsDate(2083, 12, 30), 1)); // → '2084-01-01'
```

### `addMonths` and `addYears`

BS months have different lengths, so a day might not exist in the target month. In that case
the day is **capped** to the end of the month:

```ts
import { addMonths, addYears, adDate, bsDate, formatDate } from '@nepdatejs/core';

formatDate(addMonths(bsDate(2083, 3, 32), 1)); // → '2083-04-31'
formatDate(addMonths(adDate(2026, 1, 31), 1)); // → '2026-02-28'
formatDate(addYears(adDate(2024, 2, 29), 1)); // → '2025-02-28'
```

## Start and end of a period

```ts
import {
  bsDate,
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from '@nepdatejs/core';

const date = bsDate(2083, 7, 15);

formatDate(startOfMonth(date)); // → '2083-07-01'
formatDate(endOfMonth(date)); // → '2083-07-30'
formatDate(startOfYear(date)); // → '2083-01-01'
formatDate(endOfYear(date)); // → '2083-12-30'
formatDate(startOfWeek(date)); // → '2083-07-15'
formatDate(endOfWeek(date)); // → '2083-07-21'
```

Weeks start on Sunday in Nepal, which is the default. Pass a day from `0` (Sunday) to `6`
(Saturday) to change it for one call, or set `weekStartsOn` with
[`configure`](./configuration).

```ts
import { bsDate, formatDate, startOfWeek } from '@nepdatejs/core';

formatDate(startOfWeek(bsDate(2083, 7, 15), 1)); // → '2083-07-09'
```

## Differences

`differenceInDays(a, b)` is the number of days from `b` to `a`. It's positive when `a` is
later, and the two dates may be in different calendars.

```ts
import { adDate, bsDate, differenceInDays } from '@nepdatejs/core';

differenceInDays(bsDate(2083, 7, 10), bsDate(2083, 7, 1)); // → 9
differenceInDays(bsDate(2083, 7, 1), adDate(2026, 10, 18)); // → 0
```

To count a range including both ends, as for leave days, add one:

```ts
import { bsDate, differenceInDays } from '@nepdatejs/core';

const start = bsDate(2083, 7, 1);
const end = bsDate(2083, 7, 5);

differenceInDays(end, start) + 1; // → 5
```

## Going through days

### `eachDayOfMonth`

Every day of a date's month, as a list:

```ts
import { bsDate, eachDayOfMonth } from '@nepdatejs/core';

eachDayOfMonth(bsDate(2083, 7, 15)).length; // → 30
```

### `eachDayOfInterval`

Every day from `start` to `end`, including both. It's a generator, so it stays cheap for long
ranges. Use `for...of`, or spread it into a list:

```ts
import { bsDate, eachDayOfInterval, formatDate, isWeekend } from '@nepdatejs/core';

const start = bsDate(2083, 7, 1);
const end = bsDate(2083, 7, 10);

[...eachDayOfInterval(start, end)].length; // → 10

let workingDays = 0;
for (const day of eachDayOfInterval(start, end)) {
  if (!isWeekend(day)) {
    workingDays++;
  }
}

workingDays; // → 9
formatDate(start); // → '2083-07-01'
```

## Weekdays

`dayOfWeek` gives `0` for Sunday through `6` for Saturday. `isWeekend` uses the configured
weekend, which is Saturday by default:

```ts
import { bsDate, dayOfWeek, isWeekend } from '@nepdatejs/core';

const date = bsDate(2083, 7, 7);

dayOfWeek(date); // → 6
isWeekend(date); // → true
isWeekend(date, [0]); // → false
```
