import { hasDom } from './env';

type Targets =
  | readonly (Element | null | undefined)[]
  | (() => readonly (Element | null | undefined)[]);

/**
 * Call `callback` when a pointer goes down outside all of `elements` (checked
 * in the capture phase, before the page reacts). Returns a cleanup function.
 */
export function onOutsidePointer(
  elements: Targets,
  callback: (event: PointerEvent) => void,
): () => void {
  if (!hasDom()) {
    return noop;
  }
  const listener = (event: PointerEvent): void => {
    const target = event.target;
    const list = typeof elements === 'function' ? elements() : elements;
    const inside =
      target instanceof Node &&
      list.some((element) => element?.contains(target) ?? false);
    if (!inside) {
      callback(event);
    }
  };
  document.addEventListener('pointerdown', listener, true);

  return () => {
    document.removeEventListener('pointerdown', listener, true);
  };
}

/**
 * Call `callback` on Escape. By default it listens in the capture phase and
 * stops the event, so an enclosing dialog does not close as well.
 */
export function onEscape(
  callback: (event: KeyboardEvent) => void,
  options: { readonly capture?: boolean; readonly stop?: boolean } = {},
): () => void {
  if (!hasDom()) {
    return noop;
  }
  const capture = options.capture ?? true;
  const listener = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    if (options.stop ?? true) {
      event.stopPropagation();
      event.preventDefault();
    }
    callback(event);
  };
  window.addEventListener('keydown', listener, capture);

  return () => {
    window.removeEventListener('keydown', listener, capture);
  };
}

/** Focus the first element in `container` matching `selector` (the roving-tabindex day by default). */
export function focusFirst(
  container: ParentNode | null,
  selector = '[tabindex="0"]',
): boolean {
  const element = container?.querySelector<HTMLElement>(selector);
  if (!element) {
    return false;
  }
  element.focus();

  return true;
}

/** Put focus back, e.g. on the input after the panel closes. */
export function restoreFocus(element: HTMLElement | null | undefined): void {
  element?.focus({ preventScroll: true });
}

function noop(): void {
  // Nothing to undo outside a browser.
}
