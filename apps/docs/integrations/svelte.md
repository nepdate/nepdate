# Svelte

[[toc]]

## Introduction

Svelte works well with custom elements, so the [Web Components](./web-components) need no special
setup.

## Setting up

```bash
npm install @nepdatejs/vanilla @nepdatejs/styles
```

Import these once, for example in your root layout or `main.js`:

```js
import '@nepdatejs/styles';
import '@nepdatejs/vanilla/define';
```

## Using a picker

```svelte
<script>
  let dob = $state('2026-10-10');
</script>

<nep-date-picker
  value={dob}
  label="Date of birth"
  onchange={(event) => (dob = event.detail.value)}
></nep-date-picker>

<p>Stored value: {dob}</p>
```

Svelte sets a property when the element has one, so functions and lists work directly:

```svelte
<nep-date-picker
  isDateDisabled={(date) => date.day === 1}
  presets={['today', 'yesterday']}
></nep-date-picker>
```

On Svelte 4, use `on:change` in place of `onchange`.

## SvelteKit

Elements exist only in the browser, so register them when the component mounts:

```svelte
<script>
  import { onMount } from 'svelte';

  onMount(() => import('@nepdatejs/vanilla/define'));
</script>
```

Import `@nepdatejs/styles` in your root `+layout.svelte`. `@nepdatejs/core` works on the server as is.
