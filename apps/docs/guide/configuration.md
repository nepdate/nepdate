# Settings

[[toc]]

## Introduction

The defaults suit Nepal, so most apps change nothing. If you do need to change something, call
`configure` once when your app starts, before you use any other function.

```ts
import { configure } from '@nepdatejs/core';

configure({ defaultLocale: 'ne' });
```

Only the settings you pass are changed. Every value is checked first, so a bad value throws an
error and changes nothing.

## The settings

| Setting | Default | Meaning |
|---|---|---|
| `timeZone` | `'Asia/Kathmandu'` | The zone that decides "today" and the day of a timestamp |
| `weekStartsOn` | `0` (Sunday) | The first day of the week, `0` to `6` |
| `weekendDays` | `[6]` (Saturday) | Days treated as weekend |
| `defaultLocale` | `'en'` | The language used when a function isn't given one |

### Time zone

Any [IANA time zone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) name works:

```ts
import { configure, getConfig } from '@nepdatejs/core';

configure({ timeZone: 'Asia/Dubai' });

getConfig().timeZone; // → 'Asia/Dubai'
```

### Week and weekend

Nepal's government offices have Saturday and sometimes Sunday as holidays. To treat both as
the weekend:

```ts
import { bsDate, configure, isWeekend } from '@nepdatejs/core';

configure({ weekendDays: [6, 0] });

isWeekend(bsDate(2083, 7, 1)); // → true
```

Calendars and pickers use these settings too, and each component can also override them with
its own `weekStartsOn` and `weekendDays` options.

### Language

```ts
import { bsDate, configure, formatDate } from '@nepdatejs/core';

configure({ defaultLocale: 'ne' });

formatDate(bsDate(2083, 7, 1), 'long'); // → '१ कार्तिक २०८३'
formatDate(bsDate(2083, 7, 1), 'long', 'en'); // → '1 Kartik 2083'
```

## Reading and resetting

`getConfig` returns the current settings as a frozen object, and `resetConfig` goes back to
the defaults. `resetConfig` is mainly useful between tests.

```ts
import { configure, getConfig, resetConfig } from '@nepdatejs/core';

configure({ defaultLocale: 'ne' });
getConfig().defaultLocale; // → 'ne'

resetConfig();
getConfig().defaultLocale; // → 'en'
```

## Global state

`configure` changes a setting for the whole JavaScript process. On a server shared by many
users, don't call it per request. Pass the value directly instead, since every function that
reads a setting also takes it as an argument:

<!-- no-check -->
```ts
formatDate(date, 'long', user.locale);
today('BS', user.timeZone);
```
