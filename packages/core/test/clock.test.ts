import { afterEach, describe, expect, test, vi } from 'vitest';
import { configure, fiscalYear, fromJsDate, resetConfig, today } from '@nepdate/core';
import { ymd } from './helpers';

afterEach(() => {
  vi.useRealTimers();
  resetConfig();
});

describe('a moment converts by its calendar day in a time zone (TEST-007)', () => {
  const lateUtc = new Date('2026-04-13T20:00:00Z');

  test('Kathmandu (default) is already 1 Baisakh 2083; UTC is still 30 Chaitra 2082', () => {
    expect(ymd(fromJsDate(lateUtc))).toBe('2026-04-14');
    expect(ymd(fromJsDate(lateUtc, 'UTC'))).toBe('2026-04-13');
  });

  test('fiscal year follows the Nepal day', () => {
    expect(fiscalYear(fromJsDate(new Date('2026-07-16T18:30:00Z'))).label).toBe(
      '2083/84',
    );
    expect(fiscalYear(fromJsDate(new Date('2026-07-16T18:00:00Z'))).label).toBe(
      '2082/83',
    );
  });

  test('BC instants map to astronomical years (1 BC = year 0)', () => {
    const instant = new Date(Date.UTC(0, 5, 1));
    instant.setUTCFullYear(0);
    expect(fromJsDate(instant, 'UTC').year).toBe(0);
  });

  test('rejects an invalid Date and an unknown time zone', () => {
    expect(() => fromJsDate(new Date('nope'))).toThrow(/invalid/);
    expect(() => fromJsDate(lateUtc, 'Mars/Olympus')).toThrow(/not a time zone/);
  });
});

describe('today (CORE-047)', () => {
  test('uses the configured zone, in either calendar', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T20:00:00Z'));

    expect(ymd(today())).toBe('2026-04-14');
    expect(ymd(today('BS'))).toBe('2083-01-01');
    expect(ymd(today('BS', 'UTC'))).toBe('2082-12-30');

    configure({ timeZone: 'UTC' });
    expect(ymd(today('AD'))).toBe('2026-04-13');
  });
});
