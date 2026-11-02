# Nepal holidays

[[toc]]

## Introduction

`@nepdate/holidays` knows Nepal's **fixed-date national days**, and can load **each year's official
list** for everything else. It works with `@nepdate/core`, and plugs into the calendar and pickers.

```bash
npm install @nepdate/holidays
```

```ts
import { adDate } from '@nepdate/core';
import { holidaysFor, holidaysOn, isHoliday } from '@nepdate/holidays';

holidaysFor(2083).length; // → 7
isHoliday(adDate(2026, 9, 19)); // → true
holidaysOn(adDate(2026, 9, 19))[0]?.name.en; // → 'Constitution Day'
```

## What is included

| Day | BS date | Observed from |
|---|---|---|
| Nepali New Year | 1 Baisakh | |
| Loktantra Day | 11 Baisakh | 2063 |
| Republic Day | 15 Jestha | 2065 |
| Constitution Day | 3 Asoj | 2072 |
| Prithvi Jayanti (National Unity Day) | 27 Poush | |
| Martyrs' Day | 16 Magh | |
| Democracy Day | 7 Falgun | 2008 |

::: warning Festivals are not included
Dashain, Tihar, Chhath and other festivals follow the lunar calendar, so their BS dates change
every year and can't be calculated. Whether a national day is a public holiday can also change by
government notice. For leave and payroll, load each year's published list, as shown below.
:::

## Looking up holidays

### For a year

`holidaysFor` takes a BS year and returns its holidays in date order:

```ts
import { holidaysFor } from '@nepdate/holidays';

const [first] = holidaysFor(2083);

first?.id; // → 'new-year'
first?.name; // → { en: 'Nepali New Year', ne: 'नयाँ वर्ष' }
first?.type; // → 'national'
```

### For a day

`holidaysOn` and `isHoliday` accept a date in either calendar:

```ts
import { bsDate } from '@nepdate/core';
import { holidaysOn, isHoliday } from '@nepdate/holidays';

isHoliday(bsDate(2083, 6, 3)); // → true
isHoliday(bsDate(2083, 6, 4)); // → false
holidaysOn(bsDate(2083, 6, 4)); // → []
```

### For a range

`holidaysBetween` crosses years, which is handy for fiscal-year reports:

```ts
import { bsDate } from '@nepdate/core';
import { holidaysBetween } from '@nepdate/holidays';

holidaysBetween(bsDate(2083, 6, 1), bsDate(2083, 11, 30)).map((holiday) => holiday.id).length; // → 4
```

### Filtering

Every lookup takes the same filter:

```ts
import { holidaysFor } from '@nepdate/holidays';

holidaysFor(2083, { types: ['national'] }).length; // → 7
holidaysFor(2083, { includeFixed: false }); // → []
```

| Option | Default | Meaning |
|---|---|---|
| `types` | all | Only these kinds: `national`, `festival`, `observance`, `custom` |
| `includeFixed` | `true` | Include the bundled national days |

### Names

```ts
import { holidayName, holidaysFor } from '@nepdate/holidays';

const [first] = holidaysFor(2083);

first && holidayName(first, 'ne'); // → 'नयाँ वर्ष'
```

## In the calendar and pickers

`toCalendarHolidays` gives you a function for the `holidays` option. Days turn red and screen readers
hear the name:

```tsx
import { toCalendarHolidays } from '@nepdate/holidays';
import { Calendar, DatePicker } from '@nepdate/react';

const holidays = toCalendarHolidays({ locale: 'ne' });

export function Schedule() {
  return (
    <>
      <DatePicker holidays={holidays} aria-label="Date" />
      <Calendar holidays={holidays} />
    </>
  );
}
```

It takes the same `types` and `includeFixed` filter, plus `locale`.

## Adding your own

`registerHolidays` adds days for a year, such as school or company closures:

```ts
import { holidaysFor, registerHolidays } from '@nepdate/holidays';

registerHolidays(2083, [
  {
    id: 'founders-day',
    date: '2083-05-10',
    name: { en: "Founders' Day", ne: 'संस्थापक दिवस' },
    type: 'custom',
  },
]);

holidaysFor(2083, { types: ['custom'] })[0]?.source; // → 'registered'
```

## Loading a yearly list

Save each year's published list as JSON:

```json
{
  "year": 2083,
  "source": "https://example.gov.np/notice-2083",
  "holidays": [
    {
      "id": "vijaya-dashami",
      "date": "2083-06-24",
      "name": { "en": "Vijaya Dashami", "ne": "विजया दशमी" },
      "type": "festival"
    }
  ]
}
```

| Field | Rule |
|---|---|
| `year` | The BS year the list covers |
| `source` | Required: where the list comes from |
| `id` | Unique in the file. Reuse a fixed day's ID, such as `constitution-day`, to replace it for that year |
| `date` | A BS date inside `year`, in ASCII or Devanagari digits |
| `name` | Both `en` and `ne` |
| `type` | `national`, `festival` (the default), `observance` or `custom` |

The dates above are examples only. Copy real dates from the published notice, and never estimate
festival dates.

Then load it. The file is checked first:

<!-- no-check -->
```ts
import { loadHolidayFile } from '@nepdate/holidays';

const response = await fetch('/holidays/2083.json');

loadHolidayFile(await response.json());
```

A bad file throws `HolidayDataError`, whose `path` shows where the problem is:

```ts
import { HolidayDataError, parseHolidayFile } from '@nepdate/holidays';

try {
  parseHolidayFile({ year: 2083, source: 'notice', holidays: [{ id: '' }] });
} catch (error) {
  if (error instanceof HolidayDataError) {
    error.path; // → 'holidays[0].id'
  }
}
```

`parseHolidayFile` only checks a file. `loadHolidayFile` checks it and adds it.

## Managing lists

```ts
import { clearHolidays, registerHolidays, registeredYears } from '@nepdate/holidays';

registerHolidays(2083, []);
registeredYears(); // → [2083]

clearHolidays(2083);
registeredYears(); // → []
```

Call `clearHolidays()` with no year to remove every list.
