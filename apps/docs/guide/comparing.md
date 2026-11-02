# Comparing dates

[[toc]]

## Introduction

Comparisons work across calendars, because they compare the actual day. A BS date and an AD
date for the same day are equal.

```ts
import { adDate, bsDate, isSameDay } from '@nepdate/core';

isSameDay(bsDate(2083, 7, 1), adDate(2026, 10, 18)); // → true
```

Don't compare date objects with `===`. Two objects for the same day are still different
objects.

## Before and after

```ts
import { bsDate, isAfter, isBefore } from '@nepdate/core';

const first = bsDate(2083, 7, 1);
const second = bsDate(2083, 7, 2);

isBefore(first, second); // → true
isAfter(first, second); // → false
```

## Same day, month or year

```ts
import { bsDate, isSameDay, isSameMonth, isSameYear } from '@nepdate/core';

const date = bsDate(2083, 7, 1);

isSameDay(date, bsDate(2083, 7, 1)); // → true
isSameMonth(date, bsDate(2083, 7, 20)); // → true
isSameYear(date, bsDate(2083, 12, 1)); // → true
isSameDay(date, null); // → false
```

`isSameDay` also accepts `null` and `undefined`, which helps when one of the dates is optional.

`isSameMonth` and `isSameYear` use the **first** date's calendar. Kartik 2083 and October 2026
overlap but aren't the same month, so the result depends on the calendar of the first date.

## Inside a range

`isWithin(date, min, max)` includes both ends. Either limit can be left out:

```ts
import { bsDate, isWithin } from '@nepdate/core';

const date = bsDate(2083, 7, 15);

isWithin(date, bsDate(2083, 7, 1), bsDate(2083, 7, 29)); // → true
isWithin(date, bsDate(2083, 8, 1)); // → false
isWithin(date, null, bsDate(2083, 7, 15)); // → true
```

## Keeping a date in range

`clampDate` returns the date, moved to the nearest limit if it falls outside:

```ts
import { bsDate, clampDate, formatDate } from '@nepdate/core';

const min = bsDate(2083, 7, 1);
const max = bsDate(2083, 7, 29);

formatDate(clampDate(bsDate(2083, 6, 15), min, max)); // → '2083-07-01'
formatDate(clampDate(bsDate(2083, 7, 15), min, max)); // → '2083-07-15'
```

## Sorting

`compareDates` returns `-1`, `0` or `1`, so it fits straight into `sort`:

```ts
import { bsDate, compareDates, formatDate } from '@nepdate/core';

const dates = [bsDate(2083, 7, 9), bsDate(2083, 1, 1), bsDate(2083, 7, 2)];

dates.sort(compareDates).map((date) => formatDate(date)); // → ['2083-01-01', '2083-07-02', '2083-07-09']
```
