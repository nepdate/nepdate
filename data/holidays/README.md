# Yearly holiday lists

Festivals such as Dashain, Tihar and Chhath fall on different BS dates each year (they follow the lunar calendar), so they can't be computed. Each year's list comes from the government's published holiday notice.

Add one file per BS year, `<year>.json`, in this format:

```json
{
  "year": 2083,
  "source": "https://… (link to the published notice)",
  "holidays": [
    {
      "id": "example-festival",
      "date": "2083-06-24",
      "name": { "en": "Example Festival", "ne": "उदाहरण पर्व" },
      "type": "festival"
    }
  ]
}
```

| Field    | Rule                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------ |
| `year`   | The BS year the notice covers                                                                    |
| `source` | Required: a link to the notice                                                                   |
| `id`     | Unique in the file; reuse a fixed day's id (e.g. `constitution-day`) to replace it for that year |
| `date`   | BS `YYYY-MM-DD` inside `year`; ASCII or Devanagari digits                                        |
| `name`   | Both `en` and `ne`                                                                               |
| `type`   | `national`, `festival` (default), `observance` or `custom`                                       |

`pnpm check:holidays` (part of `pnpm verify`) validates every file here. Only add a list copied from a published notice; never estimate festival dates.

Apps load a list with:

```ts
import { loadHolidayFile } from '@nepdate/holidays';
loadHolidayFile(await (await fetch('/holidays/2083.json')).json());
```
