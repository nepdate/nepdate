# Plain JavaScript API

[[toc]]

## Introduction

If you'd rather not use custom elements, you can mount a picker with a function call. These
functions come from `@nepdate/vanilla`, and they are also the way to enhance an input you already
have.

## Mounting into a container

```js
import { createDatePicker } from '@nepdate/vanilla';

const picker = createDatePicker(document.querySelector('#date'), {
  min: '2026-01-01',
  onChange: (value) => console.log(value),
});

picker.getValue(); // ""
picker.setValue('2026-10-10');
picker.open();
picker.destroy();
```

The options are the same as the [date picker's](/pickers/date-picker#options), in camelCase. You
also get `ariaLabel` in place of `aria-label`, and `onOpenChange` to hear when the panel opens or
closes.

## What you get back

`createDatePicker` returns a handle:

| Member | Does |
|---|---|
| `view` | The underlying view |
| `getValue()` | The AD value |
| `getState()` | The full [picker state](/reference/datepicker#state) |
| `setValue(value)` | Set the value. Doesn't call `onChange` |
| `setOptions(changes)` | Change any option |
| `open()`, `close()` | Open or close the panel |
| `destroy()` | Remove everything |

## Enhancing an existing input

Pass an `<input>` instead of a container. The picker hides it, shows itself in its place, and keeps
the input's `value` up to date. Your form, validation and server code carry on as before.

```html
<input type="text" name="dob" value="2026-10-10" />

<script type="module">
  import { createDatePicker } from '@nepdate/vanilla';

  const picker = createDatePicker(document.querySelector('input[name="dob"]'));

  // Later, to undo it:
  picker.destroy();
</script>
```

The input also fires `input` and `change` when the value changes, so existing listeners keep
working. `destroy()` removes the picker and shows the input again.

## Other pickers

```js
import {
  createCalendar,
  createDateRangePicker,
  createDateTimePicker,
  createMultiDatePicker,
} from '@nepdate/vanilla';

const range = createDateRangePicker(document.querySelector('#range'), { maxDays: 15 });

range.getState().value; // { start: "", end: "" }
range.destroy();
```

`createDateRangePicker` and `createDateTimePicker` return the view itself, which has `getState()`,
`setOptions()`, `open()`, `close()` and `destroy()`, plus a `store` for everything else.
`createMultiDatePicker` returns a handle like `createDatePicker`'s, and `createCalendar` returns one
for a calendar.
