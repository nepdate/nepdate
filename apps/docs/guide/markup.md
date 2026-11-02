# Markup and classes

[[toc]]

## Introduction

The class names, `data-*` attributes and structure below are a public part of nepdate. Changing one
counts as a breaking change, so it's safe to target them in your CSS, or to write your own markup
that uses them.

## The field

```text
.ndp-field
  .ndp-input            [data-invalid] [data-disabled]
    input.ndp-input__control
    .ndp-input__actions
      button.ndp-icon-button      clear
      button.ndp-input__switch    BS/AD
      button.ndp-icon-button      calendar
  p.ndp-hint            [data-error]
```

A range field puts `.ndp-range` around two inputs and a `span.ndp-range__separator`. A date and time
field puts `.ndp-datetime` around `.ndp-input` and `.ndp-input.ndp-input--time`.

## The panel

```text
.ndp-panel              [data-side=top|bottom] [data-layout=popover|sheet|inline]
  .ndp-panel__body
    .ndp-presets
      button.ndp-preset [aria-pressed]
    .ndp-calendar
    .ndp-time
      .ndp-time__column
        button.ndp-time-item [aria-pressed]
  .ndp-panel__footer
    .ndp-segment
      button.ndp-segment__item [aria-pressed]
    button.ndp-button
```

## The calendar

```text
.ndp-calendar
  .ndp-calendar__header
    button.ndp-icon-button    previous
    .ndp-calendar__title
      button.ndp-calendar__title-button
    button.ndp-icon-button    next
  table.ndp-grid
    th.ndp-weekday            [data-weekend]
    td > button.ndp-day       [data-state] [data-weekend] [data-preview]
      span.ndp-day__label
      span.ndp-day__sub
      span.ndp-day__dot
  .ndp-options
    button.ndp-option         [data-state=default|selected|current]
```

## Day states

`data-state` on `.ndp-day` is one of:

`default`, `today`, `selected`, `range-start`, `range-middle`, `range-end`, `disabled`, `outside`,
`holiday`.

## Examples

Round the selected day into a circle:

```css
.ndp-day[data-state='selected'] {
  border-radius: 50%;
}
```

Hide the other calendar's digits in one place:

```css
.compact .ndp-day__sub {
  display: none;
}
```

Style the bottom sheet only:

```css
.ndp-panel[data-layout='sheet'] {
  max-height: 70dvh;
}
```

## Building from scratch

You can use these classes with your own markup. There's a static copy of each state on the
playground's Styles page, which is useful as a reference. With React, the
[headless hooks](/integrations/headless-react) supply the behaviour.
