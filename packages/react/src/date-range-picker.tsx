import { useRef, type ReactElement } from 'react';
import {
  getLocale,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';
import type { HolidayInput, HolidayLookup } from '@nepdate/calendar';
import type { RangeDetail, RangePreset, RangeValue } from '@nepdate/datepicker';
import { restoreFocus } from '@nepdate/dom';
import { CalendarBody } from './calendar-body';
import { useDateRangePicker } from './hooks';
import { Icon } from './icons';
import { usePanel } from './panel';
import { PANEL_WIDTH, PANEL_WIDTH_WITH_PRESETS, PanelBody } from './presets';

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
  /** Shortcuts beside the calendar: 'last7Days', 'thisMonth', 'thisFiscalYear', … or { id, label, resolve }. */
  presets?: readonly RangePreset[] | undefined;
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
  /** Show a "Fiscal year" button that switches the panel to fiscal-year tiles. */
  fiscalYearView?: boolean | undefined;
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
  fiscalYearView = false,
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
    state.presets.length > 0 ? PANEL_WIDTH_WITH_PRESETS : PANEL_WIDTH,
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
          <PanelBody
            presets={state.presets}
            label={labels.labels.presets}
            onPreset={(id) => {
              if (store.actions.applyPreset(id) && !store.getState().open) {
                restoreFocus(start.current);
              }
            }}
          >
            <CalendarBody bindings={calendar} />
          </PanelBody>
          {(state.canSwitchCalendar || fiscalYearView) && (
            <div className="ndp-panel__footer">
              {state.canSwitchCalendar ? (
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
              ) : (
                <span />
              )}
              {fiscalYearView && (
                <button
                  type="button"
                  className="ndp-button"
                  aria-pressed={state.calendarState.view === 'fiscal'}
                  onClick={() => {
                    store.calendar.actions.setView(
                      state.calendarState.view === 'fiscal' ? 'day' : 'fiscal',
                    );
                    calendar.focusGrid();
                  }}
                >
                  {labels.labels.fiscalYear}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
