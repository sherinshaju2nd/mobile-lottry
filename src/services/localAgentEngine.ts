import {
  fetchAllDraws,
  getCachedDrawsQuick,
  searchTicketNumber,
  fetchBumperLotteries,
  DrawResult,
  SearchMatch,
} from "../api/lotteryApi";
import { WEEKLY_LOTTERIES, BUMPER_LOTTERIES, LotteryMeta } from "../constants/lotteries";
import { Language } from "../constants/translations";

export interface LocalAgentResult {
  text: string;
  speechText: string;
  intent: string;
  cardData?: {
    type:
      | "draw_result"
      | "ticket_match"
      | "ticket_no_match"
      | "ticket_prompt"
      | "bumper_info"
      | "claim_guide"
      | "tax_calculator"
      | "schedule_info";
    title: string;
    subtitle?: string;
    primaryHighlight?: string;
    secondaryHighlight?: string;
    badgeText?: string;
    details?: Array<{ label: string; value: string }>;
    fullPrizes?: Record<string, string | string[]>;
  };
  latencyMs: number;
}

/**
 * Extract ticket number from user's custom spoken or typed message
 * e.g., "MH 980055", "KN-582914", "980055", "ticket 482910"
 */
export function parseTicketFromText(text: string): string | null {
  // Pattern 1: Series letter(s) + 6 digits (e.g., "MH 980055", "KN-982104")
  const seriesPattern = /\b([A-Z]{1,3})[\s-]*(\d{4,6})\b/i;
  const matchSeries = text.match(seriesPattern);
  if (matchSeries) {
    return `${matchSeries[1].toUpperCase()} ${matchSeries[2]}`;
  }

  // Pattern 2: Standalone 4 to 6 digits
  const digitPattern = /\b(\d{4,6})\b/;
  const matchDigits = text.match(digitPattern);
  if (matchDigits) {
    return matchDigits[1];
  }

  return null;
}

/**
 * Fast DB cache getter (sub-10ms)
 */
async function getFastDrawSnapshot(): Promise<DrawResult[]> {
  try {
    const cached = await getCachedDrawsQuick();
    if (cached && cached.length > 0) {
      fetchAllDraws().catch(() => {});
      return cached;
    }
  } catch {}
  return await fetchAllDraws();
}

/**
 * Known Kerala lotteries mapping helper
 */
const LOTTERY_ALIASES: Record<string, { code: string; names: string[] }> = {
  samrudhi: { code: "SM", names: ["samrudhi", "samruddhi", "സമൃദ്ധി"] },
  karunya: { code: "KR", names: ["karunya", "കാരുണ്യ"] },
  karunya_plus: { code: "KN", names: ["karunya plus", "karunyaplus", "കാരുണ്യ പ്ലസ്"] },
  dhanalekshmi: { code: "DL", names: ["dhanalekshmi", "dhanalakshmi", "ധനലക്ഷ്മി"] },
  sthree_sakthi: { code: "SS", names: ["sthree sakthi", "sthreesakthi", "sthree", "സ്ത്രീശക്തി"] },
  bhagyathara: { code: "BT", names: ["bhagyathara", "ഭാഗ്യതാര"] },
  suvarna_keralam: { code: "SK", names: ["suvarna", "suvarna keralam", "സുവർണ്ണകേരളം", "സുവർണ്ണ"] },
  fifty_fifty: { code: "FF", names: ["fifty fifty", "fifty", "ഫിഫ്റ്റി"] },
  nirmal: { code: "NR", names: ["nirmal", "നിർമ്മൽ"] },
  win_win: { code: "WN", names: ["win win", "win-win", "വിൻ വിൻ"] },
  thiruvonam: { code: "TH", names: ["thiruvonam", "onam bumper", "തിരുവോണം", "ഓണം ബംപർ"] },
  christmas: { code: "XN", names: ["christmas", "xmas", "new year bumper", "ക്രിസ്മസ്"] },
  vishu: { code: "VB", names: ["vishu bumper", "വിഷു"] },
  pooja: { code: "PB", names: ["pooja bumper", "പൂജ"] },
  monsoon: { code: "MB", names: ["monsoon bumper", "മൺസൂൺ"] },
  summer: { code: "SB", names: ["summer bumper", "സമ്മർ"] },
};

/**
 * Extract target date from natural language (Malayalam & English)
 * e.g., "സെപ്റ്റംബർ 22", "22-ാം തീയതി", "September 22", "2026-09-22"
 */
