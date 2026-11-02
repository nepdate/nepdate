# Troubleshooting

[[toc]]

## The picker has no styles

You need the stylesheet once in your app:

```ts
import '@nepdatejs/styles';
```

With a script tag, add the `<link>` shown in [Script tag (CDN)](/integrations/cdn).

## `<nep-date-picker>` shows nothing

The element hasn't been registered. Import `@nepdatejs/vanilla/define`, or load the script. In Vue,
Svelte or a similar framework, also see the guide for your framework.

Elements only exist in the browser, so with server rendering, register them on the client.

## Vue warns "failed to resolve component"

Tell Vue that `nep-` tags are custom elements. See [Vue](/integrations/vue#setting-up).

## My date is off by one day

This nearly always means a JavaScript `Date` is involved. `new Date('2026-10-10')` is midnight UTC,
which can be the previous day locally. Don't pass dates through `Date`: use `fromIsoDate` for
stored dates, and `fromIsoTimestamp` for timestamps.

```ts
import { fromIsoDate } from '@nepdatejs/core';

fromIsoDate('2026-10-10')?.day; // → 10
```

If you read a timestamp with `fromIsoDate`, you get the date as written in UTC, not the date in
Nepal. See [From timestamps](./time#from-timestamps).

## `today()` isn't the date on my computer

`today()` gives the date in Nepal unless you say otherwise. See
[Today, time and time zones](./time). To use another zone, pass it or set it with
[`configure`](./configuration).

## "The date is outside the BS table"

You've got an `OUT_OF_TABLE` error. Conversion covers BS 1970 to 2099, which is AD 1913 to 2043.
Check with `isConvertible` before converting dates from outside your code. AD-only functions
work for any year.

## `bsDate` throws for a date I know exists

Check the month length: BS months vary from year to year.

```ts
import { daysInMonth } from '@nepdatejs/core';

daysInMonth('BS', 2083, 7); // → 30
```

If you have a published calendar that disagrees with the table, you can
[correct the year](./bs-table#correcting-a-year). Please also tell us.

## A future date has moved

Years after 2083 are projections. If you have stored AD dates, they haven't changed. See
[Verified and projected years](./bs-table#verified-and-projected-years).

## The value is empty but the field has text

The text isn't a valid, allowed date, so the value stays `''`. `state.error` or the message under
the field says why. See [Limits and validation](/pickers/validation).

## `onChange` doesn't fire when I set the value

That's on purpose. `onChange` and the `change` event are for what a person does. Setting a value
from code doesn't fire them, which prevents update loops.

## The panel appears behind something

The panel uses the browser's top layer, which sits above everything, including dialogs. On an older
browser with no top layer, it uses `position: fixed` with `--ndp-z-index`. Raise that token if
needed.

## The panel closes inside my dialog

Escape closes the panel first, not your dialog. If your dialog library closes on outside clicks, it
shouldn't see clicks in the panel, since the panel is a child of the field. If yours does, check
how it detects "outside".

## Next.js shows a hydration warning

Pass `today` from the server. See
[Avoiding hydration mismatches](/integrations/nextjs#avoiding-hydration-mismatches).

## Festivals aren't marked

They aren't bundled, because their dates change every year. See
[Nepal holidays](./holidays#what-is-included).

## Numbers show as Devanagari, or don't

Digits follow the locale. Set `locale`, or [`defaultLocale`](./configuration#language). The React
`<DatePicker>` also follows `<html lang="ne">`.
