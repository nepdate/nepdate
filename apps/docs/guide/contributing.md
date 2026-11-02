# Contributing

[[toc]]

## Setting up

You need Node 22.18 or newer and Corepack, which comes with Node.

```bash
git clone https://github.com/nepdate/nepdate.git
cd nepdate
corepack enable
pnpm install
```

## Useful commands

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the playground at `http://localhost:5180` |
| `pnpm test` | Runs the tests |
| `pnpm verify` | Runs everything CI runs: format, lint, types, tests, build, package and size checks |
| `pnpm --filter @nepdatejs/docs dev` | Runs these docs at `http://localhost:5181` |
| `pnpm check:docs` | Checks every code sample in the docs against the packages |

Run `pnpm verify` before you open a pull request.

## Correcting a date

If a BS year in the table is wrong, or you have a year's holiday list, open an
[issue](https://github.com/nepdate/nepdate/issues/new/choose) and link to the published
calendar or government notice. Data changes need a source people can check.

## Improving these docs

Pages live in `apps/docs` as Markdown, and every page has an "Edit this page" link.

Code samples are tested. `pnpm check:docs` type-checks each sample, and a line ending in
`// → value` is run and compared with the real result, so write expected results that way:

```ts
import { bsDate, formatDate } from '@nepdatejs/core';

formatDate(bsDate(2083, 7, 1), 'long'); // → '1 Kartik 2083'
```

## Reporting a security issue

Please don't open a public issue. See
[SECURITY.md](https://github.com/nepdate/nepdate/blob/main/SECURITY.md).
