<?php

declare(strict_types=1);

namespace NepDate;

use RuntimeException;

/** Thrown when a BS table (bundled, set or patched) is not valid. */
final class NepDateDataException extends RuntimeException
{
    public function __construct(
        public readonly string $reason,
        string $message,
        public readonly ?int $year = null,
        public readonly ?int $month = null,
    ) {
        parent::__construct($message);
    }
}
