import { useEffect, useRef, type RefObject } from 'react';
import {
  onBackdropPointer,
  onEscape,
  onOutsidePointer,
  restoreFocus,
  trackPosition,
  type PanelLayout,
} from '@nepdate/dom';
import { useIsomorphicLayoutEffect } from './use-store';

/**
 * While `open`: show the panel in the top layer beside the anchor, close on an
 * outside pointer, a tap on a bottom sheet's backdrop, or Escape (returning focus to `returnFocus`), and move focus
 * into the calendar.
 */
export function usePanel(
  open: boolean,
  refs: {
    anchor: RefObject<HTMLElement | null>;
    panel: RefObject<HTMLDivElement | null>;
    field: RefObject<HTMLElement | null>;
    returnFocus: RefObject<HTMLElement | null>;
  },
  close: () => void,
  focusGrid: () => void,
  width = 320,
  layout: PanelLayout = 'auto',
): void {
  const closeRef = useRef(close);
  closeRef.current = close;

  useIsomorphicLayoutEffect(() => {
    const anchor = refs.anchor.current;
    const panel = refs.panel.current;
    if (!open || !anchor || !panel) {
      return undefined;
    }
    const stopTracking = trackPosition(anchor, panel, { width, layout });
    const stopOutside = onOutsidePointer(
      () => [refs.field.current, refs.panel.current],
      () => {
        closeRef.current();
      },
    );
    const stopBackdrop = onBackdropPointer(panel, () => {
      closeRef.current();
    });
    const stopEscape = onEscape(() => {
      closeRef.current();
      restoreFocus(refs.returnFocus.current);
    });

    return () => {
      stopTracking();
      stopOutside();
      stopBackdrop();
      stopEscape();
    };
  }, [open, width, layout]);

  useEffect(() => {
    if (open) {
      focusGrid();
    }
  }, [open]);
}
