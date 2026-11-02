# @nepdate/react

[[toc]]

React components and hooks. See the [React guide](/integrations/react).

| Entry | Contains |
|---|---|
| `@nepdate/react` | Components and everything below |
| `@nepdate/react/headless` | Hooks only, no markup or CSS |
| `@nepdate/react/server` | Components with no hooks, for Server Components |

## Components

| Component | Props |
|---|---|
| `DatePicker` | [`DatePickerProps`](/pickers/date-picker#options) |
| `DateRangePicker` | [`DateRangePickerProps`](/pickers/range-picker#options) |
| `DateTimePicker` | [`DateTimePickerProps`](/pickers/date-time-picker#options) |
| `MultiDatePicker` | [`MultiDatePickerProps`](/pickers/multi-date-picker#options) |
| `Calendar` | [`CalendarProps`](/pickers/calendar#options) |
| `DateText` | [`DateTextProps`](/integrations/react#datetext) |
| `ShortDate` | `value`, `fallback`, `className` |
| `CalendarBody` | `bindings`, `className`, `theme`. The calendar part alone, with the `ndp-*` classes |
| `TimeColumns` | The hour and minute columns alone |
| `Icon` | `name`: an `IconName`. The icons the components use |

## Functions

| Function | Returns |
|---|---|
| `shortDate(value)` | `"10 Ashwin 2083"`, with the time if the value has one |
| `bothDates(value)` | `"10 Ashwin 2083 (26 Sep 2026)"` |

## Hooks

| Hook | Options | Returns |
|---|---|---|
| `useCalendar` | Calendar options | `CalendarBindings` and `store` |
| `useDatePicker` | Picker options and `id` | `DatePickerBindings` |
| `useDateRangePicker` | Picker options | `DateRangePickerBindings` |
| `useDateTimePicker` | Picker options and `id` | `DateTimePickerBindings` |
| `useMultiDatePicker` | Picker options and `id` | `MultiDatePickerBindings` |
| `useCalendarBindings` | State, actions, locale, options | `CalendarBindings`, for a custom store |
| `useStore` | Factory, options | `{ store, state }`, for wrapping any store |
| `deepEqual` | Two values | Compares by content, as `useStore` does |

See [Headless React hooks](/integrations/headless-react).

### `CalendarBindings`

| Member | Contents |
|---|---|
| `state`, `actions` | The calendar's state and actions |
| `focusGrid()` | Move focus to the current day |
| `getGridProps()` | For the `<table>`. Type: `GridProps` |
| `getDayProps(cell)` | For a day button. Type: `ButtonProps` |

## Types

`DatePickerProps`, `DateRangePickerProps`, `DateTimePickerProps`, `MultiDatePickerProps`,
`CalendarProps`, `DateTextProps`, `IconName`, `DatePickerBindings`, `DateRangePickerBindings`,
`DateTimePickerBindings`, `MultiDatePickerBindings`, `CalendarBindings`, `InputProps`, `PanelProps`,
`ButtonProps`, `GridProps`.
