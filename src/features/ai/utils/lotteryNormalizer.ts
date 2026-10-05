export interface LotteryAliasInfo {
  code: string;
  officialName: string;
  malayalamName: string;
  dayOfWeek: string;
  defaultPrize: string;
  aliases: string[];
}

export const KERALA_LOTTERIES: Record<string, LotteryAliasInfo> = {
  karunya: {
    code: "KR",
    officialName: "Karunya",
    malayalamName: "കാരുണ്യ",
    dayOfWeek: "Saturday",
    defaultPrize: "₹80 Lakhs",
    aliases: [
      "karunya",
      "karunya lottery",
      "കാരുണ്യ",
      "കാരുണ്യ ലോട്ടറി",
      "കാരുണ്യ ഫലം",
      "കാരുണ്യ റിസൾട്ട്",
    ],
  },
  karunya_plus: {
    code: "KN",
    officialName: "Karunya Plus",
    malayalamName: "കാരുണ്യ പ്ലസ്",
    dayOfWeek: "Thursday",
    defaultPrize: "₹80 Lakhs",
    aliases: [
      "karunya plus",
      "karunyaplus",
      "കാരുണ്യ പ്ലസ്",
      "കാരുണ്യപ്ലസ്",
    ],
  },
  win_win: {
    code: "WN",
    officialName: "Win-Win",
    malayalamName: "വിൻ വിൻ",
    dayOfWeek: "Monday",
    defaultPrize: "₹75 Lakhs",
    aliases: [
      "win win",
      "win-win",
      "winwin",
      "വിൻ വിൻ",
      "വിൻവിൻ",
      "വിൻ-വിൻ",
    ],
  },
  sthree_sakthi: {
    code: "SS",
    officialName: "Sthree Sakthi",
    malayalamName: "സ്ത്രീശക്തി",
    dayOfWeek: "Tuesday",
    defaultPrize: "₹75 Lakhs",
    aliases: [
      "sthree sakthi",
      "sthreesakthi",
      "stree sakthi",
      "sthree",
      "സ്ത്രീശക്തി",
      "സ്ത്രീ ശക്തി",
    ],
  },
  fifty_fifty: {
    code: "FF",
    officialName: "Fifty-Fifty",
    malayalamName: "ഫിഫ്റ്റി-ഫിഫ്റ്റി",
    dayOfWeek: "Wednesday",
    defaultPrize: "₹1 Crore",
    aliases: [
      "fifty fifty",
      "fifty-fifty",
      "fifty",
      "ഫിഫ്റ്റി ഫിഫ്റ്റി",
      "ഫിഫ്റ്റി-ഫിഫ്റ്റി",
      "ഫിഫ്റ്റി",
    ],
  },
  nirmal: {
    code: "NR",
    officialName: "Nirmal",
    malayalamName: "നിർമ്മൽ",
    dayOfWeek: "Friday",
    defaultPrize: "₹70 Lakhs",
    aliases: [
      "nirmal",
      "നിർമ്മൽ",
      "നിർമൽ",
    ],
  },
  samrudhi: {
    code: "SM",
    officialName: "Samrudhi",
    malayalamName: "സമൃദ്ധി",
    dayOfWeek: "Sunday",
    defaultPrize: "₹70 Lakhs",
    aliases: [
      "samrudhi",
      "samruddhi",
      "samrudhi lottery",
      "സമൃദ്ധി",
    ],
  },
  bhagyathara: {
    code: "BT",
    officialName: "Bhagyathara",
    malayalamName: "ഭാഗ്യതാര",
    dayOfWeek: "Monday",
    defaultPrize: "₹1 Crore",
    aliases: [
      "bhagyathara",
      "ഭാഗ്യതാര",
    ],
  },
  dhanalekshmi: {
    code: "DL",
    officialName: "Dhanalekshmi",
    malayalamName: "ധനലക്ഷ്മി",
    dayOfWeek: "Wednesday",
    defaultPrize: "₹1 Crore",
    aliases: [
      "dhanalekshmi",
      "dhanalakshmi",
      "ധനലക്ഷ്മി",
    ],
  },
  suvarna_keralam: {
    code: "SK",
    officialName: "Suvarna Keralam",
    malayalamName: "സുവർണ്ണ കേരളം",
    dayOfWeek: "Friday",
    defaultPrize: "₹70 Lakhs",
    aliases: [
      "suvarna",
      "suvarna keralam",
      "സുവർണ്ണ",
      "സുവർണ്ണ കേരളം",
      "സുവർണ്ണകേരളം",
    ],
  },
  thiruvonam: {
    code: "TH",
    officialName: "Thiruvonam Bumper",
    malayalamName: "തിരുവോണം ബംപർ",
    dayOfWeek: "Bumper",
    defaultPrize: "₹25 Crore",
    aliases: [
      "thiruvonam",
      "onam bumper",
      "തിരുവോണം",
      "ഓണം ബംപർ",
    ],
  },
  christmas: {
    code: "XN",
    officialName: "Christmas New Year Bumper",
    malayalamName: "ക്രിസ്മസ് ന്യൂ ഇയർ ബംപർ",
    dayOfWeek: "Bumper",
    defaultPrize: "₹20 Crore",
    aliases: [
      "christmas bumper",
      "xmas bumper",
      "new year bumper",
      "ക്രിസ്മസ്",
      "ക്രിസ്മസ് ബംപർ",
    ],
  },
  vishu: {
    code: "VB",
    officialName: "Vishu Bumper",
    malayalamName: "വിഷു ബംപർ",
    dayOfWeek: "Bumper",
    defaultPrize: "₹12 Crore",
    aliases: [
      "vishu bumper",
      "vishu",
      "വിഷു",
      "വിഷു ബംപർ",
    ],
  },
  pooja: {
    code: "PB",
    officialName: "Pooja Bumper",
    malayalamName: "പൂജ ബംപർ",
    dayOfWeek: "Bumper",
    defaultPrize: "₹12 Crore",
    aliases: [
      "pooja bumper",
      "pooja",
      "പൂജ",
      "പൂജ ബംപർ",
    ],
  },
  monsoon: {
    code: "MB",
    officialName: "Monsoon Bumper",
    malayalamName: "മൺസൂൺ ബംപർ",
    dayOfWeek: "Bumper",
    defaultPrize: "₹10 Crore",
    aliases: [
      "monsoon bumper",
      "monsoon",
      "മൺസൂൺ",
      "മൺസൂൺ ബംപർ",
    ],
  },
  summer: {
    code: "SB",
    officialName: "Summer Bumper",
    malayalamName: "സമ്മർ ബംപർ",
    dayOfWeek: "Bumper",
    defaultPrize: "₹10 Crore",
    aliases: [
      "summer bumper",
      "summer",
      "സമ്മർ",
      "സമ്മർ ബംപർ",
    ],
  },
};

