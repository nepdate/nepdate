# Vue

[[toc]]

## Introduction

In Vue, use the [Web Components](./web-components). They need one setting so that Vue leaves
them alone.

## Setting up

```bash
npm install @nepdatejs/vanilla @nepdatejs/styles
```

Tell Vue that tags starting with `nep-` are custom elements:

```js
// vite.config.js
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('nep-') },
      },
    }),
  ],
});
```

Register the elements once, in `main.js`:

```js
import '@nepdatejs/styles';
import '@nepdatejs/vanilla/define';
```

## Using a picker

```vue
<script setup>
import { ref } from 'vue';

const dob = ref('2026-10-10');
</script>

<template>
  <nep-date-picker
    :value="dob"
    label="Date of birth"
    @change="dob = $event.detail.value"
  ></nep-date-picker>

  <p>Stored value: {{ dob }}</p>
</template>
```

`v-model` is for native inputs, so bind `:value` and listen for `@change` as above.

## Passing functions and lists

Add `.prop` so Vue sets a property instead of an attribute:

```vue
<script setup>
const isClosed = (date) => date.day === 1;
const presets = ['today', 'yesterday'];
</script>

<template>
  <nep-date-picker
    :isDateDisabled.prop="isClosed"
    :presets.prop="presets"
  ></nep-date-picker>
</template>
```

## A reusable component

Wrap it once to get `v-model` everywhere:

```vue
<!-- NepDateField.vue -->
<script setup>
defineProps(['modelValue']);
defineEmits(['update:modelValue']);
</script>

<template>
  <nep-date-picker
    :value="modelValue"
    @change="$emit('update:modelValue', $event.detail.value)"
  ></nep-date-picker>
</template>
```

```vue
<NepDateField v-model="dob" />
```

## Nuxt

Elements exist only in the browser, so register them in a client plugin,
`plugins/nepdate.client.js`, and set `vue.compilerOptions.isCustomElement` in `nuxt.config`. Wrap
pickers in `<ClientOnly>` if you see hydration warnings.

## Dates only

`@nepdatejs/core` is plain JavaScript and needs no setup, so it works in `computed` values, stores
and server routes alike.
