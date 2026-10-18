/**
 * @nepdate/dom: small browser helpers shared by the DOM adapters (vanilla,
 * react, angular). Knows nothing about dates. Every helper is safe to call
 * during server rendering and returns a cleanup function where it listens.
 */
export { hasDom, prefersReducedMotion, supportsPopover } from './env';
export {
  computePosition,
  placePopover,
  trackPosition,
  type Placement,
  type PlaceOptions,
  type Position,
  type Rect,
} from './position';
export { focusFirst, onEscape, onOutsidePointer, restoreFocus } from './events';
