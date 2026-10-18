# @nepdate/core

The Bikram Sambat (BS) ⇄ AD date engine: conversion, formatting, parsing, arithmetic, Nepal's fiscal year, and English/Nepali names. It depends on no package, and runs in Node (ESM and CJS), browsers and a plain `<script>` tag.

```bash
npm install @nepdate/core
```

```ts
import { adDate, adToBs, bsDate, bsToAd, formatDate, toIsoDate } from '@nepdate/core';

const bs = adToBs(adDate(2026, 10, 18)); // { calendar: 'BS', year: 2083, month: 7, day: 1 }
formatDate(bs, 'long'); // "1 Kartik 2083"
formatDate(bs, 'full', 'ne'); // "आइतबार, १ कार्तिक २०८३"
toIsoDate(bsDate(2083, 6, 24)); // "2026-10-10"
```

## Dates

Dates are frozen plain objects, `{ calendar, year, month, day }`, typed as `AdDate` or `BsDate`. They serialise to JSON and compare by value. Functions that need one calendar take that type, so passing a BS date where an AD date is expected is a type error.

| Function                                     | Does                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `adDate(y, m, d)` / `bsDate(y, m, d)`        | Create and validate. AD works for any year; BS only inside the table. |
| `createDate(calendar, y, m, d)`              | Either calendar.                                                      |
| `isValidDate`, `daysInMonth`, `isAdLeapYear` | Checks.                                                               |
| `isAdDate`, `isBsDate`, `isCalendarDate`     | Type guards for unknown input (e.g. JSON).                            |

Invalid dates throw `NepDateRangeError` with a `code`: `'INVALID_DATE'`, `'OUT_OF_TABLE'` or `'INVALID_ARGUMENT'`. Nothing is silently clamped.

## Conversion

| Function                                                        | Does                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `adToBs(ad)`, `bsToAd(bs)`, `toCalendar(date, 'AD' \| 'BS')`    | Convert. Throws `OUT_OF_TABLE` outside 1913-04-13 – 2043-04-13 AD.   |
| `toIsoDate(date)`                                               | The AD day as `"YYYY-MM-DD"`, ready to store or send.                |
| `fromIsoDate(text)`                                             | `"2026-10-18"` or a longer ISO timestamp → `AdDate`, or `null`.      |
| `fromJsDate(date, timeZone?)`                                   | The calendar day of a JS `Date` in a time zone (Nepal by default).   |
| `fromIsoTimestamp(text, timeZone?)`                             | `"2026-04-13T20:00:00Z"` → `{ date, time: "01:45" }` in Nepal time.  |
| `today(calendar?, timeZone?)`                                   | Today in Nepal (configurable), not the device's zone.                |
| `minDate(calendar)`, `maxDate(calendar)`, `isConvertible(date)` | The range that can be converted.                                     |
| `toEpoch(date)`, `fromEpoch(day, calendar)`                     | Whole days since 1970-01-01, the only thing the two calendars share. |

## Arithmetic and comparison

These work in the date's own calendar, and compare across calendars.

- `addDays`, `addMonths`, `addYears`: the day is capped to the target month.
- `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `startOfYear`, `endOfYear`.
- `differenceInDays`, `eachDayOfInterval`, `eachDayOfMonth`.
- `compareDates`, `isSameDay`, `isSameMonth`, `isSameYear`, `isBefore`, `isAfter`, `isWithin`, `clampDate`.
- `dayOfWeek`, `isWeekend`.

## Formatting and parsing

```ts
formatDate(date, 'iso'); // 2083-07-01
formatDate(date, 'cbms'); // 2083.07.01
formatDate(date, 'short'); // 1 Kar 2083
formatDate(date, 'D, j M y \\Y'); // Sun, 1 Kar 83 Y
parseDate('2083/7/1', 'BS'); // year first only; ASCII or Devanagari digits; null if invalid
parseDateStrict('17 July 2025', 'BS'); // throws with a reason
```

| Token | Output           |
| ----- | ---------------- |
| `Y`   | 2083             |
| `y`   | 83               |
| `m`   | 07               |
| `n`   | 7                |
| `d`   | 01               |
| `j`   | 1                |
| `F`   | month name       |
| `M`   | short month name |
| `l`   | weekday          |
| `D`   | short weekday    |

Put a backslash before a letter to print it as is. Digits follow the locale.

## Fiscal year

Nepal's fiscal year runs from 1 Shrawan to the end of Asar.

```ts
fiscalYear(date).label; // "2083/84"
formatFiscalYear(fiscalYear(date), 'cbms'); // "2083.084"
parseFiscalYear('२०८३/८४'); // FiscalYear | null
isInFiscalYear(date, fiscalYearRange(2083));
```

## Time

```ts
parseTime('2:30 pm'); // { hour: 14, minute: 30 }; also "14:30", "1430", "२:३० अपराह्न"
formatTime(timeOfDay(14, 30), { hour12: true, locale: 'ne' }); // "२:३० अपराह्न"
toIsoDateTime(bsDate(2083, 7, 1), timeOfDay(14, 30)); // "2026-10-18T14:30:00+05:45" (Nepal by default)
fromIsoDateTime('2026-10-18T09:00:00Z'); // { date: 2026-10-18 AD, time: 14:45 } in Nepal time
now(); // { date, time } in the configured zone
```

## Locales and config

```ts
import { configure, getLocale, monthNames, registerLocale } from '@nepdate/core';

configure({
  timeZone: 'Asia/Kathmandu',
  weekStartsOn: 0,
  weekendDays: [6],
  defaultLocale: 'ne',
});
monthNames('BS', 'ne'); // ['बैशाख', 'जेठ', …]
registerLocale('xx', { ...getLocale('en'), digits: [/* ten digits */] });
```

## The BS table

BS month lengths come from a table keyed by BS year (1970–2099), verified through 2083. The table holds no AD dates, so fixing one BS year never changes any AD result, or any BS date before that year.

```ts
isProjected(bsDate(2084, 1, 1)); // true: after the last verified year
patchBsYear(2090, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]); // correct one year
setBsData(table); // replace the whole table (validated)
import { BS_DATA } from '@nepdate/core/data'; // the raw bundled table
```

## In a `<script>` tag

```html
<script src="https://unpkg.com/@nepdate/core"></script>
<script>
  NepDate.formatDate(NepDate.today('BS'), 'long');
</script>
```

MIT © Shishir Rai
