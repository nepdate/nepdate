import { describe, expect, test } from 'vitest';
import { deepEqual } from '@nepdate/react/headless';

describe('deepEqual (option syncing)', () => {
  test('compares plain data by value and everything else by identity', () => {
    const fn = (): void => undefined;
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
    expect(deepEqual([1], { 0: 1 })).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual(fn, fn)).toBe(true);
    expect(
      deepEqual(
        () => 1,
        () => 1,
      ),
    ).toBe(false);
    expect(deepEqual(new Map(), new Map())).toBe(false);
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
  });
});
