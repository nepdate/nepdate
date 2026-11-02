---
'@nepdatejs/react': patch
---

Fixes four bugs:

- `DatePicker` no longer causes a hydration error on server-rendered pages with `<html lang="ne">`. It renders with the configured default language, then switches to Nepali once it has hydrated.
- The calendar now redraws when `isDateDisabled`, `holidays` or `events` give different answers, for example when they depend on state.
- A controlled picker now goes back to the parent's `value` when the parent doesn't accept a date, instead of keeping and submitting the rejected date.
- `useDateTimePicker` and `useMultiDatePicker` no longer crash when `id` is added after the first render.
- `DateRangePicker`, `DateTimePicker` and `MultiDatePicker` now follow `<html lang="ne">` too, as `DatePicker` does.
- `DateText` now uses the configured default language instead of always English.
