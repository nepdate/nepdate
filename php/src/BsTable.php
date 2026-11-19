<?php

declare(strict_types=1);

namespace NepDate;

/**
 * The Bikram Sambat month-length table: twelve month lengths per BS year, starting at
 * $firstYear, whose 1 Baisakh is day $epochStart (days since 1970-01-01). Immutable.
 */
final class BsTable
{
    /** Days a verified year may have. Projected years may be off by one. */
    private const array VERIFIED_YEAR_DAYS = [365, 366];

    private const array PROJECTED_YEAR_DAYS = [364, 365, 366, 367];

    public readonly int $lastYear;

    /** @var list<int> day count of 1 Baisakh of each year, plus one entry for the end */
    private readonly array $yearStart;

    /** @var list<list<int>> days from 1 Baisakh to the first of each month */
    private readonly array $monthOffset;

    private static ?self $bundled = null;

    /**
     * @param  list<list<int>>  $years
     */
    private function __construct(
        public readonly int $firstYear,
        public readonly int $epochStart,
        public readonly int $verifiedThrough,
        public readonly array $years,
    ) {
        $this->validate($firstYear, $verifiedThrough, $years);

        $yearStart = [];
        $monthOffset = [];
        $start = $epochStart;
        foreach ($years as $months) {
            $yearStart[] = $start;
            $offsets = [];
            $offset = 0;
            foreach ($months as $days) {
                $offsets[] = $offset;
                $offset += $days;
            }
            $monthOffset[] = $offsets;
            $start += $offset;
        }
        $yearStart[] = $start;

        $this->yearStart = $yearStart;
        $this->monthOffset = $monthOffset;
        $this->lastYear = $firstYear + \count($years) - 1;
    }

    /**
     * @param  list<list<int>>  $years
     */
    public static function of(int $firstYear, int $epochStart, int $verifiedThrough, array $years): self
    {
        return new self($firstYear, $epochStart, $verifiedThrough, $years);
    }

    /** The table bundled with the package (data/bs-table.json, generated from @nepdatejs/core). */
    public static function bundled(): self
    {
        if (! self::$bundled instanceof BsTable) {
            $json = \file_get_contents(__DIR__.'/../data/bs-table.json');
            /** @var array{firstYear: int, epochStart: int, verifiedThrough: int, years: list<list<int>>} $data */
            $data = \json_decode((string) $json, true, flags: JSON_THROW_ON_ERROR);
            self::$bundled = new self($data['firstYear'], $data['epochStart'], $data['verifiedThrough'], $data['years']);
        }

        return self::$bundled;
    }

    /** First and last day counts the table covers. */
    public function firstEpoch(): int
    {
        return $this->yearStart[0];
    }

    public function lastEpoch(): int
    {
        return $this->yearStart[\count($this->yearStart) - 1] - 1;
    }

    public function covers(int $epoch): bool
    {
        return $epoch >= $this->firstEpoch() && $epoch <= $this->lastEpoch();
    }

    public function monthLength(int $year, int $month): int
    {
        if ($year < $this->firstYear || $year > $this->lastYear) {
            throw new NepDateRangeException(
                NepDateRangeException::OUT_OF_TABLE,
                \sprintf('BS year %d is outside the supported range (BS %d–%d).', $year, $this->firstYear, $this->lastYear),
            );
        }
        if ($month < 1 || $month > 12) {
            throw new NepDateRangeException(NepDateRangeException::INVALID_DATE, \sprintf('BS month %d does not exist.', $month));
        }

        return $this->years[$year - $this->firstYear][$month - 1];
    }

    public function isValid(int $year, int $month, int $day): bool
    {
        try {
            return $day >= 1 && $day <= $this->monthLength($year, $month);
        } catch (NepDateRangeException) {
            return false;
        }
    }

    /** Day count of a valid BS date. */
    public function toEpoch(int $year, int $month, int $day): int
    {
        $index = $year - $this->firstYear;

        return $this->yearStart[$index] + $this->monthOffset[$index][$month - 1] + $day - 1;
    }

    /**
     * @return array{0: int, 1: int, 2: int} year, month, day
     */
    public function fromEpoch(int $epoch): array
    {
        if (! $this->covers($epoch)) {
            throw new NepDateRangeException(
                NepDateRangeException::OUT_OF_TABLE,
                \sprintf('Day %d is outside the BS table (BS %d–%d).', $epoch, $this->firstYear, $this->lastYear),
            );
        }

        // Last year whose start is on or before the day.
        $low = 0;
        $high = \count($this->yearStart) - 2;
        while ($low < $high) {
            $middle = \intdiv($low + $high + 1, 2);
            if ($this->yearStart[$middle] <= $epoch) {
                $low = $middle;
            } else {
                $high = $middle - 1;
            }
        }

        $dayOfYear = $epoch - $this->yearStart[$low];
        $month = 11;
        while ($month > 0 && $this->monthOffset[$low][$month] > $dayOfYear) {
            $month--;
        }

        return [$this->firstYear + $low, $month + 1, $dayOfYear - $this->monthOffset[$low][$month] + 1];
    }

    public function isProjectedYear(int $year): bool
    {
        return $year > $this->verifiedThrough;
    }

    /**
     * Corrects one year's month lengths, or adds the year just before the first or just after
     * the last. Years after a corrected year move with it; earlier years never move.
     *
     * @param  list<int>  $months
     */
    public function withPatchedYear(int $year, array $months): self
    {
        if ($year >= $this->firstYear && $year <= $this->lastYear) {
            $years = $this->years;
            $years[$year - $this->firstYear] = $months;

            return new self($this->firstYear, $this->epochStart, $this->verifiedThrough, $years);
        }
        if ($year === $this->lastYear + 1) {
            return new self($this->firstYear, $this->epochStart, $this->verifiedThrough, [...$this->years, $months]);
        }
        if ($year === $this->firstYear - 1) {
            return new self($year, $this->epochStart - \array_sum($months), $this->verifiedThrough, [$months, ...$this->years]);
        }

        throw new NepDateRangeException(
            NepDateRangeException::OUT_OF_TABLE,
            \sprintf('BS %d is not in the table and does not extend it (BS %d–%d).', $year, $this->firstYear, $this->lastYear),
        );
    }

    /**
     * @param  list<list<int>>  $years
     */
    private function validate(int $firstYear, int $verifiedThrough, array $years): void
    {
        if ($years === []) {
            throw new NepDateDataException('EMPTY', 'The BS table has no years.');
        }

        foreach ($years as $index => $months) {
            $year = $firstYear + $index;
            if (\count($months) !== 12) {
                throw new NepDateDataException('BAD_MONTH_COUNT', \sprintf('BS %d lists %d months, not 12.', $year, \count($months)), $year);
            }
            foreach ($months as $m => $days) {
                if ($days < 29 || $days > 32) {
                    throw new NepDateDataException('BAD_MONTH', \sprintf('BS %d month %d has %d days; expected 29–32.', $year, $m + 1, $days), $year, $m + 1);
                }
            }
            $allowed = $year <= $verifiedThrough ? self::VERIFIED_YEAR_DAYS : self::PROJECTED_YEAR_DAYS;
            if (! \in_array(\array_sum($months), $allowed, true)) {
                throw new NepDateDataException('BAD_YEAR_TOTAL', \sprintf('BS %d has %d days; expected %s.', $year, \array_sum($months), \implode(' or ', $allowed)), $year);
            }
        }
    }
}
