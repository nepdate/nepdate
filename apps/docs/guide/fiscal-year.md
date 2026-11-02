# Fiscal years

[[toc]]

## Introduction

Nepal's fiscal year runs from **1 Shrawan** to the last day of **Asar**, about mid-July to
mid-July. So the fiscal year that begins in BS 2083 ends in BS 2084, and is written `2083/84`.

```ts
import { bsDate, fiscalYear } from '@nepdate/core';

const fy = fiscalYear(bsDate(2083, 7, 1));

fy.label; // → '2083/84'
fy.startYear; // → 2083
```

## Finding a fiscal year

### `fiscalYear(date)`

This takes any date, in either calendar, and gives the fiscal year it falls in:

```ts
import { adDate, bsDate, fiscalYear } from '@nepdate/core';

fiscalYear(bsDate(2083, 4, 1)).label; // → '2083/84'
fiscalYear(bsDate(2083, 3, 15)).label; // → '2082/83'
fiscalYear(adDate(2026, 10, 18)).label; // → '2083/84'
```

### `fiscalYearRange(startYear)`

This builds a fiscal year from the BS year it starts in:

```ts
import { fiscalYearRange, formatDate } from '@nepdate/core';

const fy = fiscalYearRange(2083);

formatDate(fy.firstDay); // → '2083-04-01'
formatDate(fy.lastDay); // → '2084-03-32'
```

A `FiscalYear` is a frozen object:

| Field | Type | Example |
|---|---|---|
| `startYear` | `number` | `2083` |
| `label` | `string` | `'2083/84'` |
| `firstDay` | `BsDate` | 2083-04-01 |
| `lastDay` | `BsDate` | 2084-03-32 |

## Checking a date

```ts
import { bsDate, fiscalYearRange, isInFiscalYear } from '@nepdate/core';

const fy = fiscalYearRange(2083);

isInFiscalYear(bsDate(2083, 10, 1), fy); // → true
isInFiscalYear(bsDate(2083, 2, 1), fy); // → false
```

## Writing a fiscal year

`formatFiscalYear` has three styles, and digits follow the locale:

```ts
import { fiscalYearRange, formatFiscalYear } from '@nepdate/core';

const fy = fiscalYearRange(2083);

formatFiscalYear(fy); // → '2083/84'
formatFiscalYear(fy, 'full'); // → '2083/2084'
formatFiscalYear(fy, 'cbms'); // → '2083.084'
formatFiscalYear(fy, 'label', 'ne'); // → '२०८३/८४'
```

`cbms` is the form used by Nepal's tax system.

To read one back, use [`parseFiscalYear`](./parsing#fiscal-years).

## Querying by fiscal year

To filter stored AD dates, turn the two ends into AD strings:

```ts
import { fiscalYearRange, toIsoDate } from '@nepdate/core';

const fy = fiscalYearRange(2083);

toIsoDate(fy.firstDay); // → '2026-07-17'
toIsoDate(fy.lastDay); // → '2027-07-16'
```

Then use them in your query, such as `WHERE paid_on BETWEEN ? AND ?`. See
[Reports by fiscal year](./recipe-fiscal-report) for a full example.

## In the pickers

The range picker can offer a whole fiscal year in one click, through shortcuts or a tile view.
See [Date range picker](/pickers/range-picker#fiscal-years).
