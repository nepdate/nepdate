// Runs in the plain Node environment: no window, no document.
import { describe, expect, test, vi } from 'vitest';
import {
  hasDom,
  onEscape,
  onOutsidePointer,
  placePopover,
  prefersReducedMotion,
  supportsPopover,
  trackPosition,
} from '@nepdate/dom';

describe('server rendering (SSR-safe)', () => {
  test('every helper is a no-op without a DOM', () => {
    expect(hasDom()).toBe(false);
    expect(supportsPopover()).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
    const fake = {} as HTMLElement;
    const callback = vi.fn();
    for (const cleanup of [
      placePopover(fake, fake),
      trackPosition(fake, fake),
      onOutsidePointer([], callback),
      onEscape(callback),
    ]) {
      expect(() => {
        cleanup();
      }).not.toThrow();
    }
    expect(callback).not.toHaveBeenCalled();
  });
});
