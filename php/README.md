# nepdatejs/nepdate (PHP)

PHP port of [`@nepdatejs/core`](../packages/core): BS ⇄ AD conversion, `BsDate` / `AdDate`, arithmetic,
compare, format and parse (English and Nepali), Nepal's fiscal year, projected years and BS table patches.
Plain PHP 8.3+, no dependencies, so it works in Laravel, CodeIgniter, Symfony or a plain script.

```bash
composer require nepdatejs/nepdate
```

```php
use NepDate\AdDate;
use NepDate\BsDate;
use NepDate\FiscalYear;

$bs = AdDate::fromIso('2026-11-15')->toBs();      // BS 2083-07-29
$bs->format('full');                               // "Sunday, 29 Kartik 2083"
$bs->format('long', 'ne');                         // "२९ कार्तिक २०८३"
FiscalYear::of($bs)->label;                        // "2083/84"
BsDate::of(2083, 4, 1)->toIsoDate();               // "2026-07-17"
```

## Same answers as the JS package

- `php/data/bs-table.json` and `php/data/locales.json` are generated from `packages/core` by
  `scripts/gen-php.ts`, so the table and the names cannot drift. After changing `data/bikram-sambat.json`, run
  `pnpm gen:data && pnpm build && pnpm gen:php`.
- The same script writes `php/tests/Conformance/fixtures`: core's answers for every BS day 1970–2099 and for the
  arithmetic, format, parse and fiscal-year cases. The PHP conformance tests must match them exactly, and
  `pnpm verify` fails if the fixtures are stale.
- The PHP package has the same version as `@nepdatejs/core` (see [RELEASING.md](../RELEASING.md#php-package)).

## Development

From the repository root:

```bash
composer install
composer verify    # Pint, PHPStan (max), Pest
```
