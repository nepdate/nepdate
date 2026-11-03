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
  readonly actions?: object;
}

/** Function options whose answers decide how the calendar's days look. */
const DAY_FUNCTIONS = ['isDateDisabled', 'holidays', 'events'] as const;

interface DayAnswers {
  /** The days on screen; moving to another month isn't a change of answers. */
  readonly days: string;
  readonly answers: string;
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
  const dayAnswers = useRef<DayAnswers | null>(null);
  const storeValue = useRef(valueOf(store.getState()));

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

    // An inline function is wrapped once, so it never looks changed above. Ask it
    // about the days on screen instead, and redraw only if an answer is different.
    const current = askDayFunctions(options, store.getState());
    const asked = dayAnswers.current;
    dayAnswers.current = current;
    if (asked?.days === current?.days && asked?.answers !== current?.answers) {
      for (const key of DAY_FUNCTIONS) {
        if (key in next) {
          changes[key] = next[key];
        }
      }
    }
    if (Object.keys(changes).length > 0) {
      store.setOptions(changes as Partial<O>);
    }

    // A controlled picker shows what its parent holds. If the person entered a
    // date and the parent kept its value, put that value back.
    const value = valueOf(store.getState());
    const changedByUser = !deepEqual(value, storeValue.current) && !('value' in changes);
    storeValue.current = value;
    const held = next['value'];
    if (
      changedByUser &&
      held !== undefined &&
      isChosen(value) &&
      !deepEqual(value, held)
    ) {
      (store.actions as { setValue?: (value: unknown) => void } | undefined)?.setValue?.(
        held,
      );
      storeValue.current = valueOf(store.getState());
    }
  });

  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );

  return { store, state };
}

function valueOf(state: unknown): unknown {
  return (state as { value?: unknown }).value;
}

/** A finished value: not empty, half typed, or a range with one end still to pick. */
function isChosen(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every((part) => part !== '');
  }

  return value !== '' && value !== undefined;
}

/** What the day functions say about the days on screen, or null when there are none. */
function askDayFunctions(options: object, state: unknown): DayAnswers | null {
  const given = DAY_FUNCTIONS.flatMap((key) => {
    const option = (options as Record<string, unknown>)[key];

    return typeof option === 'function' ? [option as (date: unknown) => unknown] : [];
  });
  if (given.length === 0) {
    return null;
  }
  const { weeks, calendarState } = state as {
    weeks?: readonly (readonly ({ date: unknown } | null)[])[];
    calendarState?: { weeks: readonly (readonly ({ date: unknown } | null)[])[] };
  };
  const dates = (weeks ?? calendarState?.weeks ?? [])
    .flat()
    .flatMap((cell) => (cell ? [cell.date] : []));

  return {
    days: JSON.stringify(dates),
    answers: JSON.stringify(dates.map((date) => given.map((ask) => ask(date)))),
  };
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
