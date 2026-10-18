# @nepdate/vanilla

The BS/AD date picker and calendar for plain JavaScript, as custom elements and a small imperative API. It works in plain HTML, Vue, Svelte, Solid, Laravel Blade, Django and Rails templates.

## From a CDN

```html
<link rel="stylesheet" href="https://unpkg.com/@nepdate/styles/index.css" />
<script src="https://unpkg.com/@nepdate/vanilla/dist/nepdate-picker.global.js"></script>

<form>
  <label for="dob">Date of birth</label>
  <nep-date-picker name="dob" input-id="dob" max="2026-12-31" required></nep-date-picker>
</form>
```

## With a bundler

```bash
npm install @nepdate/vanilla @nepdate/styles
```

```js
import '@nepdate/styles';
import '@nepdate/vanilla/define'; // registers the elements
```

## `<nep-date-picker>`

A form-associated element: the form receives the AD `"YYYY-MM-DD"` value under `name`. It supports `required`, `disabled` fieldsets and form reset.

| Attribute                 | Meaning                               |
| ------------------------- | ------------------------------------- |
| `value`                   | Starting value (AD)                   |
| `min`, `max`              | Limits (AD)                           |
| `calendar`                | `BS` or `AD`, fixed                   |
| `default-calendar`        | Calendar shown first                  |
| `locale`                  | `en`, `ne`                            |
| `name`                    | Form field name                       |
| `placeholder`             | Input placeholder                     |
| `required`, `disabled`    | As on a native input                  |
| `clearable="false"`       | Hide the clear button                 |
| `show-equivalent="false"` | Hide the other-calendar line          |
| `close-on-select="false"` | Keep the panel open after a pick      |
| `theme`                   | `light` \| `dark` \| `auto`           |
| `persist-calendar`        | localStorage key for the BS/AD choice |
| `week-starts-on`          | `0`–`6`                               |
| `display-format`          | e.g. `long`                           |
| `label`                   | The input's `aria-label`              |
| `input-id`                | For `<label for>`                     |

- **Properties:** `value`; `holidays`, `events` and `isDateDisabled` (functions and lists); `open()`, `close()`, `focus()`, `checkValidity()`.
- **Events:** `change` (detail `{ value, ad, bs }`), `nep-open`, `nep-close`, `nep-calendar-change`.

## `<nep-calendar>` and `<nep-date-range-picker>`

```html
<nep-calendar value="2026-10-18" range></nep-calendar>
<nep-date-range-picker name="leave" min-days="1" max-days="15"></nep-date-range-picker>
```

- **`nep-calendar`:** fires `nep-select` with `{ date, value }`, or `{ range: { start, end } }` when it has the `range` attribute.
- **`nep-date-range-picker`:** submits `leave-start` and `leave-end` (or set `start-name` / `end-name`), and fires `change` with `{ value: { start, end } }`.

## Without custom elements

```js
import { createDatePicker } from '@nepdate/vanilla';

// Takes over an existing <input name="dob" value="2026-10-10">, keeping it in step:
const picker = createDatePicker(document.querySelector('input[name="dob"]'), {
  min: '2026-01-01',
});
picker.getValue(); // "2026-10-10"
picker.destroy(); // puts the original input back
```

`createCalendar(container, options)` and `createDateRangePicker(container, options)` work the same way.

MIT © Shishir Rai
