# @nepdatejs/datepicker

## 0.1.1

### Patch Changes

- c800cd9: Names that every object inherits, such as `constructor`, are no longer mistaken for a named format, a message value or a preset label. `formatDate(date, 'constructor')` used to throw.
- b641413: An open panel now re-places itself at most once per frame while scrolling. Picker listeners and queued callbacks now run even when something throws during a change.
- Updated dependencies [c800cd9]
  - @nepdatejs/core@0.1.1

## 0.1.0

### Minor Changes

- df1c0a6: First public release: BS and AD dates, a calendar, and date pickers for React and Web Components.

### Patch Changes

- Updated dependencies [df1c0a6]
  - @nepdatejs/calendar@0.1.0
  - @nepdatejs/core@0.1.0
