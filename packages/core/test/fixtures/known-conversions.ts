/**
 * FIX-001: BS ⇄ AD pairs confirmed by published notices. Copied from the
 * institute-SaaS test suite (tests/Feature/NepaliDateTest.php).
 */
export const KNOWN_CONVERSIONS: readonly (readonly [
  label: string,
  bs: string,
  ad: string,
])[] = [
  ['calendar anchor', '1970-01-01', '1913-04-13'],
  ['BS 1975 new year', '1975-01-01', '1918-04-13'],
  ['BS 2000 new year', '2000-01-01', '1943-04-14'],
  ['2078 new year', '2078-01-01', '2021-04-14'],
  ['2079 new year', '2079-01-01', '2022-04-14'],
  ['2080 new year', '2080-01-01', '2023-04-14'],
  ['2081 new year', '2081-01-01', '2024-04-13'],
  ['Asar 1, 2081', '2081-03-01', '2024-06-15'],
  ['2082 new year', '2082-01-01', '2025-04-14'],
  ['Jestha 1, 2082', '2082-02-01', '2025-05-15'],
  ['Mangsir 1, 2082', '2082-08-01', '2025-11-17'],
  ['Poush 1, 2082', '2082-09-01', '2025-12-16'],
  ['2083 new year', '2083-01-01', '2026-04-14'],
  ['Ashwin 1, 2083', '2083-06-01', '2026-09-17'],
  ['Kartik 1, 2083', '2083-07-01', '2026-10-18'],
  ['Mangsir 1, 2083', '2083-08-01', '2026-11-17'],
  ['Poush 1, 2083', '2083-09-01', '2026-12-16'],
  ['Magh 1, 2083', '2083-10-01', '2027-01-15'],
  ['Falgun 1, 2083', '2083-11-01', '2027-02-13'],
  ['Chaitra 1, 2083', '2083-12-01', '2027-03-15'],
  ['2084 new year', '2084-01-01', '2027-04-14'],
];

/**
 * FIX-002 (partial): the AD date of 1 Baisakh, kept separate from the table so
 * it checks the table independently. TODO(Q-009): extend to every verified
 * year (1970–2083) from a published government calendar.
 */
export const BS_NEW_YEAR_AD: Readonly<Record<number, string>> = {
  1970: '1913-04-13',
  1975: '1918-04-13',
  2000: '1943-04-14',
  2078: '2021-04-14',
  2079: '2022-04-14',
  2080: '2023-04-14',
  2081: '2024-04-13',
  2082: '2025-04-14',
  2083: '2026-04-14',
  2084: '2027-04-14',
};

/** FIX-003: first day (1 Shrawan) of each fiscal year, from the same PHP tests. */
export const FISCAL_YEAR_STARTS: readonly (readonly [startYear: number, ad: string])[] = [
  [2078, '2021-07-16'],
  [2079, '2022-07-17'],
  [2080, '2023-07-17'],
  [2081, '2024-07-16'],
  [2082, '2025-07-17'],
  [2083, '2026-07-17'],
];
