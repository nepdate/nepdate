import type { LocaleData } from './registry';

const bsMonths = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मङ्सिर',
  'पुस',
  'माघ',
  'फाल्गुण',
  'चैत',
];
const adMonths = [
  'जनवरी',
  'फेब्रुअरी',
  'मार्च',
  'अप्रिल',
  'मे',
  'जुन',
  'जुलाई',
  'अगस्ट',
  'सेप्टेम्बर',
  'अक्टोबर',
  'नोभेम्बर',
  'डिसेम्बर',
];

export const ne: LocaleData = {
  digits: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  weekdays: {
    long: ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'],
    short: ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिही', 'शुक्र', 'शनि'],
    narrow: ['आ', 'सो', 'मं', 'बु', 'बि', 'शु', 'श'],
  },
  months: {
    AD: { long: adMonths, short: adMonths },
    BS: { long: bsMonths, short: bsMonths },
  },
  calendarNames: { AD: 'ई.सं.', BS: 'वि.सं.' },
  labels: {
    today: 'आज',
    clear: 'मिति हटाउनुहोस्',
    previousMonth: 'अघिल्लो महिना',
    nextMonth: 'अर्को महिना',
    previousYear: 'अघिल्लो वर्ष',
    nextYear: 'अर्को वर्ष',
    month: 'महिना',
    year: 'वर्ष',
    openCalendar: 'पात्रो खोल्नुहोस्',
    chooseDate: 'मिति छान्नुहोस्',
    calendar: 'पात्रो',
  },
  messages: {
    invalidFormat: {
      AD: 'ई.सं. मिति YYYY-MM-DD ढाँचामा लेख्नुहोस्।',
      BS: 'वि.सं. मिति YYYY-MM-DD ढाँचामा लेख्नुहोस्।',
    },
    outOfRange: '{min} देखि {max} सम्मको मिति छान्नुहोस्।',
    onOrAfter: '{min} वा त्यसपछिको मिति छान्नुहोस्।',
    onOrBefore: '{max} वा त्यसअघिको मिति छान्नुहोस्।',
    unavailable: 'यो मिति उपलब्ध छैन।',
  },
};
