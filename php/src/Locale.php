<?php

declare(strict_types=1);

namespace NepDate;

/**
 * Digits and names for English ("en") and Nepali ("ne"). Loaded from data/locales.json, which is
 * generated from @nepdatejs/core so both sides spell months and weekdays the same way.
 * An unknown locale falls back to English, like the JS package.
 */
final class Locale
{
    private const array DEVANAGARI = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

    /** @var array<string, array{digits: list<string>, weekdays: array{long: list<string>, short: list<string>}, months: array{AD: array{long: list<string>, short: list<string>}, BS: array{long: list<string>, short: list<string>}}}>|null */
    private static ?array $locales = null;

    private function __construct() {}

    /**
     * @return array{digits: list<string>, weekdays: array{long: list<string>, short: list<string>}, months: array{AD: array{long: list<string>, short: list<string>}, BS: array{long: list<string>, short: list<string>}}}
     */
    public static function data(string $locale): array
    {
        if (self::$locales === null) {
            /** @var array{locales: array<string, array{digits: list<string>, weekdays: array{long: list<string>, short: list<string>}, months: array{AD: array{long: list<string>, short: list<string>}, BS: array{long: list<string>, short: list<string>}}}>} $json */
            $json = \json_decode((string) \file_get_contents(__DIR__.'/../data/locales.json'), true, flags: JSON_THROW_ON_ERROR);
            self::$locales = $json['locales'];
        }

        return self::$locales[$locale] ?? self::$locales['en'];
    }

    public static function has(string $locale): bool
    {
        self::data('en');

        return isset(self::$locales[$locale]);
    }

    /**
     * @return list<string>
     */
    public static function monthNames(Calendar $calendar, string $locale = 'en', string $width = 'long'): array
    {
        return self::data($locale)['months'][$calendar->value][$width === 'short' ? 'short' : 'long'];
    }

    /**
     * @return list<string> Sunday first
     */
    public static function weekdayNames(string $locale = 'en', string $width = 'long'): array
    {
        return self::data($locale)['weekdays'][$width === 'short' ? 'short' : 'long'];
    }

    public static function formatNumber(string|int $value, string $locale = 'en'): string
    {
        $digits = self::data($locale)['digits'];

        return (string) \preg_replace_callback('/[0-9]/', fn (array $m): string => $digits[(int) $m[0]], (string) $value);
    }

    public static function toAsciiDigits(string $value): string
    {
        return (string) \preg_replace_callback('/[०-९]/u', fn (array $m): string => (string) \array_search($m[0], self::DEVANAGARI, true), $value);
    }

    public static function toDevanagariDigits(string|int $value): string
    {
        return (string) \preg_replace_callback('/[0-9]/', fn (array $m): string => self::DEVANAGARI[(int) $m[0]], (string) $value);
    }
}
