# Next.js and server rendering

[[toc]]

## Introduction

`@nepdate/react` renders on the server. Nothing touches `window` during render, and there are two
things to know: the pickers are client components, and "today" must match on both sides.

## App Router

The pickers use state, so they go in a client component. Add `'use client'` at the top:

```tsx
'use client';

import { useState } from 'react';
import { DatePicker } from '@nepdate/react';

export function BirthDate() {
  const [value, setValue] = useState('');

  return <DatePicker value={value} onChange={setValue} aria-label="Date of birth" />;
}
```

Import the stylesheet once in your root layout:

```ts
import '@nepdate/styles';
```

## Server components

`@nepdate/react/server` has the helpers with no hooks, so they work in server components. All of
`@nepdate/core` works there too.

```tsx
import { DateText } from '@nepdate/react/server';

export default function Invoice() {
  return (
    <p>
      Issued on <DateText value="2026-09-26" />
    </p>
  );
}
```

## Avoiding hydration mismatches

A picker highlights today. If your server and a visitor's browser disagree about the date, for
example right around midnight, React warns about a mismatch.

Pass `today` from the server so both sides agree:

```tsx
import { today } from '@nepdate/core';
import { DatePicker } from '@nepdate/react';

export function Field() {
  return <DatePicker today={today('AD')} aria-label="Date" />;
}
```

A calendar choice saved with `persistCalendar` is read after hydration, for the same reason, so
the first render always matches the server.

## Server actions

The value is a plain field in `FormData`:

```tsx
import { DatePicker } from '@nepdate/react';

export function Form({ action }: { action: (data: FormData) => void }) {
  return (
    <form action={action}>
      <DatePicker name="dob" aria-label="Date of birth" />
      <button>Save</button>
    </form>
  );
}
```

## Remix, Astro and others

The same rules apply: render on the server, hydrate on the client, and pass `today` if the date
could differ. In Astro, use a client directive such as `client:load` on the component.
