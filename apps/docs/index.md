---
layout: home
hero:
  name: nepdate
  text: Bikram Sambat dates for JavaScript
  tagline: Convert, format and calculate BS and AD dates, then give people a calendar and date pickers in React, plain HTML or any framework.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Quick start
      link: /guide/quickstart
    - theme: alt
      text: Date converter
      link: /converter
    - theme: alt
      text: GitHub
      link: https://github.com/nepdate/nepdate
features:
  - title: Correct by construction
    details: Every day in the BS table converts to AD and back to itself. Invalid dates throw an error instead of being quietly changed.
  - title: AD and BS never mix
    details: AdDate and BsDate are different types, and the two calendars share only a day count, so a BS date cannot pass as an AD one.
  - title: Your database stays simple
    details: Pickers show BS, but forms and APIs always receive the AD date as YYYY-MM-DD, the same as a native date input.
  - title: Works everywhere
    details: Node, browsers, a plain script tag, React 18 and 19 with server rendering, and Web Components for Vue, Svelte, Angular and Laravel Blade.
  - title: Five pickers and a calendar
    details: Single dates, ranges, date and time, several separate dates, and a calendar. Each one is keyboard friendly and works on phones.
  - title: Made for Nepal
    details: English and Nepali names and digits, Nepal's fiscal year, Nepal time by default, and national holidays with a loader for each year's list.
---
