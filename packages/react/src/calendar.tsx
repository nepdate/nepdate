import type { ReactElement } from 'react';
import type { CalendarDate } from '@nepdate/core';
import type { CalendarOptions, CalendarSelection } from '@nepdate/calendar';
import { CalendarBody } from './calendar-body';
import { useCalendar } from './hooks';

export interface CalendarProps extends Omit<
  CalendarOptions,
  'onSelect' | 'visibleMonth' | 'onVisibleMonthChange'
> {
  /** Show this month (any day in it); pair with onMonthChange to control it. */
  month?: CalendarDate | undefined;
  onMonthChange?: ((month: CalendarDate) => void) | undefined;
  onSelect?: ((selection: CalendarSelection) => void) | undefined;
  className?: string | undefined;
  theme?: 'light' | 'dark' | 'auto' | undefined;
}

/** A standalone BS/AD month view with keyboard support. */
export function Calendar({
  month,
  onMonthChange,
  className,
  theme,
  ...options
}: CalendarProps): ReactElement {
  const bindings = useCalendar({
    ...options,
    visibleMonth: month,
    onVisibleMonthChange: onMonthChange,
  });

  return <CalendarBody bindings={bindings} className={className} theme={theme} />;
}
