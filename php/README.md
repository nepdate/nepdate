# nepdatejs/nepdate

Bikram Sambat (BS) ⇄ AD dates for PHP: conversion, formatting and parsing in English and Nepali,
date arithmetic, comparison and Nepal's fiscal year. Plain PHP 8.3+ with no dependencies, so it
works in Laravel, Symfony, CodeIgniter or a plain script.

It gives the same answers as the JavaScript package [`@nepdatejs/core`](https://www.npmjs.com/package/@nepdatejs/core),
so a date converted in the browser and on the server always agrees.

**[Full documentation](https://nepdate.github.io/nepdate/integrations/php)**

> This repository is a read-only copy of the `php/` folder of [nepdate/nepdate](https://github.com/nepdate/nepdate), where the PHP and JavaScript packages are developed and tested together. Please open issues and pull requests there.

## Installation

```bash
composer require nepdatejs/nepdate
```

Requires PHP 8.3 or later with the `json` and `mbstring` extensions.

## Quick start

```php
use NepDate\AdDate;
use NepDate\BsDate;
use NepDate\FiscalYear;

$bs = AdDate::fromIso('2026-11-15')->toBs();   // BS 2083-07-29

$bs->format('full');                            // "Sunday, 29 Kartik 2083"
$bs->format('long', 'ne');                      // "२९ कार्तिक २०८३"
FiscalYear::of($bs)->label;                     // "2083/84"

BsDate::of(2083, 4, 1)->toIsoDate();            // "2026-07-17"
```

## Creating dates

```php
use NepDate\AdDate;
use NepDate\BsDate;

$bs = BsDate::of(2083, 6, 24);                   // year, month (1 = Baishakh), day
$ad = AdDate::of(2026, 10, 18);

AdDate::fromIso('2026-11-15');                   // from "YYYY-MM-DD" (null if invalid)
AdDate::fromDateTime(new DateTimeImmutable());   // today in Asia/Kathmandu
AdDate::fromDateTime($carbon, 'Asia/Kathmandu'); // any DateTimeInterface, e.g. Carbon
```

A date that does not exist throws `NepDate\NepDateRangeException`:

```php
BsDate::of(2083, 2, 33); // "BS 2083-2 has 31 days, not 33." ($e->reason === 'INVALID_DATE')
```

## Converting

```php
$bs = AdDate::of(2026, 10, 18)->toBs();   // BS 2083-07-01
$ad = $bs->toAd();                        // AD 2026-10-18
$bs->toIsoDate();                         // "2026-10-18", always the AD day
```

Store dates as AD (`DATE` columns, `Y-m-d` strings) and convert to BS only to show them.
`toIsoDate()` returns the AD day whichever calendar the date is in.

## Formatting

```php
$date = BsDate::of(2083, 7, 29);

$date->format();               // "2083-07-29"  (iso)
$date->format('short');        // "29 Kar 2083"
$date->format('long');         // "29 Kartik 2083"
$date->format('full');         // "Sunday, 29 Kartik 2083"
$date->format('cbms');         // "2083.07.29"  (the dotted form Nepal's tax system uses)
$date->format('long', 'ne');   // "२९ कार्तिक २०८३"
$date->format('l, j F Y');     // your own pattern
```

Pattern tokens: `Y` 2083 · `y` 83 · `m` 07 · `n` 7 · `d` 09 · `j` 9 · `F` month name ·
`M` short month name · `l` weekday · `D` short weekday. Put a backslash before a letter to print it
as is. With the `ne` locale, names and digits are in Nepali.

## Parsing

```php
use NepDate\Calendar;
use NepDate\DateParser;

DateParser::parse('2083-06-24', Calendar::BS);       // BsDate, or null when invalid
DateParser::parse('२०८३-०६-२४', Calendar::BS);       // Devanagari digits work too
DateParser::parseStrict('2083-13-01', Calendar::BS); // throws: "BS month 13 does not exist."
```

Dates are read year first: `2083-06-24`, `2083/6/24`, `2083.06.24` or `20830624`. Other orders
are rejected rather than guessed.

## Arithmetic

```php
$date = BsDate::of(2083, 6, 24);

$date->addDays(10);           // BS 2083-07-03
$date->addMonths(1);          // the day is kept within the new month's length
$date->addYears(-1);
$date->startOfMonth();        // also endOfMonth(), startOfYear(), endOfYear()
$date->startOfWeek();         // Sunday; startOfWeek(1) for Monday
$date->daysInMonth();         // 31
BsDate::of(2083, 7, 1)->differenceInDays($date); // 8
```

Dates are immutable: every method returns a new date.

## Comparing

BS and AD dates compare by the day they stand for, so you can mix them:

```php
$date->isBefore(AdDate::of(2026, 12, 1));  // true
$date->isAfter($other);
$date->isSameDay($other);
$date->isSameMonth($other);                // in the date's own calendar
$date->isWithin($min, $max);
$date->clamp($min, $max);
$date->compareTo($other);                  // -1, 0 or 1, for usort()
$date->dayOfWeek();                        // 0 = Sunday … 6 = Saturday
$date->isWeekend();                        // Saturday by default; isWeekend([5, 6]) for Friday too
```

## Fiscal year

Nepal's fiscal year runs from 1 Shrawan to the last day of Asar.

```php
use NepDate\FiscalYear;

$fy = FiscalYear::of(BsDate::of(2083, 6, 24));

$fy->label;                    // "2083/84"
$fy->firstDay;                 // BS 2083-04-01
$fy->lastDay;                  // BS 2084-03-32
$fy->contains($someDate);      // true or false
$fy->format('full');           // "2083/2084"
$fy->format('cbms');           // "2083.084"
$fy->format('label', 'ne');    // "२०८३/८४"

FiscalYear::starting(2083);    // the year that starts in BS 2083
FiscalYear::parse('2083/84');  // or null when the label is invalid
```

## Nepali names and digits

```php
use NepDate\Calendar;
use NepDate\Locale;

Locale::monthNames(Calendar::BS, 'ne');   // ["बैशाख", "जेठ", …]
Locale::weekdayNames('en', 'short');      // ["Sun", "Mon", …]
Locale::toDevanagariDigits(2083);         // "२०८३"
Locale::toAsciiDigits('२०८३');            // "2083"
```

## Laravel

Keep `date` columns in AD and show BS where people read them:

```php
use NepDate\AdDate;

$bs = AdDate::fromIso($invoice->issued_on->toDateString())->toBs();

$bs->format('long');    // "29 Kartik 2083"
```

```blade
{{ \NepDate\AdDate::fromIso($visit->date->toDateString())->toBs()->format('long', app()->getLocale()) }}
```

Validate incoming AD dates with Laravel's `date_format:Y-m-d` rule. To accept BS text, parse it with
`DateParser::parse($text, Calendar::BS)` and store `->toIsoDate()`.

## The BS table and its limits

BS month lengths come from a bundled table for BS 1970–2099 (AD 1913–2043), checked against
published calendars through BS 2083. Later years are projections:

```php
use NepDate\NepDate;

$date->isProjected();              // true for a year not yet published
NepDate::minDate(Calendar::BS);    // BS 1970-01-01
NepDate::maxDate(Calendar::BS);    // BS 2099-12-30
```

When an officially published year differs, correct it at boot (for example in a service
provider) without waiting for a release:

```php
NepDate::patchBsYear(2090, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]);
```

## Errors

| Exception                                            | When                                                   |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `NepDateRangeException`, `reason` `INVALID_DATE`     | The year, month or day does not exist in that calendar |
| `NepDateRangeException`, `reason` `OUT_OF_TABLE`     | The date is outside the BS table                       |
| `NepDateRangeException`, `reason` `INVALID_ARGUMENT` | Bad text or a value of the wrong kind                  |
| `NepDateDataException`                               | A patched BS year is invalid                           |

`DateParser::parse()`, `AdDate::fromIso()` and `FiscalYear::parse()` return `null` for bad input
instead of throwing.

## Licence

[MIT](https://github.com/nepdate/nepdate/blob/main/LICENSE) © Shishir Rai
