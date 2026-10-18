import { describe, expect, test } from 'vitest';
import {
  adDate,
  bsDate,
  compareTimes,
  formatTime,
  fromIsoDateTime,
  isValidTime,
  parseTime,
  timeOfDay,
  toIsoDateTime,
} from '@nepdate/core';
import { ymd } from './helpers';

describe('time of day (TIME-001)', () => {
  test.each([
    ['14:30', 14, 30],
    ['9:05', 9, 5],
    ['09.05', 9, 5],
    ['1430', 14, 30],
    ['14', 14, 0],
    ['2:30 pm', 14, 30],
    ['2 PM', 14, 0],
    ['12 am', 0, 0],
    ['12:15 p.m.', 12, 15],
    ['१४:३०', 14, 30],
    ['२:३० अपराह्न', 14, 30],
    ['११ पूर्वाह्न', 11, 0],
  ])('parseTime(%s)', (text, hour, minute) => {
    expect(parseTime(text)).toEqual({ hour, minute });
  });

  test.each(['24:00', '13 pm', '0 am', '9:5', 'noon', '', null, '12:60'])(
    'parseTime(%s) is null',
    (text) => {
      expect(parseTime(text)).toBeNull();
    },
  );

  test('formatTime in 24 and 12 hours, in both locales', () => {
    expect(formatTime(timeOfDay(14, 5))).toBe('14:05');
    expect(formatTime(timeOfDay(14, 5), { hour12: true })).toBe('2:05 PM');
    expect(formatTime(timeOfDay(0, 0), { hour12: true })).toBe('12:00 AM');
    expect(formatTime(timeOfDay(12, 30), { hour12: true })).toBe('12:30 PM');
    expect(formatTime(timeOfDay(9, 0), { locale: 'ne' })).toBe('०९:००');
    expect(formatTime(timeOfDay(21, 15), { hour12: true, locale: 'ne' })).toBe(
      '९:१५ अपराह्न',
    );
  });

  test('validation and comparison', () => {
    expect(() => timeOfDay(24, 0)).toThrow(
      expect.objectContaining({ code: 'INVALID_ARGUMENT' }),
    );
    expect(isValidTime(23, 59)).toBe(true);
    expect(isValidTime(1.5, 0)).toBe(false);
    expect(compareTimes(timeOfDay(9), timeOfDay(10))).toBe(-1);
    expect(compareTimes(timeOfDay(9, 30), timeOfDay(9, 30))).toBe(0);
    expect(Object.isFrozen(timeOfDay(1, 2))).toBe(true);
  });
});

describe('date + time as an ISO instant', () => {
  test('Nepal time by default, from either calendar', () => {
    expect(toIsoDateTime(bsDate(2083, 7, 1), timeOfDay(14, 30))).toBe(
      '2026-10-18T14:30:00+05:45',
    );
    expect(toIsoDateTime(adDate(2026, 10, 18), timeOfDay(0, 0), 'UTC')).toBe(
      '2026-10-18T00:00:00+00:00',
    );
  });

  test('zones with daylight saving get the offset for that day', () => {
    expect(toIsoDateTime(adDate(2026, 7, 1), timeOfDay(14, 30), 'America/New_York')).toBe(
      '2026-07-01T14:30:00-04:00',
    );
    expect(
      toIsoDateTime(adDate(2026, 1, 15), timeOfDay(14, 30), 'America/New_York'),
    ).toBe('2026-01-15T14:30:00-05:00');
  });

  test('rejects years ISO cannot write and unknown zones', () => {
    expect(() => toIsoDateTime(adDate(10_000, 1, 1), timeOfDay(0))).toThrow(/ISO form/);
    expect(() => toIsoDateTime(adDate(2026, 1, 1), timeOfDay(0), 'Mars/Base')).toThrow(
      /time zone/,
    );
  });

  test('fromIsoDateTime reads zoned instants and local wall times', () => {
    const zoned = fromIsoDateTime('2026-04-13T20:00:00Z');
    expect(zoned && ymd(zoned.date)).toBe('2026-04-14');
    expect(zoned?.time).toEqual({ hour: 1, minute: 45 });
    const local = fromIsoDateTime('2026-10-18T14:30');
    expect(local && ymd(local.date)).toBe('2026-10-18');
    expect(local?.time).toEqual({ hour: 14, minute: 30 });
    expect(fromIsoDateTime('2026-10-18T14:30:15.250')?.time).toEqual({
      hour: 14,
      minute: 30,
    });
    for (const bad of [
      '2026-10-18',
      '2026-02-30T10:00',
      '2026-10-18T25:00',
      null,
      'soon',
    ]) {
      expect(fromIsoDateTime(bad)).toBeNull();
    }
  });

  test('round trip through the ISO form', () => {
    const iso = toIsoDateTime(bsDate(2083, 6, 24), timeOfDay(9, 15));
    const back = fromIsoDateTime(iso);
    expect(back && ymd(back.date)).toBe('2026-10-10');
    expect(back?.time).toEqual({ hour: 9, minute: 15 });
  });
});
