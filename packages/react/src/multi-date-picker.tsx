import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react';
import {
  getLocale,
  type CalendarDate,
  type CalendarSystem,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';
import type { EventMarker, HolidayInput, HolidayLookup } from '@nepdate/calendar';
import type { DateDetail } from '@nepdate/datepicker';
import { restoreFocus, type PanelLayout } from '@nepdate/dom';
import { CalendarBody } from './calendar-body';
import { useMultiDatePicker } from './hooks';
import { Icon } from './icons';
import { usePanel } from './panel';
import { PANEL_WIDTH } from './presets';

export interface MultiDatePickerProps {
  /** AD "YYYY-MM-DD" days. */
  value?: readonly string[] | undefined;
  defaultValue?: readonly string[] | undefined;
  onChange?:
    ((value: readonly string[], dates: readonly DateDetail[]) => void) | undefined;
  calendar?: CalendarSystem | undefined;
  defaultCalendar?: CalendarSystem | undefined;
  onCalendarChange?: ((calendar: CalendarSystem) => void) | undefined;
  /** Earliest and latest allowed days, as AD "YYYY-MM-DD". */
  min?: string | undefined;
  max?: string | undefined;
  /** The most days that may be chosen. */
  maxDates?: number | undefined;
  isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
  holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  events?: ((date: CalendarDate) => readonly EventMarker[]) | undefined;
  locale?: LocaleCode | undefined;
  weekStartsOn?: Weekday | undefined;
  weekendDays?: readonly Weekday[] | undefined;
  showOtherCalendar?: boolean | undefined;
  /** Close the panel after each click. Default false. */
  closeOnSelect?: boolean | undefined;
  /** Add the dashes of YYYY-MM-DD while the user types digits. Default true. */
  mask?: boolean | undefined;
  /** Show the calendar in the page, always open, instead of in a popover. */
  inline?: boolean | undefined;
  /** 'sheet' opens a bottom sheet; 'popover' sits beside the field; 'auto' (default) uses the sheet below 480px. */
  panelLayout?: PanelLayout | undefined;
  /** Submit each day under this name, one hidden input per day. */
  name?: string | undefined;
  id?: string | undefined;
  placeholder?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  clearable?: boolean | undefined;
  today?: CalendarDate | undefined;
  theme?: 'light' | 'dark' | 'auto' | undefined;
  className?: string | undefined;
  'aria-label'?: string | undefined;
}

/**
 * Several separate BS/AD days in one field (PICK-001): click days in the
 * panel to add or remove them, or type them separated by commas. The value is
 * the sorted AD days as "YYYY-MM-DD" strings.
 */
export function MultiDatePicker({
  name,
  placeholder,
  required,
  disabled = false,
  clearable = true,
  panelLayout,
  theme,
  className,
  'aria-label': ariaLabel,
  ...options
}: MultiDatePickerProps): ReactElement {
  const picker = useMultiDatePicker(options);
  const { state, store, calendar } = picker;
  const labels = getLocale(options.locale);
  const field = useRef<HTMLDivElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  usePanel(
    state.open && !state.inline,
    { anchor: box, panel, field, returnFocus: input },
    () => {
      store.actions.close();
    },
    calendar.focusGrid,
    PANEL_WIDTH,
    panelLayout,
  );

  // A form reset puts the field back to its default value.
  useEffect(() => {
    const form = input.current?.form;
    if (!form) {
      return undefined;
    }
    const reset = (): void => {
      store.actions.reset();
    };
    form.addEventListener('reset', reset);

    return () => {
      form.removeEventListener('reset', reset);
    };
  }, [store]);

  useEffect(() => {
    input.current?.setCustomValidity(state.error?.message ?? '');
  }, [state.error]);

  return (
    <div
      ref={field}
      className={className ? `ndp-field ${className}` : 'ndp-field'}
      data-ndp-theme={theme}
    >
      <div
        ref={box}
        className="ndp-input"
        data-invalid={state.error !== null || undefined}
        data-disabled={disabled || undefined}
      >
        <input
          ref={input}
          className="ndp-input__control"
          {...picker.getInputProps()}
          aria-label={ariaLabel}
          placeholder={placeholder ?? state.placeholder}
          required={required}
          disabled={disabled}
        />
        <span className="ndp-input__actions">
          {clearable && state.text !== '' && !disabled && (
            <button
              className="ndp-icon-button"
              {...picker.getClearProps()}
              onClick={() => {
                store.actions.clear();
                input.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          )}
          {!state.inline && (
            <button
              className="ndp-icon-button"
              disabled={disabled}
              {...picker.getToggleProps()}
            >
              <Icon name="calendar" />
            </button>
          )}
        </span>
      </div>
      {state.error && (
        <p id={picker.ids.hint} className="ndp-hint" data-error aria-live="polite">
          {state.error.message}
        </p>
      )}
      {name !== undefined &&
        state.value.map((day) => (
          <input key={day} type="hidden" name={name} value={day} disabled={disabled} />
        ))}
      {state.open && (
        <div
          ref={panel}
          className="ndp-panel"
          popover={state.inline ? undefined : 'manual'}
          data-layout={state.inline ? 'inline' : undefined}
          style={
            state.inline
              ? ({ '--ndp-panel-width': `${String(PANEL_WIDTH)}px` } as CSSProperties)
              : undefined
          }
          data-ndp-theme={theme}
          {...picker.getPanelProps()}
          aria-label={
            ariaLabel
              ? `${ariaLabel}: ${labels.labels.calendar}`
              : labels.labels.chooseDate
          }
        >
          <CalendarBody
            bindings={{
              ...calendar,
              getDayProps: (cell) => ({
                ...calendar.getDayProps(cell),
                onClick: () => {
                  if (
                    !cell.isDisabled &&
                    store.actions.select(cell.date) &&
                    !store.getState().open
                  ) {
                    restoreFocus(input.current);
                  }
                },
              }),
            }}
          />
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
            {!state.inline && (
              <button
                type="button"
                className="ndp-button"
                onClick={() => {
                  store.actions.close();
                  restoreFocus(input.current);
                }}
              >
                {labels.labels.done}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
