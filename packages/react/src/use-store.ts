import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

interface StoreLike<O, S> {
  getState(): S;
  subscribe(listener: () => void): () => void;
  setOptions(changes: Partial<O>): void;
}

/** useLayoutEffect in the browser, useEffect on the server (no warning). */
export const useIsomorphicLayoutEffect: typeof useEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Fn = (...args: never[]) => unknown;

/**
 * Create a store once and keep its options in step with props, without
 * loops: functions are wrapped once so their identity never changes, and data
 * options are compared by value, so inline objects and arrays are fine.
 */
export function useStore<O extends object, S, T extends StoreLike<O, S>>(
  create: (options: O) => T,
  options: O,
): { store: T; state: S } {
  const latest = useRef(options);
  latest.current = options;
  const wrappers = useRef(new Map<string, Fn>());

  const prepare = (input: O): O => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'function') {
        let wrapper = wrappers.current.get(key);
        if (!wrapper) {
          wrapper = (...args: never[]) =>
            ((latest.current as Record<string, unknown>)[key] as Fn | undefined)?.(
              ...args,
            );
          wrappers.current.set(key, wrapper);
        }
        out[key] = wrapper;
      } else {
        out[key] = value;
      }
    }

    return out as O;
  };

  const [store] = useState(() => create(prepare(options)));
  const previous = useRef<O>(prepare(options));

  useIsomorphicLayoutEffect(() => {
    const next = prepare(options) as Record<string, unknown>;
    const before = previous.current as Record<string, unknown>;
    const changes: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(before), ...Object.keys(next)])) {
      if (!deepEqual(before[key], next[key])) {
        changes[key] = next[key];
      }
    }
    previous.current = next as O;
    if (Object.keys(changes).length > 0) {
      store.setOptions(changes as Partial<O>);
    }
  });

  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );

  return { store, state };
}

/** Structural equality for plain data (dates, ranges, lists); identity for everything else. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => deepEqual(item, b[index]))
    );
  }
  if (
    Object.getPrototypeOf(a) !== Object.prototype ||
    Object.getPrototypeOf(b) !== Object.prototype
  ) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  return (
    keysA.length === keysB.length &&
    keysA.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}
