<?php

declare(strict_types=1);

namespace NepDate;

/** Same tokens and named formats as formatDate() in @nepdatejs/core. */
final class DateFormat
{
    public const array NAMED = [
        'iso' => 'Y-m-d',
        'cbms' => 'Y.m.d',
        'short' => 'j M Y',
        'long' => 'j F Y',
        'full' => 'l, j F Y',
    ];

    private function __construct() {}

    public static function format(CalendarDate $date, string $pattern = 'iso', string $locale = 'en'): string
    {
        $tokens = \mb_str_split(self::NAMED[$pattern] ?? $pattern);
        $data = Locale::data($locale);
        $months = $data['months'][$date->calendar()->value];
        $digits = fn (string|int $v): string => Locale::formatNumber($v, $locale);
        $pad = fn (int $v): string => \str_pad((string) $v, 2, '0', STR_PAD_LEFT);

        $output = '';
        for ($i = 0, $n = \count($tokens); $i < $n; $i++) {
            $output .= match ($tokens[$i]) {
                '\\' => $tokens[++$i] ?? '',
                'Y' => $digits($date->year),
                'y' => $digits($pad((($date->year % 100) + 100) % 100)),
                'm' => $digits($pad($date->month)),
                'n' => $digits($date->month),
                'd' => $digits($pad($date->day)),
                'j' => $digits($date->day),
                'F' => $months['long'][$date->month - 1],
                'M' => $months['short'][$date->month - 1],
                'l' => $data['weekdays']['long'][$date->dayOfWeek()],
                'D' => $data['weekdays']['short'][$date->dayOfWeek()],
                default => $tokens[$i],
            };
        }

        return $output;
    }
}
