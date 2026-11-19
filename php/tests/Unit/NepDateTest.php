<?php

declare(strict_types=1);

use NepDate\AdCalendar;
use NepDate\AdDate;
use NepDate\BsDate;
use NepDate\BsTable;
use NepDate\Calendar;
use NepDate\FiscalYear;
use NepDate\Locale;
use NepDate\NepDate;
use NepDate\NepDateDataException;
use NepDate\NepDateRangeException;

beforeEach(fn () => NepDate::reset());
afterEach(fn () => NepDate::reset());

function nepdateReason(Closure $call): string
{
    try {
        $call();
    } catch (NepDateRangeException|NepDateDataException $e) {
        return $e->reason;
    }

    return 'none';
}

describe('BS table patches', function (): void {
    it('corrects a year; later dates move, earlier dates do not', function (): void {
        $before = BsDate::of(2083, 12, 1)->toIsoDate();
        $earlier = BsDate::of(2082, 1, 1)->toIsoDate();

        NepDate::patchBsYear(2083, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 31]);

        expect(BsDate::of(2083, 12, 31)->day)->toBe(31)
            ->and(BsDate::of(2084, 1, 1)->toIsoDate())->not->toBe(AdDate::fromIso($before)?->addDays(30)->toIsoDate())
            ->and(BsDate::of(2082, 1, 1)->toIsoDate())->toBe($earlier);

        NepDate::reset();
        expect(nepdateReason(fn (): BsDate => BsDate::of(2083, 12, 31)))->toBe(NepDateRangeException::INVALID_DATE);
    });

    it('extends the table at either end', function (): void {
        $first = BsDate::of(1970, 1, 1)->toIsoDate();
        NepDate::patchBsYear(2100, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]);
        NepDate::patchBsYear(1969, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]);

        expect(BsDate::of(2100, 1, 1)->isProjected())->toBeTrue()
            ->and(BsDate::of(1969, 1, 1)->toBs()->year)->toBe(1969)
            ->and(BsDate::of(1970, 1, 1)->toIsoDate())->toBe($first)
            ->and(NepDate::table()->firstYear)->toBe(1969)
            ->and(NepDate::table()->lastYear)->toBe(2100);
    });

    it('refuses patches that leave a gap', function (): void {
        expect(nepdateReason(fn () => NepDate::patchBsYear(2105, array_fill(0, 12, 30))))->toBe(NepDateRangeException::OUT_OF_TABLE);
    });

    it('validates tables', function (array $years, int $verifiedThrough, string $reason): void {
        expect(nepdateReason(fn (): BsTable => BsTable::of(2000, 0, $verifiedThrough, $years)))->toBe($reason);
    })->with([
        'empty' => [[], 2000, 'EMPTY'],
        '11 months' => [[array_fill(0, 11, 31)], 2000, 'BAD_MONTH_COUNT'],
        'month of 33 days' => [[[33, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]], 2000, 'BAD_MONTH'],
        'month of 28 days' => [[[28, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]], 2000, 'BAD_MONTH'],
        'verified year of 364 days' => [[[30, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]], 2000, 'BAD_YEAR_TOTAL'],
    ]);

    it('allows a projected year to be off by one', function (): void {
        $table = BsTable::of(2000, 0, 1999, [[30, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]]);

        expect($table->isProjectedYear(2000))->toBeTrue()
            ->and(nepdateReason(fn (): int => $table->monthLength(2000, 13)))->toBe(NepDateRangeException::INVALID_DATE)
            ->and($table->isValid(2001, 1, 1))->toBeFalse();
    });

    it('can swap in a whole table', function (): void {
        NepDate::useTable(BsTable::of(2000, 0, 2000, [[31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]]));

        expect(BsDate::of(2000, 1, 1)->toIsoDate())->toBe('1970-01-01')
            ->and(nepdateReason(fn (): BsDate => BsDate::of(2001, 1, 1)))->toBe(NepDateRangeException::OUT_OF_TABLE);
    });
});

