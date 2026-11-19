<?php

declare(strict_types=1);

namespace NepDate;

use JsonSerializable;
use Stringable;

/**
 * A day in one calendar. AD and BS dates convert through the day count since 1970-01-01
 * (the "epoch day"), the only value the two calendars share. Immutable.
 */
abstract readonly class CalendarDate implements JsonSerializable, Stringable
{
    final protected function __construct(public int $year, public int $month, public int $day) {}

    abstract public function calendar(): Calendar;

    abstract public function toEpochDay(): int;

    abstract public static function of(int $year, int $month, int $day): static;

    abstract public static function fromEpochDay(int $epochDay): static;

    // ── Conversion ───────────────────────────────────────────────────────

    public function toAd(): AdDate
    {
        return $this instanceof AdDate ? $this : AdDate::fromEpochDay($this->toEpochDay());
    }

    public function toBs(): BsDate
    {
        return $this instanceof BsDate ? $this : BsDate::fromEpochDay($this->toEpochDay());
    }

    public function toCalendar(Calendar $calendar): CalendarDate
    {
        return $calendar === Calendar::AD ? $this->toAd() : $this->toBs();
    }

    /** The AD day as "YYYY-MM-DD": the form to store and send. */
    public function toIsoDate(): string
    {
        $ad = $this->toAd();
        if ($ad->year < 0 || $ad->year > 9999) {
            throw new NepDateRangeException(NepDateRangeException::INVALID_ARGUMENT, \sprintf('AD year %d cannot be written as YYYY-MM-DD.', $ad->year));
        }

        return \sprintf('%04d-%02d-%02d', $ad->year, $ad->month, $ad->day);
    }

    public function isConvertible(): bool
    {
        return NepDate::table()->covers($this->toEpochDay());
    }

    /** The BS year is after the last year checked against a published calendar. */
    public function isProjected(): bool
    {
        return NepDate::table()->isProjectedYear($this->toBs()->year);
    }

    // ── Arithmetic (in the date's own calendar) ──────────────────────────

    public function addDays(int $days): static
    {
        return static::fromEpochDay($this->toEpochDay() + $days);
    }

    /** The day is capped to the new month's length (31 Jan + 1 month = 28/29 Feb). */
    public function addMonths(int $months): static
    {
        $index = $this->year * 12 + ($this->month - 1) + $months;
        $year = AdCalendar::floorDiv($index, 12);
        $month = $index - $year * 12 + 1;

        return static::of($year, $month, \min($this->day, NepDate::daysInMonth($this->calendar(), $year, $month)));
    }

    public function addYears(int $years): static
    {
        return $this->addMonths($years * 12);
    }

    public function startOfMonth(): static
    {
        return static::of($this->year, $this->month, 1);
    }

    public function endOfMonth(): static
    {
        return static::of($this->year, $this->month, $this->daysInMonth());
    }

    public function startOfYear(): static
    {
        return static::of($this->year, 1, 1);
    }

    public function endOfYear(): static
    {
        return static::of($this->year, 12, NepDate::daysInMonth($this->calendar(), $this->year, 12));
    }

    /** @param int $weekStartsOn 0 = Sunday … 6 = Saturday */
    public function startOfWeek(int $weekStartsOn = 0): static
    {
        $this->assertWeekday($weekStartsOn);

        return $this->addDays(-(($this->dayOfWeek() - $weekStartsOn + 7) % 7));
    }

    public function endOfWeek(int $weekStartsOn = 0): static
    {
        return $this->startOfWeek($weekStartsOn)->addDays(6);
    }

    public function daysInMonth(): int
    {
        return NepDate::daysInMonth($this->calendar(), $this->year, $this->month);
    }

    /** Whole days from $other to this date (positive when this is later). Calendars may differ. */
    public function differenceInDays(CalendarDate $other): int
    {
        return $this->toEpochDay() - $other->toEpochDay();
    }

    // ── Compare (by the day, across calendars) ───────────────────────────

    /** 0 = Sunday … 6 = Saturday. */
    public function dayOfWeek(): int
    {
        return ((($this->toEpochDay() + 4) % 7) + 7) % 7;
    }

    /** @param list<int> $weekendDays Saturday in Nepal */
    public function isWeekend(array $weekendDays = [6]): bool
    {
        return \in_array($this->dayOfWeek(), $weekendDays, true);
    }

    public function compareTo(CalendarDate $other): int
    {
        return $this->toEpochDay() <=> $other->toEpochDay();
    }

    public function isSameDay(CalendarDate $other): bool
    {
        return $this->toEpochDay() === $other->toEpochDay();
    }

    public function isBefore(CalendarDate $other): bool
    {
        return $this->toEpochDay() < $other->toEpochDay();
    }

    public function isAfter(CalendarDate $other): bool
    {
        return $this->toEpochDay() > $other->toEpochDay();
    }

    /** Same month as this date, judged in this date's calendar. */
    public function isSameMonth(CalendarDate $other): bool
    {
        $o = $other->toCalendar($this->calendar());

        return $o->year === $this->year && $o->month === $this->month;
    }

    public function isSameYear(CalendarDate $other): bool
    {
        return $other->toCalendar($this->calendar())->year === $this->year;
    }

    /** On or after $min and on or before $max; a missing bound is open. */
    public function isWithin(?CalendarDate $min = null, ?CalendarDate $max = null): bool
    {
        return (! $min instanceof CalendarDate || $this->compareTo($min) >= 0) && (! $max instanceof CalendarDate || $this->compareTo($max) <= 0);
    }

    /** This date, or the nearest bound when outside, in this date's calendar. */
    public function clamp(?CalendarDate $min = null, ?CalendarDate $max = null): static
    {
        if ($min instanceof CalendarDate && $this->isBefore($min)) {
            return static::fromEpochDay($min->toEpochDay());
        }
        if ($max instanceof CalendarDate && $this->isAfter($max)) {
            return static::fromEpochDay($max->toEpochDay());
        }

        return $this;
    }

    // ── Text ─────────────────────────────────────────────────────────────

    /**
     * Formats in this date's calendar. Named: iso, cbms, short, long, full. Tokens: Y y m n d j
     * F M l D; a backslash prints the next character as is. Digits follow the locale.
     */
    public function format(string $pattern = 'iso', string $locale = 'en'): string
    {
        return DateFormat::format($this, $pattern, $locale);
    }

    public function equals(CalendarDate $other): bool
    {
        return $other->calendar() === $this->calendar() && $this->isSameDay($other);
    }

    public function __toString(): string
    {
        return \sprintf('%s %d-%02d-%02d', $this->calendar()->value, $this->year, $this->month, $this->day);
    }

    /**
     * @return array{calendar: string, year: int, month: int, day: int}
     */
    public function jsonSerialize(): array
    {
        return ['calendar' => $this->calendar()->value, 'year' => $this->year, 'month' => $this->month, 'day' => $this->day];
    }

    private function assertWeekday(int $value): void
    {
        if ($value < 0 || $value > 6) {
            throw new NepDateRangeException(NepDateRangeException::INVALID_ARGUMENT, \sprintf('%d is not a weekday (0–6).', $value));
        }
    }
}
