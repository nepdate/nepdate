<?php

declare(strict_types=1);

namespace NepDate;

/**
 * The Gregorian calendar by arithmetic only (Howard Hinnant's days_from_civil and
 * civil_from_days). Works for any year within ±MAX_YEAR.
 *
 * @internal
 */
final class AdCalendar
{
    public const int MAX_YEAR = 999_999;

    private const int DAYS_BEFORE_EPOCH = 719_468;

    private const int DAYS_PER_ERA = 146_097;

    private const array MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    private function __construct() {}

    public static function isLeapYear(int $year): bool
    {
        return ($year % 4 === 0 && $year % 100 !== 0) || $year % 400 === 0;
    }

    public static function monthLength(int $year, int $month): int
    {
        return $month === 2 && self::isLeapYear($year) ? 29 : self::MONTH_DAYS[$month - 1];
    }

    public static function isValid(int $year, int $month, int $day): bool
    {
        return \abs($year) <= self::MAX_YEAR
            && $month >= 1 && $month <= 12
            && $day >= 1 && $day <= self::monthLength($year, $month);
    }

    public static function toEpoch(int $year, int $month, int $day): int
    {
        $y = $month <= 2 ? $year - 1 : $year;
        $era = self::floorDiv($y, 400);
        $yearOfEra = $y - $era * 400;
        $dayOfYear = \intdiv(153 * ($month + ($month > 2 ? -3 : 9)) + 2, 5) + $day - 1;
        $dayOfEra = $yearOfEra * 365 + \intdiv($yearOfEra, 4) - \intdiv($yearOfEra, 100) + $dayOfYear;

        return $era * self::DAYS_PER_ERA + $dayOfEra - self::DAYS_BEFORE_EPOCH;
    }

    /**
     * @return array{0: int, 1: int, 2: int} year, month, day
     */
    public static function fromEpoch(int $epoch): array
    {
        $z = $epoch + self::DAYS_BEFORE_EPOCH;
        $era = self::floorDiv($z, self::DAYS_PER_ERA);
        $dayOfEra = $z - $era * self::DAYS_PER_ERA;
        $yearOfEra = \intdiv($dayOfEra - \intdiv($dayOfEra, 1460) + \intdiv($dayOfEra, 36_524) - \intdiv($dayOfEra, 146_096), 365);
        $dayOfYear = $dayOfEra - (365 * $yearOfEra + \intdiv($yearOfEra, 4) - \intdiv($yearOfEra, 100));
        $shiftedMonth = \intdiv(5 * $dayOfYear + 2, 153);
        $day = $dayOfYear - \intdiv(153 * $shiftedMonth + 2, 5) + 1;
        $month = $shiftedMonth < 10 ? $shiftedMonth + 3 : $shiftedMonth - 9;

        return [$yearOfEra + $era * 400 + ($month <= 2 ? 1 : 0), $month, $day];
    }

    /** Division rounded towards minus infinity (JS Math.floor(a / b)); PHP's intdiv truncates. */
    public static function floorDiv(int $a, int $b): int
    {
        $q = \intdiv($a, $b);

        return ($a % $b !== 0 && (($a < 0) !== ($b < 0))) ? $q - 1 : $q;
    }
}
