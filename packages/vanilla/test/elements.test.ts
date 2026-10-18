// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  createCalendar,
  createDatePicker,
  createDateRangePicker,
  defineElements,
  ELEMENT_NAMES,
  type NepCalendarElement,
  type NepDatePickerElement,
  type NepDateRangePickerElement,
} from '@nepdate/vanilla';

const TODAY = '2026-10-18'; // Kartik 1, 2083 BS

beforeAll(() => {
  defineElements();
});

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

function mount<T extends HTMLElement>(html: string): T {
  document.body.innerHTML = html;
  return (
    document.body.querySelector<T>('[data-test]') ??
    (document.body.firstElementChild as T)
  );
}

function picker(attrs = ''): NepDatePickerElement {
  const element = mount<NepDatePickerElement>(
    `<form><nep-date-picker data-test ${attrs}></nep-date-picker></form>`,
  );
  element.view?.setOptions({ today: { calendar: 'AD', year: 2026, month: 10, day: 18 } });
  return element;
}

function typeInto(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const q = <T extends Element>(root: ParentNode, selector: string): T => {
  const found = root.querySelector<T>(selector);
  if (!found) {
    throw new Error(`Missing ${selector}`);
  }
  return found;
};

/** A day button by the start (or part) of its accessible name, which lives in .ndp-sr-only. */
function day(
  root: ParentNode,
  text: string,
  match: 'start' | 'part' | 'end' = 'start',
): HTMLButtonElement {
  const found = [...root.querySelectorAll<HTMLButtonElement>('.ndp-day')].find(
    (button) => {
      const name = nameOf(button);
      return match === 'start'
        ? name.startsWith(text)
        : match === 'end'
          ? name.endsWith(text)
          : name.includes(text);
    },
  );
  if (!found) {
    throw new Error(`No day named ${text}`);
  }
  return found;
}

/** A month/year/fiscal tile by the start of its accessible name. */
function option(root: ParentNode, text: string): HTMLButtonElement {
  const found = [...root.querySelectorAll<HTMLButtonElement>('.ndp-option')].find(
    (button) => nameOf(button).startsWith(text),
  );
  if (!found) {
    throw new Error(`No tile named ${text}`);
  }
  return found;
}

function nameOf(element: Element | null): string {
  return (
    element?.querySelector('.ndp-sr-only')?.textContent ??
    element?.getAttribute('aria-label') ??
    ''
  );
}

describe('registration (VAN-009)', () => {
  test('defineElements registers all three and can run twice', () => {
    defineElements();
    for (const name of Object.values(ELEMENT_NAMES)) {
      expect(customElements.get(name)).toBeDefined();
    }
  });
});

describe('<nep-date-picker> (VAN-001, VAN-004, VAN-005)', () => {
  test('renders the field with the styles markup', () => {
    const element = picker('name="dob" label="Date of birth"');
    const input = q<HTMLInputElement>(element, 'input.ndp-input__control');
    expect(input.placeholder).toBe('YYYY-MM-DD (BS)');
    expect(input.getAttribute('aria-label')).toBe('Date of birth');
    expect(input.getAttribute('aria-haspopup')).toBe('dialog');
    expect(q(element, '.ndp-input__switch').textContent).toBe('BS');
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(true);
  });

  test('typing a BS date fires change with the AD value and submits it with the form', () => {
    const element = picker('name="dob"');
    const onChange = vi.fn<(event: CustomEvent) => void>();
    element.addEventListener('change', onChange as unknown as EventListener);
    typeInto(q(element, 'input.ndp-input__control'), '2083-06-24');

    expect(element.value).toBe('2026-10-10');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0]?.[0].detail).toMatchObject({
      value: '2026-10-10',
      bs: { year: 2083, month: 6, day: 24 },
    });
    expect(q(element, '.ndp-hint').textContent).toBe('10 October 2026 AD');
    const form = element.closest('form');
    expect(form && new FormData(form).get('dob')).toBe('2026-10-10');
  });

  test('the inner input’s native change event does not leak out', () => {
    const element = picker();
    const onChange = vi.fn();
    element.addEventListener('change', onChange);
    q(element, 'input.ndp-input__control').dispatchEvent(
      new Event('change', { bubbles: true }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  test('errors are shown and set the input’s validity', () => {
    const element = picker('min="2026-10-01"');
    const input = q<HTMLInputElement>(element, 'input.ndp-input__control');
    typeInto(input, '2083-06-01');
    expect(q(element, '.ndp-hint').textContent).toBe('Choose 2083-06-15 or later.');
    expect(q(element, '.ndp-hint').hasAttribute('data-error')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.validationMessage).toBe('Choose 2083-06-15 or later.');
    expect(q(element, '.ndp-input').hasAttribute('data-invalid')).toBe(true);
  });

  test('attributes update the picker', () => {
    const element = picker('value="2026-10-10"');
    const input = q<HTMLInputElement>(element, 'input.ndp-input__control');
    expect(input.value).toBe('2083-06-24');
    element.setAttribute('calendar', 'AD');
    expect(input.value).toBe('2026-10-10');
    expect(q<HTMLElement>(element, '.ndp-input__switch').hidden).toBe(true);
    element.setAttribute('value', '2026-12-25');
    expect(input.value).toBe('2026-12-25');
    element.setAttribute('locale', 'ne');
    expect(input.value).toBe('२०२६-१२-२५');
    element.setAttribute('disabled', '');
    expect(input.disabled).toBe(true);
  });

  test('the BS/AD switch changes the text, never the value', () => {
    const element = picker('value="2026-10-10" persist-calendar="ndp-test"');
    q<HTMLButtonElement>(element, '.ndp-input__switch').click();
    expect(q<HTMLInputElement>(element, 'input.ndp-input__control').value).toBe(
      '2026-10-10',
    );
    expect(element.value).toBe('2026-10-10');
    expect(localStorage.getItem('ndp-test')).toBe('AD');
  });

  test('a remembered calendar is restored', () => {
    localStorage.setItem('ndp-remember', 'AD');
    const element = picker('value="2026-10-10" persist-calendar="ndp-remember"');
    expect(q<HTMLInputElement>(element, 'input.ndp-input__control').value).toBe(
      '2026-10-10',
    );
  });

  test('clear empties the field', () => {
    const element = picker('value="2026-10-10"');
    q<HTMLButtonElement>(element, '[data-action="clear"]').click();
    expect(element.value).toBe('');
    expect(q<HTMLElement>(element, '[data-action="clear"]').hidden).toBe(true);
  });
});

describe('panel and keyboard (VAN-006, VAN-010)', () => {
  test('opens, moves focus with arrows, picks with a click, closes and returns focus', () => {
    const element = picker('value="2026-10-10"');
    const events: string[] = [];
    element.addEventListener('nep-open', () => events.push('open'));
    element.addEventListener('nep-close', () => events.push('close'));
    q<HTMLButtonElement>(element, '[data-action="toggle"]').click();

    const panel = q<HTMLElement>(element, '.ndp-panel');
    expect(panel.hidden).toBe(false);
    expect(q(panel, '.ndp-calendar__title').textContent).toBe('Ashwin2083');
    expect(nameOf(document.activeElement)).toBe(
      'Saturday, 24 Ashwin 2083 (10 October 2026 AD)',
    );

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(nameOf(document.activeElement)).toBe(
      'Sunday, 25 Ashwin 2083 (11 October 2026 AD)',
    );
    (document.activeElement as HTMLButtonElement).click();

    expect(element.value).toBe('2026-10-11');
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(q(element, 'input.ndp-input__control'));
    expect(events).toEqual(['open', 'close']);
  });

  test('the grid has the ARIA the spec asks for', () => {
    const element = picker('value="2026-10-10"');
    element.open();
    const grid = q<HTMLTableElement>(element, 'table.ndp-grid');
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-label')).toBe('Ashwin 2083');
    expect(q(grid, 'th').getAttribute('abbr')).toBe('Sunday');
    const selected = q<HTMLButtonElement>(grid, '[aria-pressed="true"]');
    expect(selected.getAttribute('tabindex')).toBe('0');
    expect(selected.parentElement?.getAttribute('aria-selected')).toBe('true');
    expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(q(element, '[data-action="prev"]').getAttribute('aria-label')).toBe(
      'Previous month',
    );
  });

  test('Escape closes; month and year views drill down', () => {
    const element = picker('value="2026-10-10"');
    element.open();
    q<HTMLButtonElement>(element, '[data-action="view-year"]').click();
    expect(element.querySelectorAll('.ndp-option')).toHaveLength(12);
    option(element, '2080').click();
    option(element, 'Baisakh').click();
    expect(q(element, '.ndp-calendar__title').textContent).toBe('Baisakh2080');
    q<HTMLButtonElement>(element, '[data-action="next"]').click();
    expect(q(element, '.ndp-calendar__title').textContent).toBe('Jestha2080');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(true);
  });

  test('Alt+ArrowDown opens; Today picks today; an outside click closes', () => {
    const element = picker();
    const input = q<HTMLInputElement>(element, 'input.ndp-input__control');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
    );
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(false);
    q<HTMLButtonElement>(element, '[data-action="today"]').click();
    expect(element.value).toBe(TODAY);

    element.open();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(true);
  });

  test('the footer segment switches calendars', () => {
    const element = picker('value="2026-10-10"');
    element.open();
    q<HTMLButtonElement>(element, '.ndp-segment__item[data-calendar="AD"]').click();
    expect(q(element, '.ndp-calendar__title').textContent).toBe('October2026');
    expect(
      q(element, '.ndp-segment__item[data-calendar="AD"]').getAttribute('aria-pressed'),
    ).toBe('true');
  });
});

describe('forms (VAN-001)', () => {
  test('required, reset and disabled fieldsets', () => {
    const element = picker('name="dob" required value="2026-10-10"');
    const form = element.closest('form');
    if (!form) {
      throw new Error('no form');
    }
    typeInto(q(element, 'input.ndp-input__control'), '');
    expect(form.checkValidity()).toBe(false);
    form.reset();
    element.formResetCallback(); // happy-dom may not call it; real browsers do
    expect(element.value).toBe('2026-10-10');
    expect(element.checkValidity()).toBe(true);
    element.formDisabledCallback(true);
    expect(q<HTMLInputElement>(element, 'input.ndp-input__control').disabled).toBe(true);
  });

  test('focus() moves to the input; reconnecting renders again', () => {
    const element = picker();
    element.focus();
    expect(document.activeElement).toBe(q(element, 'input.ndp-input__control'));
    const parent = element.parentElement;
    element.remove();
    expect(element.view).toBeNull();
    parent?.append(element);
    expect(element.querySelectorAll('.ndp-field')).toHaveLength(1);
  });

  test('rich options are properties', () => {
    const element = picker('value="2026-10-10"');
    element.isDateDisabled = (date) => date.day === 13;
    element.holidays = [
      { date: { calendar: 'BS', year: 2083, month: 6, day: 26 }, label: 'Dashain' },
    ];
    element.events = () => [{ color: 'red' }];
    element.open();
    expect(day(element, ' 13 Ashwin 2083', 'part').disabled).toBe(true);
    expect(day(element, ', Dashain', 'end').getAttribute('data-state')).toBe('holiday');
    expect(element.holidays).toHaveLength(1);
    expect(element.isDateDisabled).toBeTypeOf('function');
    expect(element.events).toBeTypeOf('function');
  });
});

describe('presets (PRE-007)', () => {
  test('the presets attribute lists shortcuts; applying one sets the value', () => {
    const element = picker('presets="today, yesterday, nonsense"');
    element.open();
    const buttons = [...element.querySelectorAll<HTMLButtonElement>('.ndp-preset')];
    expect(buttons.map((button) => [button.textContent, button.disabled])).toEqual([
      ['Today', false],
      ['Yesterday', false],
      ['nonsense', true],
    ]);
    expect(q(element, '.ndp-presets').getAttribute('aria-label')).toBe('Shortcuts');
    buttons[1]?.click();
    expect(element.value).toBe('2026-10-17');
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(true);
  });

  test('custom presets as a property; range presets', () => {
    const element = picker();
    element.presets = [
      {
        id: 'ny',
        label: 'New year',
        resolve: () => ({ calendar: 'BS', year: 2083, month: 1, day: 1 }),
      },
    ];
    element.open();
    q<HTMLButtonElement>(element, '.ndp-preset').click();
    expect(element.value).toBe('2026-04-14');
    expect(element.presets).toHaveLength(1);

    const range = mount<NepDateRangePickerElement>(
      '<nep-date-range-picker presets="last7Days"></nep-date-range-picker>',
    );
    range.view?.setOptions({ today: { calendar: 'AD', year: 2026, month: 10, day: 18 } });
    range.view?.open();
    q<HTMLButtonElement>(range, '.ndp-preset').click();
    expect(range.value).toEqual({ start: '2026-10-12', end: '2026-10-18' });
    range.presets = ['thisMonth'];
    expect(range.presets).toEqual(['thisMonth']);
  });
});

describe('fiscal-year view (FY-001)', () => {
  test('fiscal-years shows the button; a tile picks the whole year', () => {
    const element = mount<NepDateRangePickerElement>(
      '<nep-date-range-picker fiscal-years></nep-date-range-picker>',
    );
    element.view?.setOptions({
      today: { calendar: 'AD', year: 2026, month: 10, day: 18 },
    });
    element.view?.open();
    const button = q<HTMLButtonElement>(element, '[data-action="fiscal"]');
    expect(button.textContent).toBe('Fiscal year');
    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(q(element, '.ndp-calendar__title').textContent).toBe(
      'Fiscal year 2076/77–2087/88',
    );
    option(element, '2083/84 (2026/27)').click();
    expect(element.value.start).toBe('2026-07-17');
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(true);
  });
});

describe('<nep-date-time-picker> (TIME-003)', () => {
  test('typing and the time columns set one zoned instant that the form submits', () => {
    const element = mount<
      HTMLElement & {
        value: string;
        view: { setOptions(o: object): void; open(): void } | null;
      }
    >(
      '<form><nep-date-time-picker data-test name="starts" minute-step="30" label="Starts"></nep-date-time-picker></form>',
    );
    element.view?.setOptions({
      today: { calendar: 'AD', year: 2026, month: 10, day: 18 },
    });
    const onChange = vi.fn<(event: CustomEvent) => void>();
    element.addEventListener('change', onChange as unknown as EventListener);
    const [date, time] = element.querySelectorAll<HTMLInputElement>(
      'input.ndp-input__control',
    );
    if (!date || !time) {
      throw new Error('inputs missing');
    }
    typeInto(date, '2083-06-24');
    typeInto(time, '2:30 pm');
    expect(element.value).toBe('2026-10-10T14:30:00+05:45');
    expect(onChange.mock.lastCall?.[0].detail).toMatchObject({
      time: { hour: 14, minute: 30 },
    });
    const form = element.closest('form');
    expect(form && new FormData(form).get('starts')).toBe('2026-10-10T14:30:00+05:45');

    element.view?.open();
    q<HTMLButtonElement>(element, '[data-unit="hour"] [data-value="8"]').click();
    q<HTMLButtonElement>(element, '[data-unit="minute"] [data-value="30"]').click();
    expect(element.value).toBe('2026-10-10T08:30:00+05:45');
    expect(element.querySelectorAll('[data-unit="minute"] .ndp-time-item')).toHaveLength(
      2,
    );
    q<HTMLButtonElement>(element, '[data-action="done"]').click();
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(true);

    typeInto(time, 'later');
    expect(q(element, '.ndp-hint').textContent).toBe('Enter a time as HH:MM.');
    expect(time.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('<nep-calendar> (VAN-002)', () => {
  test('fires nep-select with the date and its AD value', () => {
    const element = mount<NepCalendarElement>(
      '<nep-calendar value="2026-10-10" theme="dark"></nep-calendar>',
    );
    element.store?.setOptions({
      today: { calendar: 'AD', year: 2026, month: 10, day: 18 },
    });
    const onSelect = vi.fn<(event: CustomEvent) => void>();
    element.addEventListener('nep-select', onSelect as unknown as EventListener);
    day(element, 'Sunday, 25 Ashwin').click();
    expect(onSelect.mock.calls[0]?.[0].detail).toMatchObject({ value: '2026-10-11' });
    expect(q<HTMLElement>(element, '.ndp-calendar').dataset['ndpTheme']).toBe('dark');
    element.removeAttribute('theme');
    expect(q<HTMLElement>(element, '.ndp-calendar').dataset['ndpTheme']).toBeUndefined();
  });

  test('range mode reports both ends and previews on hover', () => {
    const element = mount<NepCalendarElement>('<nep-calendar range></nep-calendar>');
    element.store?.setOptions({
      visibleMonth: { calendar: 'BS', year: 2083, month: 6, day: 1 },
    });
    const onSelect = vi.fn<(event: CustomEvent) => void>();
    element.addEventListener('nep-select', onSelect as unknown as EventListener);
    day(element, 'Saturday, 24 Ashwin').click();
    day(element, 'Tuesday, 27 Ashwin').dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true }),
    );
    expect(element.querySelectorAll('[data-preview]').length).toBeGreaterThan(0);
    q(element, '.ndp-calendar').dispatchEvent(new MouseEvent('mouseleave'));
    expect(element.querySelectorAll('[data-preview]')).toHaveLength(0);
    day(element, 'Tuesday, 27 Ashwin').click();
    expect(onSelect.mock.calls[1]?.[0].detail).toEqual({
      range: { start: '2026-10-10', end: '2026-10-13' },
    });
    element.holidays = [];
    element.events = undefined;
    element.isDateDisabled = undefined;
    expect(element.holidays).toEqual([]);
  });
});

describe('<nep-date-range-picker> (VAN-003)', () => {
  test('two clicks set the range, fire change and submit both names', () => {
    const element = mount<NepDateRangePickerElement>(
      '<form><nep-date-range-picker data-test name="leave"></nep-date-range-picker></form>',
    );
    element.view?.setOptions({
      today: { calendar: 'AD', year: 2026, month: 10, day: 18 },
    });
    const onChange = vi.fn<(event: CustomEvent) => void>();
    element.addEventListener('change', onChange as unknown as EventListener);
    q<HTMLButtonElement>(element, '[data-action="toggle"]').click();
    day(element, 'Thursday, 5 Kartik').click();
    day(element, 'Sunday, 8 Kartik').click();
    expect(element.value).toEqual({ start: '2026-10-22', end: '2026-10-25' });
    expect(onChange.mock.lastCall?.[0].detail).toEqual({
      value: { start: '2026-10-22', end: '2026-10-25' },
    });
    const form = element.closest('form');
    const data = form ? new FormData(form) : null;
    expect(data?.get('leave-start')).toBe('2026-10-22');
    expect(data?.get('leave-end')).toBe('2026-10-25');
    expect(q<HTMLElement>(element, '.ndp-panel').hidden).toBe(true);
  });

  test('start/end attributes are the default value', () => {
    const element = mount<NepDateRangePickerElement>(
      '<nep-date-range-picker start="2026-10-13" end="2026-10-10"></nep-date-range-picker>',
    );
    expect(element.value).toEqual({ start: '2026-10-10', end: '2026-10-13' });
  });

  test('typing, length errors and attributes', () => {
    const element = mount<NepDateRangePickerElement>(
      '<nep-date-range-picker max-days="3" start-label="From" end-label="To"></nep-date-range-picker>',
    );
    const [start, end] = element.querySelectorAll<HTMLInputElement>(
      'input.ndp-input__control',
    );
    if (!start || !end) {
      throw new Error('inputs missing');
    }
    expect(start.getAttribute('aria-label')).toBe('From');
    typeInto(start, '2083-07-01');
    typeInto(end, '2083-07-10');
    expect(q(element, '.ndp-hint').textContent).toBe('Choose at most 3 days.');
    expect(end.getAttribute('aria-invalid')).toBe('true');
    element.setAttribute('max-days', '30');
    typeInto(end, '2083-07-09');
    expect(element.value.end).toBe('2026-10-26');
    element.value = { start: '', end: '' };
    expect(start.value).toBe('');
    element.isDateDisabled = () => false;
    element.holidays = [];
    element.setAttribute('disabled', '');
    expect(start.disabled).toBe(true);
  });
});

describe('createDatePicker (VAN-008)', () => {
  test('enhances an existing input and keeps its value in step', () => {
    document.body.innerHTML = '<form><input name="dob" value="2026-10-10"></form>';
    const original = q<HTMLInputElement>(document.body, 'input[name="dob"]');
    const onChange = vi.fn();
    original.addEventListener('change', onChange);
    const handle = createDatePicker(original);

    expect(original.hidden).toBe(true);
    const visible = q<HTMLInputElement>(document.body, 'input.ndp-input__control');
    expect(visible.value).toBe('2083-06-24');
    typeInto(visible, '2083-07-01');
    expect(original.value).toBe('2026-10-18');
    expect(onChange).toHaveBeenCalledOnce();
    expect(handle.getValue()).toBe('2026-10-18');
    handle.setValue('2026-12-25');
    expect(original.value).toBe('2026-12-25');
    handle.setOptions({ placeholder: 'Pick a day' });
    handle.open();
    handle.close();
    expect(handle.getState().open).toBe(false);
    handle.destroy();
    expect(original.hidden).toBe(false);
    expect(document.querySelector('.ndp-field')).toBeNull();
  });

  test('mounts into a container with a hidden input', () => {
    document.body.innerHTML = '<form><div id="box"></div></form>';
    const handle = createDatePicker(q(document.body, '#box'), {
      name: 'when',
      defaultValue: '2026-10-10',
    });
    const form = q<HTMLFormElement>(document.body, 'form');
    expect(new FormData(form).get('when')).toBe('2026-10-10');
    handle.destroy();
  });
});

describe('createCalendar and createDateRangePicker (VAN-008)', () => {
  test('mount, update and destroy', () => {
    document.body.innerHTML = '<div id="cal"></div><div id="range"></div>';
    const calendar = createCalendar(q(document.body, '#cal'), {
      today: { calendar: 'AD', year: 2026, month: 10, day: 18 },
    });
    expect(q(document.body, '.ndp-calendar__title').textContent).toBe('Kartik2083');
    calendar.setOptions({ calendar: 'AD' });
    expect(q(document.body, '.ndp-calendar__title').textContent).toBe('October2026');
    calendar.destroy();
    expect(document.querySelector('#cal .ndp-calendar')).toBeNull();

    const range = createDateRangePicker(q(document.body, '#range'), {
      startName: 'from',
      endName: 'to',
    });
    range.setOptions({ disabled: true });
    expect(
      document.querySelectorAll('#range input.ndp-input__control:disabled'),
    ).toHaveLength(2);
    range.destroy();
    expect(document.querySelector('#range .ndp-field')).toBeNull();
  });
});