/**
 * Match a lottery from natural language query (Malayalam, Manglish, English)
 */
export function identifyLotteryFromText(text: string): LotteryAliasInfo | null {
  const q = text.toLowerCase().trim();

  // Check multi-word aliases first to ensure "karunya plus" matches before "karunya"
  const allAliases: Array<{ alias: string; info: LotteryAliasInfo }> = [];
  for (const info of Object.values(KERALA_LOTTERIES)) {
    for (const alias of info.aliases) {
      allAliases.push({ alias, info });
    }
  }

  // Sort longest alias first
  allAliases.sort((a, b) => b.alias.length - a.alias.length);

  for (const item of allAliases) {
    if (q.includes(item.alias.toLowerCase())) {
      return item.info;
    }
  }

  return null;
}

/**
 * Extract ticket number from text (series + number or standalone 4-6 digits)
 * E.g. "WA 123456", "123456", "KN 482910", "1234"
 */
export function extractTicketNumber(text: string): string | null {
  // Pattern 1: Series letter(s) + 6 digits (e.g., "WA 123456", "KN-482910")
  const seriesPattern = /\b([A-Z]{1,3})[\s-]*(\d{4,6})\b/i;
  const matchSeries = text.match(seriesPattern);
  if (matchSeries) {
    return `${matchSeries[1].toUpperCase()} ${matchSeries[2]}`;
  }

  // Pattern 2: Standalone 6 digits
  const digit6Pattern = /\b(\d{6})\b/;
  const match6 = text.match(digit6Pattern);
  if (match6) {
    return match6[1];
  }

  // Pattern 3: Standalone 4 digits
  const digit4Pattern = /\b(\d{4})\b/;
  const match4 = text.match(digit4Pattern);
  if (match4) {
    return match4[1];
  }

  return null;
}

/**
 * Extract date intent from query ("today", "yesterday", or specific date)
 */
export function extractDateIntent(text: string): { type: "today" | "yesterday" | "specific" | null; dateStr?: string } {
  const q = text.toLowerCase();

  if (
    q.includes("innathe") ||
    q.includes("today") ||
    q.includes("ഇന്നത്തെ") ||
    q.includes("ഇന്നത്തേ") ||
    q.includes("ഇന്ന്")
  ) {
    return { type: "today" };
  }

  if (
    q.includes("innale") ||
    q.includes("yesterday") ||
    q.includes("ഇന്നലത്തെ") ||
    q.includes("ഇന്നലെ") ||
    q.includes("kazhinja") ||
    q.includes("കഴിഞ്ഞ")
  ) {
    return { type: "yesterday" };
  }

  // ISO Date YYYY-MM-DD
  const isoMatch = q.match(/\b(202\d)-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/);
  if (isoMatch) {
    return { type: "specific", dateStr: isoMatch[0] };
  }

  return { type: null };
}

/**
 * Extract prize tier from query ("1st", "2nd", "3rd", "consolation", etc.)
 */
export function extractPrizeTier(text: string): string | null {
  const q = text.toLowerCase();

  if (
    q.includes("first prize") ||
    q.includes("1st prize") ||
    q.includes("ഒന്നാം സമ്മാനം") ||
    q.includes("onnam") ||
    q.includes("ഒന്നാം")
  ) {
    return "1st";
  }

  if (
    q.includes("second prize") ||
    q.includes("2nd prize") ||
    q.includes("രണ്ടാം സമ്മാനം") ||
    q.includes("rendam") ||
    q.includes("രണ്ടാം")
  ) {
    return "2nd";
  }

  if (
    q.includes("third prize") ||
    q.includes("3rd prize") ||
    q.includes("മൂന്നാം സമ്മാനം") ||
    q.includes("moonnam") ||
    q.includes("മൂന്നാം")
  ) {
    return "3rd";
  }

  if (
    q.includes("consolation") ||
    q.includes("ആശ്വാസ സമ്മാനം") ||
    q.includes("ആശ്വാസ")
  ) {
    return "consolation";
  }

  return null;
}
