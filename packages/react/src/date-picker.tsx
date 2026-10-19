import { useEffect, useRef, type ReactElement } from 'react';
import {
  getLocale,
  type CalendarDate,
  type CalendarSystem,
  type DateFormatPattern,
  type LocaleCode,
  type Weekday,
} from '@nepdate/core';
import type { EventMarker, HolidayInput, HolidayLookup } from '@nepdate/calendar';
import type { DateDetail, SinglePreset } from '@nepdate/datepicker';
import { restoreFocus } from '@nepdate/dom';
import { CalendarBody } from './calendar-body';
import { useDatePicker } from './hooks';
import { Icon } from './icons';
import { usePanel } from './panel';
import type { PanelLayout } from '@nepdate/dom';
import { PANEL_WIDTH, PANEL_WIDTH_WITH_PRESETS, PanelBody } from './presets';

export interface DatePickerProps {
  /** The AD date as "YYYY-MM-DD", or "": the same value a native date input uses. */
  value?: string | undefined;
  /** The starting value when the field keeps its own state, as in a plain form with `name`. */
  defaultValue?: string | undefined;
  onChange?: ((value: string, date: DateDetail | null) => void) | undefined;
  /** Show and type dates in this calendar only, and hide the BS/AD switch. */
  calendar?: CalendarSystem | undefined;
  /** The calendar shown first when the viewer has not chosen one. */
  defaultCalendar?: CalendarSystem | undefined;
  /** Called when the viewer switches BS/AD. */
  onCalendarChange?: ((calendar: CalendarSystem) => void) | undefined;
  /** Earliest and latest allowed days, as AD "YYYY-MM-DD". */
  min?: string | undefined;
  max?: string | undefined;
  isDateDisabled?: ((date: CalendarDate) => boolean) | undefined;
  /** Names, digits and messages; defaults to the page language (ne when <html lang="ne">). */
  locale?: LocaleCode | undefined;
  /** Submit the AD value with a plain form under this name. */
  name?: string | undefined;
  id?: string | undefined;
  placeholder?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  clearable?: boolean | undefined;
  /** Show the same day in the other calendar under the field. */
  showEquivalent?: boolean | undefined;
  holidays?: readonly HolidayInput[] | HolidayLookup | undefined;
  events?: ((date: CalendarDate) => readonly EventMarker[]) | undefined;
  weekStartsOn?: Weekday | undefined;
  weekendDays?: readonly Weekday[] | undefined;
  /** Show the other calendar's day number under each day. Default true. */
  showOtherCalendar?: boolean | undefined;
  displayFormat?: DateFormatPattern | undefined;
  closeOnSelect?: boolean | undefined;
  /** Shortcuts beside the calendar: 'today', 'yesterday', 'tomorrow' or { id, label, resolve }. */
  presets?: readonly SinglePreset[] | undefined;
  /** Remember the viewer's BS/AD choice in localStorage under this key. */
  persistCalendar?: string | undefined;
  /** Override "today" (tests, server rendering). */
  today?: CalendarDate | undefined;
  /** Add the dashes of YYYY-MM-DD while the user types digits. Default true. */
  mask?: boolean | undefined;
  /** 'sheet' opens a bottom sheet; 'popover' sits beside the field; 'auto' (default) uses the sheet below 480px. */
  panelLayout?: PanelLayout | undefined;
  theme?: 'light' | 'dark' | 'auto' | undefined;
  className?: string | undefined;
  'aria-label'?: string | undefined;
  'aria-invalid'?: boolean | undefined;
  'aria-describedby'?: string | undefined;
}

/**
 * A BS/AD date field: type a date or pick it from a calendar. The value is
 * always the AD day as "YYYY-MM-DD", so forms, validation and storage are
 * unchanged and a BS date can never be sent as if it were AD.
 */
