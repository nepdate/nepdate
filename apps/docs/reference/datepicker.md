# @nepdate/datepicker

[[toc]]

Picker logic with no UI. See [Framework-free stores](/integrations/stores) for how to use it.

```ts
import { createDatePicker } from '@nepdate/datepicker';
```

## Stores

| Function | Picks |
|---|---|
| `createDatePicker(options?)` | One day |
| `createDateRangePicker(options?)` | A start and an end |
| `createDateTimePicker(options?)` | A day and a time |
| `createMultiDatePicker(options?)` | Several days |

Each returns a store with `getState()`, `subscribe(listener)`, `setOptions(changes)`, `actions`,
`calendar` (the panel's [calendar store](./calendar)) and `destroy()`.

## Options

### Shared by all pickers

| Option | Type | Default | Meaning |
|---|---|---|---|
| `calendar` | `'BS' \| 'AD'` | | Fix the calendar |
| `defaultCalendar` | `'BS' \| 'AD'` | `'BS'` | The calendar shown first |
| `onCalendarChange` | `(calendar) => void` | | Called on a switch |
| `min`, `max` | `string` | | AD `YYYY-MM-DD` |
| `isDateDisabled` | `(date) => boolean` | | Rule out days |
| `locale` | `string` | configured | Names, digits, messages |
| `displayFormat` | `string` | `'iso'` | How the input shows a date |
| `closeOnSelect` | `boolean` | `true` | Close after a pick |
| `inline` | `boolean` | `false` | Always open, in the page |
| `mask` | `boolean` | `true` | Add dashes while typing |
| `holidays`, `events` | | | Passed to the calendar |
| `showOtherCalendar` | `boolean` | `true` | |
| `weekStartsOn`, `weekendDays` | | configured | |
| `today` | `CalendarDate` | real today | Override, for tests |

### `createDatePicker`

| Option | Type | Meaning |
|---|---|---|
| `value`, `defaultValue` | `string` | AD `YYYY-MM-DD` |
| `onChange` | `(value, detail) => void` | `detail` is `{ ad, bs }` or `null` |
| `presets` | `SinglePreset[]` | [Shortcuts](/pickers/presets) |

### `createDateRangePicker`

| Option | Type | Meaning |
|---|---|---|
| `value`, `defaultValue` | `RangeValue` | `{ start, end }` |
| `onChange` | `(value, detail) => void` | `detail` is `RangeDetail` |
| `minDays`, `maxDays` | `number` | Counting both ends |
| `presets` | `RangePreset[]` | [Shortcuts](/pickers/presets) |

### `createDateTimePicker`

| Option | Type | Default | Meaning |
|---|---|---|---|
| `value`, `defaultValue` | `string` | | An ISO timestamp |
| `onChange` | `(value, detail) => void` | | `detail` is `DateTimeDetail` or `null` |
| `timeZone` | `string` | configured | The zone shown and stored |
| `hour12` | `boolean` | `false` | 12-hour display |
| `minuteStep` | `number` | `5` | 1 to 30 |
| `defaultTime` | `string` | `'00:00'` | Used when a day is picked first |
| `presets` | `SinglePreset[]` | | [Shortcuts](/pickers/presets) |

### `createMultiDatePicker`

| Option | Type | Meaning |
|---|---|---|
| `value`, `defaultValue` | `readonly string[]` | AD days |
| `onChange` | `(value, dates) => void` | `dates` is `DateDetail[]` |
| `maxDates` | `number` | The most days allowed |

`displayFormat` isn't used here, and `closeOnSelect` defaults to `false`.

## State

| Field | Pickers | Contents |
|---|---|---|
| `value` | All | The value, always AD |
| `date` | Date, range | `{ ad, bs }`, or `{ start, end }` of those |
| `dates` | Multiple | A list of `{ ad, bs }` |
| `detail` | Date and time | `{ ad, bs, time, iso }` or `null` |
| `text` | Date, multiple | What the input shows |
| `startText`, `endText` | Range | What the inputs show |
| `dateText`, `timeText`, `time` | Date and time | The two inputs and the parsed time |
| `calendar`, `canSwitchCalendar` | All | The calendar on screen |
| `open`, `inline` | All | Panel state |
| `error` | All | `{ code, message }` or `null`. In range and date and time, also `field` |
| `equivalentText` | Date, range, date and time | The same day in the other calendar |
| `placeholder` | All | `"YYYY-MM-DD (BS)"` |
| `timePlaceholder`, `hours`, `minutes` | Date and time | The time column |
| `presets` | Date, range, date and time | A list of `PresetState` |
| `calendarState` | All | The panel's [calendar state](./calendar#state) |

## Actions

| Action | Pickers | Does |
|---|---|---|
| `type(text)` | Date, multiple | The user typed |
| `type(field, text)` | Range | The user typed in `'start'` or `'end'` |
| `typeDate(text)`, `typeTime(text)` | Date and time | |
| `blur()` | Date, multiple | Tidy the text |
| `blur(field)` | Range | |
| `blurDate()`, `blurTime()` | Date and time | |
| `select(date)` | Date, range, multiple | Pick a day. In multiple, a second pick removes it |
| `selectDate(date)` | Date and time | |
| `selectHour(hour)`, `selectMinute(minute)` | Date and time | |
| `selectNow()` | Date and time | Today and the current time |
| `selectToday()` | Date | |
| `remove(value)` | Multiple | Remove one day |
| `clear()` | All | |
| `setValue(value)` | All | From outside. Doesn't call `onChange` |
| `reset()` | All | Back to `defaultValue` |
| `open()`, `close()`, `toggle()` | All | Panel |
| `switchCalendar(calendar)` | All | The value doesn't change |
| `applyPreset(id)` | Date, range, date and time | Returns `false` if disabled or unknown |

## The value contract

- The value is always AD, and `''` when empty or invalid.
- `onChange` is called for user actions only: typing, picking, clear and reset.
- `setValue` and `setOptions({ value })` never call it.
- Passing back the value the user just typed leaves their text alone, so the cursor doesn't jump.

## Helpers

| Function | Does |
|---|---|
| `parseInput(text, calendar, limits, locale, format?)` | Read typed text. Returns a `ParseResult` |
| `checkDate(date, calendar, limits, locale, format?)` | The error for a date, or `null` |
| `formatInput(date, calendar, format, locale)` | The text for an input |
| `equivalentText(date, calendar, locale)` | "10 October 2026 AD" |
| `placeholderText(calendar, locale)` | "YYYY-MM-DD (BS)" |
| `maskDateText(next, previous?)` | [Add dashes](/pickers/typing#using-the-mask-yourself) |
| `resolveSinglePreset(id, context)`, `resolveRangePreset(id, context)` | What a built-in shortcut stands for |

## Types

`DatePickerOptions`, `DatePickerState`, `DatePickerActions`, `DatePickerStore`,
`DateRangePickerOptions`, `DateRangePickerState`, `DateRangePickerActions`, `DateRangePickerStore`,
`DateTimePickerOptions`, `DateTimePickerState`, `DateTimePickerActions`, `DateTimePickerStore`,
`MultiDatePickerOptions`, `MultiDatePickerState`, `MultiDatePickerActions`, `MultiDatePickerStore`,
`PickerBaseOptions`, `DateDetail`, `DateTimeDetail`, `RangeDetail`, `RangeField`, `RangeValue`,
`DateError`, `DateErrorCode`, `TimeCell`, `InputLimits`, `ParseResult`, `CustomPreset`, `PresetContext`,
`PresetRange`, `PresetState`, `RangePreset`, `RangePresetId`, `SinglePreset`, `SinglePresetId`.
