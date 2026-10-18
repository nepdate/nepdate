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

| Helper                                                        | Does                                     |
| ------------------------------------------------------------- | ---------------------------------------- |
| `computePosition(anchorRect, panelHeight, viewport, options)` | Pure placement maths.                    |
| `placePopover(anchor, panel, options)` / `trackPosition(…)`   | Show and position (and keep positioned). |
| `onOutsidePointer(elements, callback)`                        | Pointer down outside the elements.       |
| `onEscape(callback, { capture, stop })`                       | Escape key.                              |
| `focusFirst(container, selector?)`, `restoreFocus(element)`   | Focus helpers.                           |
| `supportsPopover()`, `prefersReducedMotion()`, `hasDom()`     | Feature checks.                          |

MIT © Shishir Rai
