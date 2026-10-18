/** True in a browser-like environment; false during server rendering. */
export function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** Whether the browser can show elements in the top layer (`popover` + `showPopover`). */
export function supportsPopover(): boolean {
  return (
    hasDom() &&
    typeof HTMLElement !== 'undefined' &&
    typeof HTMLElement.prototype.showPopover === 'function'
  );
}

/** Whether the user asked the system for less motion. */
export function prefersReducedMotion(): boolean {
  return (
    hasDom() &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
