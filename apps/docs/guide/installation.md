# Installation

[[toc]]

::: warning Not on npm yet
The first release hasn't been published, so the `npm install` commands below won't work yet.
Until then, you can build the packages from
[the repository](https://github.com/nepdate/nepdate).
:::

## Requirements

- Node 18 or newer, if you run nepdate on a server or use a bundler.
- A modern browser for the components.
- TypeScript is optional. Types are included if you use it.

## Choose your packages

### Dates only

For a Node service, a script, or any code that only needs conversion and formatting:

::: code-group

```bash [npm]
npm install @nepdatejs/core
```

```bash [pnpm]
pnpm add @nepdatejs/core
```

```bash [yarn]
yarn add @nepdatejs/core
```

:::

### React

::: code-group

```bash [npm]
npm install @nepdatejs/react @nepdatejs/styles
```

```bash [pnpm]
pnpm add @nepdatejs/react @nepdatejs/styles
```

```bash [yarn]
yarn add @nepdatejs/react @nepdatejs/styles
```

:::

Import the stylesheet once, usually in your app's entry file:

```ts
import '@nepdatejs/styles';
```

`@nepdatejs/react` needs React 18 or 19 as a peer dependency. It installs `@nepdatejs/core`
for you, but add it to your own `package.json` if you import from it directly.

### Vue, Svelte, Angular, or plain JavaScript with a bundler

These all use the Web Components:

::: code-group

```bash [npm]
npm install @nepdatejs/vanilla @nepdatejs/styles
```

```bash [pnpm]
pnpm add @nepdatejs/vanilla @nepdatejs/styles
```

```bash [yarn]
yarn add @nepdatejs/vanilla @nepdatejs/styles
```

:::

Then register the elements once:

```js
import '@nepdatejs/styles';
import '@nepdatejs/vanilla/define';
```

### A script tag, with no build step

For plain HTML, Laravel Blade, Django or Rails templates, add two lines to your page:

```html
<link rel="stylesheet" href="https://unpkg.com/@nepdatejs/styles/index.css" />
<script src="https://unpkg.com/@nepdatejs/vanilla/dist/nepdate-picker.global.js"></script>
```

See [Script tag (CDN)](/integrations/cdn) for more, including pinning a version.

### Optional packages

```bash
npm install @nepdatejs/holidays
```

[`@nepdatejs/holidays`](./holidays) adds Nepal's national holidays. To build your own UI, install
[`@nepdatejs/calendar` or `@nepdatejs/datepicker`](/integrations/stores) directly.

## Check that it works

Run this in Node, or anywhere you can import from `@nepdatejs/core`:

```ts
import { formatDate, today } from '@nepdatejs/core';

console.log(formatDate(today('BS'), 'full'));
```

It prints today's date in BS, for example `Sunday, 1 Kartik 2083`.

## TypeScript

Types come with each package. For the best experience, turn on `strict` in your
`tsconfig.json`, which lets the compiler catch a BS date passed where an AD date is expected.
The packages work with `moduleResolution` set to `bundler`, `node16` or `nodenext`.
