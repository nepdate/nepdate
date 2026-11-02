# @nepdate/holidays

[[toc]]

Nepal's national days and a loader for yearly lists. See [Nepal holidays](/guide/holidays).

## Looking up

| Function | Returns |
|---|---|
| `holidaysFor(year, query?)` | A BS year's holidays, sorted |
| `holidaysOn(date, query?)` | The holidays on a day, in either calendar |
| `isHoliday(date, query?)` | `boolean` |
| `holidaysBetween(start, end, query?)` | Holidays in a range, both ends included |
| `holidayName(holiday, locale?)` | The name in a language |
| `toCalendarHolidays({ locale, types, includeFixed })` | A function for the `holidays` option |

A `HolidayQuery` has `types` and `includeFixed`.

## Managing lists

| Function | Does |
|---|---|
| `registerHolidays(year, entries)` | Add entries for a year |
| `loadHolidayFile(json)` | Check a yearly list and add it |
| `parseHolidayFile(json)` | Check a yearly list and return it typed |
| `clearHolidays(year?)` | Remove one year, or all |
| `registeredYears()` | The years with lists |
| `fixedHolidaysFor(year)` | Only the bundled national days |
| `FIXED_NATIONAL_DAYS` | The rules behind them |

## `Holiday`

| Field | Contents |
|---|---|
| `id` | A stable ID, such as `"constitution-day"` |
| `date` | A `BsDate` |
| `name` | `{ en, ne }` |
| `type` | `'national'`, `'festival'`, `'observance'` or `'custom'` |
| `source` | `'fixed'` or `'registered'` |

## Errors

`HolidayDataError` has a `path` that shows where a list is wrong, such as `holidays[0].date`.

## Types

`Holiday`, `HolidayEntry`, `HolidayFile`, `HolidayName`, `HolidayType`, `HolidayQuery`,
`FixedHolidayRule`.
