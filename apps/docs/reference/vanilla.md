# @nepdate/vanilla

[[toc]]

Web Components and a plain JavaScript API. See [Web Components](/integrations/web-components) and
[Plain JavaScript API](/integrations/vanilla-api).

| Entry | Contains |
|---|---|
| `@nepdate/vanilla` | Everything, with no side effects |
| `@nepdate/vanilla/define` | Importing it registers every element |
| `@nepdate/vanilla/date-picker` | Date picker only |
| `@nepdate/vanilla/date-range-picker` | Range picker only |
| `@nepdate/vanilla/date-time-picker` | Date and time picker only |
| `@nepdate/vanilla/multi-date-picker` | Multiple dates only |
| `@nepdate/vanilla/calendar` | Calendar only |

## Shared attributes

The pickers all accept these:

| Attribute | Meaning |
|---|---|
| `min`, `max` | Limits, AD |
| `calendar` | `BS` or `AD`, fixed |
| `default-calendar` | The calendar shown first |
| `locale` | `en`, `ne` or a registered code |
| `name` | Form field name |
| `required`, `disabled` | As on an input |
| `theme` | `light`, `dark` or `auto` |
| `panel-layout` | `auto`, `popover` or `sheet` |
| `inline` | Always show the calendar |
| `mask="false"` | Don't add dashes while typing |

## `<nep-date-picker>`

| Attribute | Meaning |
|---|---|
| `value` | Starting value, AD |
| `placeholder` | Input placeholder |
| `clearable="false"` | Hide the clear button |
| `show-equivalent="false"` | Hide the other-calendar line |
| `close-on-select="false"` | Keep the panel open after a pick |
| `persist-calendar` | `localStorage` key for the BS/AD choice |
| `week-starts-on` | `0` to `6` |
| `display-format` | How the input shows a date, such as `long` |
| `presets` | Shortcut IDs, separated by commas |
| `label` | The input's `aria-label` |
| `input-id` | The input's `id`, for `<label for>` |

- **Properties:** `value`, `form`, `holidays`, `events`, `isDateDisabled`, `presets`.
- **Methods:** `open()`, `close()`, `focus()`, `checkValidity()`, `reportValidity()`.
- **Events:** `change` with `{ value, ad, bs }`, `nep-open`, `nep-close`, `nep-calendar-change` with
  `{ calendar }`.

## `<nep-date-range-picker>`

| Attribute | Meaning |
|---|---|
| `start`, `end` | Starting values, AD |
| `start-name`, `end-name` | Field names. Default `<name>-start` and `<name>-end` |
| `min-days`, `max-days` | Shortest and longest range |
| `fiscal-years` | Show the **Fiscal year** button |
| `presets` | Shortcut IDs, separated by commas |
| `start-label`, `end-label` | Accessible names of the two inputs |

- **Properties:** `value`, `holidays`, `isDateDisabled`, `presets`.
- **Events:** `change` with `{ value: { start, end } }`, `nep-open`, `nep-close`.

## `<nep-date-time-picker>`

| Attribute | Meaning |
|---|---|
| `value` | Starting value, an ISO timestamp |
| `time-zone` | The zone shown and stored |
| `hour12` | 12-hour display |
| `minute-step` | Minutes between choices |
| `default-time` | Used when a day is picked first |
| `presets` | Shortcut IDs, separated by commas |
| `label`, `time-label` | Accessible names of the two inputs |

- **Properties:** `value`, `holidays`, `isDateDisabled`.
- **Events:** `change` with `{ value, ad, bs, time }`, `nep-open`, `nep-close`.

## `<nep-multi-date-picker>`

| Attribute | Meaning |
|---|---|
| `value` | Starting days, AD, separated by commas |
| `max-dates` | The most days allowed |
| `clearable="false"` | Hide the clear button |
| `close-on-select` | Close after each click |
| `label` | The input's `aria-label` |

- **Properties:** `value` (an array), `holidays`, `events`, `isDateDisabled`.
- **Events:** `change` with `{ value, dates }`, `nep-open`, `nep-close`.

## `<nep-calendar>`

| Attribute | Meaning |
|---|---|
| `value` | The selected day, AD |
| `calendar` | `BS` or `AD` |
| `locale` | Names and digits |
| `min`, `max` | Limits, AD |
| `week-starts-on` | `0` to `6` |
| `show-other-calendar="false"` | Hide the other calendar's digits |
| `show-outside-days="false"` | Hide days of nearby months |
| `range` | Select a range |
| `theme` | `light`, `dark` or `auto` |

- **Properties:** `store`, `holidays`, `events`, `isDateDisabled`.
- **Events:** `nep-select` with `{ date, value }`, or `{ range: { start, end } }`.

## Functions

| Function | Returns |
|---|---|
| `defineElements(registry?)` | Registers every element |
| `defineDatePicker`, `defineDateRangePicker`, `defineDateTimePicker`, `defineMultiDatePicker`, `defineCalendar` | Registers one |
| `createDatePicker(target, options?)` | `DatePickerHandle`. `target` may be an `<input>` |
| `createDateRangePicker(container, options?)` | `DateRangePickerView` |
| `createDateTimePicker(container, options?)` | `DateTimePickerView` |
| `createMultiDatePicker(container, options?)` | `MultiDatePickerHandle` |
| `createCalendar(container, options?)` | `CalendarHandle` |

`ELEMENT_NAMES` lists the tag names.

## Classes

The elements, `NepDatePickerElement`, `NepDateRangePickerElement`, `NepDateTimePickerElement`,
`NepMultiDatePickerElement` and `NepCalendarElement`, and the views they use, `DatePickerView`,
`DateRangePickerView`, `DateTimePickerView`, `MultiDatePickerView` and `CalendarView`.
