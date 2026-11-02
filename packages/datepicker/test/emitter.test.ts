import { describe, expect, test, vi } from 'vitest';
import { createEmitter } from '../src/base';

describe('createEmitter', () => {
  test('a change that throws still tells listeners and runs queued callbacks', () => {
    const emitter = createEmitter(() => undefined);
    const listener = vi.fn();
    const callback = vi.fn();
    emitter.subscribe(listener);
    expect(() => {
      emitter.act(() => {
        emitter.after(callback);
        throw new Error('app bug');
      });
    }).toThrow('app bug');
    expect(listener).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });

  test('a listener that throws does not lose queued callbacks', () => {
    const emitter = createEmitter(() => undefined);
    const callback = vi.fn();
    emitter.subscribe(() => {
      throw new Error('listener bug');
    });
    expect(() => {
      emitter.act(() => {
        emitter.after(callback);
      });
    }).toThrow('listener bug');
    expect(callback).toHaveBeenCalledOnce();
  });
});
