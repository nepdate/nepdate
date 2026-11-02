# The BS table

[[toc]]

## Introduction

BS month lengths can't be calculated, so nepdate includes a table of them, one row for each BS
year from **1970 to 2099**. This page explains what is in the table, how far you can trust it,
and how to correct it.

## Verified and projected years

Years through **2083** have been checked against published calendars. Later years are
**projections**. They are good enough for planning, but an official calendar could differ by a
day here and there when it comes out.

`isProjected` tells you when a date falls in a projected year:

```ts
import { adDate, bsDate, isProjected } from '@nepdate/core';

isProjected(bsDate(2083, 12, 30)); // → false
isProjected(bsDate(2084, 1, 1)); // → true
isProjected(adDate(2030, 1, 1)); // → true
```

If you issue anything official for a far-future date, you could use this to show a notice.

## Correcting a year

If a calendar is published that differs from the table, you don't have to wait for a new
release. `patchBsYear` replaces one year's twelve month lengths:

```ts
import { bsDate, daysInMonth, patchBsYear, toIsoDate } from '@nepdate/core';

const before = toIsoDate(bsDate(2083, 1, 1));

patchBsYear(2090, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]);

daysInMonth('BS', 2090, 3); // → 32
toIsoDate(bsDate(2083, 1, 1)) === before; // → true
```

Call it once when your app starts. The effects are predictable:

- Years **after** the corrected year move with it, because each year starts where the last one
  ended.
- Years **before** it never move.
- AD results never change, since AD doesn't use the table.

You can also add the year just before the first or just after the last, which extends the
table by one year.

## Replacing the table

`setBsData` replaces the whole table, and `resetBsData` puts the bundled one back. `getBsData`
returns the table in use.

```ts
import { getBsData, resetBsData, setBsData } from '@nepdate/core';

const table = getBsData();

table.firstYear; // → 1970
table.verifiedThrough; // → 2083

setBsData({ ...table, verifiedThrough: 2084 });
getBsData().verifiedThrough; // → 2084

resetBsData();
getBsData().verifiedThrough; // → 2083
```

A table has four fields:

| Field | Meaning |
|---|---|
| `firstYear` | The BS year of the first row |
| `epochStart` | The epoch day of 1 Baisakh of `firstYear` |
| `verifiedThrough` | The last year checked against a published calendar |
| `years` | Twelve month lengths for each year |

## Validation

Every table is checked before it is used. `validateBsData` runs the same checks without
changing anything:

```ts
import { getBsData, validateBsData } from '@nepdate/core';

validateBsData(getBsData());
```

A table is rejected when a month has fewer than 29 or more than 32 days, a year doesn't have 12
months, or a verified year doesn't add up to 365 or 366 days. The error, `NepDateDataError`,
names the year and month at fault. See [Errors](./errors).

## The raw data

To use the table without any of the functions, for example to generate something at build time:

```ts
import { BS_DATA } from '@nepdate/core/data';

BS_DATA.firstYear; // → 1970
```

## Reporting a wrong year

If the bundled table is wrong, please
[open an issue](https://github.com/nepdate/nepdate/issues/new/choose) with the year, the month
lengths and a link to the published calendar.
