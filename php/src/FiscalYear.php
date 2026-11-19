<?php

declare(strict_types=1);

namespace NepDate;

/** Nepal's fiscal year: 1 Shrawan to the last day of Asar. FY 2083/84 starts in BS 2083. */
final readonly class FiscalYear
{
    private function __construct(
        public int $startYear,
        public string $label,
        public BsDate $firstDay,
        public BsDate $lastDay,
    ) {}

    /** The fiscal year that starts in BS $startYear. */
    public static function starting(int $startYear): self
    {
        $endYear = $startYear + 1;
        $lastMonth = NepDate::FISCAL_YEAR_START_MONTH - 1;

        return new self(
            $startYear,
            \sprintf('%d/%02d', $startYear, $endYear % 100),
            BsDate::of($startYear, NepDate::FISCAL_YEAR_START_MONTH, 1),
            BsDate::of($endYear, $lastMonth, NepDate::table()->monthLength($endYear, $lastMonth)),
        );
    }

    /** The fiscal year a date falls in. */
    public static function of(CalendarDate $date): self
    {
        $bs = $date->toBs();

        return self::starting($bs->month >= NepDate::FISCAL_YEAR_START_MONTH ? $bs->year : $bs->year - 1);
    }

    /** "2083/84", "2083/2084", "2083-84", "2083.084", in ASCII or Devanagari digits. Null when not valid. */
    public static function parse(?string $text): ?self
    {
        if (\preg_match('#^(\d{4})\s*[-/.]\s*(\d{2,4})$#', \trim(Locale::toAsciiDigits($text ?? '')), $m) !== 1) {
            return null;
        }

        $start = (int) $m[1];
        $end = $m[2];
        $next = $start + 1;
        $expected = \strlen($end) === 4 ? (string) $next : \str_pad((string) ($next % (10 ** \strlen($end))), \strlen($end), '0', STR_PAD_LEFT);
        if ($end !== $expected) {
            return null;
        }

        try {
            return self::starting($start);
        } catch (NepDateRangeException) {
            return null;
        }
    }

    /** label "2083/84" · full "2083/2084" · cbms "2083.084" (Nepal's tax system). Digits follow the locale. */
    public function format(string $style = 'label', string $locale = 'en'): string
    {
        $end = $this->startYear + 1;
        $text = match ($style) {
            'full' => $this->startYear.'/'.$end,
            'cbms' => \sprintf('%d.%03d', $this->startYear, $end % 1000),
            default => $this->label,
        };

        return Locale::formatNumber($text, $locale);
    }

    public function contains(CalendarDate $date): bool
    {
        return $date->isWithin($this->firstDay, $this->lastDay);
    }
}
