const DIGIT = '[0-9\u0966-\u096f]';
const DIGITS_ONLY = new RegExp(`^${DIGIT}{1,8}$`);
const YEAR_MONTH = new RegExp(`^(${DIGIT}{4}-${DIGIT}{2})(${DIGIT}?)$`);

/**
 * Add the dashes of YYYY-MM-DD while the user types digits: "2083" becomes
 * "2083-", "208306" becomes "2083-06-" and a pasted "20830624" becomes
 * "2083-06-24". ASCII and Devanagari digits keep their script. Only text that
 * grew at the end (typing, or a paste into an empty field) is touched, so
 * deleting, editing in the middle and other separators ("2083/6/4") are left
 * as the user wrote them. Pure.
 */
export function maskDateText(next: string, previous = ''): string {
  if (next.length <= previous.length || !next.startsWith(previous)) {
    return next;
  }
  if (DIGITS_ONLY.test(next)) {
    // Every character is one ASCII or Devanagari digit, so string offsets are safe.
    let out = next.slice(0, 4);
    if (next.length >= 4) {
      out += '-';
    }
    out += next.slice(4, 6);
    if (next.length >= 6) {
      out += '-';
    }

    return out + next.slice(6);
  }
  const yearMonth = YEAR_MONTH.exec(next);
  if (yearMonth) {
    // "2083-06" → "2083-06-"; "2083-062" → "2083-06-2".
    return `${yearMonth[1] ?? ''}-${yearMonth[2] ?? ''}`;
  }

  return next;
}
