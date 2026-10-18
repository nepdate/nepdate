import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { checkBoundaries } from '../check-boundaries.ts';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

describe('checkBoundaries', () => {
  test('the real repo has no violations', () => {
    expect(checkBoundaries(fileURLToPath(new URL('../..', import.meta.url)))).toEqual([]);
  });

  test('allowed imports, relative imports and src/node built-ins pass', () => {
    expect(checkBoundaries(fixture('good'))).toEqual([]);
  });

  test('reports every kind of violation', () => {
    const messages = checkBoundaries(fixture('bad')).map((v) => `${v.pkg}: ${v.message}`);

    expect(messages).toEqual([
      'calendar: "@nepdate/core" is imported but @nepdate/core is not in package.json.',
      'calendar: @nepdate/calendar may not import "left-pad".',
      'calendar: relative import "../../core/src/index" leaves packages/calendar/src.',
      'core: @nepdate/core must not depend on any package, but lists: left-pad.',
      'core: @nepdate/core may not depend on left-pad.',
      'core: @nepdate/core may not import "@nepdate/calendar".',
      'core: Node built-in "node:fs" is only allowed under src/node/ (the package must also run in browsers).',
      'core: Node built-in "fs" is only allowed under src/node/ (the package must also run in browsers).',
      'stray: packages/stray is not listed in boundaries.json.',
    ]);
  });
});
