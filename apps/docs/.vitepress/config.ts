import { defineConfig } from 'vitepress';

const REPO = 'https://github.com/nepdate/nepdate';

export default defineConfig({
  title: 'nepdate',
  description:
    'Bikram Sambat (BS) and AD dates for JavaScript: a date engine with no dependencies, plus a calendar and date pickers for React, Web Components and any framework.',
  // Served from https://nepdate.github.io/nepdate/. Set DOCS_BASE=/ to serve from a domain's root.
  base: process.env['DOCS_BASE'] ?? '/nepdate/',
  cleanUrls: true,
  lastUpdated: true,
  head: [['meta', { name: 'theme-color', content: '#2563eb' }]],
  vue: {
    // The live examples are the real custom elements.
    template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('nep-') } },
  },
  vite: {
    // Use the packages' sources, so the docs need no build of them first.
    resolve: { conditions: ['@nepdate/source'] },
    ssr: { resolve: { conditions: ['@nepdate/source'] } },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: 'Pickers', link: '/pickers/overview', activeMatch: '/pickers/' },
      {
        text: 'Integrations',
        link: '/integrations/react',
        activeMatch: '/integrations/',
      },
      { text: 'API reference', link: '/reference/core', activeMatch: '/reference/' },
      { text: 'Converter', link: '/converter' },
      {
        text: '0.1',
        items: [
          { text: 'Release notes', link: '/guide/release-notes' },
          { text: 'Contributing', link: '/guide/contributing' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Prologue',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Release notes', link: '/guide/release-notes' },
            { text: 'Contributing', link: '/guide/contributing' },
          ],
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick start', link: '/guide/quickstart' },
            { text: 'How it works', link: '/guide/concepts' },
          ],
        },
        {
          text: 'Working with Dates',
          items: [
            { text: 'Creating dates', link: '/guide/dates' },
            { text: 'Converting BS and AD', link: '/guide/conversion' },
            { text: 'Formatting', link: '/guide/formatting' },
            { text: 'Parsing', link: '/guide/parsing' },
            { text: 'Date arithmetic', link: '/guide/arithmetic' },
            { text: 'Comparing dates', link: '/guide/comparing' },
            { text: 'Fiscal years', link: '/guide/fiscal-year' },
            { text: 'Today, time and time zones', link: '/guide/time' },
          ],
        },
        {
          text: 'Configuration',
          items: [
            { text: 'Settings', link: '/guide/configuration' },
            { text: 'Languages', link: '/guide/locales' },
            { text: 'The BS table', link: '/guide/bs-table' },
            { text: 'Errors', link: '/guide/errors' },
          ],
        },
        {
          text: 'Holidays',
          items: [{ text: 'Nepal holidays', link: '/guide/holidays' }],
        },
        {
          text: 'Styling',
          items: [
            { text: 'Theming', link: '/guide/theming' },
            { text: 'Markup and classes', link: '/guide/markup' },
          ],
        },
        {
          text: 'Recipes',
          items: [
            { text: 'Storing and showing dates', link: '/guide/storing-dates' },
            { text: 'A leave request form', link: '/guide/recipe-leave-form' },
            { text: 'Reports by fiscal year', link: '/guide/recipe-fiscal-report' },
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
      ],
      '/pickers/': [
        {
          text: 'Pickers',
          items: [
            { text: 'Overview', link: '/pickers/overview' },
            { text: 'Date picker', link: '/pickers/date-picker' },
            { text: 'Date range picker', link: '/pickers/range-picker' },
            { text: 'Date and time picker', link: '/pickers/date-time-picker' },
            { text: 'Multiple dates', link: '/pickers/multi-date-picker' },
            { text: 'Calendar', link: '/pickers/calendar' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Limits and validation', link: '/pickers/validation' },
            { text: 'Shortcuts (presets)', link: '/pickers/presets' },
            { text: 'Holidays and events', link: '/pickers/holidays-events' },
            { text: 'Forms', link: '/pickers/forms' },
            { text: 'Layouts: popover, sheet, inline', link: '/pickers/layouts' },
            { text: 'Typing and input masking', link: '/pickers/typing' },
            { text: 'Accessibility', link: '/pickers/accessibility' },
          ],
        },
      ],
      '/integrations/': [
        {
          text: 'Frameworks',
          items: [
            { text: 'React', link: '/integrations/react' },
            { text: 'Next.js and server rendering', link: '/integrations/nextjs' },
            { text: 'Web Components', link: '/integrations/web-components' },
            { text: 'Plain JavaScript API', link: '/integrations/vanilla-api' },
            { text: 'Script tag (CDN)', link: '/integrations/cdn' },
            { text: 'Vue', link: '/integrations/vue' },
            { text: 'Svelte', link: '/integrations/svelte' },
            { text: 'Angular', link: '/integrations/angular' },
          ],
        },
        {
          text: 'Back end',
          items: [
            { text: 'Laravel and Blade', link: '/integrations/laravel' },
            { text: 'Node.js', link: '/integrations/node' },
          ],
        },
        {
          text: 'Build your own',
          items: [
            { text: 'Headless React hooks', link: '/integrations/headless-react' },
            { text: 'Framework-free stores', link: '/integrations/stores' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'API Reference',
          items: [
            { text: '@nepdate/core', link: '/reference/core' },
            { text: '@nepdate/calendar', link: '/reference/calendar' },
            { text: '@nepdate/datepicker', link: '/reference/datepicker' },
            { text: '@nepdate/react', link: '/reference/react' },
            { text: '@nepdate/vanilla', link: '/reference/vanilla' },
            { text: '@nepdate/holidays', link: '/reference/holidays' },
            { text: '@nepdate/styles', link: '/reference/styles' },
            { text: '@nepdate/dom', link: '/reference/dom' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: REPO }],
    editLink: {
      pattern: `${REPO}/edit/main/apps/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT licence.',
      copyright: 'Copyright © Shishir Rai and nepdate contributors',
    },
    search: { provider: 'local' },
    outline: { level: [2, 3], label: 'On this page' },
  },
});
