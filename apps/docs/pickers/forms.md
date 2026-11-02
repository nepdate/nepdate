# Forms

[[toc]]

## Introduction

Give a picker a `name` and it joins your form, like any other input. The form receives the AD
value, so your server needs no knowledge of BS.

## Plain HTML forms

The Web Components are **form-associated**: the browser treats them as real form fields, so they
take part in submitting, validation, reset and `<fieldset disabled>`.

```html
<form action="/profile" method="post">
  <label for="dob">Date of birth</label>
  <nep-date-picker name="dob" input-id="dob" required></nep-date-picker>

  <button>Save</button>
  <button type="reset">Reset</button>
</form>
```

Whichever calendar the person used, the form submits:

```text
dob=2026-10-10
```

| Picker | What the form receives |
|---|---|
| `<nep-date-picker name="dob">` | `dob=2026-10-10` |
| `<nep-date-range-picker name="leave">` | `leave-start=2026-10-22&leave-end=2026-10-25` |
| `<nep-date-time-picker name="starts">` | `starts=2026-10-18T14:30:00+05:45` |
| `<nep-multi-date-picker name="days">` | `days=2026-10-18&days=2026-10-20` |

## React forms

### Without state

With `name`, the component renders a hidden input, so `FormData` and server actions work:

```tsx
import { DatePicker } from '@nepdatejs/react';

export function Profile() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        console.log(data.get('dob')); // "2026-10-10"
      }}
    >
      <DatePicker name="dob" required aria-label="Date of birth" />
      <button>Save</button>
    </form>
  );
}
```

### With React Hook Form

Use `Controller`, since the value doesn't come from a native input change:

<!-- no-check -->
```tsx
import { Controller, useForm } from 'react-hook-form';
import { DatePicker } from '@nepdatejs/react';

export function Profile() {
  const { control, handleSubmit } = useForm({ defaultValues: { dob: '' } });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        name="dob"
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <DatePicker
            value={field.value}
            onChange={field.onChange}
            aria-label="Date of birth"
          />
        )}
      />
      <button>Save</button>
    </form>
  );
}
```

## Labels

Every field needs an accessible name. Any of these works:

```html
<!-- A label, joined by input-id -->
<label for="dob">Date of birth</label>
<nep-date-picker input-id="dob"></nep-date-picker>

<!-- A label attribute, when there's no visible label -->
<nep-date-picker label="Date of birth"></nep-date-picker>
```

```tsx
<>
  <label htmlFor="dob">Date of birth</label>
  <DatePicker id="dob" />

  <DatePicker aria-label="Date of birth" />
</>;
```

## Reset

A form reset puts the picker back to its starting value: `value` on the element, or
`defaultValue` in React.

## Disabled fields

`disabled` works on the picker, and elements also follow a surrounding
`<fieldset disabled>`. A disabled picker isn't submitted.

## Existing inputs

Already have an `<input name="dob" value="2026-10-10">`? `createDatePicker` can take it over and
keep it up to date, so nothing else in the form has to change. See
[Plain JavaScript API](/integrations/vanilla-api#enhancing-an-existing-input).
