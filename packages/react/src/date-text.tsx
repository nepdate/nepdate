import type { ReactElement } from 'react';
import {
  formatDate,
  fromIsoDate,
  fromIsoTimestamp,
  toCalendar,
  type CalendarSystem,
  type DateFormatPattern,
  type LocaleCode,
} from '@nepdate/core';

export interface DateTextProps {
  /** An AD date or timestamp from the server ("2026-09-26" or an ISO timestamp). */
  value: string | null | undefined;
  /** Which calendar to show first. Default 'BS'. */
  calendar?: CalendarSystem | undefined;
  /** Also show the day in the other calendar, muted. Default true. */
  withEquivalent?: boolean | undefined;
  format?: DateFormatPattern | undefined;
  locale?: LocaleCode | undefined;
  fallback?: string | undefined;
  className?: string | undefined;
}

/**
 * A server date shown in BS (or AD), with the other calendar alongside:
 * "10 Ashwin 2083 · 26 Sep 2026". No hooks, so it works in server components.
 */
export function DateText({
  value,
  calendar = 'BS',
  withEquivalent = true,
  format = 'long',
  locale = 'en',
  fallback = '—',
  className,
}: DateTextProps): ReactElement {
  const date = fromIsoDate(value);
  if (!date) {
    return <span className={className}>{fallback}</span>;
  }
  const other: CalendarSystem = calendar === 'BS' ? 'AD' : 'BS';

  return (
    <time dateTime={formatDate(date, 'Y-m-d')} className={className}>
      {formatDate(toCalendar(date, calendar), format, locale)}
      {withEquivalent && (
        <span className="ndp-muted" style={{ color: 'var(--ndp-text-muted, #64748b)' }}>
          {' · '}
          {formatDate(toCalendar(date, other), other === 'AD' ? 'j M Y' : format, locale)}
        </span>
      )}
    </time>
  );
}

/**
 * A server date as short text: "12 Ashwin 2083", keeping the time of day when
 * the value has one. A timestamp with a zone is read in the configured zone
 * (Nepal by default). Anything that is not a date is returned unchanged.
 */
export function shortDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const instant = fromIsoTimestamp(value);
  const date = instant?.date ?? fromIsoDate(value);
  if (!date) {
    return value;
  }
  const time = instant?.time ?? /[T ](\d{2}:\d{2})/.exec(value)?.[1];

  return `${formatDate(toCalendar(date, 'BS'), 'j F Y')}${time ? `, ${time}` : ''}`;
}

/** A server date as documents print it, in both calendars: "31 Shrawan 2083 (16 Aug 2026)". */
export function bothDates(value: string | null | undefined): string {
  const date = fromIsoDate(value);

  return date
    ? `${formatDate(toCalendar(date, 'BS'), 'j F Y')} (${formatDate(date, 'j M Y')})`
    : (value ?? '');
}

/** A server date for a table cell or list row, with the AD day on hover. */
export function ShortDate({
  value,
  fallback = '—',
  className,
}: {
  value: string | null | undefined;
  fallback?: string | undefined;
  className?: string | undefined;
}): ReactElement {
  const text = shortDate(value);
  const date = fromIsoDate(value);
  if (!text) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <time
      dateTime={value ?? undefined}
      title={date ? formatDate(date, 'j M Y') : undefined}
      className={className}
    >
      {text}
    </time>
  );
}
