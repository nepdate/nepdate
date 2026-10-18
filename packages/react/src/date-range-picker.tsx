import { useRef, type ReactElement } from 'react';
import {
  getLocale,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';
import type { HolidayInput, HolidayLookup } from '@nepdate/calendar';
import type { RangeDetail, RangeValue } from '@nepdate/datepicker';
import { CalendarBody } from './calendar-body';
import { useDateRangePicker } from './hooks';
import { Icon } from './icons';
import { usePanel } from './panel';

export interface DateRangePickerProps {
  value?: RangeValue | undefined;
  defaultValue?: RangeValue | undefined;
  onChange?: ((value: RangeValue, detail: RangeDetail) => void) | undefined;
  calendar?: CalendarSystem | undefined;
  defaultCalendar?: CalendarSystem | undefined;
  min?: string | undefined;
  max?: string | undefined;
  minDays?: number | undefined;
  maxDays?: number | undefined;
  isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
  holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  locale?: LocaleCode | undefined;
  weekStartsOn?: Weekday | undefined;
  weekendDays?: readonly Weekday[] | undefined;
  showOtherCalendar?: boolean | undefined;
  today?: CalendarDate | undefined;
  /** Field names for plain form posts. */
  startName?: string | undefined;
  endName?: string | undefined;
  startLabel?: string | undefined;
  endLabel?: string | undefined;
  disabled?: boolean | undefined;
  theme?: 'light' | 'dark' | 'auto' | undefined;
  className?: string | undefined;
}

/** Two BS/AD date fields sharing one calendar panel in range mode. */
export function DateRangePicker({
  startName,
  endName,
  startLabel,
  endLabel,
  disabled = false,
  theme,
  className,
  ...options
}: DateRangePickerProps): ReactElement {
  const picker = useDateRangePicker(options);
  const { state, store, calendar } = picker;
  const labels = getLocale(options.locale);
  const field = useRef<HTMLDivElement | null>(null);
  const row = useRef<HTMLDivElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const start = useRef<HTMLInputElement | null>(null);

  usePanel(
    state.open,
    { anchor: row, panel, field, returnFocus: start },
    () => {
      store.actions.close();
    },
    calendar.focusGrid,
  );

  const invalid = (which: 'start' | 'end'): boolean =>
    state.error !== null &&
    (state.error.field === which || state.error.field === 'range');

  return (
    <div
      ref={field}
      className={className ? `ndp-field ${className}` : 'ndp-field'}
      data-ndp-theme={theme}
    >
      <div ref={row} className="ndp-range">
        <div
          className="ndp-input"
          data-invalid={invalid('start') || undefined}
          data-disabled={disabled || undefined}
        >
          <input
            ref={start}
            className="ndp-input__control"
            {...picker.getInputProps('start')}
            aria-label={startLabel}
            disabled={disabled}
          />
        </div>
        <span className="ndp-range__separator" aria-hidden="true">
          →
        </span>
        <div
          className="ndp-input"
          data-invalid={invalid('end') || undefined}
          data-disabled={disabled || undefined}
        >
          <input
            className="ndp-input__control"
            {...picker.getInputProps('end')}
            aria-label={endLabel}
            disabled={disabled}
          />
          <span className="ndp-input__actions">
            <button
              className="ndp-icon-button"
              disabled={disabled}
              {...picker.getToggleProps()}
            >
              <Icon name="calendar" />
            </button>
          </span>
        </div>
      </div>
      {state.error && (
        <p id={picker.ids.hint} className="ndp-hint" data-error aria-live="polite">
          {state.error.message}
        </p>
      )}
      {startName !== undefined && (
        <input
          type="hidden"
          name={startName}
          value={state.value.start}
          disabled={disabled}
        />
      )}
      {endName !== undefined && (
        <input type="hidden" name={endName} value={state.value.end} disabled={disabled} />
      )}
      {state.open && (
        <div
          ref={panel}
          className="ndp-panel"
          popover="manual"
          data-ndp-theme={theme}
          {...picker.getPanelProps()}
        >
          <CalendarBody bindings={calendar} />
          {state.canSwitchCalendar && (
            <div className="ndp-panel__footer">
              <div
                className="ndp-segment"
                role="group"
                aria-label={labels.labels.calendar}
              >
                {(['BS', 'AD'] as const).map((option) => (
                  <button
                    key={option}
                    className="ndp-segment__item"
                    {...picker.getCalendarOptionProps(option)}
                  >
                    {labels.calendarNames[option]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
