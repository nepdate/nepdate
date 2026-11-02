# Storing and showing dates

[[toc]]

## Introduction

The simplest approach to BS dates in an app is this:

**Store AD. Show BS.**

Keep every date in your database and API as AD. Convert to BS at the last moment, when you show it
to someone.

## Why store AD?

- **Your database understands it.** `date` columns, sorting, ranges and date functions all work. A
  BS date stored in a `date` column would be rejected or, worse, accepted: BS 2083-02-32 isn't a
  real AD date, but BS 2083-02-15 looks like one.
- **BS months can be corrected.** If a future BS year's table is corrected, an AD date still means
  the same day.
- **Other systems expect it.** Payment gateways, email tools and reports all speak AD.

## Storing a date

Use a `date` column, not a string or a datetime. The value from a picker goes straight in:

```sql
CREATE TABLE students (
  id  serial PRIMARY KEY,
  dob date NOT NULL
);
```

## Showing a date

```ts
import { formatDate, fromIsoDate, toCalendar } from '@nepdate/core';

function showDate(stored: string | null) {
  const date = fromIsoDate(stored);

  return date ? formatDate(toCalendar(date, 'BS'), 'long') : '—';
}

showDate('2026-10-10'); // → '24 Ashwin 2083'
showDate(null); // → '—'
```

In React, [`<DateText>`](/integrations/react#showing-dates) does this.

## Date-only values and time zones

A date with no time should never pass through a JavaScript `Date`. `new Date('2026-10-10')` is
midnight UTC, which is the evening of the 9th in New York.

```ts
import { fromIsoDate, toIsoDate } from '@nepdate/core';

const date = fromIsoDate('2026-10-10');

date && toIsoDate(date); // → '2026-10-10'
```

nepdate dates have no time or zone in them, so this can't happen.

## Moments in time

For a timestamp, such as when a record was created, store the instant in a `timestamptz` column.
Then show it in Nepal time:

```ts
import { formatDate, fromIsoTimestamp, toCalendar } from '@nepdate/core';

function showMoment(stored: string) {
  const local = fromIsoTimestamp(stored);

  return local
    ? `${formatDate(toCalendar(local.date, 'BS'), 'long')}, ${local.time}`
    : stored;
}

showMoment('2026-10-18T09:00:00Z'); // → '1 Kartik 2083, 14:45'
```

## Querying by BS periods

Turn the BS period into AD limits, and query those.

### By BS month

```ts
import { bsDate, endOfMonth, startOfMonth, toIsoDate } from '@nepdate/core';

const month = bsDate(2083, 7, 1);

toIsoDate(startOfMonth(month)); // → '2026-10-18'
toIsoDate(endOfMonth(month)); // → '2026-11-16'
```

### By BS year

```ts
import { bsDate, endOfYear, startOfYear, toIsoDate } from '@nepdate/core';

const year = bsDate(2083, 1, 1);

toIsoDate(startOfYear(year)); // → '2026-04-14'
toIsoDate(endOfYear(year)); // → '2027-04-13'
```

### Grouping by BS month

SQL can't group by BS month by itself, so group in your code:

```ts
import { formatDate, fromIsoDate, toCalendar } from '@nepdate/core';

const rows = ['2026-10-18', '2026-11-05', '2026-11-20'];
const byMonth = new Map<string, number>();

for (const row of rows) {
  const date = fromIsoDate(row);
  if (date) {
    const key = formatDate(toCalendar(date, 'BS'), 'F Y');
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
}

byMonth.get('Kartik 2083'); // → 2
byMonth.get('Mangsir 2083'); // → 1
```

## When someone gives you BS

If people send BS, such as in a spreadsheet import, convert it to AD on the way in:

```ts
import { parseDate, toIsoDate } from '@nepdate/core';

const date = parseDate('2083-06-24', 'BS');

date && toIsoDate(date); // → '2026-10-10'
```
