import { useEffect, useRef, type ReactElement } from 'react';
import { getLocale, type LocaleCode } from '@nepdate/core';
import type { TimeCell } from '@nepdate/datepicker';

/** Hour and minute columns (Figma "Time Item"); the selected items scroll into view. */
export function TimeColumns({
  hours,
  minutes,
  locale,
  onHour,
  onMinute,
}: {
  hours: readonly TimeCell[];
  minutes: readonly TimeCell[];
  locale?: LocaleCode | undefined;
  onHour: (hour: number) => void;
  onMinute: (minute: number) => void;
}): ReactElement {
  const root = useRef<HTMLDivElement | null>(null);
  const labels = getLocale(locale).labels;

  useEffect(() => {
    for (const item of root.current?.querySelectorAll<HTMLElement>(
      '[aria-pressed="true"]',
    ) ?? []) {
      if (typeof item.scrollIntoView === 'function') {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, []);

  const column = (
    label: string,
    cells: readonly TimeCell[],
    pick: (value: number) => void,
  ): ReactElement => (
    <div className="ndp-time__column" role="group" aria-label={label}>
      {cells.map((cell) => (
        <button
          key={cell.value}
          type="button"
          className="ndp-time-item"
          aria-pressed={cell.isSelected}
          onClick={() => {
            pick(cell.value);
          }}
        >
          {cell.label}
        </button>
      ))}
    </div>
  );

  return (
    <div ref={root} className="ndp-time" role="group" aria-label={labels.time}>
      {column(labels.hour, hours, onHour)}
      {column(labels.minute, minutes, onMinute)}
    </div>
  );
}
