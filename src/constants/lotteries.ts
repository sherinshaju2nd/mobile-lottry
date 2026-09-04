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
  { day: "Monday", name: "Bhagyathara", nameMl: "ഭാഗ്യതാരാ", code: "BT", drawTime: "3:00 PM", isBumper: false },
  { day: "Tuesday", name: "Sthree Sakthi", nameMl: "സ്ത്രീശക്തി", code: "SS", drawTime: "3:00 PM", isBumper: false },
  { day: "Wednesday", name: "Dhanalekshmi", nameMl: "ധനലക്ഷ്മി", code: "DL", drawTime: "3:00 PM", isBumper: false },
  { day: "Thursday", name: "Karunya Plus", nameMl: "കാരുണ്യ പ്ലസ്", code: "KN", drawTime: "3:00 PM", isBumper: false },
  { day: "Friday", name: "Suvarna Keralam", nameMl: "സുവർണ്ണ കേരളം", code: "SK", drawTime: "3:00 PM", isBumper: false },
  { day: "Saturday", name: "Karunya", nameMl: "കാരുണ്യ", code: "KR", drawTime: "3:00 PM", isBumper: false },
  { day: "Sunday", name: "Samrudhi", nameMl: "സമൃദ്ധി", code: "SM", drawTime: "3:00 PM", isBumper: false },
];

export const BUMPER_LOTTERIES: LotteryMeta[] = [
  {
    day: "Bumper (January)",
    name: "Christmas New Year Bumper",
    nameMl: "ക്രിസ്മസ് ന്യൂ ഇയർ ബംപർ",
    code: "XN",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹20 Crore",
    drawSeason: "January",
  },
  {
    day: "Bumper (March)",
    name: "Summer Bumper",
    nameMl: "സമ്മർ ബംപർ",
    code: "SB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹10 Crore",
    drawSeason: "March (Summer)",
  },
  {
    day: "Bumper (May)",
    name: "Vishu Bumper",
    nameMl: "വിഷു ബംപർ",
    code: "VB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹12 Crore",
    drawSeason: "May (Vishu)",
  },
  {
    day: "Bumper (July)",
    name: "Monsoon Bumper",
    nameMl: "മൺസൂൺ ബംപർ",
    code: "MB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹10 Crore",
    drawSeason: "July (Monsoon)",
  },
  {
    day: "Bumper (September)",
    name: "Thiruvonam Bumper",
    nameMl: "തിരുവോണം ബംപർ",
    code: "TH",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹25 Crore",
    drawSeason: "September (Onam)",
  },
  {
    day: "Bumper (November)",
    name: "Pooja Bumper",
    nameMl: "പൂജ ബംപർ",
    code: "PB",
    drawTime: "2:00 PM",
    isBumper: true,
    jackpot: "₹12 Crore",
    drawSeason: "November (Pooja/Diwali)",
  },
];

export const ALL_LOTTERIES: LotteryMeta[] = [...WEEKLY_LOTTERIES, ...BUMPER_LOTTERIES];

export function getLotteryMalayalamName(code?: string): string {
  if (!code) return "";
  const codeUpper = code.toUpperCase().trim();
  const match = ALL_LOTTERIES.find(
    (l) => l.code.toUpperCase() === codeUpper
  );
  if (match?.nameMl) return match.nameMl;

  // Additional legacy & alternate code mappings
  const codeMap: Record<string, string> = {
    BT: "ഭാഗ്യതാരാ",
    SS: "സ്ത്രീശക്തി",
    DL: "ധനലക്ഷ്മി",
    KN: "കാരുണ്യ പ്ലസ്",
    SK: "സുവർണ്ണ കേരളം",
    KR: "കാരുണ്യ",
    SM: "സമൃദ്ധി",
    W: "വിൻ വിൻ",
    WIN: "വിൻ വിൻ",
    AK: "അക്ഷയ",
    NR: "നിർമ്മൽ",
    FF: "ഫിഫ്റ്റി ഫിഫ്റ്റി",
    XN: "ക്രിസ്മസ് ന്യൂ ഇയർ ബംപർ",
    SB: "സമ്മർ ബംപർ",
    VB: "വിഷു ബംപർ",
    MB: "മൺസൂൺ ബംപർ",
    TH: "തിരുവോണം ബംപർ",
    PB: "പൂജ ബംപർ",
  };
  return codeMap[codeUpper] || "";
}

export function getDayTranslated(dayName?: string, lang: "en" | "ml" = "en"): string {
  if (!dayName) return "";
  if (lang === "en") return dayName;
  const d = dayName.toLowerCase().trim();
  if (d.includes("monday") || d.includes("mon")) return "തിങ്കൾ";
  if (d.includes("tuesday") || d.includes("tue")) return "ചൊവ്വ";
  if (d.includes("wednesday") || d.includes("wed")) return "ബുധൻ";
  if (d.includes("thursday") || d.includes("thu")) return "വ്യാഴം";
  if (d.includes("friday") || d.includes("fri")) return "വെള്ളി";
  if (d.includes("saturday") || d.includes("sat")) return "ശനി";
  if (d.includes("sunday") || d.includes("sun")) return "ഞായർ";
  return dayName;
}


