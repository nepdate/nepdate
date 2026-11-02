# Formatting

[[toc]]

## Introduction

`formatDate` turns a date into text. It writes the date in the date's **own** calendar, so
convert first if you want the other one.

```ts
import { bsDate, formatDate } from '@nepdate/core';

const date = bsDate(2083, 7, 1);

formatDate(date, 'long'); // → '1 Kartik 2083'
formatDate(date, 'full', 'ne'); // → 'आइतबार, १ कार्तिक २०८३'
formatDate(date, 'j M'); // → '1 Kar'
```

The signature is `formatDate(date, pattern = 'iso', locale?)`.

## Named formats

| Name | Pattern | English | Nepali |
|---|---|---|---|
| `iso` | `Y-m-d` | 2083-07-01 | २०८३-०७-०१ |
| `cbms` | `Y.m.d` | 2083.07.01 | २०८३.०७.०१ |
| `short` | `j M Y` | 1 Kar 2083 | १ कार्तिक २०८३ |
| `long` | `j F Y` | 1 Kartik 2083 | १ कार्तिक २०८३ |
| `full` | `l, j F Y` | Sunday, 1 Kartik 2083 | आइतबार, १ कार्तिक २०८३ |

```ts
import { bsDate, formatDate } from '@nepdate/core';

const date = bsDate(2083, 7, 1);

formatDate(date); // → '2083-07-01'
formatDate(date, 'cbms'); // → '2083.07.01'
formatDate(date, 'short'); // → '1 Kar 2083'
```

`cbms` is the dotted form that Nepal's tax systems use.

## Custom patterns

Build your own pattern from these letters. Any other character is printed as it is.

| Token | Meaning | Example |
|---|---|---|
| `Y` | Year | 2083 |
| `y` | Two-digit year | 83 |
| `m` | Month, two digits | 07 |
| `n` | Month | 7 |
| `d` | Day, two digits | 01 |
| `j` | Day | 1 |
| `F` | Month name | Kartik |
| `M` | Short month name | Kar |
| `l` | Weekday | Sunday |
| `D` | Short weekday | Sun |

```ts
import { bsDate, formatDate } from '@nepdate/core';

const date = bsDate(2083, 7, 1);

formatDate(date, 'd/m/Y'); // → '01/07/2083'
formatDate(date, 'D, j M'); // → 'Sun, 1 Kar'
formatDate(date, 'F Y'); // → 'Kartik 2083'
```

To print one of these letters as a letter, put a backslash before it:

```ts
import { bsDate, formatDate } from '@nepdate/core';

formatDate(bsDate(2083, 7, 1), 'Y \\B\\S'); // → '2083 BS'
```

## Languages

Pass `'en'` or `'ne'` as the third argument. Names and digits both follow it:

```ts
import { adDate, bsDate, formatDate } from '@nepdate/core';

formatDate(bsDate(2083, 7, 1), 'long', 'ne'); // → '१ कार्तिक २०८३'
formatDate(adDate(2026, 10, 18), 'long', 'ne'); // → '१८ अक्टोबर २०२६'
```

If you leave it out, nepdate uses the `defaultLocale` from
[`configure`](./configuration). You can add other languages too. See
[Languages](./locales).

## Showing both calendars

Convert and format each one. This is common on official documents:

```ts
import { adDate, adToBs, formatDate } from '@nepdate/core';

const ad = adDate(2026, 10, 18);

`${formatDate(adToBs(ad), 'long')} (${formatDate(ad, 'short')})`; // → '1 Kartik 2083 (18 Oct 2026)'
```

In React, [`<DateText>`](/integrations/react#showing-dates) does this for you.

## Digits

To change digits in text you already have:

```ts
import { formatNumber, toAsciiDigits, toDevanagariDigits } from '@nepdate/core';

toDevanagariDigits('2083-07-01'); // → '२०८३-०७-०१'
toAsciiDigits('२०८३'); // → '2083'
formatNumber(2083, 'ne'); // → '२०८३'
formatNumber(2083, 'en'); // → '2083'
```

`formatNumber` follows the locale, so use it when the language can change.

## Month and weekday names

```ts
import { monthNames, weekdayNames } from '@nepdate/core';

monthNames('BS')[0]; // → 'Baisakh'
monthNames('BS', 'ne')[0]; // → 'बैशाख'
monthNames('AD', 'en', 'short')[0]; // → 'Jan'
weekdayNames('ne')[0]; // → 'आइतबार'
weekdayNames('en', 'short')[6]; // → 'Sat'
weekdayNames('en', 'narrow')[0]; // → 'Su'
```
