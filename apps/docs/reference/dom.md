# @nepdate/dom

[[toc]]

Small browser helpers that the components share. It knows nothing about dates and depends on no
package. Every helper is safe to call during server rendering, where it does nothing. Most apps
don't need this directly. It's useful with [headless hooks](/integrations/headless-react).

```ts
import { onEscape, onOutsidePointer, trackPosition } from '@nepdate/dom';

function open(input: HTMLElement, field: HTMLElement, panel: HTMLElement) {
  const stops = [
    trackPosition(input, panel),
    onOutsidePointer([field, panel], close),
    onEscape(close),
  ];

  function close() {
    stops.forEach((stop) => stop());
  }
}
```

## Placement

| Function | Does |
|---|---|
| `computePosition(anchorRect, panelHeight, viewport, options?)` | Pure placement maths |
| `placePopover(anchor, panel, options?)` | Show and place once. Returns a function that hides it |
| `trackPosition(anchor, panel, options?)` | The same, and keep it placed on resize and scroll |
| `resolveLayout(layout, viewportWidth, sheetBelow?)` | `'popover'` or `'sheet'` for a width |

`PlaceOptions`:

| Option | Default | Meaning |
|---|---|---|
| `gap` | `6` | Space around the panel |
| `width` | `320` | Panel width |
| `placement` | `'bottom-start'` | `'bottom-start'`, `'bottom-end'`, `'top-start'` or `'top-end'` |
| `layout` | `'auto'` | `'auto'`, `'popover'` or `'sheet'` |
| `sheetBelow` | `480` | `'auto'` uses the sheet below this width |

## Events and focus

| Function | Does |
|---|---|
| `onOutsidePointer(elements, callback)` | A pointer went down outside the elements |
| `onBackdropPointer(panel, callback)` | A tap on a bottom sheet's backdrop |
| `onEscape(callback, { capture, stop })` | The Escape key. In the capture phase, so an enclosing dialog stays open |
| `focusFirst(container, selector?)` | Focus the first focusable element |
| `restoreFocus(element)` | Return focus |

Functions that listen return a function that stops listening.

## Feature checks

`hasDom()`, `supportsPopover()`, `prefersReducedMotion()`.

## Types

`PlaceOptions`, `Placement`, `PanelLayout`, `Position`, `Rect`.
