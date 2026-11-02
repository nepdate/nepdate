# Release notes

[[toc]]

nepdate follows [semantic versioning](https://semver.org/). While the version is `0.x`, a minor
release may contain breaking changes, and they are listed here.

## 0.1.0 (2 November 2026)

The first version. It includes:

**Dates (`@nepdatejs/core`)**

- BS and AD conversion for BS 1970–2099, with a table that can be corrected at run time.
- Formatting and parsing in English and Nepali, with ASCII or Devanagari digits.
- Date arithmetic, comparison, and Nepal's fiscal year.
- Time of day and time zones, with Nepal time by default.

**Components (`@nepdatejs/react`, `@nepdatejs/vanilla`)**

- Date picker, date range picker, date and time picker, and a picker for several separate dates.
- A calendar with month, year and fiscal-year views.
- Shortcuts such as "Last 7 days" and "This fiscal year".
- Bottom sheets on phones, an always-open inline mode, and dashes added as you type.
- Keyboard support, screen-reader labels, and light and dark themes.

**Other**

- `@nepdatejs/holidays`: national days and a loader for each year's published list.
- `@nepdatejs/calendar` and `@nepdatejs/datepicker`: framework-free logic for building your own UI.
