# Introduction

[[toc]]

## What is nepdate?

nepdate is a set of JavaScript packages for working with **Bikram Sambat (BS)**, the
official calendar of Nepal, alongside the Gregorian calendar (**AD**). It has two parts:

- **A date engine.** `@nepdate/core` converts between BS and AD, formats and parses dates in
  English and Nepali, does date arithmetic, and knows Nepal's fiscal year. It depends on no
  other package and runs anywhere JavaScript runs.
- **A calendar and date pickers.** Ready-made components for React and for plain HTML
  (Web Components), so they also work in Vue, Svelte, Angular and Laravel Blade.

```ts
import { adDate, adToBs, formatDate } from '@nepdate/core';

const bs = adToBs(adDate(2026, 10, 18));

formatDate(bs, 'long'); // → '1 Kartik 2083'
formatDate(bs, 'long', 'ne'); // → '१ कार्तिक २०८३'
```

## Why a library for this?

BS looks simple, but three things make it easy to get wrong:

- **Month lengths can't be calculated.** A BS month has 29 to 32 days, and the lengths change
  from year to year. They are decided by astronomical observation and published in calendars,
  so software has to use a table.
- **A BS year spans two AD years.** BS 2083 runs from April 2026 to April 2027. Code that
  looks things up by year number across the two calendars gives subtly wrong answers around
  the new year.
- **It is easy to store the wrong thing.** If a BS date lands in a database column that
  expects AD, nothing fails. The record is just wrong, years in the future.

nepdate is designed around these problems. See [How it works](./concepts) for the details.

## What you get

| You want to | Use |
|---|---|
| Convert, format or calculate dates | [`@nepdate/core`](./dates) |
| Add a date picker in React | [`@nepdate/react`](/integrations/react) |
| Add a date picker in HTML, Vue, Svelte, Angular or Blade | [`@nepdate/vanilla`](/integrations/web-components) |
| Show Nepal's national holidays | [`@nepdate/holidays`](./holidays) |
| Change how the components look | [`@nepdate/styles`](./theming) |
| Build your own picker UI | [`@nepdate/calendar` and `@nepdate/datepicker`](/integrations/stores) |

## The packages

| Package | What it does | Depends on |
|---|---|---|
| `@nepdate/core` | Conversion, formatting, parsing, arithmetic, fiscal year, time | Nothing |
| `@nepdate/calendar` | Calendar logic with no UI: grids, keyboard moves, day states | core |
| `@nepdate/datepicker` | Picker logic with no UI: typed text, validation, BS/AD switch | core, calendar |
| `@nepdate/react` | React components and hooks | calendar, datepicker, dom |
| `@nepdate/vanilla` | Web Components and a plain JavaScript API | calendar, datepicker, dom |
| `@nepdate/styles` | The stylesheet, with light and dark themes | Nothing |
| `@nepdate/holidays` | National holidays and a loader for yearly lists | core |
| `@nepdate/dom` | Small browser helpers the components share | Nothing |

You only install what you need. Most apps install one of `@nepdate/react` or
`@nepdate/vanilla`, plus `@nepdate/styles`.

## Size

`@nepdate/core` is under 8 kB gzipped if you bundle all of it, and bundlers keep only what
you import: a page that only uses `adToBs` ships about 2 kB. CI fails if a package grows past
its budget.

| Import | Gzipped |
|---|---|
| `{ adToBs }` from `@nepdate/core` | 2.1 kB |
| All of `@nepdate/core` | 7.9 kB |
| One Web Component, such as `@nepdate/vanilla/date-picker` | 6.6 kB, plus core and the stylesheet |
| All the Web Components as one `<script>` file | 24.5 kB, including core |

## Browser and runtime support

- **Node:** 18 or newer, in ESM or CommonJS.
- **Browsers:** current versions of Chrome, Edge, Firefox and Safari. Panels use the browser's
  top layer where it is available, and fall back to fixed positioning.
- **React:** 18 and 19, including server rendering and Server Components.
- **TypeScript:** full types are included. No `@types` package is needed.

## Next steps

- [Installation](./installation): add nepdate to your project.
- [Quick start](./quickstart): a working date and a working picker in five minutes.
- [Converter](/converter): try a conversion right now.
