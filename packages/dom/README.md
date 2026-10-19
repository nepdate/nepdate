# @nepdate/dom

Small browser helpers shared by the `@nepdate` adapters. It knows nothing about dates and depends on no package. Every helper is a safe no-op during server rendering, and the ones that listen return a cleanup function.

```ts
import { onEscape, onOutsidePointer, trackPosition } from '@nepdate/dom';

const stop = [
  trackPosition(input, panel), // top layer when supported; flips and stays on screen
  onOutsidePointer([field, panel], close),
  onEscape(close), // capture phase, so an enclosing dialog stays open
];
// later: stop.forEach((cleanup) => cleanup());
```

| Helper                                                        | Does                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `computePosition(anchorRect, panelHeight, viewport, options)` | Pure placement maths.                                                                                  |
| `placePopover(anchor, panel, options)` / `trackPosition(…)`   | Show and position (and keep positioned); `layout: 'auto' \| 'popover' \| 'sheet'`, `sheetBelow` (480). |
| `onOutsidePointer(elements, callback)`                        | Pointer down outside the elements.                                                                     |
| `onEscape(callback, { capture, stop })`                       | Escape key.                                                                                            |
| `onBackdropPointer(panel, callback)`                          | Tap on a bottom sheet's backdrop.                                                                      |
| `resolveLayout(layout, viewportWidth, sheetBelow?)`           | `'popover'` or `'sheet'` for a width.                                                                  |
| `focusFirst(container, selector?)`, `restoreFocus(element)`   | Focus helpers.                                                                                         |
| `supportsPopover()`, `prefersReducedMotion()`, `hasDom()`     | Feature checks.                                                                                        |

MIT © Shishir Rai