export function DatePicker(props: DatePickerProps): ReactElement {
  const {
    name,
    placeholder,
    required,
    disabled = false,
    clearable = true,
    showEquivalent = true,
    persistCalendar,
    panelLayout,
    theme,
    className,
    'aria-label': ariaLabel,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    locale: localeProp,
    onCalendarChange,
    ...options
  } = props;
  const locale = localeProp ?? pageLocale();
  const picker = useDatePicker({
    ...options,
    locale,
    onCalendarChange: (calendar: CalendarSystem) => {
      remember(persistCalendar, calendar);
      onCalendarChange?.(calendar);
    },
  });
  const { state, store, calendar } = picker;
  const labels = getLocale(locale);
  const field = useRef<HTMLDivElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const hidden = useRef<HTMLInputElement | null>(null);

  usePanel(
    state.open,
    { anchor: box, panel, field, returnFocus: input },
    () => {
      store.actions.close();
    },
    calendar.focusGrid,
    state.presets.length > 0 ? PANEL_WIDTH_WITH_PRESETS : PANEL_WIDTH,
    panelLayout,
  );

  // The viewer's last BS/AD choice, read after hydration so server and client render alike.
  useEffect(() => {
    const stored = read(persistCalendar);
    if (stored) {
      store.actions.switchCalendar(stored);
    }
  }, [persistCalendar, store]);

  // A form reset puts the field back to its default value.
  useEffect(() => {
    const form = hidden.current?.form ?? input.current?.form;
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

  const hint = state.error?.message ?? (showEquivalent ? state.equivalentText : null);
  const inputProps = picker.getInputProps();
  const describedBy =
    [ariaDescribedBy, hint ? picker.ids.hint : undefined].filter(Boolean).join(' ') ||
    undefined;
  const invalid = ariaInvalid === true || state.error !== null;

  return (
    <div
      ref={field}
      className={className ? `ndp-field ${className}` : 'ndp-field'}
      data-ndp-theme={theme}
    >
      <div
        ref={box}
        className="ndp-input"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <input
          ref={input}
          className="ndp-input__control"
          {...inputProps}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
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
          {state.canSwitchCalendar && (
            <button
              className="ndp-input__switch"
              disabled={disabled}
              {...picker.getSwitchProps()}
            >
              {labels.calendarNames[state.calendar]}
            </button>
          )}
          <button
            className="ndp-icon-button"
            disabled={disabled}
            {...picker.getToggleProps()}
          >
            <Icon name="calendar" />
          </button>
        </span>
      </div>
      {hint !== null && (
        <p
          id={picker.ids.hint}
          className="ndp-hint"
          data-error={state.error ? true : undefined}
          aria-live="polite"
        >
          {hint}
        </p>
      )}
      {name !== undefined && (
        <input
          ref={hidden}
          type="hidden"
          name={name}
          value={state.value}
          disabled={disabled}
        />
      )}
      {state.open && (
        <div
          ref={panel}
          className="ndp-panel"
          popover="manual"
          data-ndp-theme={theme}
          {...picker.getPanelProps()}
          aria-label={
            ariaLabel
              ? `${ariaLabel}: ${labels.labels.calendar}`
              : labels.labels.chooseDate
          }
        >
          <PanelBody
            presets={state.presets}
            label={labels.labels.presets}
            onPreset={(id) => {
              if (store.actions.applyPreset(id) && !store.getState().open) {
                restoreFocus(input.current);
              }
            }}
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
            <button
              className="ndp-button"
              {...picker.getTodayProps()}
              onClick={() => {
                if (store.actions.selectToday()) {
                  restoreFocus(input.current);
                }
              }}
            >
              {labels.labels.today}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Nepali names and digits when the page language is Nepali. */
function pageLocale(): LocaleCode {
  return typeof document !== 'undefined' &&
    document.documentElement.lang.toLowerCase().startsWith('ne')
    ? 'ne'
    : 'en';
}

function read(key: string | undefined): CalendarSystem | null {
  if (!key) {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(key);
    return stored === 'AD' || stored === 'BS' ? stored : null;
  } catch {
    return null;
  }
}

function remember(key: string | undefined, calendar: CalendarSystem): void {
  if (!key) {
    return;
  }
  try {
    window.localStorage.setItem(key, calendar);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this page only.
  }
}
