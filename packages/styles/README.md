# @nepdate/styles

The stylesheet for `@nepdate/react` and `@nepdate/vanilla`. It's plain CSS with no build step and no Tailwind, and follows the "Nepali Date Picker & Calendar" UI kit.

```bash
npm install @nepdate/styles
```

```js
import '@nepdate/styles'; // tokens + components
// or: import '@nepdate/styles/tokens.css'; to reuse the variables only
```

## Theming

Everything uses `--ndp-*` CSS variables, so override them to match your design:

```css
:root {
  --ndp-bg-accent: #126453; /* selected day, primary button */
  --ndp-border-accent: #126453; /* focus ring, today */
  --ndp-text-accent: #126453;
  --ndp-bg-accent-muted: #e5eee6; /* range middle */
  --ndp-radius-md: 6px;
  --ndp-font: 'Inter', system-ui, sans-serif;
}
```

- **Dark mode:** follows the system automatically. Force a theme with `data-ndp-theme="light" | "dark"` on `<html>` or on any wrapper, or with the components' `theme` prop/attribute.
- **Sizes:** `--ndp-day-size` (44px), `--ndp-input-height` (40px), `--ndp-option-height` (48px) and `--ndp-icon-button-size` (32px) control the layout.

## Classes

The class names, `data-*` attributes and markup are a public, documented contract (see the comment at the top of `picker.css`), so you can style the components or build your own markup that matches:

`ndp-field`, `ndp-input`, `ndp-input__control`, `ndp-hint`, `ndp-range`, `ndp-panel`, `ndp-calendar`, `ndp-grid`, `ndp-weekday`, `ndp-day` (with `data-state="today|selected|range-start|range-middle|range-end|disabled|outside|holiday"`), `ndp-option`, `ndp-segment`, `ndp-button`, `ndp-icon-button`, `ndp-holiday-tag`.

Muted text is darker than the original UI kit value, so every text colour meets WCAG AA contrast.

MIT © Shishir Rai
