export * from "./lotteryConfig";

export interface LotteryMeta {
  day: string;
  name: string;
  nameMl: string;
  code: string;
  drawTime: string;
  isBumper?: boolean;
  jackpot?: string;
  ticket_price?: string;
  draw_date?: string;
  drawSeason?: string;
}

export const WEEKLY_LOTTERIES: LotteryMeta[] = [
  { day: "Monday", name: "Bhagyathara", nameMl: "ഭാഗ്യതാരാ", code: "BT", drawTime: "3:00 PM", isBumper: false, jackpot: "₹1 Crore", ticket_price: "₹50" },
  { day: "Tuesday", name: "Sthree Sakthi", nameMl: "സ്ത്രീശക്തി", code: "SS", drawTime: "3:00 PM", isBumper: false, jackpot: "₹75 Lakhs", ticket_price: "₹50" },
  { day: "Wednesday", name: "Dhanalekshmi", nameMl: "ധനലക്ഷ്മി", code: "DL", drawTime: "3:00 PM", isBumper: false, jackpot: "₹1 Crore", ticket_price: "₹50" },
  { day: "Thursday", name: "Karunya Plus", nameMl: "കാരുണ്യ പ്ലസ്", code: "KN", drawTime: "3:00 PM", isBumper: false, jackpot: "₹80 Lakhs", ticket_price: "₹50" },
  { day: "Friday", name: "Suvarna Keralam", nameMl: "സുവർണ്ണ കേരളം", code: "SK", drawTime: "3:00 PM", isBumper: false, jackpot: "₹70 Lakhs", ticket_price: "₹50" },
  { day: "Saturday", name: "Karunya", nameMl: "കാരുണ്യ", code: "KR", drawTime: "3:00 PM", isBumper: false, jackpot: "₹80 Lakhs", ticket_price: "₹50" },
  { day: "Sunday", name: "Samrudhi", nameMl: "സമൃദ്ധി", code: "SM", drawTime: "3:00 PM", isBumper: false, jackpot: "₹70 Lakhs", ticket_price: "₹50" },
];

export const BUMPER_LOTTERIES: LotteryMeta[] = [
  {
    day: "Bumper (September)",
    name: "Thiruvonam Bumper",
    nameMl: "തിരുവോണം ബംപർ",
    code: "TH",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹30 Crore",
    ticket_price: "₹500",
    draw_date: "2026-09-26",
    drawSeason: "September (Onam)",
  },
  {
    day: "Bumper (January)",
    name: "Christmas New Year Bumper",
    nameMl: "ക്രിസ്മസ് ന്യൂ ഇയർ ബംപർ",
    code: "XN",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹30 Crore",
    ticket_price: "₹400",
    drawSeason: "January",
  },
  {
    day: "Bumper (March)",
    name: "Summer Bumper",
    nameMl: "സമ്മർ ബംപർ",
    code: "SB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹30 Crore",
    ticket_price: "₹250",
    drawSeason: "March (Summer)",
  },
  {
    day: "Bumper (May)",
    name: "Vishu Bumper",
    nameMl: "വിഷു ബംപർ",
    code: "VB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹30 Crore",
    ticket_price: "₹300",
    drawSeason: "May (Vishu)",
  },
  {
    day: "Bumper (July)",
    name: "Monsoon Bumper",
    nameMl: "മൺസൂൺ ബംപർ",
    code: "MB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹30 Crore",
    ticket_price: "₹250",
    drawSeason: "July (Monsoon)",
  },
  {
    day: "Bumper (November)",
    name: "Pooja Bumper",
    nameMl: "പൂജ ബംപർ",
    code: "PB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹12 Crore",
    ticket_price: "₹300",
    draw_date: "2026-11-28",
    drawSeason: "November (Pooja/Diwali)",
  },
];

export const ALL_LOTTERIES: LotteryMeta[] = [...WEEKLY_LOTTERIES, ...BUMPER_LOTTERIES];

import { Language } from "./translations";

