# @nepdate/datepicker

Framework-free BS/AD date picker behaviour:

- typed text ⇄ value, year first, in ASCII or Devanagari digits
- validation with English or Nepali messages
- the BS/AD switch
- open/close
- single and range values

It renders nothing; the adapters (`@nepdate/react`, `@nepdate/vanilla`) do.

```bash
npm install @nepdate/datepicker
```

```ts
import { createDatePicker } from '@nepdate/datepicker';

const picker = createDatePicker({
  defaultCalendar: 'BS',
  min: '2026-01-01', // AD "YYYY-MM-DD"
  onChange: (value, detail) => save(value), // value is always AD, e.g. "2026-10-10"
});

picker.actions.type('२०८३-०६-२४');
picker.getState();
// { value: '2026-10-10', text: '२०८३-०६-२४', equivalentText: '10 October 2026 AD', error: null, … }
picker.actions.switchCalendar('AD'); // the text becomes "2026-10-10"; the value does not change
```

## The value contract

- **Value:** always the AD day as `"YYYY-MM-DD"`, or `""` when empty or invalid. A BS date is never sent as the value.
- **`onChange(value, detail)`:** called for user actions only (typing, picking, clear, reset). `detail` is `{ ad, bs }` or `null`.
- **Outside values:** `setValue()` and `setOptions({ value })` never call `onChange`. Passing back the value the user just typed leaves their text alone, so the cursor doesn't jump.

## Errors

`state.error` is `{ code, message }`, with `code` one of `'format'`, `'range'`, `'disabled'`, `'tooShort'` or `'tooLong'`. The message is already translated, e.g. "Choose 2083-06-15 or later." or "वि.सं. मिति YYYY-MM-DD ढाँचामा लेख्नुहोस्।".

## Presets

Shortcuts shown beside the calendar. Weeks, months and years count in the calendar on screen, so "This month" is the BS month in BS mode.

```ts
createDateRangePicker({
  presets: ['last7Days', 'thisMonth', 'lastMonth', 'thisFiscalYear', 'lastFiscalYear'],
});
createDatePicker({
  presets: [
    'today',
    'yesterday',
    { id: 'admission', label: 'Admission day', resolve: () => bsDate(2083, 1, 15) },
  ],
});
picker.getState().presets; // [{ id, label, isActive, isDisabled }]
picker.actions.applyPreset('thisFiscalYear'); // 2083-04-01 → 2084-03-32 BS
```

| Picker | Built-in presets                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single | `today`, `yesterday`, `tomorrow`                                                                                                                  |
| Range  | `today`, `yesterday`, `thisWeek`, `lastWeek`, `last7Days`, `last30Days`, `thisMonth`, `lastMonth`, `thisYear`, `thisFiscalYear`, `lastFiscalYear` |

A preset is disabled when its range falls outside `min`/`max` or breaks `minDays`/`maxDays`.

## Range picker

```ts
import { createDateRangePicker } from '@nepdate/datepicker';

const range = createDateRangePicker({ minDays: 1, maxDays: 15 });
range.actions.select(start); // a click in the panel
range.actions.select(end);
range.getState().value; // { start: '2026-10-22', end: '2026-10-25' }
```

Both stores expose the panel's calendar store as `.calendar` (see `@nepdate/calendar`). The pure helpers `parseInput`, `checkDate`, `formatInput` and `equivalentText` are exported too.

MIT © Shishir Rai
