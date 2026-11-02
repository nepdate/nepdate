# Reports by fiscal year

[[toc]]

## Introduction

Most reports in Nepal run by fiscal year, from 1 Shrawan to the end of Asar. This recipe filters and
groups AD records by fiscal year.

## Choosing a period

The range picker gives people a one-click fiscal year:

```tsx
import { useState } from 'react';
import { DateRangePicker } from '@nepdatejs/react';

export function ReportFilter() {
  const [range, setRange] = useState({ start: '', end: '' });

  return (
    <DateRangePicker
      value={range}
      onChange={setRange}
      fiscalYearView
      presets={['thisFiscalYear', 'lastFiscalYear', 'thisMonth']}
      startLabel="From"
      endLabel="To"
    />
  );
}
```

The value is AD, so it goes straight into your query:

```sql
SELECT sum(amount) FROM payments WHERE paid_on BETWEEN :start AND :end;
```

## From a fiscal-year label

If your URL or filter holds a label such as `2083/84`, read it and get the AD limits:

```ts
import { parseFiscalYear, toIsoDate } from '@nepdatejs/core';

function limits(label: string) {
  const fy = parseFiscalYear(label);

  return fy ? { start: toIsoDate(fy.firstDay), end: toIsoDate(fy.lastDay) } : null;
}

limits('2083/84'); // → { start: '2026-07-17', end: '2027-07-16' }
limits('nonsense'); // → null
```

## Grouping records

Group by the fiscal year of each record's date:

```ts
import { fiscalYear, fromIsoDate } from '@nepdatejs/core';

const payments = [
  { paidOn: '2026-07-16', amount: 100 },
  { paidOn: '2026-07-17', amount: 200 },
  { paidOn: '2026-12-01', amount: 300 },
];

const totals = new Map<string, number>();

for (const { paidOn, amount } of payments) {
  const date = fromIsoDate(paidOn);
  if (date) {
    const { label } = fiscalYear(date);
    totals.set(label, (totals.get(label) ?? 0) + amount);
  }
}

totals.get('2082/83'); // → 100
totals.get('2083/84'); // → 500
```

Note how one day makes the difference: 16 July 2026 is the last day of Asar, and 17 July is
1 Shrawan.

## Months in a fiscal year

For a monthly table, start at Shrawan and step twelve times:

```ts
import { addMonths, fiscalYearRange, formatDate } from '@nepdatejs/core';

const fy = fiscalYearRange(2083);
const months = Array.from({ length: 12 }, (_, index) =>
  formatDate(addMonths(fy.firstDay, index), 'F Y'),
);

months[0]; // → 'Shrawan 2083'
months[11]; // → 'Asar 2084'
```

## Printing the label

Tax forms use a dotted style. See [Writing a fiscal year](./fiscal-year#writing-a-fiscal-year).
