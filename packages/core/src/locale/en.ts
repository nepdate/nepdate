import type { LocaleData } from './registry';

const bsMonths = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];
const adMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const en: LocaleData = {
  digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  weekdays: {
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    narrow: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },
  months: {
    AD: { long: adMonths, short: adMonths.map((name) => name.slice(0, 3)) },
    BS: { long: bsMonths, short: bsMonths.map((name) => name.slice(0, 3)) },
  },
  calendarNames: { AD: 'AD', BS: 'BS' },
  labels: {
    today: 'Today',
    clear: 'Clear date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    month: 'Month',
    year: 'Year',
    openCalendar: 'Open calendar',
    chooseDate: 'Choose a date',
    calendar: 'Calendar',
  },
  messages: {
    invalidFormat: {
      AD: 'Enter an AD date as YYYY-MM-DD.',
      BS: 'Enter a BS date as YYYY-MM-DD.',
    },
    outOfRange: 'Choose a date from {min} to {max}.',
    onOrAfter: 'Choose {min} or later.',
    onOrBefore: 'Choose {max} or earlier.',
    unavailable: 'This date is not available.',
    rangeTooShort: 'Choose at least {min} days.',
    rangeTooLong: 'Choose at most {max} days.',
  },
};
