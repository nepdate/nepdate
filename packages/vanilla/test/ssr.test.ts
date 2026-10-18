// Plain Node: no DOM. The package must import without touching window or HTMLElement.
import { expect, test } from 'vitest';

test('importing the package during server rendering does not throw', async () => {
  const module = await import('@nepdate/vanilla');
  expect(module.ELEMENT_NAMES.datePicker).toBe('nep-date-picker');
  expect(() => {
    module.defineElements();
  }).not.toThrow();
});
