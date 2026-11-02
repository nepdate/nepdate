# Accessibility

[[toc]]

## Introduction

The components work with a keyboard and with screen readers, and they meet WCAG AA colour contrast.
Every playground page is checked with [axe](https://github.com/dequelabs/axe-core). You don't need
to add anything, except a label.

## Give every field a name

This is the one thing you must do. See [Labels](./forms#labels).

## Keyboard

### In the field

| Key | Action |
|---|---|
| `Tab` | Move between the input and its buttons |
| `Alt` + `↓` | Open the calendar |
| `↓` | Open the calendar, when the field is empty |
| `Escape` | Close the calendar and return to the input |

### In the calendar

| Key | Action |
|---|---|
| `←` `→` | Previous or next day |
| `↑` `↓` | Same day in the previous or next week |
| `Home` `End` | Start or end of the week |
| `PageUp` `PageDown` | Previous or next month |
| `Shift` + `PageUp` `PageDown` | Previous or next year |
| `Enter` `Space` | Choose the focused day |

Focus moves into the calendar when it opens, and returns to the input when it closes.

## Screen readers

- The input is a `combobox` linked to the panel, which is a `dialog`.
- The calendar is a `grid`, with one tab stop that moves as you use the arrow keys.
- Each day has a full name that gives both calendars and any holiday, such as "Sunday, 1 Kartik
  2083 (18 October 2026 AD)". The digits you see are hidden from screen readers, so it doesn't
  read them twice.
- Selected days are announced as pressed, and today is marked as current.
- Hints and errors are live regions linked to the input, so they are read out when they change.

An [inline](./layouts#inline) picker has no popup, so its input is a plain text box and its panel
is a labelled group.

## Colour and contrast

Text colours meet WCAG AA at 4.5:1 in both themes. Muted text is darker than in the original
design for this reason. If you [change the colours](/guide/theming), check the contrast again.

Selection is shown by more than colour: selected days have a filled background and today has a
ring.

## Motion

Opening animations are turned off when someone has asked for reduced motion in their system
settings.

## Focus

Focus outlines are always visible with a keyboard. They come from the `--ndp-focus-ring` token, so
keep it visible if you change it.
