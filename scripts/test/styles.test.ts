import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const read = (file: string): string =>
  readFileSync(new URL(`../../packages/styles/${file}`, import.meta.url), 'utf8');

const tokens = read('tokens.css');
const picker = read('picker.css');

/** The custom properties declared inside the first block whose selector contains `marker`. */
function declared(css: string, marker: string): Map<string, string> {
  const start = css.indexOf(marker);
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
  const body = css.slice(open + 1, end);
  const inner =
    body.lastIndexOf('{') === -1 ? body : body.slice(body.lastIndexOf('{') + 1);

  return new Map(
    [...inner.matchAll(/(--ndp-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [
      m[1] ?? '',
      (m[2] ?? '').trim(),
    ]),
  );
}

const light = declared(tokens, ':root,');
const dark = declared(tokens, "[data-ndp-theme='dark']");
const systemDark = declared(tokens, '@media (prefers-color-scheme: dark)');

describe('@nepdate/styles tokens (STY-001..004)', () => {
  test('every token picker.css uses without a fallback is defined', () => {
    const used = new Set(
      [...picker.matchAll(/var\((--ndp-[\w-]+)\)/g)].map((m) => m[1] ?? ''),
    );
    const missing = [...used].filter((name) => !light.has(name));
    expect(missing).toEqual([]);
  });

  test('both dark sets define the same values', () => {
    expect([...systemDark]).toEqual([...dark]);
  });

  test('dark mode overrides every colour and shadow token', () => {
    const themed = [...light.keys()].filter((name) =>
      /^--ndp-(bg|border|text|focus|shadow)-/.test(name),
    );
    expect(themed.filter((name) => !dark.has(name))).toEqual([]);
    expect(themed.length).toBeGreaterThan(20);
  });

  test('light values match the Figma kit', () => {
    expect(
      Object.fromEntries(
        [...light].filter(([name]) => /accent$|holiday$|surface$/.test(name)),
      ),
    ).toEqual({
      '--ndp-bg-surface': '#ffffff',
      '--ndp-bg-accent': '#2563eb',
      '--ndp-border-accent': '#2563eb',
      '--ndp-text-accent': '#2563eb',
      '--ndp-text-on-accent': '#ffffff',
      '--ndp-text-holiday': '#dc2626',
    });
    expect(light.get('--ndp-day-size')).toBe('44px');
    expect(light.get('--ndp-input-height')).toBe('40px');
    expect(light.get('--ndp-option-height')).toBe('48px');
    expect(light.get('--ndp-radius-md')).toBe('8px');
  });

  test('index.css loads tokens then components', () => {
    expect(read('index.css').trim().split('\n')).toEqual([
      "@import './tokens.css';",
      "@import './picker.css';",
    ]);
  });
});
