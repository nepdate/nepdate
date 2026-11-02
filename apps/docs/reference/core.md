# @nepdatejs/core

[[toc]]

The date engine. It depends on no package. See the [guide](/guide/dates) for explanations and
examples.

```ts
import { adDate, adToBs, formatDate } from '@nepdatejs/core';
```

## Creating and checking

| Function | Returns | Notes |
|---|---|---|
| `adDate(year, month, day)` | `AdDate` | Any year. Throws `INVALID_DATE` |
| `bsDate(year, month, day)` | `BsDate` | Inside the table. Throws `INVALID_DATE` or `OUT_OF_TABLE` |
| `createDate(calendar, year, month, day)` | `DateOf<C>` | Either calendar |
| `isValidDate(calendar, year, month, day)` | `boolean` | Never throws |
| `daysInMonth(calendar, year, month)` | `number` | |
| `isAdLeapYear(year)` | `boolean` | |
| `isAdDate(value)`, `isBsDate(value)`, `isCalendarDate(value)` | `boolean` | Type guards for unknown input |
| `MAX_AD_YEAR` | `number` | The largest AD year supported |

## Converting

| Function | Returns | Notes |
|---|---|---|
| `adToBs(date)` | `BsDate` | Throws `OUT_OF_TABLE` |
| `bsToAd(date)` | `AdDate` | |
| `toCalendar(date, calendar)` | `DateOf<C>` | Returns the same date if already in that calendar |
| `toIsoDate(date)` | `string` | The AD day as `YYYY-MM-DD` |
| `fromIsoDate(text)` | `AdDate \| null` | Reads the date as written |
| `fromJsDate(instant, timeZone?)` | `AdDate` | The day of a `Date` in a zone |
| `fromIsoTimestamp(text, timeZone?)` | `{ date, time } \| null` | `time` is `HH:MM` text |
| `toEpoch(date)` | `EpochDay` | Days since 1970-01-01 |
| `fromEpoch(day, calendar)` | `DateOf<C>` | |
| `toEpochDay(number)` | `EpochDay` | Check a number and brand it as an epoch day |
| `weekdayOf(day)` | `Weekday` | The weekday of an epoch day |
| `minDate(calendar)`, `maxDate(calendar)` | `DateOf<C>` | The convertible range |
| `isConvertible(date)` | `boolean` | Inside the convertible range |
| `isProjected(date)` | `boolean` | After the last verified BS year |

## The clock

| Function | Returns | Notes |
|---|---|---|
| `today(calendar?, timeZone?)` | date | Default `'AD'` in the configured zone |
| `now(timeZone?)` | `{ date, time }` | `time` has `hour` and `minute` |

## Arithmetic

All of these keep the date's calendar and return a new date.

| Function | Notes |
|---|---|
| `addDays(date, days)` | Negative numbers go back |
| `addMonths(date, months)` | The day is capped to the month's length |
| `addYears(date, years)` | The day is capped |
| `startOfMonth(date)`, `endOfMonth(date)` | |
| `startOfYear(date)`, `endOfYear(date)` | |
| `startOfWeek(date, weekStartsOn?)`, `endOfWeek(date, weekStartsOn?)` | |
| `differenceInDays(a, b)` | A number: days from `b` to `a` |
| `eachDayOfInterval(start, end)` | A generator of every day, both ends included |
| `eachDayOfMonth(date)` | A list of the month's days |

## Comparing

| Function | Returns | Notes |
|---|---|---|
| `compareDates(a, b)` | `-1 \| 0 \| 1` | For `sort` |
| `isSameDay(a, b)` | `boolean` | Accepts `null` |
| `isSameMonth(a, b)`, `isSameYear(a, b)` | `boolean` | In the first date's calendar |
| `isBefore(a, b)`, `isAfter(a, b)` | `boolean` | |
| `isWithin(date, min?, max?)` | `boolean` | Both ends included |
| `clampDate(date, min?, max?)` | date | Moved to the nearest limit |
| `dayOfWeek(date)` | `Weekday` | `0` is Sunday |
| `isWeekend(date, weekendDays?)` | `boolean` | |

## Formatting and parsing

| Function | Returns | Notes |
|---|---|---|
| `formatDate(date, pattern?, locale?)` | `string` | See [Formatting](/guide/formatting) |
| `DATE_FORMATS` | object | The named formats |
| `parseDate(text, calendar)` | date or `null` | Never throws |
| `parseDateStrict(text, calendar)` | date | Throws the reason |

## Fiscal year

| Function | Returns | Notes |
|---|---|---|
| `fiscalYear(date)` | `FiscalYear` | The year a date falls in |
| `fiscalYearRange(startYear)` | `FiscalYear` | From its BS start year |
| `formatFiscalYear(fy, style?, locale?)` | `string` | `'label'`, `'full'` or `'cbms'` |
| `parseFiscalYear(text)` | `FiscalYear \| null` | |
| `isInFiscalYear(date, fy)` | `boolean` | |
| `BS_FISCAL_YEAR_START_MONTH` | `4` | Shrawan |

## Time

| Function | Returns | Notes |
|---|---|---|
| `timeOfDay(hour, minute?)` | `TimeOfDay` | Throws `INVALID_ARGUMENT` |
| `isValidTime(hour, minute)` | `boolean` | |
| `compareTimes(a, b)` | `-1 \| 0 \| 1` | |
| `parseTime(text)` | `TimeOfDay \| null` | English or Nepali |
| `formatTime(time, { hour12?, locale? })` | `string` | |
| `toIsoDateTime(date, time, timeZone?)` | `string` | With the zone's offset |
| `fromIsoDateTime(text, timeZone?)` | `{ date, time } \| null` | |

## Languages and digits

| Function | Returns | Notes |
|---|---|---|
| `registerLocale(code, data)` | | Adds or replaces a language |
| `getLocale(code?)` | `LocaleData` | English if not registered |
| `hasLocale(code)` | `boolean` | |
| `monthNames(calendar, locale?, width?)` | `string[]` | `'long'` or `'short'` |
| `weekdayNames(locale?, width?)` | `string[]` | `'long'`, `'short'` or `'narrow'` |
| `formatNumber(value, locale?)` | `string` | Digits in the locale |
| `formatMessage(template, values)` | `string` | Fills in `{name}` placeholders |
| `toDevanagariDigits(value)`, `toAsciiDigits(text)` | `string` | |

## Settings

| Function | Notes |
|---|---|
| `configure(changes)` | See [Settings](/guide/configuration) |
| `getConfig()` | The current settings, frozen |
| `resetConfig()` | Back to the defaults |

## The BS table

| Function | Notes |
|---|---|
| `getBsData()` | The table in use |
| `setBsData(table)` | Replace the table |
| `patchBsYear(year, months)` | Correct one year, or add one at either end |
| `resetBsData()` | Back to the bundled table |
| `validateBsData(table)` | Throws `NepDateDataError` if it isn't valid |
| `bsFirstYear()`, `bsLastYear()` | The table's limits |

`@nepdatejs/core/data` exports the raw table as `BS_DATA`.

## Errors

`NepDateRangeError` and `NepDateDataError`. See [Errors](/guide/errors).

## Types

`AdDate`, `BsDate`, `CalendarDate`, `CalendarSystem`, `DateOf`, `EpochDay`, `Weekday`, `MonthNumber`,
`FiscalYear`, `BsData`, `LocaleCode`, `LocaleData`, `TimeOfDay`, `NepDateConfig`,
`DateFormatPattern`, `NamedFormat`, `NepDateRangeErrorCode`, `NepDateDataErrorCode`.
