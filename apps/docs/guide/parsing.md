# Parsing

[[toc]]

## Introduction

Parsing reads text and gives you a date. You say which calendar the text is in, because
`2083-07-01` and `2026-07-01` look alike and nepdate won't guess.

```ts
import { parseDate } from '@nepdatejs/core';

parseDate('2083-07-01', 'BS'); // → { calendar: 'BS', year: 2083, month: 7, day: 1 }
parseDate('2026-10-18', 'AD'); // → { calendar: 'AD', year: 2026, month: 10, day: 18 }
parseDate('2083-13-01', 'BS'); // → null
```

## What it accepts

The year always comes first. You can use dashes, slashes or dots, one or two digits for the
month and day, ASCII or Devanagari digits, or eight digits in a row:

```ts
import { parseDate } from '@nepdatejs/core';

parseDate('2083-07-01', 'BS')?.day; // → 1
parseDate('2083/7/1', 'BS')?.day; // → 1
parseDate('2083.07.01', 'BS')?.day; // → 1
parseDate('२०८३-०७-०१', 'BS')?.day; // → 1
parseDate('20830701', 'BS')?.day; // → 1
parseDate('  2083-07-01  ', 'BS')?.day; // → 1
```

Other orders are rejected rather than guessed. `01-07-2083` could mean 1 July or 7 January, so
it returns `null`.

```ts
import { parseDate } from '@nepdatejs/core';

parseDate('01-07-2083', 'BS'); // → null
parseDate('1 Kartik 2083', 'BS'); // → null
```

## Handling bad input

### `parseDate` returns `null`

Use `parseDate` for anything a person typed or another system sent. It never throws, so you
only need to check for `null`:

```ts
import { parseDate, toIsoDate } from '@nepdatejs/core';

function readDate(input: string) {
  const date = parseDate(input, 'BS');

  return date ? toIsoDate(date) : 'Please enter a date as YYYY-MM-DD.';
}

readDate('2083-06-24'); // → '2026-10-10'
readDate('tomorrow'); // → 'Please enter a date as YYYY-MM-DD.'
```

### `parseDateStrict` says why

`parseDateStrict` throws an error that explains the problem. Use it when you want the reason,
for example in a data import:

```ts
import { parseDateStrict } from '@nepdatejs/core';

parseDateStrict('2083-07-01', 'BS').day; // → 1
parseDateStrict('tomorrow', 'BS'); // → throws INVALID_ARGUMENT
parseDateStrict('2083-02-33', 'BS'); // → throws INVALID_DATE
```

## Fiscal years

`parseFiscalYear` reads the common ways of writing a fiscal year:

```ts
import { parseFiscalYear } from '@nepdatejs/core';

parseFiscalYear('2083/84')?.startYear; // → 2083
parseFiscalYear('2083/2084')?.startYear; // → 2083
parseFiscalYear('2083-84')?.startYear; // → 2083
parseFiscalYear('2083.084')?.startYear; // → 2083
parseFiscalYear('२०८३/८४')?.startYear; // → 2083
parseFiscalYear('2083/85'); // → null
```

## Times

See [`parseTime`](./time#parsing-and-formatting-times).
