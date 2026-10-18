export type NepDateRangeErrorCode =
  /** The year, month or day does not exist in that calendar. */
  | 'INVALID_DATE'
  /** The date is outside the BS table, so it cannot be a BS date or be converted. */
  | 'OUT_OF_TABLE'
  /** A value of the wrong kind: not an integer, unknown time zone, bad text, … */
  | 'INVALID_ARGUMENT';

/** Thrown for any invalid date or argument. Check `code`, not the message. */
export class NepDateRangeError extends RangeError {
  readonly code: NepDateRangeErrorCode;

  constructor(code: NepDateRangeErrorCode, message: string) {
    super(message);
    this.name = 'NepDateRangeError';
    this.code = code;
  }
}

export type NepDateDataErrorCode =
  'EMPTY' | 'BAD_MONTH_COUNT' | 'BAD_MONTH' | 'BAD_YEAR_TOTAL' | 'BAD_ANCHOR';

/** Thrown when a BS table passed to `setBsData` or `patchBsYear` is not valid. */
export class NepDateDataError extends Error {
  readonly code: NepDateDataErrorCode;
  /** The BS year at fault, when there is one. */
  readonly year: number | undefined;
  /** The month (1–12) at fault, when there is one. */
  readonly month: number | undefined;

  constructor(
    code: NepDateDataErrorCode,
    message: string,
    year?: number,
    month?: number,
  ) {
    super(message);
    this.name = 'NepDateDataError';
    this.code = code;
    this.year = year;
    this.month = month;
  }
}
