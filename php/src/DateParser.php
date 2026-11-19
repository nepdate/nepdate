<?php

declare(strict_types=1);

namespace NepDate;

/**
 * Reads a date written year first ("2083-06-24", "2083/6/24", "2083.06.24", "20830624"), in ASCII
 * or Devanagari digits, in the calendar the caller names. Other orders are rejected, not guessed.
 */
final class DateParser
{
    private function __construct() {}

    public static function parse(?string $text, Calendar $calendar): ?CalendarDate
    {
        try {
            return self::parseStrict($text ?? '', $calendar);
        } catch (NepDateRangeException) {
            return null;
        }
    }

    public static function parseStrict(string $text, Calendar $calendar): CalendarDate
    {
        $ascii = \trim(Locale::toAsciiDigits($text));

        if (\preg_match('#^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$#', $ascii, $m) !== 1
            && \preg_match('/^(\d{4})(\d{2})(\d{2})$/', $ascii, $m) !== 1) {
            throw new NepDateRangeException(NepDateRangeException::INVALID_ARGUMENT, \sprintf('"%s" is not a date written as YYYY-MM-DD.', $text));
        }

        return NepDate::create($calendar, (int) $m[1], (int) $m[2], (int) $m[3]);
    }
}
