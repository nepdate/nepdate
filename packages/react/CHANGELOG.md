# @nepdatejs/react

## 0.1.1

### Patch Changes

- b641413: Fixes four bugs:

  - `DatePicker` no longer causes a hydration error on server-rendered pages with `<html lang="ne">`. It renders with the configured default language, then switches to Nepali once it has hydrated.
  - The calendar now redraws when `isDateDisabled`, `holidays` or `events` give different answers, for example when they depend on state.
  - A controlled picker now goes back to the parent's `value` when the parent doesn't accept a date, instead of keeping and submitting the rejected date.
  - `useDateTimePicker` and `useMultiDatePicker` no longer crash when `id` is added after the first render.
  - `DateRangePicker`, `DateTimePicker` and `MultiDatePicker` now follow `<html lang="ne">` too, as `DatePicker` does.
  - `DateText` now uses the configured default language instead of always English.

- Updated dependencies [c800cd9]
- Updated dependencies [b641413]
  - @nepdatejs/core@0.1.1
  - @nepdatejs/datepicker@0.1.1
  - @nepdatejs/dom@0.1.1

## 0.1.0

### Minor Changes

- df1c0a6: First public release: BS and AD dates, a calendar, and date pickers for React and Web Components.

### Patch Changes

- Updated dependencies [df1c0a6]
  - @nepdatejs/calendar@0.1.0
  - @nepdatejs/core@0.1.0
  - @nepdatejs/datepicker@0.1.0
  - @nepdatejs/dom@0.1.0
  - @nepdatejs/styles@0.1.0
