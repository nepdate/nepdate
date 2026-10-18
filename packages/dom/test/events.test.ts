// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  focusFirst,
  hasDom,
  onEscape,
  onOutsidePointer,
  prefersReducedMotion,
  restoreFocus,
} from '@nepdate/dom';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const pointerDown = (target: EventTarget): void => {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
};

describe('onOutsidePointer (DOM-003)', () => {
  test('fires only for pointers outside every element', () => {
    const input = document.createElement('div');
    const panel = document.createElement('div');
    const button = document.createElement('button');
    panel.append(button);
    const elsewhere = document.createElement('p');
    document.body.append(input, panel, elsewhere);
    const callback = vi.fn();
    const stop = onOutsidePointer([input, panel, null], callback);

    pointerDown(button);
    pointerDown(input);
    expect(callback).not.toHaveBeenCalled();
    pointerDown(elsewhere);
    expect(callback).toHaveBeenCalledOnce();

    stop();
    pointerDown(elsewhere);
    expect(callback).toHaveBeenCalledOnce();
  });

  test('accepts a function so late-mounted elements count', () => {
    let panel: HTMLElement | null = null;
    const callback = vi.fn();
    onOutsidePointer(() => [panel], callback);
    panel = document.createElement('div');
    document.body.append(panel);
    pointerDown(panel);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('onEscape (DOM-004)', () => {
  test('consumes Escape before bubbling listeners see it', () => {
    const callback = vi.fn();
    const outer = vi.fn();
    window.addEventListener('keydown', outer);
    const stop = onEscape(callback);
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);
    expect(callback).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    expect(outer).not.toHaveBeenCalled();

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(callback).toHaveBeenCalledOnce();
    stop();
    window.removeEventListener('keydown', outer);
  });

  test('can let the event through', () => {
    const callback = vi.fn();
    const stop = onEscape(callback, { capture: false, stop: false });
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    expect(callback).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(false);
    stop();
  });
});

describe('focus and environment helpers (DOM-005..007)', () => {
  test('focusFirst focuses the roving-tabindex element; restoreFocus returns', () => {
    const grid = document.createElement('div');
    grid.innerHTML = '<button tabindex="-1">1</button><button tabindex="0">2</button>';
    const input = document.createElement('input');
    document.body.append(input, grid);

    expect(focusFirst(grid)).toBe(true);
    expect(document.activeElement?.textContent).toBe('2');
    expect(focusFirst(grid, '.missing')).toBe(false);
    expect(focusFirst(null)).toBe(false);
    restoreFocus(input);
    expect(document.activeElement).toBe(input);
    expect(() => {
      restoreFocus(null);
    }).not.toThrow();
  });

  test('environment checks', () => {
    expect(hasDom()).toBe(true);
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(true);
  });
});
