import { useSyncExternalStore } from 'react';
import { getConfig, type LocaleCode } from '@nepdatejs/core';

const neverChanges = (): (() => void) => () => undefined;

/** Used on the server and while hydrating, so both render the same text. */
function defaultLocale(): LocaleCode {
  return getConfig().defaultLocale;
}

/** Nepali names and digits when the page language is Nepali. Browser only. */
function pageLocale(): LocaleCode {
  return document.documentElement.lang.toLowerCase().startsWith('ne')
    ? 'ne'
    : defaultLocale();
}

/** The given locale, or else the page's language. */
export function usePageLocale(given: LocaleCode | undefined): LocaleCode {
  const page = useSyncExternalStore(neverChanges, pageLocale, defaultLocale);

  return given ?? page;
}
