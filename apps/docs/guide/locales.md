# Languages

[[toc]]

## Introduction

nepdate includes English (`en`) and Nepali (`ne`). A locale covers digits, month and weekday
names, button labels, shortcut names and error messages.

```ts
import { bsDate, formatDate } from '@nepdate/core';

const date = bsDate(2083, 7, 1);

formatDate(date, 'full', 'en'); // → 'Sunday, 1 Kartik 2083'
formatDate(date, 'full', 'ne'); // → 'आइतबार, १ कार्तिक २०८३'
```

## Choosing a language

### For one call

Pass the locale as an argument, as above.

### For the whole app

```ts
import { configure } from '@nepdate/core';

configure({ defaultLocale: 'ne' });
```

### For a component

Components take a `locale` option:

```tsx
<DatePicker locale="ne" aria-label="मिति" />;
```

```html
<nep-date-picker locale="ne"></nep-date-picker>
```

The React `<DatePicker>` also picks Nepali by itself when the page has `<html lang="ne">`.

## Month names

BS month names have more than one common spelling. nepdate uses these:

| # | English | Nepali | Roughly |
|---|---|---|---|
| 1 | Baisakh | बैशाख | Apr–May |
| 2 | Jestha | जेठ | May–Jun |
| 3 | Asar | असार | Jun–Jul |
| 4 | Shrawan | साउन | Jul–Aug |
| 5 | Bhadra | भदौ | Aug–Sep |
| 6 | Ashwin | असोज | Sep–Oct |
| 7 | Kartik | कार्तिक | Oct–Nov |
| 8 | Mangsir | मङ्सिर | Nov–Dec |
| 9 | Poush | पुस | Dec–Jan |
| 10 | Magh | माघ | Jan–Feb |
| 11 | Falgun | फाल्गुण | Feb–Mar |
| 12 | Chaitra | चैत | Mar–Apr |

To use different spellings, register a locale based on a built-in one, as shown next.

## Adding or changing a language

`registerLocale` adds a language or replaces one. Start from an existing locale and change what
you need:

```ts
import { bsDate, formatDate, getLocale, registerLocale } from '@nepdate/core';

const en = getLocale('en');

registerLocale('en-school', {
  ...en,
  labels: { ...en.labels, today: 'Now' },
  months: {
    ...en.months,
    BS: {
      long: ['Baishakh', ...en.months.BS.long.slice(1)],
      short: en.months.BS.short,
    },
  },
});

formatDate(bsDate(2083, 1, 1), 'long', 'en-school'); // → '1 Baishakh 2083'
```

List lengths are checked: 10 digits, 7 weekdays and 12 months. A wrong length throws an error.
A locale that hasn't been registered falls back to English.

## What a locale contains

| Key | Contents |
|---|---|
| `digits` | Ten digits, `0` to `9` |
| `months` | `AD` and `BS`, each with `long` and `short` lists |
| `weekdays` | `long`, `short` and `narrow` lists, starting on Sunday |
| `calendarNames` | The names shown for `AD` and `BS` |
| `labels` | Button and field labels, such as `today`, `clear` and `openCalendar` |
| `time` | The `am` and `pm` words |
| `presets` | Names of the built-in [shortcuts](/pickers/presets) |
| `messages` | Validation messages. `{min}` and `{max}` are filled in for you |

## Translating messages

Change any message the same way:

```ts
import { getLocale, registerLocale } from '@nepdate/core';

const en = getLocale('en');

registerLocale('en', {
  ...en,
  messages: { ...en.messages, unavailable: 'Sorry, that day is closed.' },
});

getLocale('en').messages.unavailable; // → 'Sorry, that day is closed.'
```
