# @nepdate/holidays

Nepal's fixed-date national days, plus a validated loader for each year's official holiday list. It works with `@nepdate/calendar` and both pickers.

```bash
npm install @nepdate/holidays
```

```ts
import { holidaysFor, isHoliday, toCalendarHolidays } from '@nepdate/holidays';
import { adDate } from '@nepdate/core';

holidaysFor(2083); // [{ id: 'new-year', date: 2083-01-01 BS, name: { en, ne }, type: 'national' }, …]
isHoliday(adDate(2026, 9, 19)); // true: Constitution Day (3 Asoj 2083)

<DatePicker holidays={toCalendarHolidays({ locale: 'ne' })} />; // red days with names
```

## What's included

| Day                                  | BS date    | Observed from |
| ------------------------------------ | ---------- | ------------- |
| Nepali New Year                      | 1 Baisakh  | –             |
| Loktantra Day                        | 11 Baisakh | 2063          |
| Republic Day                         | 15 Jestha  | 2065          |
| Constitution Day                     | 3 Asoj     | 2072          |
| Prithvi Jayanti (National Unity Day) | 27 Poush   | –             |
| Martyrs' Day                         | 16 Magh    | –             |
| Democracy Day                        | 7 Falgun   | 2008          |

**Festivals are not bundled.** Dashain, Tihar, Chhath and other festivals follow the lunar calendar, so their BS dates change every year and can't be computed. Whether each national day is a public holiday can also change by government notice. For leave and payroll, load each year's published list:

```ts
import { loadHolidayFile } from '@nepdate/holidays';

loadHolidayFile(await (await fetch('/holidays/2083.json')).json()); // validated; throws HolidayDataError with a path
```

The list format is documented in the repository's `data/holidays/README.md`. An entry with a fixed day's `id` replaces that day for its year.

## API

| Function                                           | Does                                                          |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `holidaysFor(year, { types?, includeFixed? })`     | A BS year's holidays, sorted.                                 |
| `holidaysOn(date)`, `isHoliday(date)`              | Look up a day; AD or BS dates both work.                      |
| `holidaysBetween(start, end)`                      | Holidays in a range, crossing years.                          |
| `registerHolidays(year, entries)`                  | Add your own, e.g. school or company days (`type: 'custom'`). |
| `loadHolidayFile(json)` / `parseHolidayFile(json)` | Load or just validate a yearly list.                          |
| `clearHolidays(year?)`, `registeredYears()`        | Manage registered lists.                                      |
| `toCalendarHolidays({ locale, types })`            | A lookup for the calendar's `holidays` option.                |

MIT © Shishir Rai