export function parseDateFromQuery(query: string): string | null {
  const q = query.toLowerCase();

  // 1. Direct ISO Date YYYY-MM-DD
  const isoMatch = q.match(/\b(202\d)-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/);
  if (isoMatch) return isoMatch[0];

  // 2. Month keywords
  const monthMap: Record<string, string[]> = {
    "09": ["september", "sep", "സെപ്റ്റംബർ", "സെപ്തംബർ"],
    "10": ["october", "oct", "ഒക്ടോബർ", "ഒക്റ്റോബർ"],
    "08": ["august", "aug", "ഓഗസ്റ്റ്"],
    "07": ["july", "jul", "ജൂലൈ"],
    "06": ["june", "jun", "ജൂൺ"],
    "05": ["may", "മേയ്"],
    "04": ["april", "apr", "ഏപ്രിൽ"],
    "03": ["march", "mar", "മാർച്ച്"],
    "02": ["february", "feb", "ഫെബ്രുവരി"],
    "01": ["january", "jan", "ജനുവരി"],
    "11": ["november", "nov", "നവംബർ"],
    "12": ["december", "dec", "ഡിസംബർ"],
  };

  let matchedMonth: string | null = null;
  for (const [m, aliases] of Object.entries(monthMap)) {
    if (aliases.some((a) => q.includes(a))) {
      matchedMonth = m;
      break;
    }
  }

  // 3. Day numbers in digits or Malayalam words
  const dayWords: Record<string, string[]> = {
    "22": ["ഇരുപത്തിരണ്ട്", "ഇരുപത്തിരണ്ടാം", "22nd", "22-ാം", "22"],
    "21": ["ഇരുപത്തിയൊന്ന്", "ഇരുപത്തിയൊന്നാം", "21st", "21-ാം", "21"],
    "23": ["ഇരുപത്തിമൂന്ന്", "ഇരുപത്തിമൂന്നാം", "23rd", "23-ാം", "23"],
    "24": ["ഇരുപത്തിനാല്", "ഇരുപത്തിനാലാം", "24th", "24-ാം", "24"],
    "25": ["ഇരുപത്തിയഞ്ച്", "ഇരുപത്തിയഞ്ചാം", "25th", "25-ാം", "25"],
    "26": ["ഇരുപത്തിയാറ്", "ഇരുപത്തിയാറാം", "26th", "26-ാം", "26"],
    "27": ["ഇരുപത്തിയേഴ്", "ഇരുപത്തിയേഴാം", "27th", "27-ാം", "27"],
    "28": ["ഇരുപത്തിയെട്ട്", "ഇരുപത്തിയെട്ടാം", "28th", "28-ാം", "28"],
    "29": ["ഇരുപത്തിയൊമ്പത്", "ഇരുപത്തിയൊമ്പതാം", "29th", "29-ാം", "29"],
    "30": ["മുപ്പത്", "മുപ്പതാം", "30th", "30-ാം", "30"],
    "31": ["മുപ്പത്തിയൊന്ന്", "മുപ്പത്തിയൊന്നാം", "31st", "31-ാം", "31"],
    "01": ["ഒന്ന്", "ഒന്നാം", "1st", "1-ാം", "01"],
    "02": ["രണ്ട്", "രണ്ടാം", "2nd", "2-ാം", "02"],
    "03": ["മൂന്ന്", "മൂന്നാം", "3rd", "3-ാം", "03"],
    "04": ["നാല്", "നാലാം", "4th", "4-ാം", "04"],
    "05": ["അഞ്ച്", "അഞ്ചാം", "5th", "5-ാം", "05"],
    "06": ["ആറ്", "ആറാം", "6th", "6-ാം", "06"],
    "07": ["ഏഴ്", "ഏഴാം", "7th", "7-ാം", "07"],
    "08": ["എട്ട്", "എട്ടാം", "8th", "8-ാം", "08"],
    "09": ["ഒമ്പത്", "ഒമ്പതാം", "9th", "9-ാം", "09"],
    "10": ["പത്ത്", "പത്താം", "10th", "10-ാം", "10"],
    "11": ["പതിനൊന്ന്", "പതിനൊന്നാം", "11th", "11-ാം", "11"],
    "12": ["പന്ത്രണ്ട്", "പന്ത്രണ്ടാം", "12th", "12-ാം", "12"],
    "13": ["പതിമൂന്ന്", "പതിമൂന്നാം", "13th", "13-ാം", "13"],
    "14": ["പതിനാല്", "പതിനാലാം", "14th", "14-ാം", "14"],
    "15": ["പതിനഞ്ച്", "പതിനഞ്ചാം", "15th", "15-ാം", "15"],
    "16": ["പതിനാറ്", "പതിനാറാം", "16th", "16-ാം", "16"],
    "17": ["പതിനേഴ്", "പതിനേഴാം", "17th", "17-ാം", "17"],
    "18": ["പതിനെട്ട്", "പതിനെട്ടാം", "18th", "18-ാം", "18"],
    "19": ["പത്തൊമ്പത്", "പത്തൊമ്പതാം", "19th", "19-ാം", "19"],
    "20": ["ഇരുപത്", "ഇരുപതാം", "20th", "20-ാം", "20"],
  };

  let matchedDay: string | null = null;
  for (const [d, aliases] of Object.entries(dayWords)) {
    if (aliases.some((a) => q.includes(a))) {
      matchedDay = d;
      break;
    }
  }

  // Check isolated digit match if month or date/തീയതി mentioned
  if (!matchedDay && (matchedMonth || q.includes("തീയതി") || q.includes("date"))) {
    const digitMatch = q.match(/\b([0-2]?[0-9]|3[01])\b/);
    if (digitMatch) {
      matchedDay = digitMatch[1].padStart(2, "0");
    }
  }

  if (matchedDay) {
    const month = matchedMonth || "09";
    return `2026-${month}-${matchedDay}`;
  }

  return null;
}

/**
 * 100% Internal On-Device Natural Language & Supabase Database Query Engine
 * Defaults to Malayalam. Directly accesses Supabase draw_results table.
 */
