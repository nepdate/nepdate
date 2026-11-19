<?php

declare(strict_types=1);

namespace NepDate;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

/** A Gregorian (AD) day. Any year within ±999,999; only conversion to BS is limited by the table. */
final readonly class AdDate extends CalendarDate
{
    public static function of(int $year, int $month, int $day): static
    {
        if (! AdCalendar::isValid($year, $month, $day)) {
            throw new NepDateRangeException(
                NepDateRangeException::INVALID_DATE,
                \abs($year) > AdCalendar::MAX_YEAR
                    ? \sprintf('AD year %d is outside ±%d.', $year, AdCalendar::MAX_YEAR)
                    : \sprintf('AD %d-%d-%d is not a valid date.', $year, $month, $day),
            );
        }

        return new self($year, $month, $day);
    }

    public static function fromEpochDay(int $epochDay): static
    {
        [$year, $month, $day] = AdCalendar::fromEpoch($epochDay);

        return self::of($year, $month, $day);
    }

    /** "YYYY-MM-DD", or the date part of a longer ISO timestamp. Null for anything else. */
    public static function fromIso(?string $value): ?self
    {
        if (\preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/', $value ?? '', $m) !== 1) {
            return null;
        }

        return AdCalendar::isValid((int) $m[1], (int) $m[2], (int) $m[3]) ? new self((int) $m[1], (int) $m[2], (int) $m[3]) : null;
    }

    /** The calendar day an instant falls on in a time zone (Nepal by default). */
    public static function fromDateTime(DateTimeInterface $instant, string $timeZone = 'Asia/Kathmandu'): self
    {
        $local = DateTimeImmutable::createFromInterface($instant)->setTimezone(new DateTimeZone($timeZone));

        return self::of((int) $local->format('Y'), (int) $local->format('n'), (int) $local->format('j'));
    }

    public function calendar(): Calendar
    {
        return Calendar::AD;
    }

    public function toEpochDay(): int
    {
        return AdCalendar::toEpoch($this->year, $this->month, $this->day);
    }
}
