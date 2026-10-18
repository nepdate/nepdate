# nepdate

Bikram Sambat (BS) ⇄ AD dates for JavaScript: a dependency-free date engine, plus a calendar and date picker for React, plain HTML (Web Components) and any framework. Written in strict TypeScript.

```ts
import { adDate, adToBs, formatDate } from '@nepdate/core';

formatDate(adToBs(adDate(2026, 10, 18)), 'long'); // "1 Kartik 2083"
```

- **Correct:** every day in the BS table converts to AD and back to itself, and every published conversion in the test suite matches. Invalid dates throw instead of being silently clamped.
- **AD and BS never mix:** a BS year spans two AD years, so the two calendars share only a day count. `AdDate` and `BsDate` are different types, so one can't be passed where the other is expected.
- **The stored value is always AD `YYYY-MM-DD`:** pickers show and accept BS, but forms, APIs and databases receive the AD date.
- **Works everywhere:** Node (ESM and CJS), browsers, a plain `<script>` tag, React 18/19 (including server rendering) and Web Components.
- **Small:** the core is about 6.6 kB gzipped, or about 2 kB if you only import a converter. `@nepdate/core` depends on no package.
- **Bilingual:** English and Nepali (`ne`) names, digits and messages, with more languages via `registerLocale`.
- **Accessible:** a keyboard-driven ARIA grid, a combobox input, screen-reader labels in both calendars, and colours checked with axe.

## Packages

| Package                                      | What it does                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`@nepdate/core`](packages/core)             | The date engine: conversion, formatting, parsing, arithmetic, fiscal year. No dependencies.                      |
| [`@nepdate/calendar`](packages/calendar)     | A framework-free calendar view model: month, month-tile and year-tile grids, keyboard navigation, day states.    |
| [`@nepdate/datepicker`](packages/datepicker) | Framework-free date picker and range picker behaviour: typed input, validation, BS/AD switch.                    |
| [`@nepdate/react`](packages/react)           | React hooks and styled components.                                                                               |
| [`@nepdate/vanilla`](packages/vanilla)       | `<nep-date-picker>`, `<nep-calendar>` and `<nep-date-range-picker>` custom elements, and a plain JavaScript API. |
| [`@nepdate/styles`](packages/styles)         | The stylesheet: `--ndp-*` CSS variables and `ndp-*` classes, with light and dark themes.                         |
| [`@nepdate/dom`](packages/dom)               | Small browser helpers the adapters share (popover placement, outside click, Escape).                             |

Each package does one job, and lower packages never import higher ones. `core` ← `calendar` ← `datepicker` ← `react` / `vanilla`. CI checks these rules.

## Quick start

### Node or any bundler

```bash
npm install @nepdate/core
```

```ts
import { bsDate, fiscalYear, formatDate, parseDate, toIsoDate } from '@nepdate/core';

const date = parseDate('२०८३-०६-२४', 'BS'); // ASCII or Devanagari digits
toIsoDate(date!); // "2026-10-10" (the AD day, ready to store)
formatDate(bsDate(2083, 7, 1), 'full', 'ne'); // "आइतबार, १ कार्तिक २०८३"
fiscalYear(date!).label; // "2083/84"
```

### React

```bash
npm install @nepdate/react @nepdate/styles
```

```tsx
import '@nepdate/styles';
import { useState } from 'react';
import { DatePicker } from '@nepdate/react';

export function BirthDate() {
  const [value, setValue] = useState(''); // AD "YYYY-MM-DD"

  return (
    <DatePicker
      value={value}
      onChange={setValue}
      max="2026-12-31"
      aria-label="Date of birth"
    />
  );
}
```

### Plain HTML, Vue, Svelte, Laravel Blade…

```html
<link rel="stylesheet" href="https://unpkg.com/@nepdate/styles/index.css" />
<script src="https://unpkg.com/@nepdate/vanilla/dist/nepdate-picker.global.js"></script>

<form>
  <label for="dob">Date of birth</label>
  <nep-date-picker name="dob" input-id="dob" required></nep-date-picker>
</form>
```

The form submits `dob=2026-10-10` (AD), whichever calendar the viewer typed in.

## The BS table

BS month lengths are not computed. They come from a table keyed by BS year: 1970–2099 BS (1913–2043 AD), checked against published calendars through **2083 BS**. Later years are projections, and `isProjected(date)` tells you when a date is one.

You can correct a year without waiting for a release:

```ts
import { patchBsYear } from '@nepdate/core';

patchBsYear(2090, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]);
```

To report a wrong year in the bundled table, open an issue with the year, the month lengths and a link to the published calendar.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). In short:

```bash
corepack enable
pnpm install
pnpm verify    # format, lint, package rules, typecheck, tests, build, package checks, size
pnpm dev       # playground at http://localhost:5180
```

## Licence

[MIT](LICENSE) © Shishir Rai
