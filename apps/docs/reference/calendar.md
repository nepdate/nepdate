# @nepdatejs/calendar

[[toc]]

Calendar logic with no UI. See [Framework-free stores](/integrations/stores) for how to use it.

```ts
import { createCalendar } from '@nepdatejs/calendar';
```

## `createCalendar`

`createCalendar(options?)` returns a store:

| Member | Does |
|---|---|
| `getState()` | The current state. The same object until something changes |
| `subscribe(listener)` | Returns a function that stops listening |
| `setOptions(changes)` | Change options. `selected` and `visibleMonth` here act as controlled values |
| `actions` | See [Actions](#actions) |
| `destroy()` | Stop everything |

## Options

| Option | Type | Default | Meaning |
|---|---|---|---|
| `calendar` | `'BS' \| 'AD'` | `'BS'` | The calendar shown |
| `locale` | `string` | configured | Names and digits |
| `selectionMode` | `'single' \| 'range' \| 'multiple'` | `'single'` | How clicks select |
| `selected` | date, range or list | | The selection |
| `defaultVisibleMonth` | `CalendarDate` | selected or today | The month shown first |
| `visibleMonth` | `CalendarDate` | | Control the month |
| `min`, `max` | `CalendarDate` | table limits | Selectable range |
| `isDateDisabled` | `(date) => boolean` | | Rule out days |
| `holidays` | list or function | | See [Holidays and events](/pickers/holidays-events) |
| `events` | `(date) => EventMarker[]` | | Markers for a day |
| `showOtherCalendar` | `boolean` | `true` | Other calendar's day number |
| `showOutsideDays` | `boolean` | `true` | Days of nearby months |
| `fixedWeeks` | `boolean` | `false` | Always six rows |
| `weekStartsOn` | `Weekday` | configured | First day of the week |
| `weekendDays` | `Weekday[]` | configured | Weekend days |
| `today` | `CalendarDate` | real today | Override, for tests |
| `onSelect` | `(selection) => void` | | Called on a selection |
| `onVisibleMonthChange` | `(month) => void` | | Called when the month changes |
| `onViewChange` | `(view) => void` | | Called when the view changes |

## State

| Field | Contents |
|---|---|
| `calendar` | The calendar shown |
| `view` | `'day'`, `'month'`, `'year'` or `'fiscal'` |
| `visibleMonth` | Day 1 of the month on screen |
| `focused` | The day with keyboard focus |
| `title` | `"Kartik 2083"`, `"2083"` or `"2076–2087"` |
| `weekdays` | A list of `{ index, label, narrowLabel, longLabel, isWeekend }` |
| `weeks` | Rows of seven `DayCell \| null`. `null` is an empty cell |
| `months`, `years`, `fiscalYears` | Lists of [`PickerCell`](#pickercell) tiles |
| `canPrev`, `canNext` | Whether the view can move |
| `selectionMode`, `selected` | The selection |
| `rangeHover` | The hovered day while choosing a range end |
| `minDate`, `maxDate` | First and last selectable days |

### `DayCell`

| Field | Contents |
|---|---|
| `key` | A stable key, such as `"BS-2083-06-24"` |
| `date`, `otherDate` | The day in each calendar |
| `epoch`, `weekday` | Its epoch day and weekday |
| `label`, `subLabel` | Day numbers in the locale's digits |
| `ariaLabel` | "Sunday, 1 Kartik 2083 (18 October 2026 AD)", plus any holiday |
| `isToday`, `isSelected`, `isDisabled`, `isOutside`, `isWeekend` | Flags |
| `isRangeStart`, `isRangeMiddle`, `isRangeEnd`, `isInRangePreview` | Range flags |
| `isHoliday`, `holidayLabel` | Holiday information |
| `events` | The day's markers |
| `isFocusTarget` | Put `tabindex="0"` on this one cell |
| `state` | One word for styling: `DayState` |

### `PickerCell`

| Field | Contents |
|---|---|
| `value` | The month number, the year, or the fiscal start year |
| `label` | `"Ashwin"` or `"2083"` |
| `subLabel` | The other calendar's span, such as `"Sep / Oct"` |
| `isSelected`, `isCurrent`, `isDisabled` | Flags |

## Actions

| Action | Does |
|---|---|
| `next()`, `prev()` | Move by a month, a year or a page, depending on the view |
| `goTo(date)`, `goToToday()` | Show a date's month |
| `setView(view)` | Switch view |
| `chooseMonth(month)`, `chooseYear(year)` | Drill down through the views |
| `chooseFiscalYear(startYear)` | In range mode, select that fiscal year. Returns `false` if outside the limits |
| `focus(date)` | Move keyboard focus |
| `moveFocus(key, { shift })` | Arrows, Home, End, PageUp, PageDown. Never throws at the limits |
| `select(date)` | Returns `false` for a disabled day |
| `hover(date \| null)` | Range preview |

## Pure helpers

| Function | Does |
|---|---|
| `buildMonthGrid(input)`, `buildWeekdays(locale, weekStartsOn, weekendDays)` | Build a month |
| `buildMonthTiles(input)`, `buildYearTiles(input)` | Build tiles |
| `yearPageStart(year)` | The first year on a page of twelve |
| `nextFocus(focused, key, limits, options)` | The day a key moves to |
| `computeLimits(calendar, min, max)`, `isInLimits(date, limits)` | Work out limits |
| `isDayList(selection)` | Whether a selection is a list of days |

## Types

`CalendarOptions`, `CalendarState`, `CalendarStore`, `CalendarActions`, `CalendarView`,
`CalendarSelection`, `SelectionMode`, `DateRange`, `DayCell`, `DayState`, `WeekdayCell`, `PickerCell`,
`EventMarker`, `HolidayInfo`, `HolidayInput`, `HolidayLookup`, `FocusKey`, `GridInput`, `TileInput`,
`HolidayResolver`, `Limits`.
