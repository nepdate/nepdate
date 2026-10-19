# @nepdate/react

The BS/AD date picker and calendar for React 18 and 19. It provides styled components, plus headless hooks for your own markup, and works with server rendering and React Server Components.

```bash
npm install @nepdate/react @nepdate/styles
```

```tsx
import '@nepdate/styles';
import { useState } from 'react';
import { DatePicker } from '@nepdate/react';

export function Form() {
  const [dob, setDob] = useState('');

  return (
    <label>
      Date of birth
      <DatePicker value={dob} onChange={setDob} max="2026-12-31" />
    </label>
  );
}
```

`value` and `onChange` use the AD date as `"YYYY-MM-DD"`, the same as `<input type="date">`. Viewers see and type BS (or AD, after switching).

## Components

| Component                                   | Notes                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `<DatePicker>`                              | Props are listed below.                                                                                                  |
| `<DateRangePicker>`                         | `value={{ start, end }}`, `minDays`, `maxDays`, `startName`/`endName` for forms.                                         |
| `<Calendar>`                                | A standalone month view: `selected`, `onSelect`, `month`/`onMonthChange`, `selectionMode="range"`, `holidays`, `events`. |
| `<DateText value="2026-09-26" />`           | "10 Ashwin 2083 · 26 Sep 2026". It has no hooks, so it's safe in server components (`@nepdate/react/server`).            |
| `<ShortDate>`, `shortDate()`, `bothDates()` | Short text for tables and documents.                                                                                     |

**`<DatePicker>` props:**

- **Value:** `value`, `defaultValue`, `onChange(value, { ad, bs })`, `name` (submits with plain forms; form reset is supported).
- **Calendar:** `calendar` (fixed BS or AD), `defaultCalendar`, `onCalendarChange`, `persistCalendar` (localStorage key).
- **Limits:** `min`, `max`, `isDateDisabled`, `holidays`, `events`.
- **Shortcuts:** `presets={['today', 'yesterday']}` (or custom `{ id, label, resolve }`) beside the calendar.
- **Display:** `locale` (defaults to `ne` when `<html lang="ne">`), `displayFormat`, `showEquivalent`, `clearable`, `weekStartsOn`, `weekendDays`, `theme`.
- **Inline:** `inline` keeps the calendar in the page under the input, always open.
- **Typing:** dashes fill in as digits are typed (`20830624` → `2083-06-24`); `mask={false}` turns that off.
- **Phones:** below 480px the panel opens as a bottom sheet. `panelLayout="popover"` or `"sheet"` forces one layout at any width.
- **Field:** `required`, `disabled`, `placeholder`, `id`, `aria-*`.
- **Testing and server rendering:** `today`.

The panel opens in the browser's top layer, so dialogs and scrolling containers never clip it. Escape and outside clicks close it.

## Headless hooks

```tsx
import { useDatePicker } from '@nepdate/react/headless';

const picker = useDatePicker({ min: '2026-01-01' });
<input {...picker.getInputProps()} />
<button {...picker.getToggleProps()}>Open</button>
{picker.state.open && (
  <div {...picker.getPanelProps()}>
    <table {...picker.calendar.getGridProps()}>…{/* picker.calendar.getDayProps(cell) */}</table>
  </div>
)}
```

`useCalendar`, `useDatePicker` and `useDateRangePicker` return the state, the actions and prop getters with the right ARIA and keyboard handling. Inline objects, arrays and functions in options are fine: values are compared by content and callbacks are wrapped once, so nothing re-renders in a loop.

## Server rendering

Nothing touches `window` during render. Pass `today` for markup that is identical on server and client. A remembered BS/AD choice is read after hydration.

MIT © Shishir Rai
