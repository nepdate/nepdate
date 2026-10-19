// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import {
  createCalendar,
  defineCalendar,
  NepCalendarElement,
} from '@nepdate/vanilla/calendar';
import {
  createDatePicker,
  defineDatePicker,
  NepDatePickerElement,
} from '@nepdate/vanilla/date-picker';
import {
  createDateRangePicker,
  defineDateRangePicker,
} from '@nepdate/vanilla/date-range-picker';
import {
  createDateTimePicker,
  defineDateTimePicker,
} from '@nepdate/vanilla/date-time-picker';
import * as all from '@nepdate/vanilla';

describe('per-element entries', () => {
  test('each entry defines only its own element, into any registry', () => {
    const defined = new Map<string, CustomElementConstructor>();
    const registry = {
      get: (name: string) => defined.get(name),
      define: (name: string, element: CustomElementConstructor) => {
        if (defined.has(name)) {
          throw new Error(`${name} defined twice`);
        }
        defined.set(name, element);
      },
    } as unknown as CustomElementRegistry;
    defineDatePicker(registry);
    expect(registry.get('nep-date-picker')).toBe(NepDatePickerElement);
    expect(registry.get('nep-calendar')).toBeUndefined();
    defineCalendar(registry);
    defineDateRangePicker(registry);
    defineDateTimePicker(registry);
    defineDatePicker(registry); // already defined: no error
    expect(registry.get('nep-calendar')).toBe(NepCalendarElement);
    expect(registry.get('nep-date-time-picker')).toBeDefined();
  });

  test('the main entry re-exports every entry', () => {
    expect(all.createDatePicker).toBe(createDatePicker);
    expect(all.createCalendar).toBe(createCalendar);
    expect(all.createDateRangePicker).toBe(createDateRangePicker);
    expect(all.createDateTimePicker).toBe(createDateTimePicker);
    expect(Object.keys(all.ELEMENT_NAMES)).toHaveLength(5);
  });
});
