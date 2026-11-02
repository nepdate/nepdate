import type { CalendarSystem, LocaleData } from '@nepdatejs/core';
import {
  onBackdropPointer,
  onEscape,
  onOutsidePointer,
  restoreFocus,
  trackPosition,
  type PanelLayout,
} from '@nepdatejs/dom';
import { setAttrs, setText } from './dom';

interface OpenPanel {
  readonly panel: HTMLElement;
  readonly anchor: Element;
  /** A pointer down outside these closes the panel. */
  readonly inside: readonly Element[];
  readonly width: number;
  readonly layout: PanelLayout | undefined;
  readonly close: () => void;
  /** Gets focus back after Escape. */
  readonly returnFocus: HTMLElement;
}

/** Show a panel beside its anchor, and close it the usual ways. Returns the way to undo that. */
export function openPanel(options: OpenPanel): () => void {
  const { panel, close } = options;
  panel.hidden = false;
  const stopTracking = trackPosition(options.anchor, panel, {
    width: options.width,
    layout: options.layout,
  });
  const stopOutside = onOutsidePointer(options.inside, close);
  const stopBackdrop = onBackdropPointer(panel, close);
  const stopEscape = onEscape(() => {
    close();
    restoreFocus(options.returnFocus);
  });

  return () => {
    stopTracking();
    stopOutside();
    stopBackdrop();
    stopEscape();
    panel.hidden = true;
  };
}

/** The BS/AD buttons in a panel's footer. */
export function renderSegment(
  segment: HTMLElement,
  state: { readonly canSwitchCalendar: boolean; readonly calendar: CalendarSystem },
  locale: LocaleData,
): void {
  segment.hidden = !state.canSwitchCalendar;
  setAttrs(segment, { 'aria-label': locale.labels.calendar });
  for (const button of segment.querySelectorAll<HTMLButtonElement>('button')) {
    const calendar = button.dataset['calendar'] === 'AD' ? 'AD' : 'BS';
    setText(button, locale.calendarNames[calendar]);
    setAttrs(button, { 'aria-pressed': String(calendar === state.calendar) });
  }
}
