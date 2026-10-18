import { expectTypeOf, test } from 'vitest';
import { PACKAGE_NAME } from '@nepdate/core';

// Placeholder until CORE-001 lands: proves type tests run against the package source.
test('the package name is a literal type', () => {
  expectTypeOf(PACKAGE_NAME).toEqualTypeOf<'@nepdate/core'>();
});