export const LOTTERY_NAMES_BY_LANG: Record<string, Record<Language, string>> = {
  BT: {
    en: "Bhagyathara",
    ml: "ഭാഗ്യതാരാ",
    hi: "भाग्यतारा",
    ta: "பாக்யதாரா",
    kn: "ಭಾಗ್ಯತಾರಾ",
    te: "భాగ్యతార",
  },
  SS: {
    en: "Sthree Sakthi",
    ml: "സ്ത്രീശക്തി",
    hi: "स्त्री शक्ति",
    ta: "ஸ்த்ரீ சக்தி",
    kn: "ಸ್ತ್ರೀ ಶಕ್ತಿ",
    te: "స్త్రీ శక్తి",
  },
  DL: {
    en: "Dhanalekshmi",
    ml: "ധനലക്ഷ്മി",
    hi: "धनलक्ष्मी",
    ta: "தனலக்ஷ்மி",
    kn: "ಧನಲಕ್ಷ್ಮಿ",
    te: "ధనలక్ష్మి",
  },
  KN: {
    en: "Karunya Plus",
    ml: "കാരുണ്യ പ്ലസ്",
    hi: "कारुण्या प्लस",
    ta: "காருண்யா பிளஸ்",
    kn: "ಕಾರುಣ್ಯ ಪ್ಲಸ್",
    te: "కారుణ్య ప్లస్",
  },
  SK: {
    en: "Suvarna Keralam",
    ml: "സുവർണ്ണ കേരളം",
    hi: "सुवर्ण केरलम",
    ta: "சுவர்ண கேரளம்",
    kn: "ಸುವರ್ಣ ಕೇರಳಂ",
    te: "సువర్ణ కేరళం",
  },
  KR: {
    en: "Karunya",
    ml: "കാരുണ്യ",
    hi: "कारुण्या",
    ta: "காருண்யா",
    kn: "ಕಾರುಣ್ಯ",
    te: "కారుణ్య",
  },
  SM: {
    en: "Samrudhi",
    ml: "സമൃദ്ധി",
    hi: "समृद्धि",
    ta: "சம்ருத்தி",
    kn: "ಸಮೃದ್ಧಿ",
    te: "సమృద్ధి",
  },
  XN: {
    en: "Christmas New Year Bumper",
    ml: "ക്രിസ്മസ് ന്യൂ ഇയർ ബംപർ",
    hi: "क्रिसमस न्यू ईयर बंपर",
    ta: "கிறிஸ்துமஸ் புத்தாண்டு பம்பர்",
    kn: "ಕ್ರಿಸ್ಮಸ್ ಹೊಸ ವರ್ಷದ ಬಂಪರ್",
    te: "క్రిస్మస్ న్యూ ఇయర్ బంపర్",
  },
  SB: {
    en: "Summer Bumper",
    ml: "സമ്മർ ബംപർ",
    hi: "समर बंपर",
    ta: "சம்மர் பம்பர்",
    kn: "ಸಮ್ಮರ್ ಬಂಪರ್",
    te: "సమ్మర్ బంపర్",
  },
  VB: {
    en: "Vishu Bumper",
    ml: "വിഷു ബംപർ",
    hi: "विषु बंपर",
    ta: "விஷு பம்பர்",
    kn: "ವಿಷು ಬಂಪರ್",
    te: "విషు బంపర్",
  },
  MB: {
    en: "Monsoon Bumper",
    ml: "മൺസൂൺ ബംപർ",
    hi: "मानसून बंपर",
    ta: "மான்சூன் பம்பர்",
    kn: "ಮಾನ್ಸೂನ್ ಬಂಪರ್",
    te: "మాన్సూన్ బంపర్",
  },
  TH: {
    en: "Thiruvonam Bumper",
    ml: "തിരുവോണം ബംപർ",
    hi: "तिरुவோணம் बंपर",
    ta: "திருவோணம் பம்பர்",
    kn: "ತಿರುವೋಣಂ ಬಂಪರ್",
    te: "తిరువోణం బంపర్",
  },
  PB: {
    en: "Pooja Bumper",
    ml: "പൂജ ബംപർ",
    hi: "पूजा बंपर",
    ta: "பூஜை பம்பர்",
    kn: "ಪೂಜಾ ಬಂಪರ್",
    te: "పూజా బంపర్",
  },
};

export function getLotteryTranslatedName(code?: string, lang: Language = "en"): string {
  if (!code) return "";
  const codeUpper = code.toUpperCase().trim();
  if (LOTTERY_NAMES_BY_LANG[codeUpper]?.[lang]) {
    return LOTTERY_NAMES_BY_LANG[codeUpper][lang];
  }
  const match = ALL_LOTTERIES.find((l) => l.code.toUpperCase() === codeUpper);
  if (lang === "ml" && match?.nameMl) return match.nameMl;
  return match?.name || code;
}

export function getLotteryMalayalamName(code?: string): string {
  return getLotteryTranslatedName(code, "ml");
}

export function getDayTranslated(dayName?: string, lang: Language = "en"): string {
  if (!dayName) return "";
  if (lang === "en") return dayName;
  const d = dayName.toLowerCase().trim();

  const dayMap: Record<string, Record<Language, string>> = {
    monday: { en: "Monday", ml: "തിങ്കൾ", hi: "सोमवार", ta: "திங்கள்", kn: "ಸೋಮವಾರ", te: "సోమవారం" },
    tuesday: { en: "Tuesday", ml: "ചൊവ്വ", hi: "मंगलवार", ta: "செவ்வாய்", kn: "ಮಂಗಳವಾರ", te: "మంగళవారం" },
    wednesday: { en: "Wednesday", ml: "ಬುಧൻ", hi: "बुधवार", ta: "புதன்", kn: "ಬುಧವಾರ", te: "బుధవారం" },
    thursday: { en: "Thursday", ml: "വ്യാഴം", hi: "गुरुवार", ta: "வியாழன்", kn: "ಗುರುವಾರ", te: "గురువారం" },
    friday: { en: "Friday", ml: "വെള്ളി", hi: "शुक्रवार", ta: "வெள்ளி", kn: "ಶುಕ್ರವಾರ", te: "శుక్రవారం" },
    saturday: { en: "Saturday", ml: "ശനി", hi: "शनिवार", ta: "சனி", kn: "ಶನಿವಾರ", te: "శనివారం" },
    sunday: { en: "Sunday", ml: "ഞായർ", hi: "रविवार", ta: "ஞாயிறு", kn: "ಭಾನುವಾರ", te: "ఆదివారం" },
  };

  for (const [key, map] of Object.entries(dayMap)) {
    if (d.includes(key) || (key.length >= 3 && d.includes(key.slice(0, 3)))) {
      return map[lang] || dayName;
    }
  }

  return dayName;
}


