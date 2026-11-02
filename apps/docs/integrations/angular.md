# Angular

[[toc]]

## Introduction

In Angular, use the [Web Components](./web-components). They need one schema setting.

## Setting up

```bash
npm install @nepdatejs/vanilla @nepdatejs/styles
```

Add the stylesheet to `angular.json`:

```json
{
  "styles": ["node_modules/@nepdatejs/styles/index.css", "src/styles.css"]
}
```

Register the elements in `main.ts`:

```js
import '@nepdatejs/vanilla/define';
```

Allow custom elements in your component with `CUSTOM_ELEMENTS_SCHEMA`:

<!-- no-check -->
```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';

@Component({
  selector: 'app-profile',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <nep-date-picker
      [value]="dob()"
      label="Date of birth"
      (change)="dob.set($any($event).detail.value)"
    ></nep-date-picker>

    <p>Stored value: {{ dob() }}</p>
  `,
})
export class ProfileComponent {
  dob = signal('2026-10-10');
}
```

`[value]` binds a property, so functions and lists work the same way:

```html
<nep-date-picker [isDateDisabled]="isClosed" [presets]="presets"></nep-date-picker>
```

## Reactive forms

Inside a `<form>`, the element works as a normal field for a plain submit. To use `formControl`,
write a small `ControlValueAccessor` directive that sets `value` and listens for `change`:

<!-- no-check -->
```ts
import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'nep-date-picker[formControl], nep-date-picker[formControlName]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NepDateValueAccessor),
      multi: true,
    },
  ],
})
export class NepDateValueAccessor implements ControlValueAccessor {
  private element = inject(ElementRef).nativeElement;
  private notify: (value: string) => void = () => undefined;
  private touched: () => void = () => undefined;

  @HostListener('change', ['$event'])
  onChange(event: CustomEvent) {
    this.notify(event.detail.value);
    this.touched();
  }

  writeValue(value: string) {
    this.element.value = value ?? '';
  }

  registerOnChange(notify: (value: string) => void) {
    this.notify = notify;
  }

  registerOnTouched(touched: () => void) {
    this.touched = touched;
  }
}
```

## Dates only

`@nepdatejs/core` needs no setup, and works well in a service or a pipe:

<!-- no-check -->
```ts
import { Pipe, PipeTransform } from '@angular/core';
import { formatDate, fromIsoDate, toCalendar } from '@nepdatejs/core';

@Pipe({ name: 'bsDate', standalone: true })
export class BsDatePipe implements PipeTransform {
  transform(value: string | null): string {
    const date = fromIsoDate(value);

    return date ? formatDate(toCalendar(date, 'BS'), 'long') : '';
  }
}
```
