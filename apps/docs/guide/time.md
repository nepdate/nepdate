# Today, time and time zones

[[toc]]

## Introduction

A nepdate date has no time inside it: it's a calendar day. When you do need a time, there are
small helpers for it. By default they all use **Nepal time** (`Asia/Kathmandu`, +05:45), not
the zone of the device or server.

This matters more than it sounds. A server running in UTC reads the time as 8 PM on 18 October
when it is already 19 October in Kathmandu. nepdate gives you the right day either way.

## Today

<!-- no-check -->
```ts
import { now, today } from '@nepdate/core';

today(); // today in Nepal, as an AD date
today('BS'); // today in Nepal, as a BS date
today('AD', 'Europe/London'); // today in another zone

now(); // { date, time: { hour, minute } } in Nepal
now('UTC'); // the same in another zone
```

To change the default for your whole app, set `timeZone` with
[`configure`](./configuration).

## Time of day

A `TimeOfDay` is a frozen object with an `hour` from 0 to 23 and a `minute` from 0 to 59.

```ts
import { compareTimes, isValidTime, timeOfDay } from '@nepdate/core';

timeOfDay(14, 30); // → { hour: 14, minute: 30 }
timeOfDay(9); // → { hour: 9, minute: 0 }
timeOfDay(24, 0); // → throws INVALID_ARGUMENT

isValidTime(23, 59); // → true
compareTimes(timeOfDay(9), timeOfDay(17)); // → -1
```

## Parsing and formatting times

`parseTime` accepts the ways people usually write a time, in English or Nepali, and returns
`null` for anything else:

```ts
import { parseTime } from '@nepdate/core';

parseTime('14:30'); // → { hour: 14, minute: 30 }
parseTime('2:30 pm'); // → { hour: 14, minute: 30 }
parseTime('2 PM'); // → { hour: 14, minute: 0 }
parseTime('1430'); // → { hour: 14, minute: 30 }
parseTime('१४:३०'); // → { hour: 14, minute: 30 }
parseTime('२:३० अपराह्न'); // → { hour: 14, minute: 30 }
parseTime('25:00'); // → null
```

`formatTime` writes a time back out:

```ts
import { formatTime, timeOfDay } from '@nepdate/core';

const time = timeOfDay(14, 30);

formatTime(time); // → '14:30'
formatTime(time, { hour12: true }); // → '2:30 PM'
formatTime(time, { locale: 'ne' }); // → '१४:३०'
formatTime(time, { hour12: true, locale: 'ne' }); // → '२:३० अपराह्न'
```

## Storing a moment

A date plus a time is an instant, and an instant needs a zone. `toIsoDateTime` gives you an ISO
timestamp with the offset included, which any database or API can read:

```ts
import { bsDate, timeOfDay, toIsoDateTime } from '@nepdate/core';

const date = bsDate(2083, 7, 1);

toIsoDateTime(date, timeOfDay(14, 30)); // → '2026-10-18T14:30:00+05:45'
toIsoDateTime(date, timeOfDay(14, 30), 'UTC'); // → '2026-10-18T14:30:00+00:00'
```

`fromIsoDateTime` reads one back, in Nepal time by default:

```ts
import { fromIsoDateTime } from '@nepdate/core';

const moment = fromIsoDateTime('2026-10-18T09:00:00Z');

moment?.date; // → { calendar: 'AD', year: 2026, month: 10, day: 18 }
moment?.time; // → { hour: 14, minute: 45 }
fromIsoDateTime('2026-10-18T09:00:00Z', 'UTC')?.time; // → { hour: 9, minute: 0 }
fromIsoDateTime('nonsense'); // → null
```

## From timestamps

If you have a timestamp from a server and just want the day and a display time in Nepal, use
`fromIsoTimestamp`. It gives the time as `HH:MM` text:

```ts
import { formatDate, fromIsoTimestamp, toCalendar } from '@nepdate/core';

const local = fromIsoTimestamp('2026-04-13T20:00:00Z');

local?.time; // → '01:45'
local && formatDate(toCalendar(local.date, 'BS')); // → '2083-01-01'
```

That example is why the zone matters: the timestamp says 13 April, but in Nepal it's already
14 April, which is the first day of the new BS year.

A plain date with no time has no instant, so `fromIsoTimestamp` returns `null` for it. Use
[`fromIsoDate`](./conversion#fromisodate) for those.
