import { hasDom, supportsPopover } from './env';

export type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface PlaceOptions {
  /** Space between the anchor and the panel, and kept from the viewport edges. Default 6. */
  readonly gap?: number;
  /** Panel width in px; shrinks to fit narrow screens. Default 320. */
  readonly width?: number;
  /** Preferred side; flips when there is not enough room. Default 'bottom-start'. */
  readonly placement?: Placement;
}

export interface Rect {
  readonly top: number;
  readonly left: number;
  readonly bottom: number;
  readonly right: number;
}

export interface Position {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  /** Where the panel ended up after flipping. */
  readonly side: 'top' | 'bottom';
}

/**
 * Where to put a panel next to an anchor, in viewport (position: fixed)
 * coordinates. Pure, so it can be tested without a browser. Rules from the
 * institute-SaaS picker: prefer the requested side, flip when the panel does
 * not fit but does fit on the other side, and keep `gap` px from every edge
 * (the panel may overlap the anchor rather than leave the screen).
 */
export function computePosition(
  anchor: Rect,
  panelHeight: number,
  viewport: { readonly width: number; readonly height: number },
  options: PlaceOptions = {},
): Position {
  const gap = options.gap ?? 6;
  const placement = options.placement ?? 'bottom-start';
  const width = Math.max(0, Math.min(options.width ?? 320, viewport.width - gap * 2));
  const roomBelow = viewport.height - anchor.bottom - gap * 2;
  const roomAbove = anchor.top - gap * 2;
  const wantsTop = placement.startsWith('top');
  const side: 'top' | 'bottom' = wantsTop
    ? roomAbove >= panelHeight || roomAbove >= roomBelow
      ? 'top'
      : 'bottom'
    : roomBelow >= panelHeight || roomBelow >= roomAbove
      ? 'bottom'
      : 'top';
  const rawTop = side === 'bottom' ? anchor.bottom + gap : anchor.top - gap - panelHeight;
  const rawLeft = placement.endsWith('end') ? anchor.right - width : anchor.left;

  return {
    // Keep the whole panel on screen; when it is taller than the room, its top edge wins.
    top: Math.max(gap, Math.min(rawTop, viewport.height - gap - panelHeight)),
    left: Math.max(gap, Math.min(rawLeft, viewport.width - width - gap)),
    width,
    side,
  };
}

/**
 * Show `panel` beside `anchor` once. Uses the browser's top layer when it can
 * (so dialogs and scrolling containers never clip the panel), otherwise
 * position: fixed. Returns a function that hides the panel again.
 */
export function placePopover(
  anchor: Element,
  panel: HTMLElement,
  options: PlaceOptions = {},
): () => void {
  if (!hasDom()) {
    return noop;
  }
  const topLayer = supportsPopover();
  if (topLayer) {
    if (!panel.hasAttribute('popover')) {
      panel.setAttribute('popover', 'manual');
    }
    if (!panel.matches(':popover-open')) {
      panel.showPopover();
    }
  }
  const position = computePosition(
    anchor.getBoundingClientRect(),
    panel.offsetHeight,
    { width: window.innerWidth, height: window.innerHeight },
    options,
  );
  Object.assign(panel.style, {
    position: 'fixed',
    margin: '0',
    inset: 'auto',
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${position.width}px`,
  });
  panel.dataset['side'] = position.side;

  return () => {
    if (topLayer && panel.matches(':popover-open')) {
      panel.hidePopover();
    }
  };
}

/**
 * Show the panel and keep it beside the anchor while the window resizes or
 * any ancestor scrolls. Returns a function that stops tracking and hides it.
 */
export function trackPosition(
  anchor: Element,
  panel: HTMLElement,
  options: PlaceOptions = {},
): () => void {
  if (!hasDom()) {
    return noop;
  }
  let hide = placePopover(anchor, panel, options);
  const place = (): void => {
    hide = placePopover(anchor, panel, options);
  };
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);

  return () => {
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    hide();
  };
}

function noop(): void {
  // Nothing to undo outside a browser.
}
