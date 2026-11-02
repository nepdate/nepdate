# Headless React hooks

[[toc]]

## Introduction

If the built-in look doesn't fit, you can keep the behaviour and write your own markup. The hooks in
`@nepdate/react/headless` give you the state, the actions and **prop getters**, which supply the
right ARIA attributes and keyboard handling.

```ts
import { useDatePicker } from '@nepdate/react/headless';
```

| Hook | For |
|---|---|
| `useCalendar` | A calendar |
| `useDatePicker` | A date picker |
| `useDateRangePicker` | A range picker |
| `useDateTimePicker` | A date and time picker |
| `useMultiDatePicker` | Several separate dates |

## A date picker with your own markup

Spread each getter on the matching element:

```tsx
import { useDatePicker } from '@nepdate/react/headless';

export function MyDatePicker() {
  const picker = useDatePicker({ min: '2026-01-01' });
  const { state, calendar } = picker;

  return (
    <div>
      <input {...picker.getInputProps()} />
      <button {...picker.getToggleProps()}>Open</button>

      {state.error && <p>{state.error.message}</p>}

      {state.open && (
        <div {...picker.getPanelProps()}>
          <h2>{state.calendarState.title}</h2>
          <table {...calendar.getGridProps()}>
            <tbody>
              {state.calendarState.weeks.map((week, index) => (
                <tr key={index}>
                  {week.map((cell, column) => (
                    <td key={cell?.key ?? column}>
                      {cell && (
                        <button {...calendar.getDayProps(cell)}>{cell.label}</button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

The panel isn't positioned for you here. `@nepdate/dom` has
[`trackPosition`](/reference/dom) to place it beside the input.

## What a hook returns

`useDatePicker` returns:

| Member | Contents |
|---|---|
| `state` | The [picker state](/reference/datepicker#state) |
| `actions` | The [actions](/reference/datepicker#actions) |
| `store` | The underlying store |
| `calendar` | `getGridProps`, `getDayProps` and the rest for the panel's calendar |
| `ids` | The `input`, `panel` and `hint` element IDs |
| `getInputProps()` | For the `<input>` |
| `getToggleProps()` | For the button that opens the panel |
| `getClearProps()` | For the clear button |
| `getSwitchProps()` | For the BS/AD switch in the field |
| `getCalendarOptionProps(calendar)` | For one button of a BS/AD segment |
| `getTodayProps()` | For a Today button |
| `getPanelProps()` | For the panel |
| `getPresetProps(preset)` | For a shortcut button |

## Using the styles anyway

You can write your own markup and still use `@nepdate/styles`, by using the same classes. See
[Markup and classes](/guide/markup). `CalendarBody` from `@nepdate/react` renders just the calendar
part with those classes.

## Options

Hooks take the same options as the [store](/reference/datepicker#options). Inline objects and
functions are fine, as values are compared by content.
