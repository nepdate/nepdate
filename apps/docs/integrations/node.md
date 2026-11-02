# Node.js

[[toc]]

## Introduction

`@nepdatejs/core` runs in Node with no dependencies, in ESM or CommonJS, so you can use it in APIs,
scripts, cron jobs and serverless functions.

```bash
npm install @nepdatejs/core
```

::: code-group

```js [ESM]
import { formatDate, today } from '@nepdatejs/core';

console.log(formatDate(today('BS'), 'long'));
```

```js [CommonJS]
const { formatDate, today } = require('@nepdatejs/core');

console.log(formatDate(today('BS'), 'long'));
```

:::

## The server's time zone

Servers usually run in UTC, but `today()` still gives you the date in Nepal, because it uses the
configured zone, not the server's. That means a job that runs at 8 PM UTC correctly sees the next
day in Nepal.

## An API endpoint

Your API can take and return AD dates and add the BS date for display:

```ts
import { adToBs, formatDate, fromIsoDate } from '@nepdatejs/core';

function describeDate(input: string) {
  const ad = fromIsoDate(input);
  if (!ad) {
    return { error: 'Use YYYY-MM-DD' };
  }
  const bs = adToBs(ad);

  return { ad: input, bs: formatDate(bs), label: formatDate(bs, 'long', 'ne') };
}

describeDate('2026-10-18'); // → { ad: '2026-10-18', bs: '2083-07-01', label: '१ कार्तिक २०८३' }
describeDate('soon'); // → { error: 'Use YYYY-MM-DD' }
```

## Validating input

Check dates sent by a client again on the server, as the browser's checks can be bypassed:

```ts
import { fromIsoDate, isWithin, parseDate, toIsoDate } from '@nepdatejs/core';

const earliest = fromIsoDate('2026-01-01');

function readBsDate(text: string) {
  const date = parseDate(text, 'BS');
  if (!date || !isWithin(date, earliest)) {
    return null;
  }

  return toIsoDate(date);
}

readBsDate('2083-06-24'); // → '2026-10-10'
readBsDate('2075-01-01'); // → null
readBsDate('nonsense'); // → null
```

## Per-user settings

`configure` is global to the process, so on a shared server pass each user's language and zone as
arguments. See [Global state](/guide/configuration#global-state).

## Importing data

To convert a column of BS dates to AD, `parseDateStrict` gives you the reason for each bad row:

```ts
import { parseDateStrict, toIsoDate } from '@nepdatejs/core';

const rows = ['2083-06-24', '2083-02-33'];

const results = rows.map((text) => {
  try {
    return { ok: toIsoDate(parseDateStrict(text, 'BS')) };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

results[0]; // → { ok: '2026-10-10' }
results.length; // → 2
```

## Other runtimes

`@nepdatejs/core` uses only standard JavaScript, so it also runs on Deno, Bun and edge runtimes such
as Cloudflare Workers.
