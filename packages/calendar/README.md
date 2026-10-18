# @nepdate/calendar

A framework-free BS/AD calendar view model. It builds the month grid (with the other calendar's day under each day), the month and year tile views, keyboard navigation and every day state: today, selected, range, disabled, outside, weekend, holiday and events. It renders nothing. `@nepdate/react` and `@nepdate/vanilla` render it, and you can render it yourself in any framework.

```bash
npm install @nepdate/calendar
```

```ts
import { createCalendar } from '@nepdate/calendar';

const calendar = createCalendar({
  calendar: 'BS',
  locale: 'en',
  selectionMode: 'single', // or 'range'
  holidays: [
    { date: { calendar: 'BS', year: 2083, month: 6, day: 26 }, label: 'Dashain' },
  ],
  onSelect: (date) => console.log(date),
});

const unsubscribe = calendar.subscribe(() => render(calendar.getState()));
calendar.actions.next(); // next month
calendar.actions.moveFocus('ArrowRight');
calendar.actions.select(calendar.getState().focused);
```

## State

`getState()` returns a frozen snapshot, and the same object until something changes, so it works with `useSyncExternalStore`, signals and similar.

| Field                                                                             | Contents                                                                                     |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `view`                                                                            | `'day' \| 'month' \| 'year'`                                                                 |
| `title`                                                                           | `"Kartik 2083"`, `"2083"` or `"2076–2087"`                                                   |
| `weekdays[]`                                                                      | `{ index, label, narrowLabel, longLabel, isWeekend }`                                        |
| `weeks[][]`                                                                       | `DayCell \| null`. A null cell is empty (outside days hidden, or before/after the BS table). |
| `months[]`, `years[]`                                                             | Tiles: `{ value, label, subLabel: "Oct / Nov", isSelected, isCurrent, isDisabled }`          |
| `canPrev`, `canNext`, `focused`, `visibleMonth`, `selected`, `minDate`, `maxDate` |                                                                                              |

Each `DayCell` has `date`, `otherDate`, `label`, `subLabel`, `ariaLabel` ("Sunday, 1 Kartik 2083 (18 October 2026 AD)"), the `isToday` / `isSelected` / `isRange*` / `isDisabled` / `isOutside` / `isWeekend` / `isHoliday` flags, `holidayLabel`, `events`, `isFocusTarget` (for a roving tabindex), and `state`: one string for styling.

## Actions

| Action                                       | Does                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `next()`, `prev()`                           | Move by a month, a year or 12 years (depending on the view); stops at the limits.                        |
| `goTo(date)`, `goToToday()`                  | Show a date's month.                                                                                     |
| `setView()`, `chooseMonth()`, `chooseYear()` | Switch and drill down through the views.                                                                 |
| `focus(date)`, `moveFocus(key, { shift })`   | Arrows, Home/End, PageUp/PageDown, Shift for years. Never throws at the edges.                           |
| `select(date)`                               | Returns `false` for disabled days. In range mode, the first click sets the start and the second the end. |
| `hover(date \| null)`                        | Range preview.                                                                                           |

Change options at any time with `setOptions({ min, max, calendar, … })`. Passing `selected` or `visibleMonth` there makes them controlled.

The pure helpers `buildMonthGrid`, `buildMonthTiles`, `buildYearTiles`, `nextFocus` and `computeLimits` are exported for custom layouts.

MIT © Shishir Rai
