<?php

declare(strict_types=1);

use NepDate\AdDate;
use NepDate\BsDate;
use NepDate\Calendar;
use NepDate\CalendarDate;
use NepDate\DateParser;
use NepDate\FiscalYear;
use NepDate\NepDate;
use NepDate\NepDateRangeException;

/*
 * nepdate-php must give exactly the answers @nepdatejs/core gives.
 * Fixtures: php/tests/Conformance/fixtures, generated from packages/core by scripts/gen-php.ts.
 */

function nepdateFixture(string $name): mixed
{
    return json_decode((string) file_get_contents(__DIR__.'/fixtures/'.$name), true, flags: JSON_THROW_ON_ERROR);
}

/** @return list<int>|string the date as [y, m, d], or the error reason */
function nepdateOutcome(Closure $call): array|string
{
    try {
        $date = $call();

        return $date instanceof CalendarDate ? [$date->year, $date->month, $date->day] : throw new LogicException('not a date');
    } catch (NepDateRangeException $e) {
        return $e->reason;
    }
}

function nepdateDateIn(string $calendar, array $ymd): CalendarDate
{
    return NepDate::create(Calendar::from($calendar), $ymd[0], $ymd[1], $ymd[2]);
}

beforeEach(fn () => NepDate::reset());

it('has fixtures matching their checksums', function (): void {
    $lines = file(__DIR__.'/fixtures/SHA256SUMS', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $checked = 0;
    foreach ($lines as $line) {
        if (str_starts_with($line, '#')) {
            continue;
        }
        [$hash, $file] = preg_split('/\s+/', $line, 2) ?: ['', ''];
        expect(hash_file('sha256', __DIR__.'/../../../'.$file))->toBe($hash, $file);
        $checked++;
    }

    expect($checked)->toBe(8);
});

it('converts every BS day 1970–2099 like the JS package (BS→AD, AD→BS, epoch, weekday, projected)', function (): void {
    $mismatches = [];
    foreach (nepdateFixture('days.json') as [$y, $m, $d, $iso, $epoch, $weekday, $projected]) {
        $bs = BsDate::of($y, $m, $d);
        $back = AdDate::fromIso($iso)?->toBs();

        if ($bs->toIsoDate() !== $iso || $bs->toEpochDay() !== $epoch || $bs->dayOfWeek() !== $weekday
            || $bs->isProjected() !== (bool) $projected || ! $back instanceof BsDate || ! $back->equals($bs)) {
            $mismatches[] = "BS {$y}-{$m}-{$d}";
        }
    }

    expect($mismatches)->toBe([]);
})->group('slow');

it('agrees on the edges of the table and on invalid dates', function (): void {
    $edges = nepdateFixture('edges.json');
    $min = NepDate::minDate(Calendar::BS);
    $max = NepDate::maxDate(Calendar::BS);

    expect([$min->year, $min->month, $min->day])->toBe($edges['firstBs'])
        ->and([$max->year, $max->month, $max->day])->toBe($edges['lastBs'])
        ->and(NepDate::minDate(Calendar::AD)->toIsoDate())->toBe($edges['firstAd'])
        ->and(NepDate::maxDate(Calendar::AD)->toIsoDate())->toBe($edges['lastAd']);

    foreach ($edges['invalidBs'] as [$y, $m, $d, $reason]) {
        expect(nepdateOutcome(fn (): BsDate => BsDate::of($y, $m, $d)))->toBe($reason, "BS {$y}-{$m}-{$d}");
    }
    foreach ($edges['invalidAd'] as [$y, $m, $d, $reason]) {
        expect(nepdateOutcome(fn (): AdDate => AdDate::of($y, $m, $d)))->toBe($reason, "AD {$y}-{$m}-{$d}");
    }
    foreach ($edges['outOfTableAd'] as [$iso, $reason]) {
        expect(nepdateOutcome(fn (): ?BsDate => AdDate::fromIso($iso)?->toBs()))->toBe($reason, $iso);
    }
});

it('does arithmetic like the JS package in both calendars', function (): void {
    foreach (nepdateFixture('arithmetic.json') as $row) {
        $date = nepdateDateIn($row['calendar'], $row['date']);
        $label = $row['calendar'].' '.implode('-', $row['date']);

        foreach ([-25, -13, -1, 0, 1, 2, 11, 12, 37] as $i => $n) {
            expect(nepdateOutcome(fn (): CalendarDate => $date->addMonths($n)))->toBe($row['addMonths'][$i], "{$label} addMonths {$n}");
        }
        foreach ([-3, 1, 4] as $i => $n) {
            expect(nepdateOutcome(fn (): CalendarDate => $date->addYears($n)))->toBe($row['addYears'][$i], "{$label} addYears {$n}");
        }
        foreach ([-400, -1, 1, 30, 365] as $i => $n) {
            expect(nepdateOutcome(fn (): CalendarDate => $date->addDays($n)))->toBe($row['addDays'][$i], "{$label} addDays {$n}");
        }
        expect(nepdateOutcome(fn (): CalendarDate => $date->startOfMonth()))->toBe($row['startOfMonth'], $label)
            ->and(nepdateOutcome(fn (): CalendarDate => $date->endOfMonth()))->toBe($row['endOfMonth'], $label)
            ->and(nepdateOutcome(fn (): CalendarDate => $date->startOfYear()))->toBe($row['startOfYear'], $label)
            ->and(nepdateOutcome(fn (): CalendarDate => $date->endOfYear()))->toBe($row['endOfYear'], $label);
        foreach ([0, 1, 6] as $i => $w) {
            expect(nepdateOutcome(fn (): CalendarDate => $date->startOfWeek($w)))->toBe($row['startOfWeek'][$i], "{$label} startOfWeek {$w}");
        }
        foreach ([0, 1] as $i => $w) {
            expect(nepdateOutcome(fn (): CalendarDate => $date->endOfWeek($w)))->toBe($row['endOfWeek'][$i], "{$label} endOfWeek {$w}");
        }
        expect($date->dayOfWeek())->toBe($row['dayOfWeek'], $label)
            ->and($date->isWeekend())->toBe($row['isWeekend'], $label)
            ->and($date->daysInMonth())->toBe($row['daysInMonth'], $label);
    }
});

it('computes fiscal years, labels and parsing like the JS package', function (): void {
    $fiscal = nepdateFixture('fiscal.json');

    foreach ($fiscal['years'] as $fy) {
        $php = FiscalYear::starting($fy['startYear']);
        expect($php->label)->toBe($fy['label'])
            ->and([$php->firstDay->year, $php->firstDay->month, $php->firstDay->day])->toBe($fy['first'])
            ->and([$php->lastDay->year, $php->lastDay->month, $php->lastDay->day])->toBe($fy['last'])
            ->and($php->format('full'))->toBe($fy['full'])
            ->and($php->format('cbms'))->toBe($fy['cbms'])
            ->and($php->format('label', 'ne'))->toBe($fy['labelNe']);
    }
    foreach ($fiscal['dates'] as [$iso, $expected]) {
        $actual = is_string($expected)
            ? nepdateOutcome(fn (): BsDate => FiscalYear::of(AdDate::fromIso($iso) ?? throw new LogicException)->firstDay)
            : FiscalYear::of(AdDate::fromIso($iso) ?? throw new LogicException)->startYear;
        expect($actual)->toBe($expected, $iso);
    }
    foreach ($fiscal['parse'] as [$text, $expected]) {
        expect(FiscalYear::parse($text)?->startYear)->toBe($expected, "parse '{$text}'");
    }
});

it('formats like the JS package in English and Nepali', function (): void {
    foreach (nepdateFixture('format.json') as [$calendar, $ymd, $pattern, $locale, $expected]) {
        expect(nepdateDateIn($calendar, $ymd)->format($pattern, $locale))->toBe($expected, "{$calendar} ".implode('-', $ymd)." '{$pattern}' {$locale}");
    }
});

it('parses like the JS package', function (): void {
    foreach (nepdateFixture('parse.json') as [$calendar, $text, $expected]) {
        $actual = nepdateOutcome(fn (): CalendarDate => DateParser::parseStrict($text, Calendar::from($calendar)));
        expect($actual)->toBe($expected, "{$calendar} '{$text}'");
        expect(! DateParser::parse($text, Calendar::from($calendar)) instanceof CalendarDate)->toBe(is_string($expected));
    }
});
