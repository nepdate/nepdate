# Converting BS and AD

[[toc]]

## Introduction

Converting takes a date in one calendar and gives you the same day in the other. The result
is a normal date object you can format or calculate with.

```ts
import { adDate, adToBs, bsDate, bsToAd } from '@nepdate/core';

adToBs(adDate(2026, 10, 18)); // → { calendar: 'BS', year: 2083, month: 7, day: 1 }
bsToAd(bsDate(2083, 7, 1)); // → { calendar: 'AD', year: 2026, month: 10, day: 18 }
```

## Converting

### `adToBs` and `bsToAd`

These take the exact type, so TypeScript stops you converting a date that is already in the
target calendar. Use them when you know what you have.

### `toCalendar`

Use `toCalendar` when you don't know which calendar a date is in, or when the target is a
variable. If the date is already in that calendar, you get it back unchanged.

```ts
import { adDate, bsDate, toCalendar } from '@nepdate/core';

toCalendar(adDate(2026, 10, 18), 'BS').year; // → 2083
toCalendar(bsDate(2083, 7, 1), 'BS').year; // → 2083
```

## The convertible range

Conversion works from **13 April 1913** to **13 April 2043** AD, which is BS 1970 to 2099.
Outside that, conversion throws an error with the code `OUT_OF_TABLE`.

```ts
import { adDate, adToBs, isConvertible } from '@nepdate/core';

adToBs(adDate(1900, 1, 1)); // → throws OUT_OF_TABLE
isConvertible(adDate(1900, 1, 1)); // → false
isConvertible(adDate(2026, 10, 18)); // → true
```

Check first with `isConvertible` when the date comes from outside your code.

## To and from text

### `toIsoDate`

`toIsoDate` gives the **AD** day as `YYYY-MM-DD`, whichever calendar the date is in. This is
the form to store or send.

```ts
import { adDate, bsDate, toIsoDate } from '@nepdate/core';

toIsoDate(bsDate(2083, 6, 24)); // → '2026-10-10'
toIsoDate(adDate(2026, 10, 10)); // → '2026-10-10'
```

### `fromIsoDate`

`fromIsoDate` reads that form back. It also accepts a longer timestamp and uses the date part
as written. It returns `null` for anything else, so check the result:

```ts
import { fromIsoDate } from '@nepdate/core';

fromIsoDate('2026-10-18'); // → { calendar: 'AD', year: 2026, month: 10, day: 18 }
fromIsoDate('2026-10-18T14:30:00Z')?.day; // → 18
fromIsoDate('2026-02-30'); // → null
fromIsoDate('not a date'); // → null
fromIsoDate(null); // → null
```

::: warning A timestamp near midnight
`fromIsoDate` reads the date as written and ignores the time. `2026-10-18T20:00:00Z` is already
19 October in Nepal. For a timestamp, use
[`fromIsoTimestamp`](./time#from-timestamps) so the date is worked out in the right zone.
:::

## From a JavaScript `Date`

`fromJsDate` takes a `Date` and gives you the calendar day in a time zone, which is Nepal by
default:

```ts
import { fromJsDate } from '@nepdate/core';

const instant = new Date('2026-10-18T20:00:00Z');

fromJsDate(instant); // → { calendar: 'AD', year: 2026, month: 10, day: 19 }
fromJsDate(instant, 'UTC').day; // → 18
```

## Epoch days

An epoch day is the number of days since 1 January 1970. It's the one thing the two calendars
share, and it's handy for storing a date as a number or for your own calculations.

```ts
import { adDate, fromEpoch, toEpoch } from '@nepdate/core';

const day = toEpoch(adDate(2026, 10, 18));

day; // → 20744
fromEpoch(day, 'BS'); // → { calendar: 'BS', year: 2083, month: 7, day: 1 }
```

## Converting many dates

Conversion is fast: it does a binary search on the table and a little arithmetic. There's no
need to cache results, even across thousands of table rows.
