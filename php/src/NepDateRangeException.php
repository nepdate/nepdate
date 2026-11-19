<?php

declare(strict_types=1);

namespace NepDate;

use RangeException;

/** Thrown for any invalid date or argument. Check $reason, not the message. */
final class NepDateRangeException extends RangeException
{
    /** The year, month or day does not exist in that calendar. */
    public const string INVALID_DATE = 'INVALID_DATE';

    /** The date is outside the BS table, so it cannot be a BS date or be converted. */
    public const string OUT_OF_TABLE = 'OUT_OF_TABLE';

    /** A value of the wrong kind: bad text, unknown weekday, … */
    public const string INVALID_ARGUMENT = 'INVALID_ARGUMENT';

    public function __construct(public readonly string $reason, string $message)
    {
        parent::__construct($message);
    }
}
