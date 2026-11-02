# A leave request form

[[toc]]

## Introduction

This recipe builds a typical form for Nepal: a range picker that blocks past dates, marks holidays,
and works out how many working days a request covers.

## The working-day count

Start with a plain function, so it's easy to test. It counts every day in the range except weekends
and holidays:

```ts
import { eachDayOfInterval, fromIsoDate, isWeekend } from '@nepdate/core';
import { isHoliday } from '@nepdate/holidays';

export function workingDays(start: string, end: string) {
  const from = fromIsoDate(start);
  const to = fromIsoDate(end);
  if (!from || !to) {
    return 0;
  }

  let count = 0;
  for (const day of eachDayOfInterval(from, to)) {
    if (!isWeekend(day) && !isHoliday(day)) {
      count++;
    }
  }

  return count;
}

workingDays('2026-10-18', '2026-10-24'); // → 6
workingDays('', ''); // → 0
```

That week has one Saturday and no fixed holidays, so it counts six days.

## The form

```tsx
import { useState } from 'react';
import { toCalendarHolidays } from '@nepdate/holidays';
import { DateRangePicker } from '@nepdate/react';

declare function workingDays(start: string, end: string): number;

const holidays = toCalendarHolidays();

export function LeaveRequest({ today }: { today: string }) {
  const [range, setRange] = useState({ start: '', end: '' });
  const days = workingDays(range.start, range.end);

  return (
    <form method="post" action="/leave">
      <DateRangePicker
        value={range}
        onChange={setRange}
        min={today}
        maxDays={30}
        holidays={holidays}
        startName="start"
        endName="end"
        startLabel="First day of leave"
        endLabel="Last day of leave"
      />
      {days > 0 && <p>{days} working days</p>}
      <button disabled={days === 0}>Request leave</button>
    </form>
  );
}
```

## On the server

Check again on the server, with the same function:

<!-- no-check -->
```ts
import { fromIsoDate, isBefore, today } from '@nepdate/core';

export function checkLeave(start: string, end: string) {
  const from = fromIsoDate(start);
  const to = fromIsoDate(end);

  if (!from || !to || isBefore(to, from)) {
    return 'Choose a start and an end date.';
  }
  if (isBefore(from, today())) {
    return 'Leave cannot start in the past.';
  }

  return workingDays(start, end) > 0 ? null : 'That range has no working days.';
}
```

## Real holidays

Only fixed national days are bundled. For real leave, load the year's
[published list](./holidays#loading-a-yearly-list) when your app starts, on both the client and the
server, so that festivals count as holidays too.
