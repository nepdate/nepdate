# Laravel and Blade

[[toc]]

## Introduction

nepdate fits Laravel well. Because the form submits a plain AD date, your migrations, models,
validation and Eloquent queries don't change at all. BS only exists in the browser.

## Installation

### With Vite

```bash
npm install @nepdate/vanilla @nepdate/styles
```

In `resources/js/app.js`:

```js
import '@nepdate/styles';
import '@nepdate/vanilla/define';
```

Make sure your layout loads it:

```blade
@vite(['resources/css/app.css', 'resources/js/app.js'])
```

### Without a build step

Add these to your layout's `<head>`:

```html
<link rel="stylesheet" href="https://unpkg.com/@nepdate/styles/index.css" />
<script src="https://unpkg.com/@nepdate/vanilla/dist/nepdate-picker.global.js"></script>
```

## A form

In a Blade view, use the element like any other input. `old()` keeps the value after a validation
error, and it's already AD:

```blade
<form method="POST" action="{{ route('students.store') }}">
    @csrf

    <label for="dob">Date of birth</label>
    <nep-date-picker
        name="dob"
        input-id="dob"
        value="{{ old('dob', $student->dob?->format('Y-m-d')) }}"
        max="{{ now()->format('Y-m-d') }}"
        required
    ></nep-date-picker>

    @error('dob')
        <p class="error">{{ $message }}</p>
    @enderror

    <button type="submit">Save</button>
</form>
```

Whichever calendar the person typed in, the request contains `dob=2064-03-12`.

## Validating

Use Laravel's normal date rules:

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'dob' => ['required', 'date_format:Y-m-d', 'before:today'],
    ]);

    Student::create($validated);

    return back();
}
```

For a range, compare the two fields:

```php
$request->validate([
    'leave-start' => ['required', 'date_format:Y-m-d'],
    'leave-end' => ['required', 'date_format:Y-m-d', 'after_or_equal:leave-start'],
]);
```

## Storing

Keep a normal `date` column, and cast it in your model:

```php
// Migration
$table->date('dob');

// Model
protected function casts(): array
{
    return ['dob' => 'date'];
}
```

Queries, sorting and `whereBetween` all work, because the column holds real dates.

## A Blade component

Save some repetition with an anonymous component, `resources/views/components/date-field.blade.php`:

```blade
@props(['name', 'label', 'value' => null])

<div>
    <label for="{{ $name }}">{{ $label }}</label>

    <nep-date-picker
        name="{{ $name }}"
        input-id="{{ $name }}"
        value="{{ old($name, $value) }}"
        {{ $attributes }}
    ></nep-date-picker>

    @error($name)
        <p class="error">{{ $message }}</p>
    @enderror
</div>
```

Then use it anywhere:

```blade
<x-date-field name="dob" label="Date of birth" :value="$student->dob?->format('Y-m-d')" required />
```

## Showing dates in BS

Render dates in the browser with core. For example, print AD dates in the page and convert them
when it loads:

```blade
<time data-bs="{{ $student->dob->format('Y-m-d') }}">
    {{ $student->dob->format('Y-m-d') }}
</time>
```

```js
import { formatDate, fromIsoDate, toCalendar } from '@nepdate/core';

for (const element of document.querySelectorAll('[data-bs]')) {
  const date = fromIsoDate(element.dataset.bs);

  if (date) {
    element.textContent = formatDate(toCalendar(date, 'BS'), 'long');
  }
}
```

nepdate is a JavaScript library, so converting on the server inside PHP, for example for a PDF,
needs a PHP package or a small Node service.

## Several dates

To get an array in PHP, add `[]` to the name:

```blade
<nep-multi-date-picker name="days_off[]"></nep-multi-date-picker>
```

```php
$request->validate([
    'days_off' => ['required', 'array', 'max:5'],
    'days_off.*' => ['date_format:Y-m-d'],
]);
```

## Date and time

The value is an ISO timestamp with an offset, which Carbon reads directly and converts to UTC if
your app stores UTC:

```php
$request->validate(['starts_at' => ['required', 'date']]);

$startsAt = Carbon::parse($request->input('starts_at'));
```

## Inertia and React

With Inertia, use [`@nepdate/react`](./react) and bind it to the form helper:

<!-- no-check -->
```tsx
import { useForm } from '@inertiajs/react';
import { DatePicker } from '@nepdate/react';

export default function Create() {
  const { data, setData, post, errors } = useForm({ dob: '' });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        post('/students');
      }}
    >
      <DatePicker
        value={data.dob}
        onChange={(value) => setData('dob', value)}
        aria-label="Date of birth"
        aria-invalid={Boolean(errors.dob)}
      />
      {errors.dob && <p>{errors.dob}</p>}
      <button>Save</button>
    </form>
  );
}
```

## Livewire

`wire:ignore` stops Livewire redrawing the element, and a change listener sends the value back:

```blade
<div wire:ignore>
    <nep-date-picker
        value="{{ $dob }}"
        x-on:change="$wire.set('dob', $event.detail.value)"
    ></nep-date-picker>
</div>
```

That example uses Alpine, which comes with Livewire 3.
