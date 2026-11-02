# Script tag (CDN)

[[toc]]

## Introduction

You can use nepdate with no build step, on any page. This suits server-rendered sites such as
Laravel Blade, Django or Rails, and simple static pages.

## Date pickers

Add the stylesheet and the script, then use the elements:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://unpkg.com/@nepdate/styles/index.css" />
    <script src="https://unpkg.com/@nepdate/vanilla/dist/nepdate-picker.global.js"></script>
  </head>
  <body>
    <form action="/save" method="post">
      <label for="dob">Date of birth</label>
      <nep-date-picker name="dob" input-id="dob" required></nep-date-picker>
      <button>Save</button>
    </form>
  </body>
</html>
```

The script includes everything, and registers the elements as soon as it loads. Its other functions
are on `window.NepDateElements`, for example `NepDateElements.createDatePicker`.

## Dates only

To convert and format with no components, load core. It's on `window.NepDate`:

```html
<script src="https://unpkg.com/@nepdate/core"></script>
<script>
  const today = NepDate.today('BS');

  document.title = NepDate.formatDate(today, 'long');
</script>
```

## Available files

| Package | File | Global |
|---|---|---|
| `@nepdate/vanilla` | `dist/nepdate-picker.global.js` | `NepDateElements` |
| `@nepdate/core` | `dist/nepdate.global.js` | `NepDate` |
| `@nepdate/calendar` | `dist/nepdate-calendar.global.js` | `NepDateCalendar` |
| `@nepdate/datepicker` | `dist/nepdate-datepicker.global.js` | `NepDatePicker` |
| `@nepdate/styles` | `index.css` | |

## Pin a version

For production, pin a version so a new release can't change your site unexpectedly:

```html
<link rel="stylesheet" href="https://unpkg.com/@nepdate/styles@0.1.0/index.css" />
<script src="https://unpkg.com/@nepdate/vanilla@0.1.0/dist/nepdate-picker.global.js"></script>
```

[jsDelivr](https://www.jsdelivr.com/) works too: replace `https://unpkg.com/` with
`https://cdn.jsdelivr.net/npm/`.

## Hosting the files yourself

Copy the two files into your public folder and point the tags at them. Nothing else is loaded from
anywhere, so this also works on an intranet with no internet access.
