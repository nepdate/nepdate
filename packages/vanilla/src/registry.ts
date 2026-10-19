/** The tag names this package registers. */
export const ELEMENT_NAMES: {
  readonly datePicker: 'nep-date-picker';
  readonly calendar: 'nep-calendar';
  readonly dateRangePicker: 'nep-date-range-picker';
  readonly dateTimePicker: 'nep-date-time-picker';
} = Object.freeze({
  datePicker: 'nep-date-picker',
  calendar: 'nep-calendar',
  dateRangePicker: 'nep-date-range-picker',
  dateTimePicker: 'nep-date-time-picker',
});

/** Define one element unless the name is taken. No-op during server rendering. */
export function defineElement(
  name: string,
  element: CustomElementConstructor,
  registry?: CustomElementRegistry,
): void {
  const target =
    registry ?? (typeof customElements === 'undefined' ? undefined : customElements);
  if (target && !target.get(name)) {
    target.define(name, element);
  }
}
