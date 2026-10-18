/** Thrown for a malformed holiday list. `path` points at the bad field, e.g. "holidays[3].date". */
export class HolidayDataError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'HolidayDataError';
    this.path = path;
  }
}
