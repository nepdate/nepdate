# How it works

[[toc]]

## Introduction

You don't need this page to use nepdate, but a few ideas explain why it behaves as it does.
They also help when you are deciding what to store and what to show.

## Two calendars, one day count

A BS year starts in mid-April and ends in mid-April, so it always overlaps two AD years. If
AD and BS code shared year numbers, a mistake could creep in around every new year.

So nepdate keeps them apart. The AD calendar is plain arithmetic and needs no data. The BS
calendar is a table of month lengths. The two meet in exactly one place: a whole number
called the **epoch day**, the number of days since 1 January 1970.

```text
AD date  ⇄  epoch day  ⇄  BS date
```

Every conversion goes through that number. AD code never reads the BS table, and the BS table
holds no AD dates. Correcting a BS year can't change any AD result.

```ts
import { adDate, bsDate, toEpoch } from '@nepdatejs/core';

toEpoch(adDate(2026, 10, 18)); // → 20744
toEpoch(bsDate(2083, 7, 1)); // → 20744
```

The same day has the same number, whichever calendar you start from.

## Dates are values

A date is a frozen plain object:

```ts
import { bsDate } from '@nepdatejs/core';

const date = bsDate(2083, 7, 1);

date; // → { calendar: 'BS', year: 2083, month: 7, day: 1 }
Object.isFrozen(date); // → true
```

This has some useful effects:

- **Nothing changes a date behind your back.** `addDays` returns a new date.
- **Dates serialise cleanly.** `JSON.stringify` just works.
- **There is no time zone inside a date.** `bsDate(2083, 7, 1)` is that calendar day, wherever
  your code runs. This avoids the classic bug where a JavaScript `Date` slips to the previous
  day in another zone.

`AdDate` and `BsDate` are separate types, so TypeScript rejects one where the other is
expected:

<!-- no-check -->
```ts
function saveBirthday(date: AdDate) {}

saveBirthday(bsDate(2083, 7, 1)); // Type error
```

## Mistakes throw

If something isn't a real date, nepdate says so rather than guessing:

```ts
import { adDate, bsDate } from '@nepdatejs/core';

bsDate(2083, 2, 33); // → throws INVALID_DATE
adDate(2026, 2, 30); // → throws INVALID_DATE
```

Some libraries would quietly give you 2 March there. nepdate won't. Functions that read
outside input, such as `parseDate`, return `null` instead of throwing. See
[Errors](./errors).

## The value is always AD

Pickers show BS, but the value they give you is always the AD date as `YYYY-MM-DD`, the same
as `<input type="date">`. This gives you three things:

- A BS date can never be saved as if it were AD.
- Your database's date columns, sorting and date functions all keep working.
- Your validation doesn't need to know about BS.

Think of BS as how a date is **shown**, and AD as how it is **stored**.
[Storing and showing dates](./storing-dates) covers this in more detail.

## The BS table

BS month lengths come from a table covering **BS 1970 to 2099** (AD 1913 to 2043). Years
through **2083** have been checked against published calendars. Later years are projections,
which may change when official calendars come out, and `isProjected` tells you which is which.

```ts
import { bsDate, isProjected } from '@nepdatejs/core';

isProjected(bsDate(2083, 1, 1)); // → false
isProjected(bsDate(2084, 1, 1)); // → true
```

AD dates work for any year, but they can only be converted to BS inside that range. You can
correct or replace the table without waiting for a new release. See
[The BS table](./bs-table).

## Layers

Each package has one job, and lower packages never import higher ones:

```text
@nepdatejs/core            dates
      ↑
@nepdatejs/calendar        calendar logic, no UI
      ↑
@nepdatejs/datepicker      picker logic, no UI
      ↑
@nepdatejs/react, @nepdatejs/vanilla        render it
```

`calendar` and `datepicker` hold no UI at all. They are small stores that you can read and
send actions to, and the React and Web Component versions are thin layers on top. That's why
they behave the same, and why you can [build your own](/integrations/stores) for another
framework.
