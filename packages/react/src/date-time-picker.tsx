import { useRef, type CSSProperties, type ReactElement } from 'react';
import {
  getLocale,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';
import type { HolidayInput, HolidayLookup } from '@nepdate/calendar';
import type { DateTimeDetail, SinglePreset } from '@nepdate/datepicker';
import { CalendarBody } from './calendar-body';
import { popupProps, useDateTimePicker } from './hooks';
import { Icon } from './icons';
import { usePanel } from './panel';
import type { PanelLayout } from '@nepdate/dom';
import {
  PANEL_WIDTH,
  PANEL_WIDTH_WITH_PRESETS,
  PanelBody,
  TIME_COLUMNS_WIDTH,
} from './presets';
import { TimeColumns } from './time-columns';

export interface DateTimePickerProps {
  /** ISO timestamp with offset ("2026-10-18T14:30:00+05:45") or "". */
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string, detail: DateTimeDetail | null) => void) | undefined;
  /** The zone the picker shows and the value's offset. Default Asia/Kathmandu (core config). */
  timeZone?: string | undefined;
  hour12?: boolean | undefined;
  /** Minutes in the column (1–30). Default 5. */
  minuteStep?: number | undefined;
  /** Time used when a day is picked first. Default "00:00". */
  defaultTime?: string | undefined;
  calendar?: CalendarSystem | undefined;
  defaultCalendar?: CalendarSystem | undefined;
  /** Earliest and latest days, AD "YYYY-MM-DD". */
  min?: string | undefined;
  max?: string | undefined;
  isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
  holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  presets?: readonly SinglePreset[] | undefined;
  locale?: LocaleCode | undefined;
  weekStartsOn?: Weekday | undefined;
  today?: CalendarDate | undefined;
  /** Submit the ISO value with a plain form. */
  name?: string | undefined;
  id?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Add the dashes of YYYY-MM-DD while the user types digits. Default true. */
  mask?: boolean | undefined;
  /** Show the calendar in the page, always open, instead of in a popover. */
  inline?: boolean | undefined;
  /** 'sheet' opens a bottom sheet; 'popover' sits beside the field; 'auto' (default) uses the sheet below 480px. */
  panelLayout?: PanelLayout | undefined;
  theme?: 'light' | 'dark' | 'auto' | undefined;
  className?: string | undefined;
  /** Accessible names for the two inputs. */
  'aria-label'?: string | undefined;
  timeLabel?: string | undefined;
}

/** A BS/AD date and time field. The value is one instant, with the zone's offset. */
export function DateTimePicker({
  name,
  required,
  disabled = false,
  panelLayout,
  theme,
  className,
  'aria-label': ariaLabel,
  timeLabel,
  ...options
}: DateTimePickerProps): ReactElement {
  const picker = useDateTimePicker(options);
  const { state, store, calendar, ids } = picker;
  const labels = getLocale(options.locale);
  const field = useRef<HTMLDivElement | null>(null);
  const row = useRef<HTMLDivElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const dateInput = useRef<HTMLInputElement | null>(null);

  const panelWidth =
    (state.presets.length > 0 ? PANEL_WIDTH_WITH_PRESETS : PANEL_WIDTH) +
    TIME_COLUMNS_WIDTH;
  usePanel(
    state.open && !state.inline,
    { anchor: row, panel, field, returnFocus: dateInput },
    () => {
      store.actions.close();
    },
    calendar.focusGrid,
    panelWidth,
    panelLayout,
  );

  const hint = state.error?.message ?? state.equivalentText;
  const invalid = (which: 'date' | 'time'): boolean => state.error?.field === which;

  return (
    <div
      ref={field}
      className={className ? `ndp-field ${className}` : 'ndp-field'}
      data-ndp-theme={theme}
    >
      <div ref={row} className="ndp-datetime">
        <div
          className="ndp-input"
          data-invalid={invalid('date') || undefined}
          data-disabled={disabled || undefined}
        >
          <input
            ref={dateInput}
            id={ids.date}
            className="ndp-input__control"
            {...popupProps(state)}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={state.dateText}
            placeholder={state.placeholder}
            aria-label={ariaLabel}
            aria-controls={ids.panel}
            aria-invalid={invalid('date') || undefined}
            aria-describedby={hint ? ids.hint : undefined}
            required={required}
            disabled={disabled}
            onChange={(event) => {
              store.actions.typeDate(event.target.value);
            }}
            onBlur={() => {
              store.actions.blurDate();
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && (event.altKey || state.dateText === '')) {
                event.preventDefault();
                store.actions.open();
              }
            }}
          />
          {!state.inline && (
            <span className="ndp-input__actions">
              <button
                type="button"
                className="ndp-icon-button"
                disabled={disabled}
                aria-label={labels.labels.openCalendar}
                aria-expanded={state.open}
                aria-controls={ids.panel}
                onClick={() => {
                  store.actions.toggle();
                }}
              >
                <Icon name="calendar" />
              </button>
            </span>
          )}
        </div>
        <div
          className="ndp-input ndp-input--time"
          data-invalid={invalid('time') || undefined}
          data-disabled={disabled || undefined}
        >
          <input
            id={ids.time}
            className="ndp-input__control"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={state.timeText}
            placeholder={state.timePlaceholder}
            aria-label={timeLabel ?? labels.labels.time}
            aria-invalid={invalid('time') || undefined}
            aria-describedby={hint ? ids.hint : undefined}
            disabled={disabled}
            onChange={(event) => {
              store.actions.typeTime(event.target.value);
            }}
            onBlur={() => {
              store.actions.blurTime();
            }}
          />
        </div>
      </div>
      {hint !== null && (
        <p
          id={ids.hint}
          className="ndp-hint"
          data-error={state.error ? true : undefined}
          aria-live="polite"
        >
          {hint}
        </p>
      )}
      {name !== undefined && (
        <input type="hidden" name={name} value={state.value} disabled={disabled} />
      )}
      {state.open && (
        <div
          ref={panel}
          id={ids.panel}
          className="ndp-panel"
          popover={state.inline ? undefined : 'manual'}
          data-layout={state.inline ? 'inline' : undefined}
          style={
            state.inline
              ? ({ '--ndp-panel-width': `${String(panelWidth)}px` } as CSSProperties)
              : undefined
          }
          role={state.inline ? 'group' : 'dialog'}
          aria-label={labels.labels.chooseDate}
          data-ndp-theme={theme}
        >
          <PanelBody
            presets={state.presets}
            label={labels.labels.presets}
            onPreset={(presetId) => {
              store.actions.applyPreset(presetId);
            }}
          >
            <CalendarBody bindings={calendar} />
            <TimeColumns
              hours={state.hours}
              minutes={state.minutes}
              locale={options.locale}
              onHour={(hour) => {
                store.actions.selectHour(hour);
              }}
              onMinute={(minute) => {
                store.actions.selectMinute(minute);
              }}
            />
          </PanelBody>
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
                    type="button"
                    className="ndp-segment__item"
                    aria-pressed={state.calendar === option}
                    onClick={() => {
                      store.actions.switchCalendar(option);
                    }}
                  >
                    {labels.calendarNames[option]}
                  </button>
                ))}
              </div>
            ) : (
              <span />
            )}
            <span>
              <button
                type="button"
                className="ndp-button"
                onClick={() => {
                  store.actions.selectNow();
                }}
              >
                {labels.labels.now}
              </button>
              <button
                type="button"
                className="ndp-button"
                data-variant="primary"
                onClick={() => {
                  store.actions.close();
                  dateInput.current?.focus();
                }}
              >
                {labels.labels.done}
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
