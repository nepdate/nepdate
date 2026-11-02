# Errors

[[toc]]

## Introduction

nepdate has one simple rule: **functions that build a date throw an error if the date is bad,
and functions that read outside input return `null`.**

| You call | Bad input gives |
|---|---|
| `bsDate`, `adDate`, `createDate` | `NepDateRangeError` |
| `adToBs`, `bsToAd`, `toCalendar` | `NepDateRangeError` |
| `parseDateStrict` | `NepDateRangeError` |
| `parseDate`, `fromIsoDate`, `parseTime`, `parseFiscalYear`, `fromIsoTimestamp`, `fromIsoDateTime` | `null` |
| `setBsData`, `patchBsYear` | `NepDateDataError` |

No function quietly changes a bad date into a nearby one.

## `NepDateRangeError`

Check `code`, not the message. Messages may be reworded, but codes won't change.

| Code | Meaning |
|---|---|
| `INVALID_DATE` | That year, month or day doesn't exist in the calendar |
| `OUT_OF_TABLE` | The date is outside the BS table, so it can't be a BS date or be converted |
| `INVALID_ARGUMENT` | A value of the wrong kind: not a whole number, an unknown time zone, unreadable text |

```ts
import { adDate, adToBs, NepDateRangeError } from '@nepdate/core';

function toBsText(year: number, month: number, day: number) {
  try {
    return adToBs(adDate(year, month, day)).year;
  } catch (error) {
    if (error instanceof NepDateRangeError && error.code === 'OUT_OF_TABLE') {
      return 'Too far from today to convert';
    }
    throw error;
  }
}

toBsText(2026, 10, 18); // → 2083
toBsText(1800, 1, 1); // → 'Too far from today to convert'
```

`NepDateRangeError` extends the built-in `RangeError`.

## `NepDateDataError`

This is thrown when a BS table isn't valid. As well as `code`, it has `year` and `month` when
it can name them.

| Code | Meaning |
|---|---|
| `EMPTY` | The table has no years |
| `BAD_MONTH_COUNT` | A year doesn't have 12 months |
| `BAD_MONTH` | A month isn't 29 to 32 days |
| `BAD_YEAR_TOTAL` | A year's days don't add up to a real year |
| `BAD_ANCHOR` | `firstYear`, `epochStart` or `verifiedThrough` isn't a whole number |

```ts
import { NepDateDataError, patchBsYear } from '@nepdate/core';

try {
  patchBsYear(2090, [31, 31, 40, 31, 31, 31, 30, 29, 30, 29, 30, 30]);
} catch (error) {
  if (error instanceof NepDateDataError) {
    error.code; // → 'BAD_MONTH'
    error.year; // → 2090
    error.month; // → 3
  }
}
```

## Errors in pickers

Pickers never throw on bad typing. They set `state.error` to an object with a `code` and a
translated `message`, and the components show that message. See
[Limits and validation](/pickers/validation).

## Errors in holiday lists

`loadHolidayFile` and `parseHolidayFile` throw `HolidayDataError`, which has a `path` showing
where the problem is. See [Nepal holidays](./holidays#loading-a-yearly-list).