describe('dates', function (): void {
    it('reads ISO dates and timestamps, and nothing else', function (): void {
        expect(AdDate::fromIso('2026-11-15')?->toIsoDate())->toBe('2026-11-15')
            ->and(AdDate::fromIso('2026-11-15T09:30:00Z')?->day)->toBe(15)
            ->and(AdDate::fromIso('2026-02-30'))->toBeNull()
            ->and(AdDate::fromIso('15/11/2026'))->toBeNull()
            ->and(AdDate::fromIso(null))->toBeNull();
    });

    it('takes the calendar day of an instant in Kathmandu', function (): void {
        $instant = new DateTimeImmutable('2026-11-15 18:20:00', new DateTimeZone('UTC'));

        expect(AdDate::fromDateTime($instant)->toIsoDate())->toBe('2026-11-16')
            ->and(AdDate::fromDateTime($instant, 'UTC')->toIsoDate())->toBe('2026-11-15');
    });

    it('rejects AD years it cannot represent or write', function (): void {
        expect(nepdateReason(fn (): AdDate => AdDate::of(1_000_000, 1, 1)))->toBe(NepDateRangeException::INVALID_DATE)
            ->and(nepdateReason(fn (): string => AdDate::of(10_000, 1, 1)->toIsoDate()))->toBe(NepDateRangeException::INVALID_ARGUMENT)
            ->and(nepdateReason(fn (): string => AdDate::of(-5, 1, 1)->toIsoDate()))->toBe(NepDateRangeException::INVALID_ARGUMENT)
            ->and(AdDate::of(-5, 1, 1)->addMonths(-1)->year)->toBe(-6)
            ->and(AdCalendar::floorDiv(-7, 2))->toBe(-4);
    });

    it('compares across calendars', function (): void {
        $ad = AdDate::fromIso('2026-11-15') ?? throw new LogicException;
        $bs = $ad->toBs();

        expect($bs->isSameDay($ad))->toBeTrue()
            ->and($bs->equals($ad))->toBeFalse()
            ->and($bs->equals(BsDate::of(2083, 7, 29)))->toBeTrue()
            ->and($bs->isSameMonth(BsDate::of(2083, 7, 1)))->toBeTrue()
            ->and($bs->isSameMonth(BsDate::of(2083, 8, 1)))->toBeFalse()
            ->and($bs->isSameYear(AdDate::fromIso('2027-01-01') ?? throw new LogicException))->toBeTrue()
            ->and($bs->differenceInDays($ad->addDays(-10)))->toBe(10)
            ->and($bs->compareTo($ad->addDays(1)))->toBe(-1)
            ->and($bs->isWithin($ad, $ad))->toBeTrue()
            ->and($bs->isWithin(null, $ad->addDays(-1)))->toBeFalse()
            ->and($bs->clamp($ad->addDays(5))->toIsoDate())->toBe('2026-11-20')
            ->and($bs->clamp(null, $ad->addDays(-5))->toIsoDate())->toBe('2026-11-10')
            ->and($bs->clamp()->equals($bs))->toBeTrue()
            ->and($bs->toCalendar(Calendar::AD)->equals($ad))->toBeTrue()
            ->and($ad->toAd())->toBe($ad)
            ->and($bs->isConvertible())->toBeTrue()
            ->and(AdDate::of(1900, 1, 1)->isConvertible())->toBeFalse();
    });

    it('prints for logs and JSON', function (): void {
        $bs = BsDate::of(2083, 7, 29);

        expect((string) $bs)->toBe('BS 2083-07-29')
            ->and(json_encode($bs))->toBe('{"calendar":"BS","year":2083,"month":7,"day":29}');
    });

    it('rejects weekdays outside 0–6 and AD months that do not exist', function (): void {
        expect(nepdateReason(fn (): BsDate => BsDate::of(2083, 7, 29)->startOfWeek(7)))->toBe(NepDateRangeException::INVALID_ARGUMENT)
            ->and(nepdateReason(fn (): int => NepDate::daysInMonth(Calendar::AD, 2026, 13)))->toBe(NepDateRangeException::INVALID_DATE);
    });
});

describe('locales and fiscal years', function (): void {
    it('names months and weekdays in English and Nepali', function (): void {
        expect(Locale::monthNames(Calendar::BS)[6])->toBe('Kartik')
            ->and(Locale::monthNames(Calendar::BS, 'en', 'short')[6])->toBe('Kar')
            ->and(Locale::weekdayNames('ne')[0])->not->toBe('Sunday')
            ->and(Locale::weekdayNames('en', 'short')[6])->toBe('Sat')
            ->and(Locale::has('ne'))->toBeTrue()
            ->and(Locale::has('fr'))->toBeFalse()
            ->and(Locale::monthNames(Calendar::AD, 'fr')[0])->toBe('January');
    });

    it('converts digits both ways', function (): void {
        expect(Locale::toDevanagariDigits(2083))->toBe('२०८३')
            ->and(Locale::toAsciiDigits('२०८३/८४'))->toBe('2083/84')
            ->and(Locale::formatNumber('12', 'ne'))->toBe('१२');
    });

    it('knows which days belong to a fiscal year', function (): void {
        $fy = FiscalYear::starting(2083);

        expect($fy->contains(BsDate::of(2083, 4, 1)))->toBeTrue()
            ->and($fy->contains(BsDate::of(2084, 3, 31)))->toBeTrue()
            ->and($fy->contains(BsDate::of(2083, 3, 32)))->toBeFalse()
            ->and(FiscalYear::parse(null))->toBeNull();
    });
});
