import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { buildTable, renderTable, type SourceTable } from '../gen-data.ts';

const source = JSON.parse(
  readFileSync(new URL('../../data/bikram-sambat.json', import.meta.url), 'utf8'),
) as SourceTable;

const months2082 = [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30];
const table = (years: Record<string, number[]>, verified = 2083): SourceTable => ({
  anchor: { bs_year: 2082, ad: '2025-04-14' },
  verified_through: verified,
  years,
});

describe('buildTable', () => {
  test('anchors 1 Baisakh 1970 BS to 1913-04-13 AD as a day count', () => {
    const built = buildTable(source);

    expect(built.firstYear).toBe(1970);
    expect(built.epochStart).toBe(Date.UTC(1913, 3, 13) / 86_400_000);
    expect(built.verifiedThrough).toBe(2083);
    expect(built.years).toHaveLength(130);
  });

  test('works out epochStart when the anchor is not the first year', () => {
    const built = buildTable({
      ...table({ 2081: months2082, 2082: months2082 }),
    });

    expect(built.epochStart).toBe(Date.UTC(2025, 3, 14) / 86_400_000 - 365);
  });

  test.each([
    ['eleven months', { 2082: months2082.slice(0, 11) }, /lists 11 months/],
    ['a 33-day month', { 2082: [33, ...months2082.slice(1)] }, /month 1 has 33 days/],
    [
      'a gap between years',
      { 2082: months2082, 2084: months2082 },
      /skips from 2082 to 2084/,
    ],
    ['a 364-day verified year', { 2082: [30, ...months2082.slice(1)] }, /has 364 days/],
  ])('rejects %s', (_name, years, message) => {
    expect(() => buildTable(table(years))).toThrow(message);
  });

  test('allows a 364-day year only after the verified year', () => {
    expect(() =>
      buildTable(table({ 2082: [30, ...months2082.slice(1)] }, 2081)),
    ).not.toThrow();
  });

  test('rejects an anchor outside the table', () => {
    expect(() =>
      buildTable({
        ...table({ 2082: months2082 }),
        anchor: { bs_year: 2090, ad: '2033-04-14' },
      }),
    ).toThrow(/anchor/);
  });
});

test('the committed years.ts matches the JSON', () => {
  const committed = readFileSync(
    new URL('../../packages/core/src/bs/data/years.ts', import.meta.url),
    'utf8',
  );

  expect(committed).toBe(renderTable(buildTable(source)));
});
