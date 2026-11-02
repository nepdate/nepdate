# Typing and input masking

[[toc]]

## Introduction

Typing a date is often faster than clicking, especially for a date of birth. Every picker's field
accepts typed dates, and it fills in the dashes for you.

<ClientOnly>
  <div class="demo">
    <label class="demo__label" for="t-demo">Type 20830624</label>
    <nep-date-picker input-id="t-demo"></nep-date-picker>
  </div>
</ClientOnly>

## What people can type

The year comes first. These all give the same date:

```text
2083-06-24
2083/6/24
2083.06.24
20830624
२०८३-०६-२४
```

The date is read in the calendar on screen, so `2083-06-24` means BS when the picker shows BS.
When the field loses focus, the text is tidied to the standard form.

See [Parsing](/guide/parsing) for the rules.

## Dashes as you type

As digits are typed, the dashes appear:

| Typed | Field shows |
|---|---|
| `2083` | `2083-` |
| `208306` | `2083-06-` |
| `20830624` | `2083-06-24` |
| `20830624`, pasted | `2083-06-24` |

If someone types the dash themselves, it isn't doubled. Devanagari digits work the same way.

It only acts when text is added at the end. Deleting, editing the middle of a date, and using
other separators such as `2083/6/4` are left as typed, so the cursor never jumps.

To turn it off:

::: code-group

```tsx [React]
<DatePicker mask={false} />;
```

```html [HTML]
<nep-date-picker mask="false"></nep-date-picker>
```

:::

Compact dates such as `20830624` are still read when masking is off.

## On phones

The field uses `inputmode="numeric"`, so phones show a number pad. If you turn on a format with
month names through `displayFormat`, people can still type a date in `YYYY-MM-DD`.

## Using the mask yourself

`maskDateText` is a plain function, so you can use it in your own input. It takes the new text
and the previous text:

```ts
import { maskDateText } from '@nepdatejs/datepicker';

maskDateText('2083', '208'); // → '2083-'
maskDateText('2083-06', '2083-0'); // → '2083-06-'
maskDateText('20830624', ''); // → '2083-06-24'
maskDateText('208', '2083-'); // → '208'
```
