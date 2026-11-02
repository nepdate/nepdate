# Theming

[[toc]]

## Introduction

`@nepdate/styles` is plain CSS: no Tailwind and no build step. Everything is drawn with `--ndp-*`
CSS variables, so you can match your design by overriding a few of them.

```ts
import '@nepdate/styles';
```

## Your brand colour

Set these on `:root`, after the stylesheet has loaded:

```css
:root {
  --ndp-bg-accent: #126453;
  --ndp-border-accent: #126453;
  --ndp-text-accent: #126453;
  --ndp-bg-accent-muted: #e5eee6;
  --ndp-text-on-accent-muted: #0b3f35;
  --ndp-focus-ring: rgb(18 100 83 / 0.5);
}
```

<ClientOnly>
  <div class="demo" style="--ndp-bg-accent:#126453;--ndp-border-accent:#126453;--ndp-text-accent:#126453;--ndp-bg-accent-muted:#e5eee6;--ndp-text-on-accent-muted:#0b3f35;--ndp-focus-ring:rgb(18 100 83 / 0.5)">
    <nep-calendar value="2026-10-18"></nep-calendar>
  </div>
</ClientOnly>

To theme one picker, set them on a wrapper instead of `:root`.

## Dark mode

By default the components follow the system's light or dark setting. To force one, use the
`data-ndp-theme` attribute on `<html>` or on any wrapper:

```html
<html data-ndp-theme="dark">
  <body>
    <div data-ndp-theme="light">
      <nep-date-picker></nep-date-picker>
    </div>
  </body>
</html>
```

Or pass `theme` to a component:

::: code-group

```tsx [React]
<DatePicker theme="dark" />;
```

```html [HTML]
<nep-date-picker theme="dark"></nep-date-picker>
```

:::

`theme` accepts `light`, `dark` or `auto`.

If your app has its own theme switch, set the attribute from it:

```ts
function setDark(dark: boolean) {
  document.documentElement.dataset['ndpTheme'] = dark ? 'dark' : 'light';
}

setDark(true);
```

## Tokens

### Colours

| Token | Used for |
|---|---|
| `--ndp-bg-surface` | Panel and input background |
| `--ndp-bg-muted` | Segment background |
| `--ndp-bg-hover` | Hovered days and buttons |
| `--ndp-bg-accent` | Selected day, primary button |
| `--ndp-bg-accent-muted` | The middle of a range |
| `--ndp-bg-holiday-muted` | Holiday background |
| `--ndp-border-default` | Dividers and panel border |
| `--ndp-border-strong` | Input border |
| `--ndp-border-hover` | Input border on hover |
| `--ndp-border-accent` | Focused input, today |
| `--ndp-border-danger` | An invalid input |
| `--ndp-text-primary` | Main text |
| `--ndp-text-secondary` | Labels |
| `--ndp-text-muted` | Hints and the other calendar's digits |
| `--ndp-text-disabled` | Disabled days |
| `--ndp-text-accent` | Links and today |
| `--ndp-text-on-accent` | Text on a selected day |
| `--ndp-text-on-accent-muted` | Text in the middle of a range |
| `--ndp-text-holiday` | Holidays and weekends |
| `--ndp-text-danger` | Error messages |
| `--ndp-focus-ring` | Keyboard focus outline |

### Sizes

| Token | Default | Used for |
|---|---|---|
| `--ndp-day-size` | `44px` | A day cell |
| `--ndp-input-height` | `40px` | The input |
| `--ndp-icon-button-size` | `32px` | Icon buttons |
| `--ndp-option-height` | `48px` | Month and year tiles |
| `--ndp-panel-padding` | `12px` | Panel padding |
| `--ndp-presets-width` | `152px` | The shortcut list |

### Shape and type

| Token | Default |
|---|---|
| `--ndp-radius-sm` | `6px` |
| `--ndp-radius-md` | `8px` |
| `--ndp-radius-lg` | `12px` |
| `--ndp-space-4`, `--ndp-space-8`, `--ndp-space-12` | `4px`, `8px`, `12px` |
| `--ndp-font` | Inter, then the system font |
| `--ndp-shadow-panel` | The panel's shadow |
| `--ndp-z-index` | `50`, used when the browser has no top layer |

## Keeping contrast

Each text colour meets WCAG AA against its background, in both themes. If you change colours, check
them again, especially `--ndp-text-on-accent` on `--ndp-bg-accent`.

## Using only the tokens

To reuse the variables in your own CSS without the component styles:

```ts
import '@nepdate/styles/tokens.css';
```
