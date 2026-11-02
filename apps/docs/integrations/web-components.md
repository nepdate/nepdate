# Web Components

[[toc]]

## Introduction

`@nepdate/vanilla` provides the pickers as custom elements, real HTML tags that work anywhere:
plain pages, server templates and every framework.

```html
<nep-date-picker name="dob"></nep-date-picker>
```

| Element | Page |
|---|---|
| `<nep-date-picker>` | [Date picker](/pickers/date-picker) |
| `<nep-date-range-picker>` | [Date range picker](/pickers/range-picker) |
| `<nep-date-time-picker>` | [Date and time picker](/pickers/date-time-picker) |
| `<nep-multi-date-picker>` | [Multiple dates](/pickers/multi-date-picker) |
| `<nep-calendar>` | [Calendar](/pickers/calendar) |

The elements render into the normal page, with no shadow DOM, so your CSS and tools such as
browser autofill and testing libraries can see inside them.

## Setting up

### With a bundler

```bash
npm install @nepdate/vanilla @nepdate/styles
```

```js
import '@nepdate/styles';
import '@nepdate/vanilla/define';
```

Importing `/define` registers every element. It's safe to import more than once, and it skips any
name that's already taken.

### One element at a time

Each element has its own entry, so a page that needs only one picker ships only that one:

```js
import { defineDatePicker } from '@nepdate/vanilla/date-picker';

defineDatePicker();
```

| Entry | Register with |
|---|---|
| `@nepdate/vanilla/date-picker` | `defineDatePicker()` |
| `@nepdate/vanilla/date-range-picker` | `defineDateRangePicker()` |
| `@nepdate/vanilla/date-time-picker` | `defineDateTimePicker()` |
| `@nepdate/vanilla/multi-date-picker` | `defineMultiDatePicker()` |
| `@nepdate/vanilla/calendar` | `defineCalendar()` |

### With no build step

See [Script tag (CDN)](./cdn).

## Attributes and properties

Simple options are **attributes**, in kebab-case. You can change them at any time and the element
updates.

```html
<nep-date-picker min="2026-01-01" default-calendar="AD" locale="ne"></nep-date-picker>
```

Functions and lists can't be attributes, so they are **properties**, set from JavaScript:

```js
const picker = document.querySelector('nep-date-picker');

picker.holidays = [{ date: { calendar: 'BS', year: 2083, month: 6, day: 3 }, label: 'Holiday' }];
picker.isDateDisabled = (date) => date.day === 1;
picker.presets = ['today', 'yesterday'];
```

The current value is a property as well:

```js
picker.value; // "2026-10-10"
picker.value = '2026-10-18'; // doesn't fire change
```

## Events

| Event | Elements | `event.detail` |
|---|---|---|
| `change` | Date picker | `{ value, ad, bs }` |
| `change` | Range picker | `{ value: { start, end } }` |
| `change` | Date and time picker | `{ value, ad, bs, time }` |
| `change` | Multiple dates | `{ value: string[], dates }` |
| `nep-select` | Calendar | `{ date, value }`, or `{ range }` |
| `nep-open`, `nep-close` | All pickers | |
| `nep-calendar-change` | Date picker | `{ calendar }` |

`change` fires only when the person changes the value, not when you set it from code. The
native `change` event from the inner input doesn't leak out, so a listener on the element sees only
the real ones.

## Methods

On `<nep-date-picker>`:

```js
picker.open();
picker.close();
picker.focus();
picker.checkValidity();
picker.reportValidity();
```

The other pickers have `focus()`, and their `view` property has `open()` and `close()`.

## Styling

The elements use the same stylesheet as the React components. See [Theming](/guide/theming) and
[Markup and classes](/guide/markup).

## Full reference

Every attribute is listed in the [`@nepdate/vanilla` reference](/reference/vanilla).
