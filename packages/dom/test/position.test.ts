// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  computePosition,
  placePopover,
  resolveLayout,
  supportsPopover,
  trackPosition,
} from '@nepdate/dom';

const viewport = { width: 1000, height: 800 };
const rect = (top: number, left: number, height = 36, width = 260) => ({
  top,
  left,
  bottom: top + height,
  right: left + width,
});

describe('computePosition (DOM-001)', () => {
  test('below the anchor, aligned to its start', () => {
    expect(computePosition(rect(100, 50), 300, viewport)).toEqual({
      top: 142,
      left: 50,
      width: 320,
      side: 'bottom',
    });
  });

  test('flips above when there is no room below but room above', () => {
    expect(computePosition(rect(700, 50), 300, viewport)).toMatchObject({
      top: 394,
      side: 'top',
    });
  });

  test('stays below when neither side fits but below is roomier', () => {
    expect(computePosition(rect(300, 50), 600, viewport).side).toBe('bottom');
  });

  test('top placements prefer above, and flip down when above is smaller', () => {
    expect(
      computePosition(rect(500, 50), 300, viewport, { placement: 'top-start' }).side,
    ).toBe('top');
    expect(
      computePosition(rect(100, 50), 300, viewport, { placement: 'top-end' }).side,
    ).toBe('bottom');
  });

  test('end alignment and clamping to the viewport', () => {
    expect(
      computePosition(rect(100, 600), 300, viewport, { placement: 'bottom-end' }).left,
    ).toBe(540);
    expect(computePosition(rect(100, 900), 300, viewport).left).toBe(1000 - 320 - 6);
    expect(
      computePosition(rect(-200, -50), 300, viewport, { placement: 'top-start' }),
    ).toMatchObject({
      top: 6,
      left: 6,
    });
  });

  test('the panel never runs off the bottom of the screen', () => {
    expect(computePosition(rect(1040, 6), 500, { width: 375, height: 812 }).top).toBe(
      306,
    );
    expect(computePosition(rect(100, 6), 900, { width: 375, height: 812 }).top).toBe(6);
  });

  test('the panel shrinks to fit a phone screen', () => {
    expect(
      computePosition(rect(100, 0), 300, { width: 320, height: 640 }, { gap: 8 }).width,
    ).toBe(304);
  });
});

describe('resolveLayout (PICK-007)', () => {
  test('auto picks the sheet below the breakpoint', () => {
    expect(resolveLayout(undefined, 375)).toBe('sheet');
    expect(resolveLayout('auto', 479)).toBe('sheet');
    expect(resolveLayout('auto', 480)).toBe('popover');
    expect(resolveLayout('auto', 700, 768)).toBe('sheet');
  });

  test('an explicit layout wins at any width', () => {
    expect(resolveLayout('popover', 320)).toBe('popover');
    expect(resolveLayout('sheet', 1400)).toBe('sheet');
  });
});

describe('placePopover and trackPosition (DOM-001, DOM-002)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  function setup() {
    const anchor = document.createElement('div');
    const panel = document.createElement('div');
    document.body.append(anchor, panel);
    const rectSpy = vi
      .spyOn(anchor, 'getBoundingClientRect')
      .mockReturnValue(DOMRect.fromRect({ x: 40, y: 100, width: 260, height: 36 }));
    Object.defineProperty(panel, 'offsetHeight', { value: 300, configurable: true });
    Object.assign(window, { innerWidth: 1000, innerHeight: 800 });
    return { anchor, panel, rectSpy };
  }

  test('positions the panel with fixed coordinates and marks the side', () => {
    const { anchor, panel } = setup();
    const hide = placePopover(anchor, panel);
    expect(panel.style.position).toBe('fixed');
    expect(panel.style.top).toBe('142px');
    expect(panel.style.left).toBe('40px');
    expect(panel.style.width).toBe('320px');
    expect(panel.dataset['side']).toBe('bottom');
    expect(() => {
      hide();
    }).not.toThrow();
  });

  test('uses the top layer when the browser supports popovers', () => {
    const { anchor, panel } = setup();
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    const hadPopover = 'showPopover' in proto;
    let open = false;
    const show = vi.fn(() => {
      open = true;
    });
    proto['showPopover'] = show;
    proto['hidePopover'] = () => {
      open = false;
    };
    vi.spyOn(panel, 'matches').mockImplementation(
      (selector) => selector === ':popover-open' && open,
    );
    try {
      expect(supportsPopover()).toBe(true);
      const hide = placePopover(anchor, panel);
      expect(panel.getAttribute('popover')).toBe('manual');
      expect(open).toBe(true);
      placePopover(anchor, panel); // already open: not shown twice
      expect(show).toHaveBeenCalledOnce();
      hide();
      expect(open).toBe(false);
      hide(); // already hidden
    } finally {
      if (!hadPopover) {
        delete proto['showPopover'];
        delete proto['hidePopover'];
      }
    }
  });

  test('a sheet drops the popover coordinates and marks the layout (PICK-007)', () => {
    const { anchor, panel } = setup();
    placePopover(anchor, panel);
    expect(panel.dataset['layout']).toBe('popover');
    placePopover(anchor, panel, { layout: 'sheet' });
    expect(panel.dataset['layout']).toBe('sheet');
    expect(panel.dataset['side']).toBeUndefined();
    expect(panel.style.position).toBe('fixed');
    expect(panel.style.top).toBe('');
    expect(panel.style.left).toBe('');
    expect(panel.style.width).toBe('');
  });

  test('auto switches layout when a resize crosses the breakpoint', () => {
    const { anchor, panel } = setup();
    const stop = trackPosition(anchor, panel);
    expect(panel.dataset['layout']).toBe('popover');
    Object.assign(window, { innerWidth: 375 });
    window.dispatchEvent(new Event('resize'));
    expect(panel.dataset['layout']).toBe('sheet');
    Object.assign(window, { innerWidth: 1000 });
    window.dispatchEvent(new Event('resize'));
    expect(panel.dataset['layout']).toBe('popover');
    expect(panel.style.top).toBe('142px');
    stop();
  });

  test('re-places on resize and scroll until stopped', () => {
    const { anchor, panel, rectSpy } = setup();
    const stop = trackPosition(anchor, panel);
    rectSpy.mockReturnValue(DOMRect.fromRect({ x: 40, y: 200, width: 260, height: 36 }));
    window.dispatchEvent(new Event('resize'));
    expect(panel.style.top).toBe('242px');
    rectSpy.mockReturnValue(DOMRect.fromRect({ x: 40, y: 150, width: 260, height: 36 }));
    document.body.dispatchEvent(new Event('scroll'));
    expect(panel.style.top).toBe('192px');
    stop();
    window.dispatchEvent(new Event('resize'));
    expect(panel.style.top).toBe('192px');
  });
});