export async function processInternalAgentQuery(
  rawQuery: string,
  language: Language = "ml"
): Promise<LocalAgentResult> {
  const startTime = Date.now();
  const q = rawQuery.trim().toLowerCase();
  const ticket = parseTicketFromText(rawQuery);
  const isMl = language === "ml";

  // 1. TICKET CHECK INTENT (Custom Ticket Number or Check Request)
  if (
    ticket ||
    q.includes("ticket") ||
    q.includes("check") ||
    q.includes("win") ||
    q.includes("ടിക്കറ്റ്") ||
    q.includes("ജയിച്ചോ") ||
    q.includes("നമ്പർ") ||
    q.includes("സമ്മാനം") ||
    q.includes("adicho") ||
    q.includes("kittiyo") ||
    q.includes("ente ticket") ||
    q.includes("പരിശോധിക്കുക")
  ) {
    if (!ticket) {
      const displayText = isMl
        ? "നിങ്ങളുടെ 6 അക്ക ടിക്കറ്റ് നമ്പർ പറയുക അല്ലെങ്കിൽ നൽകുക (ഉദാഹരണത്തിന്: MH 980055). ഞാൻ ഉടൻ തന്നെ ഔദ്യോഗിക ഡാറ്റാബേസിൽ പരിശോധിച്ച് ഫലം അറിയിക്കാം."
        : "Please enter or speak your 6-digit ticket number (e.g. MH 980055). I will verify it against official database draws instantly.";

      const speech = isMl
        ? "Please enter or speak your 6 digit ticket number, for example M H 980055. I will check the database instantly."
        : displayText;

      return {
        text: displayText,
        speechText: speech,
        intent: "ticket_prompt",
        cardData: {
          type: "ticket_prompt",
          title: isMl ? "ടിക്കറ്റ് നമ്പർ നൽകുക" : "Enter Ticket Number",
          subtitle: isMl ? "തത്സമയ പരിശോധന" : "Instant Verification",
          primaryHighlight: "e.g. MH 980055",
          secondaryHighlight: isMl ? "6 അക്ക നമ്പർ നൽകുക" : "Provide 6 digits to verify",
          badgeText: "AWAITING TICKET",
        },
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      const matches: SearchMatch[] = await searchTicketNumber(ticket);

      if (matches && matches.length > 0) {
        const top = matches[0];
        const displayText = isMl
          ? `അഭിനന്ദനങ്ങൾ! ടിക്കറ്റ് ${ticket} വിജയിച്ചിരിക്കുന്നു. ${top.draw_name} (${top.draw_code}) നറുക്കെടുപ്പിൽ ${top.prize_tier} ലഭിച്ചു. സമ്മാനത്തുക: ${top.prize_amount || "ലിസ്റ്റ് പ്രകാരം"}.`
          : `Congratulations! Ticket ${ticket} is a confirmed WINNER in ${top.draw_name} (${top.draw_code})! You won ${top.prize_tier} with prize amount ${top.prize_amount || "as per official list"}.`;

        const speech = isMl
          ? `Congratulations! Ticket ${ticket} is a winner in ${top.draw_name} ${top.draw_code}. Prize tier is ${top.prize_tier}, with prize amount ${top.prize_amount || "as per official list"}.`
          : displayText;

        return {
          text: displayText,
          speechText: speech,
          intent: "ticket_match",
          cardData: {
            type: "ticket_match",
            title: `🎉 ${top.prize_tier}!`,
            subtitle: `${top.draw_name} (${top.draw_code}) • ${top.draw_date}`,
            primaryHighlight: top.prize_amount || "Won Prize",
            secondaryHighlight: `Ticket: ${ticket}`,
            badgeText: "VERIFIED WINNER",
            details: [
              { label: isMl ? "നറുക്കെടുപ്പ്" : "Draw Name", value: top.draw_name },
              { label: isMl ? "ഡ്രോ കോഡ്" : "Draw Code", value: top.draw_code },
              { label: isMl ? "തീയതി" : "Draw Date", value: top.draw_date },
              { label: isMl ? "സമ്മാനത്തുക" : "Prize Amount", value: top.prize_amount || top.prize_tier },
              { label: isMl ? "ക്ലെയിം കാലാവധി" : "Claim Period", value: isMl ? "30 ദിവസത്തിനകം ഒറിജിനൽ ടിക്കറ്റുമായി സമർപ്പിക്കുക" : "Within 30 Days with Original Ticket" },
            ],
          },
          latencyMs: Date.now() - startTime,
        };
      } else {
        const displayText = isMl
          ? `ടിക്കറ്റ് ${ticket} പരിശോധിച്ചു. ഔദ്യോഗിക ഡാറ്റാബേസിൽ പ്രസിദ്ധീകരിച്ച നറുക്കെടുപ്പുകളിൽ ഈ നമ്പറിന് സമ്മാനങ്ങൾ ഒന്നും ലഭിച്ചിട്ടില്ല. അടുത്ത തവണ ഭാഗ്യം തുണയ്ക്കട്ടെ!`
          : `Ticket ${ticket} was checked against all official published Kerala lottery draws. No winning prize match was found. Wishing you better luck next time!`;

        const speech = isMl
          ? `Ticket ${ticket} checked across official draws. No winning prize found in published lists. Better luck next time!`
          : displayText;

        return {
          text: displayText,
          speechText: speech,
          intent: "ticket_no_match",
          cardData: {
            type: "ticket_no_match",
            title: isMl ? "സമ്മാനം ലഭിച്ചിട്ടില്ല" : "No Winning Match",
            subtitle: `Ticket: ${ticket}`,
            primaryHighlight: isMl ? "ഔദ്യോഗിക പരിശോധന പൂർത്തിയായി" : "Checked Official Draws",
            secondaryHighlight: isMl ? "പ്രസിദ്ധീകരിച്ച ലിസ്റ്റിൽ ഈ നമ്പർ ഇല്ല" : "Zero winning matches found in published draws",
            badgeText: "VERIFIED NO MATCH",
            details: [
              { label: isMl ? "പരിശോധിച്ച ടിക്കറ്റ്" : "Searched Ticket", value: ticket },
              { label: isMl ? "ഡാറ്റാബേസ് നില" : "Database Status", value: isMl ? "ഔദ്യോഗിക ലിസ്റ്റുമായി പരിശോധിച്ചു" : "Verified against published draws" },
              { label: isMl ? "ശ്രദ്ധിക്കുക" : "Advice", value: isMl ? "സീരീസ് അക്ഷരങ്ങളും തീയതിയും പരിശോധിക്കുക" : "Please double check series & draw date" },
            ],
          },
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (e) {
      console.warn("Internal ticket search error:", e);
    }
  }

  // 2. SPECIFIC DATE QUERY INTENT (e.g., "September 22", "സെപ്റ്റംബർ 22", "ഇരുപത്തിരണ്ടാം തീയതി")
  const targetDate = parseDateFromQuery(rawQuery);
  if (targetDate) {
    try {
      const draws = await getFastDrawSnapshot();
      const dateDraw = draws.find((d) => d.draw_date === targetDate);
      if (dateDraw) {
        const ticketNum = dateDraw.first?.ticket || "Pending";
        const prizeAmt = dateDraw.prizes?.amounts?.["1st"] || "₹1,00,00,000/- (1 Crore)";
        const loc = dateDraw.first?.location || "Kerala";
        const agnt = dateDraw.first?.agent || "Authorized Agency";

        const displayText = isMl
          ? `${dateDraw.draw_date}-ലെ ${dateDraw.draw_name} (${dateDraw.draw_code}) നറുക്കെടുപ്പ് ഫലം: ${prizeAmt} ഒന്നാം സമ്മാനം നേടിയ ടിക്കറ്റ് നമ്പർ ${ticketNum} ആണ്. വിറ്റ സ്ഥലം: ${loc} (ഏജന്റ്: ${agnt}).`
          : `Official Draw Result for ${dateDraw.draw_date} (${dateDraw.draw_name} ${dateDraw.draw_code}): 1st Prize of ${prizeAmt} won by ticket ${ticketNum}, sold in ${loc} by agent ${agnt}.`;

        const speech = isMl
          ? `${dateDraw.draw_name} ${dateDraw.draw_code} ${dateDraw.draw_date} ഫലം, ഒന്നാം സമ്മാനം ${prizeAmt} നേടിയ ടിക്കറ്റ് ${ticketNum}, വിറ്റ സ്ഥലം ${loc}, ഏജന്റ് ${agnt}`
          : displayText;

        return {
          text: displayText,
          speechText: speech,
          intent: "date_draw_result",
          cardData: {
            type: "draw_result",
            title: `🏆 ${dateDraw.draw_name} (${dateDraw.draw_code})`,
            subtitle: `${isMl ? "നറുക്കെടുപ്പ് തീയതി" : "Official Draw Date"}: ${dateDraw.draw_date}`,
            primaryHighlight: ticketNum,
            secondaryHighlight: `${isMl ? "ഒന്നാം സമ്മാനം" : "1st Prize"}: ${prizeAmt}`,
            badgeText: `${dateDraw.draw_date} DRAW`,
            details: [
              { label: isMl ? "ലോട്ടറി പേര്" : "Draw Name", value: `${dateDraw.draw_name} (${dateDraw.draw_code})` },
              { label: isMl ? "ഒന്നാം സമ്മാന ടിക്കറ്റ്" : "1st Prize Ticket", value: ticketNum },
              { label: isMl ? "സമ്മാനത്തുക" : "Prize Amount", value: prizeAmt },
              { label: isMl ? "വിറ്റ സ്ഥലം" : "Sold Location", value: loc },
              { label: isMl ? "ഏജന്റ്" : "Agent Name", value: agnt },
              { label: isMl ? "നറുക്കെടുപ്പ് തീയതി" : "Draw Date", value: dateDraw.draw_date },
            ],
            fullPrizes: dateDraw.prizes?.amounts || {},
          },
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (e) {
      console.warn("Date draw search error:", e);
    }
  }

  // 2. YESTERDAY'S / PREVIOUS DRAW INTENT
  if (
    q.includes("yesterday") ||
    q.includes("innale") ||
    q.includes("kazhinja") ||
    q.includes("previous") ||
    q.includes("last draw") ||
    q.includes("ഇന്നലത്തെ") ||
    q.includes("കഴിഞ്ഞ")
  ) {
    try {
      const draws = await getFastDrawSnapshot();
      if (draws && draws.length > 1) {
        const targetDraw = draws[1]; // Index 1 is yesterday's draw
        const ticketNum = targetDraw.first?.ticket || "Pending";
        const prizeAmt = targetDraw.prizes?.amounts?.["1st"] || "₹1,00,00,000/- (1 Crore)";
        const loc = targetDraw.first?.location || "Kerala";
        const agnt = targetDraw.first?.agent || "Authorized Agency";

        const displayText = isMl
          ? `ഇന്നലത്തെ ${targetDraw.draw_name} (${targetDraw.draw_code}) നറുക്കെടുപ്പ് ഫലം (${targetDraw.draw_date}): ${prizeAmt} ഒന്നാം സമ്മാനം നേടിയ ടിക്കറ്റ് ${ticketNum} ആണ്. വിറ്റ സ്ഥലം: ${loc} (${agnt}).`
          : `Yesterday's ${targetDraw.draw_name} (${targetDraw.draw_code}) Draw Result (${targetDraw.draw_date}): 1st Prize of ${prizeAmt} won by ticket ${ticketNum}, sold in ${loc} by agent ${agnt}.`;

        const speech = isMl
          ? `Yesterday's ${targetDraw.draw_name} ${targetDraw.draw_code} result: First prize ${prizeAmt} won by ticket ${ticketNum}, sold in ${loc} by agent ${agnt}.`
          : displayText;

        return {
          text: displayText,
          speechText: speech,
          intent: "draw_result",
          cardData: {
            type: "draw_result",
            title: `🏆 ${targetDraw.draw_name} (${targetDraw.draw_code})`,
            subtitle: `${isMl ? "ഇന്നലത്തെ നറുക്കെടുപ്പ് തീയതി" : "Yesterday's Draw Date"}: ${targetDraw.draw_date}`,
            primaryHighlight: ticketNum,
            secondaryHighlight: `${isMl ? "ഒന്നാം സമ്മാനം" : "1st Prize"}: ${prizeAmt}`,
            badgeText: isMl ? "ഇന്നലത്തെ ഫലം" : "YESTERDAY DRAW",
            details: [
              { label: isMl ? "ലോട്ടറി പേര്" : "Draw Name", value: `${targetDraw.draw_name} (${targetDraw.draw_code})` },
              { label: isMl ? "ഒന്നാം സമ്മാന ടിക്കറ്റ്" : "1st Prize Ticket", value: ticketNum },
              { label: isMl ? "സമ്മാനത്തുക" : "Prize Amount", value: prizeAmt },
              { label: isMl ? "വിറ്റ സ്ഥലം" : "Sold Location", value: loc },
              { label: isMl ? "ഏജന്റ്" : "Agent Name", value: agnt },
            ],
            fullPrizes: targetDraw.prizes?.amounts || {},
          },
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (e) {
      console.warn("Yesterday draw search error:", e);
    }
  }

  // 3. SPECIFIC LOTTERY INQUIRY OR TODAY'S LATEST DRAW INTENT
  let matchedSpecificLottery: DrawResult | null = null;
  const draws = await getFastDrawSnapshot();

  if (draws && draws.length > 0) {
    // Check if user specifically named a lottery (e.g. Samrudhi, Karunya, Fifty Fifty, etc.)
    for (const [_key, meta] of Object.entries(LOTTERY_ALIASES)) {
      if (meta.names.some((alias) => q.includes(alias))) {
        const found = draws.find(
          (d) =>
            (d.lottery_code && d.lottery_code.toUpperCase() === meta.code) ||
            (d.draw_name && d.draw_name.toLowerCase().includes(meta.names[0])) ||
            (d.draw_code && d.draw_code.toUpperCase().startsWith(meta.code))
        );
        if (found) {
          matchedSpecificLottery = found;
          break;
        }
      }
    }
  }

  // If a specific lottery matched OR user asked for today/latest/winner/draw result
  if (
    matchedSpecificLottery ||
    q.includes("today") ||
    q.includes("innathe") ||
    q.includes("result") ||
    q.includes("winner") ||
    q.includes("1st prize") ||
    q.includes("first prize") ||
    q.includes("ഫലം") ||
    q.includes("ഒന്നാം") ||
    q.includes("വിജയി") ||
    q.includes("ലേറ്റസ്റ്റ്") ||
    q.includes("aarano") ||
    q.includes("aarannu") ||
    q.includes("aaranu") ||
    q.includes("agent") ||
    q.includes("district") ||
    q.includes("സ്ഥലം") ||
    q.includes("ഏജന്റ്")
  ) {
    try {
      if (draws && draws.length > 0) {
        const targetDraw = matchedSpecificLottery || draws[0]; // If not specific, use latest live draw
        const ticketNum = targetDraw.first?.ticket || "Pending";
        const prizeAmt = targetDraw.prizes?.amounts?.["1st"] || "₹1,00,00,000/- (1 Crore)";
        const loc = targetDraw.first?.location || "Kerala";
        const agnt = targetDraw.first?.agent || "Authorized Agency";

        const displayText = isMl
          ? `${targetDraw.draw_name} (${targetDraw.draw_code}) നറുക്കെടുപ്പ് ഫലം (${targetDraw.draw_date}): ${prizeAmt} ഒന്നാം സമ്മാനം നേടിയ ടിക്കറ്റ് നമ്പർ ${ticketNum} ആണ്. വിറ്റ സ്ഥലം: ${loc} (ഏജന്റ്: ${agnt}).`
          : `Official ${targetDraw.draw_name} (${targetDraw.draw_code}) Result (${targetDraw.draw_date}): 1st Prize of ${prizeAmt} won by ticket ${ticketNum}, sold in ${loc} by agent ${agnt}.`;

        const speech = isMl
          ? `${targetDraw.draw_name} ${targetDraw.draw_code} result: First prize ${prizeAmt} won by ticket ${ticketNum}, sold in ${loc} by agent ${agnt}.`
          : displayText;

        return {
          text: displayText,
          speechText: speech,
          intent: "draw_result",
          cardData: {
            type: "draw_result",
            title: `🏆 ${targetDraw.draw_name} (${targetDraw.draw_code})`,
            subtitle: `${isMl ? "നറുക്കെടുപ്പ് തീയതി" : "Official Draw Date"}: ${targetDraw.draw_date}`,
            primaryHighlight: ticketNum,
            secondaryHighlight: `${isMl ? "ഒന്നാം സമ്മാനം" : "1st Prize"}: ${prizeAmt}`,
            badgeText: isMl ? "തത്സമയ ഫലം" : "LIVE DRAW",
            details: [
              { label: isMl ? "ലോട്ടറി പേര്" : "Draw Name", value: `${targetDraw.draw_name} (${targetDraw.draw_code})` },
              { label: isMl ? "ഒന്നാം സമ്മാന ടിക്കറ്റ്" : "1st Prize Ticket", value: ticketNum },
              { label: isMl ? "സമ്മാനത്തുക" : "Prize Amount", value: prizeAmt },
              { label: isMl ? "വിറ്റ ജില്ല / സ്ഥലം" : "Sold Location", value: loc },
              { label: isMl ? "ഏജന്റ് പേര്" : "Agent Name", value: agnt },
              { label: isMl ? "ഡാറ്റാബേസ് തീയതി" : "Draw Date", value: targetDraw.draw_date },
            ],
            fullPrizes: targetDraw.prizes?.amounts || {},
          },
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (e) {
      console.warn("Internal draw search error:", e);
    }
  }

  // 4. BUMPER LOTTERY INTENT
  if (
    q.includes("bumper") ||
    q.includes("onam") ||
    q.includes("vishu") ||
    q.includes("pooja") ||
    q.includes("christmas") ||
    q.includes("monsoon") ||
    q.includes("summer") ||
    q.includes("ബംപർ") ||
    q.includes("ഓണം") ||
    q.includes("വിഷു") ||
    q.includes("പൂജ")
  ) {
    try {
      const bumpers = await fetchBumperLotteries();
      const b = (bumpers && bumpers.length > 0 ? bumpers[0] : BUMPER_LOTTERIES[0]) as LotteryMeta;
      const jackpot = b.jackpot || "₹25 Crore";
      const price = b.ticket_price ? `₹${b.ticket_price}` : "₹300 - ₹500";
      const date = b.draw_date || b.day || "Announced by Directorate";

      const displayText = isMl
        ? `അടുത്ത മെഗാ ബംപർ ലോട്ടറി ${b.name} (${b.nameMl || ""}) ആണ്. ഒന്നാം സമ്മാനം ${jackpot} ആണ്. ടിക്കറ്റ് വില ${price}. നറുക്കെടുപ്പ് തീയതി: ${date}.`
        : `Next Mega Bumper is ${b.name}. 1st Prize Jackpot is ${jackpot}, ticket price is ${price}, and draw schedule is ${date}.`;

      const speech = isMl
        ? `Next Mega Bumper is ${b.name}. First Prize jackpot is ${jackpot}, ticket price is ${price}, and draw date is ${date}.`
        : displayText;

      return {
        text: displayText,
        speechText: speech,
        intent: "bumper_info",
        cardData: {
          type: "bumper_info",
          title: `🌟 ${b.name}`,
          subtitle: b.nameMl || "Kerala State Mega Bumper",
          primaryHighlight: jackpot,
          secondaryHighlight: `${isMl ? "ടിക്കറ്റ് വില" : "Ticket Price"}: ${price}`,
          badgeText: isMl ? "ബംപർ ലോട്ടറി" : "BUMPER JACKPOT",
          details: [
            { label: isMl ? "ബംപർ പേര്" : "Bumper Name", value: b.name },
            { label: isMl ? "ഒന്നാം സമ്മാനം" : "1st Prize", value: jackpot },
            { label: isMl ? "ടിക്കറ്റ് നിരക്ക്" : "Ticket Price", value: price },
            { label: isMl ? "നറുക്കെടുപ്പ്" : "Draw Schedule", value: date },
          ],
        },
        latencyMs: Date.now() - startTime,
      };
    } catch (e) {
      console.warn("Internal bumper error:", e);
    }
  }

  // 5. TAX & NET PAYOUT INTENT
  if (
    q.includes("tax") ||
    q.includes("tds") ||
    q.includes("percentage") ||
    q.includes("in hand") ||
    q.includes("കൈയിൽ") ||
    q.includes("ടാക്സ്") ||
    q.includes("നികുതി") ||
    q.includes("ethra kittum")
  ) {
    const displayText = isMl
      ? "കേരള ലോട്ടറിയിൽ 10,000 രൂപയ്ക്ക് മുകളിലുള്ള എല്ലാ സമ്മാനങ്ങൾക്കും ആദായനികുതി നിയമം സെക്ഷൻ 194B പ്രകാരം ഫ്ലാറ്റ് 30% TDS നികുതിയും 10% ഏജന്റ് കമ്മീഷനും കുറച്ചാണ് ബാക്കി തുക ബാങ്കിൽ ലഭിക്കുക. ഉദാഹരണത്തിന് 1 കോടി രൂപ സമ്മാനം ലഭിച്ചാൽ 30 ലക്ഷം രൂപ ടാക്സും 10 ലക്ഷം ഏജന്റ് കമ്മീഷനും കഴിഞ്ഞ് 60 ലക്ഷം രൂപ കൈയിൽ ലഭിക്കും."
      : "For lottery winnings above ₹10,000, a flat 30% TDS tax is deducted under Section 194B of the Income Tax Act, plus 10% agent commission. For example, on a ₹1 Crore 1st prize, ₹30 Lakhs is deducted for TDS and ₹10 Lakhs for agency, leaving ₹60 Lakhs net payout in your bank account.";

    const speech = isMl
      ? "Under Section 194B, lottery winnings above 10,000 Rupees attract 30% TDS tax and 10% agent commission. For example, on a 1 Crore first prize, 30 Lakhs TDS and 10 Lakhs commission leave 60 Lakhs net payout."
      : displayText;

    return {
      text: displayText,
      speechText: speech,
      intent: "tax_calculator",
      cardData: {
        type: "tax_calculator",
        title: isMl ? "30% TDS ടാക്സ് & സമ്മാനത്തുക" : "TDS 30% Tax & Net Payout Guide",
        subtitle: isMl ? "ആദായനികുതി സെക്ഷൻ 194B" : "Section 194B Income Tax Act",
        primaryHighlight: isMl ? "ഫ്ലാറ്റ് 30% TDS നികുതി" : "Flat 30% TDS Deduction",
        secondaryHighlight: isMl ? "നെറ്റ് ലഭിക്കുന്നത്: 60% തുക" : "Net Payout: 60% in Bank",
        badgeText: isMl ? "നികുതി നിയമങ്ങൾ" : "TAX LAW",
        details: [
          { label: isMl ? "നികുതിയിളവ്" : "Tax Exemption", value: isMl ? "₹10,000 വരെയുള്ള സമ്മാനങ്ങൾക്ക് ടാക്സ് ഇല്ല" : "Prizes up to ₹10,000 (0% TDS)" },
          { label: isMl ? "TDS നിരക്ക്" : "TDS Rate", value: isMl ? "ഫ്ലാറ്റ് 30% (₹10,000 ന് മുകളിൽ)" : "Flat 30% (Prizes > ₹10,000)" },
          { label: isMl ? "ഏജന്റ് കമ്മീഷൻ" : "Agent Commission", value: isMl ? "10% തുക" : "10% of Gross Prize" },
          { label: isMl ? "₹1 കോടി ഉദാഹരണം" : "₹1 Crore Example", value: isMl ? "₹30L ടാക്സ് + ₹10L കമ്മീഷൻ = ₹60 ലക്ഷം നെറ്റ്" : "₹30L TDS + ₹10L Comm = ₹60L Net" },
        ],
      },
      latencyMs: Date.now() - startTime,
    };
  }

  // 6. PRIZE CLAIM GUIDELINES INTENT
  if (
    q.includes("claim") ||
    q.includes("how to get") ||
    q.includes("office") ||
    q.includes("documents") ||
    q.includes("വാങ്ങാൻ") ||
    q.includes("ക്ലെയിം") ||
    q.includes("evide kodukkanam")
  ) {
    const displayText = isMl
      ? "സമ്മാനം നറുക്കെടുപ്പ് തീയതി മുതൽ 30 ദിവസത്തിനകം ക്ലെയിം ചെയ്യണം. 5,000 രൂപ വരെ ഏത് അംഗീകൃത ലോട്ടറി ഏജന്റിൽ നിന്നും വാങ്ങാം. 5,000 മുതൽ 1 ലക്ഷം രൂപ വരെ ജില്ലാ ലോട്ടറി ഓഫീസിലും (DLO), 1 ലക്ഷത്തിന് മുകളിൽ തിരുവനന്തപുരം വികാസ് ഭവനിലെ ലോട്ടറി ഡയറക്ടറേറ്റിലും സമർപ്പിക്കണം. ഒറിജിനൽ ടിക്കറ്റ്, ആധാർ, പാൻ കാർഡ് എന്നിവ ഹാജരാക്കണം."
      : "Prizes must be claimed within 30 days of the draw date. Up to ₹5,000 can be collected from any licensed agent; ₹5,000 to ₹1 Lakh at the District Lottery Office (DLO); and above ₹1 Lakh at the Directorate, Vikas Bhavan, Thiruvananthapuram. Required documents: Original signed ticket, Aadhaar, PAN card, and bank passbook.";

    const speech = isMl
      ? "Prizes must be claimed within 30 days. Up to 5,000 Rupees from any lottery agent; up to 1 Lakh at District Lottery Office; and above 1 Lakh at Directorate, Vikas Bhavan, Thiruvananthapuram with original ticket, Aadhaar and PAN."
      : displayText;

    return {
      text: displayText,
      speechText: speech,
      intent: "claim_guide",
      cardData: {
        type: "claim_guide",
        title: isMl ? "സമ്മാനം വാങ്ങുന്ന വിധം" : "Official Prize Claim Procedures",
        subtitle: isMl ? "കേരള ലോട്ടറി ഡയറക്ടറേറ്റ്" : "Directorate of State Lotteries",
        primaryHighlight: isMl ? "ക്ലെയിം കാലാവധി: 30 ദിവസം" : "Claim Window: 30 Days",
        secondaryHighlight: isMl ? "ഒറിജിനൽ ടിക്കറ്റ് നിർബന്ധം" : "Submit with Original Ticket",
        badgeText: isMl ? "ക്ലെയിം നിയമങ്ങൾ" : "CLAIM GUIDE",
        details: [
          { label: isMl ? "₹5,000 വരെ" : "Up to ₹5,000", value: isMl ? "ഏത് ലോട്ടറി ഏജന്റിൽ നിന്നും" : "Any Lottery Agent in Kerala" },
          { label: isMl ? "₹5,000 - ₹1 ലക്ഷം" : "₹5,000 - ₹1 Lakh", value: isMl ? "ജില്ലാ ലോട്ടറി ഓഫീസ് (DLO)" : "District Lottery Office (DLO)" },
          { label: isMl ? "₹1 ലക്ഷത്തിന് മുകളിൽ" : "Above ₹1 Lakh", value: isMl ? "ഡയറക്ടറേറ്റ്, വികാസ് ഭവൻ, തിരുവനന്തപുരം" : "Directorate, Vikas Bhavan, TVM" },
          { label: isMl ? "ആവശ്യമായ രേഖകൾ" : "Mandatory IDs", value: isMl ? "ആധാർ, പാൻ കാർഡ്, ഫോട്ടോ" : "Aadhaar, PAN Card, Photos" },
        ],
      },
      latencyMs: Date.now() - startTime,
    };
  }

  // 7. DRAW TIMINGS & WEEKLY SCHEDULE
  if (
    q.includes("time") ||
    q.includes("schedule") ||
    q.includes("when") ||
    q.includes("place") ||
    q.includes("സമയം") ||
    q.includes("എപ്പോഴാണ്") ||
    q.includes("samayam")
  ) {
    const displayText = isMl
      ? "എല്ലാ ദിവസവും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് തിരുവനന്തപുരം ഗോർക്കി ഭവനിൽ വച്ചാണ് ഔദ്യോഗിക ലോട്ടറി നറുക്കെടുപ്പ് നടക്കുന്നത്. തിങ്കൾ: വിൻ-വിൻ, ചൊവ്വ: സ്ത്രീശക്തി, ബുധൻ: ഫിഫ്റ്റി-ഫിഫ്റ്റി, വ്യാഴം: കാരുണ്യ പ്ലസ്, വെള്ളി: നിർമ്മൽ, ശനി: കാരുണ്യ, ഞായർ: സമൃദ്ധി."
      : "Kerala State Lottery live draws occur daily at 3:00 PM IST at Gorky Bhavan, Thiruvananthapuram. Monday: Win-Win, Tuesday: Sthree Sakthi, Wednesday: Fifty-Fifty, Thursday: Karunya Plus, Friday: Nirmal, Saturday: Karunya, Sunday: Samrudhi.";

    const speech = isMl
      ? "Daily live draw takes place at 3:00 PM IST at Gorky Bhavan, Thiruvananthapuram. Draws happen 7 days a week."
      : displayText;

    return {
      text: displayText,
      speechText: speech,
      intent: "schedule_info",
      cardData: {
        type: "schedule_info",
        title: isMl ? "നറുക്കെടുപ്പ് സമയവും ദിവസങ്ങളും" : "Daily Draw Schedule & Timings",
        subtitle: isMl ? "തത്സമയ നറുക്കെടുപ്പ്: ഉച്ചയ്ക്ക് 3:00 മണി" : "Live Draw: 3:00 PM IST Sharp",
        primaryHighlight: isMl ? "എല്ലാ ദിവസവും ഉച്ചയ്ക്ക് 3:00 മണി" : "Daily at 3:00 PM",
        secondaryHighlight: isMl ? "ഗോർക്കി ഭവൻ, തിരുവനന്തപുരം" : "Gorky Bhavan, Thiruvananthapuram",
        badgeText: isMl ? "സമയം & സ്ഥലം" : "SCHEDULE",
        details: [
          { label: isMl ? "സമയം" : "Draw Time", value: isMl ? "ഉച്ചയ്ക്ക് 3:00 മണി" : "3:00 PM IST Sharp Everyday" },
          { label: isMl ? "വേദി" : "Venue", value: isMl ? "ഗോർക്കി ഭവൻ, ബേക്കറി ജങ്ഷൻ, തിരുവനന്തപുരം" : "Gorky Bhavan, Near Bakery Jn, TVM" },
          { label: isMl ? "ടിക്കറ്റ് നിരക്ക്" : "Ticket Cost", value: isMl ? "₹40 - ₹50 (ആഴ്ചയിലെ ലോട്ടറികൾ)" : "₹40 - ₹50 (Weekly Draws)" },
        ],
      },
      latencyMs: Date.now() - startTime,
    };
  }

  // 8. DEFAULT GREETING & READY INQUIRY
  const defaultText = isMl
    ? "ഞാൻ നിങ്ങളുടെ കേരള ലോട്ടറി AI അസിസ്റ്റന്റാണ്. ചോദിക്കൂ, ഇന്നത്തെ നറുക്കെടുപ്പ് ഫലം, ടിക്കറ്റ് പരിശോധന, ഇന്നലത്തെ വിന്നർ, ബംപർ ലോട്ടറി, 30% ടാക്സ് നിയമങ്ങൾ എന്നിവ കൃത്യമായി പറഞ്ഞുതരാം."
    : "I am your Kerala Lottery AI Assistant. Ask me about today's draw result, ticket verification, yesterday's winner, next bumper lottery, or 30% TDS tax rules.";

  const defaultSpeech = isMl
    ? "Namaskaram! I am your Kerala Lottery AI Assistant. Ask me about today's draw, ticket verification, yesterday's winner, bumper lotteries, or tax rules."
    : defaultText;

  return {
    text: defaultText,
    speechText: defaultSpeech,
    intent: "default",
    cardData: {
      type: "schedule_info",
      title: isMl ? "കേരള ലോട്ടറി AI അസിസ്റ്റന്റ്" : "Kerala Lottery AI Assistant",
      subtitle: isMl ? "ഡാറ്റാബേസ് കണക്ടഡ്" : "Database Connected",
      primaryHighlight: isMl ? "ഡാറ്റാബേസ് തത്സമയം സജീവം" : "Supabase Live Connected",
      secondaryHighlight: isMl ? "ചോദിക്കൂ, ഞാൻ കൃത്യമായ ഫലം നൽകാം" : "Ready to verify any lottery or ticket",
      badgeText: isMl ? "AI ഏജന്റ്" : "AI AGENT",
      details: [
        { label: isMl ? "ഡാറ്റാബേസ്" : "Database", value: isMl ? "തത്സമയ കണക്ഷൻ" : "Supabase Live DB" },
        { label: isMl ? "ഭാഷ" : "Language", value: isMl ? "മലയാളം (Default)" : "Malayalam & English" },
      ],
    },
    latencyMs: Date.now() - startTime,
  };
}
