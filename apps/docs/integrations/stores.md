# Framework-free stores

[[toc]]

## Introduction

All the behaviour of the pickers lives in two packages that have no UI at all:
`@nepdate/calendar` and `@nepdate/datepicker`. The React and Web Component versions are thin layers
on these stores, and you can use them to support any other framework.

```bash
npm install @nepdate/datepicker
```

## How a store works

A store has four parts:

```ts
import { createDatePicker } from '@nepdate/datepicker';

const picker = createDatePicker({ today: adDate(2026, 10, 18) });

// 1. Read the current state.
picker.getState().value; // → ''

// 2. Hear about changes.
const stop = picker.subscribe(() => {
  console.log(picker.getState().text);
});

// 3. Send actions.
picker.actions.type('2083-06-24');
picker.getState().value; // → '2026-10-10'

// 4. Change options at any time.
picker.setOptions({ min: '2026-01-01' });

stop();
picker.destroy();
```

`getState()` returns a frozen object, and the **same** object until something changes. That makes
stores work directly with tools that compare by reference, such as `useSyncExternalStore`, Vue's
`shallowRef` and Solid's signals.

## The calendar store

`createCalendar` builds everything you need to draw a month:

```ts
import { createCalendar } from '@nepdate/calendar';

const calendar = createCalendar({
  calendar: 'BS',
  today: adDate(2026, 10, 18),
  selected: bsDate(2083, 7, 1),
});

const state = calendar.getState();

state.title; // → 'Kartik 2083'
state.weekdays[0]?.label; // → 'Sun'
state.weeks[0]?.[0]?.label; // → '1'
state.weeks[0]?.[0]?.isSelected; // → true
state.weeks[0]?.[0]?.ariaLabel; // → 'Sunday, 1 Kartik 2083 (18 October 2026 AD)'

calendar.actions.next();
calendar.getState().title; // → 'Mangsir 2083'
```

Draw `weeks` as rows of seven. A `null` cell is empty. Each day cell has all the flags you
need, plus `state`, one word for styling. See the
[full list](/reference/calendar#daycell).

## Keyboard

`moveFocus` handles the arrow keys and never throws at the limits. Send it the key, and put focus on
the cell whose `isFocusTarget` is true:

```ts
import { createCalendar } from '@nepdate/calendar';

const calendar = createCalendar({ today: adDate(2026, 10, 18) });

calendar.actions.moveFocus('ArrowRight');
formatDate(calendar.getState().focused); // → '2083-07-02'

calendar.actions.select(calendar.getState().focused); // → true
```

## Example: Solid

A date picker in about 20 lines of Solid:

<!-- no-check -->
```tsx
import { createDatePicker } from '@nepdate/datepicker';
import { createSignal, onCleanup } from 'solid-js';

export function DateField() {
  const picker = createDatePicker({ onChange: (value) => console.log(value) });
  const [state, setState] = createSignal(picker.getState());

  onCleanup(picker.subscribe(() => setState(picker.getState())));
  onCleanup(() => picker.destroy());

  return (
    <div>
      <input
        value={state().text}
        placeholder={state().placeholder}
        onInput={(event) => picker.actions.type(event.currentTarget.value)}
        onBlur={() => picker.actions.blur()}
      />
      <button onClick={() => picker.actions.toggle()}>Calendar</button>
      {state().error && <p>{state().error?.message}</p>}
    </div>
  );
}
```

## Pure helpers

For layouts the stores don't cover, such as a year planner, the pure functions behind them are
exported:

| Function | Package |
|---|---|
| `buildMonthGrid`, `buildWeekdays` | `@nepdate/calendar` |
| `buildMonthTiles`, `buildYearTiles` | `@nepdate/calendar` |
| `nextFocus`, `computeLimits`, `isInLimits` | `@nepdate/calendar` |
| `parseInput`, `checkDate`, `formatInput`, `equivalentText` | `@nepdate/datepicker` |
| `maskDateText` | `@nepdate/datepicker` |

## Reference

- [`@nepdate/calendar`](/reference/calendar)
- [`@nepdate/datepicker`](/reference/datepicker)
