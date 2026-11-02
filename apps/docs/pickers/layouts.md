# Layouts: popover, sheet, inline

[[toc]]

## Introduction

A picker's calendar can appear in three ways:

| Layout | Looks like | Used |
|---|---|---|
| Popover | A panel beside the field | On screens 480px and wider |
| Sheet | A panel across the bottom of the screen | On screens under 480px |
| Inline | Part of the page, always open | When you ask for it |

You usually don't have to choose: popover and sheet switch by themselves.

## Popover

The panel opens in the browser's **top layer**, so dialogs and scrolling containers can't cut it
off, and you don't need a `z-index`. It prefers to open below the field, flips above when
there's no room, and stays on screen. Escape or a click outside closes it.

## Bottom sheet

On phones, a popover is cramped and can cover the field. So below 480px the panel slides up from
the bottom of the screen and dims the page. Tapping the dimmed area closes it.

Rotating a phone or resizing a window switches between the two. To force one at every width:

::: code-group

```tsx [React]
<>
  <DatePicker panelLayout="sheet" />
  <DatePicker panelLayout="popover" />
</>;
```

```html [HTML]
<nep-date-picker panel-layout="sheet"></nep-date-picker>
<nep-date-picker panel-layout="popover"></nep-date-picker>
```

:::

The sheet respects the iPhone's home indicator through `safe-area-inset-bottom`. For that to work,
your page needs `viewport-fit=cover`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

## Inline

`inline` keeps the calendar in the page under the field, always open. There's no popover and no
toggle button.

<ClientOnly>
  <div class="demo">
    <nep-date-picker inline label="Appointment date"></nep-date-picker>
  </div>
</ClientOnly>

::: code-group

```tsx [React]
<DatePicker inline aria-label="Appointment date" />;
```

```html [HTML]
<nep-date-picker inline label="Appointment date"></nep-date-picker>
```

:::

It works on all four pickers. Unlike a plain [`<Calendar>`](./calendar), an inline picker keeps
typing, validation, the BS/AD switch and the form value.

The panel is as wide as its container, up to the normal panel width. With nothing popping up, the
input is a plain text field and the panel is a labelled group rather than a dialog.

## Sizing

To change the size of the calendar, set the [size tokens](/guide/theming#sizes). The day cell is
44px by default, which is a comfortable touch target.
