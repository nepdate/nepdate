# Contributing

Thanks for helping. Bug reports, BS table corrections, translations and code are all welcome.

## Setup

You need Node 22.18 or newer to work on the repo (the packages themselves support Node 18+).

```bash
corepack enable    # puts the pinned pnpm on your PATH
pnpm install
pnpm verify        # everything CI runs
```

| Script                                                   | Does                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm dev`                                               | Playground at http://localhost:5180 (React, Web Components, `<script>` build, styles) |
| `pnpm test` / `pnpm test:coverage`                       | Vitest, including type tests (`*.test-d.ts`)                                          |
| `pnpm typecheck`                                         | Strict TypeScript for every package                                                   |
| `pnpm lint` / `pnpm format`                              | ESLint (strict, type-aware) and Prettier                                              |
| `pnpm build`                                             | ESM, CJS, type declarations and `<script>` builds                                     |
| `pnpm check:boundaries`                                  | Enforces which package may import which (`boundaries.json`)                           |
| `pnpm check:packages` / `pnpm smoke` / `pnpm check:size` | publint + attw, loading the builds as users do, size budgets                          |
| `pnpm bench`                                             | Calendar grid benchmark                                                               |

## Rules the code follows

- **One package, one job.** `core` depends on no package; `calendar` imports only `core`; `datepicker` imports `core` and `calendar`; the adapters render and wire, with no date logic of their own. `boundaries.json` lists the rules, and lint and `check:boundaries` enforce them.
- **Only `core` touches `Date`.** Lint blocks `new Date`, `Date.now` and `Date.UTC` everywhere else.
- **AD and BS never share year logic.** Inside `core`, `ad/` and `bs/` don't import each other; conversion goes through a day count in `convert.ts`.
- **The value is AD `YYYY-MM-DD`.** Never emit a BS date as a value.
- **Throw, don't clamp.** Invalid input throws `NepDateRangeError` (or returns `null` from `parse*`).
- **Strict TypeScript:** no `any`, explicit return types on exports, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **Tests with every change.** Coverage gates: core 100% of lines, calendar/datepicker 99%, adapters 85%.
- **Class names, CSS variables, element names, attributes and events are public API.** Changing one is a breaking change.

## Correcting the BS table

The month lengths live in `data/bikram-sambat.json`. To fix a year:

1. Edit the year's twelve month lengths and give the source (a published government calendar) in your pull request.
2. If the year is now checked against a published calendar, raise `verified_through`.
3. Run `pnpm gen:data`, which validates the table and regenerates `packages/core/src/bs/data/years.ts`.
4. Add the year's 1 Baisakh AD date to `packages/core/test/fixtures/known-conversions.ts`.

## Translations

Locales live in `packages/core/src/locale/`. Copy `en.ts`, translate every string, and register the new locale in `registry.ts`.

## Changesets and releases

Every user-facing change needs a changeset:

```bash
pnpm changeset
```

Pick the packages and the bump (0.x: a breaking change is a minor bump; say so in the summary). Releases are published from CI with npm provenance.

## Commits

Use short, imperative messages with a scope, e.g. `fix(core): …`, `feat(react): …`.

By contributing you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md), and that your contribution is licensed under the MIT licence.
