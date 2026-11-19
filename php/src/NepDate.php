<?php

declare(strict_types=1);

namespace NepDate;

/**
 * The BS table in use by this process. Laravel patches it once at boot from the platform
 * settings (corrections entered by the platform admin) and shares the same patches with the
 * browser, so both sides convert identically.
 */
final class NepDate
{
    public const int FISCAL_YEAR_START_MONTH = 4;   // Shrawan

    private static ?BsTable $table = null;

    private function __construct() {}

    public static function table(): BsTable
    {
        return self::$table ??= BsTable::bundled();
    }

    public static function useTable(BsTable $table): void
    {
        self::$table = $table;
    }

    /**
     * @param  list<int>  $months
     */
    public static function patchBsYear(int $year, array $months): void
    {
        self::$table = self::table()->withPatchedYear($year, $months);
    }

    /** Back to the bundled table. */
    public static function reset(): void
    {
        self::$table = null;
    }

    /** The first day that can be converted, in either calendar. */
    public static function minDate(Calendar $calendar): CalendarDate
    {
        return self::dateOfEpoch(self::table()->firstEpoch(), $calendar);
    }

    /** The last day that can be converted, in either calendar. */
    public static function maxDate(Calendar $calendar): CalendarDate
    {
        return self::dateOfEpoch(self::table()->lastEpoch(), $calendar);
    }

    public static function dateOfEpoch(int $epoch, Calendar $calendar): CalendarDate
    {
        return $calendar === Calendar::AD ? AdDate::fromEpochDay($epoch) : BsDate::fromEpochDay($epoch);
    }

    public static function create(Calendar $calendar, int $year, int $month, int $day): CalendarDate
    {
        return $calendar === Calendar::AD ? AdDate::of($year, $month, $day) : BsDate::of($year, $month, $day);
    }

    public static function daysInMonth(Calendar $calendar, int $year, int $month): int
    {
        if ($calendar === Calendar::BS) {
            return self::table()->monthLength($year, $month);
        }
        if (! AdCalendar::isValid($year, $month, 1)) {
            throw new NepDateRangeException(NepDateRangeException::INVALID_DATE, \sprintf('AD %d-%d is not a month.', $year, $month));
        }

        return AdCalendar::monthLength($year, $month);
    }
}
