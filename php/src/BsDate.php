<?php

declare(strict_types=1);

namespace NepDate;

/** A Bikram Sambat (BS) day. The year must be in the BS table. */
final readonly class BsDate extends CalendarDate
{
    public static function of(int $year, int $month, int $day): static
    {
        $length = NepDate::table()->monthLength($year, $month);
        if ($day < 1 || $day > $length) {
            throw new NepDateRangeException(
                NepDateRangeException::INVALID_DATE,
                \sprintf('BS %d-%d has %d days, not %d.', $year, $month, $length, $day),
            );
        }

        return new self($year, $month, $day);
    }

    public static function fromEpochDay(int $epochDay): static
    {
        $table = NepDate::table();
        if (! $table->covers($epochDay)) {
            [$y, $m, $d] = AdCalendar::fromEpoch($epochDay);
            [$fy, $fm, $fd] = AdCalendar::fromEpoch($table->firstEpoch());
            [$ly, $lm, $ld] = AdCalendar::fromEpoch($table->lastEpoch());

            throw new NepDateRangeException(
                NepDateRangeException::OUT_OF_TABLE,
                \sprintf('AD %d-%02d-%02d is outside the BS table (AD %d-%02d-%02d to %d-%02d-%02d).', $y, $m, $d, $fy, $fm, $fd, $ly, $lm, $ld),
            );
        }

        [$year, $month, $day] = $table->fromEpoch($epochDay);

        return new self($year, $month, $day);
    }

    public function calendar(): Calendar
    {
        return Calendar::BS;
    }

    public function toEpochDay(): int
    {
        return NepDate::table()->toEpoch($this->year, $this->month, $this->day);
    }
}
