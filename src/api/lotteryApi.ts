import { createClient } from "@supabase/supabase-js";
import { WEEKLY_LOTTERIES, BUMPER_LOTTERIES, LotteryMeta } from "../constants/lotteries";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://dqsoseefmiwyjkgqmphh.supabase.co";
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_bF2JcJ0IPvCaVgeybXJKGw_JBtrS7sx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface WinnerInfo {
  ticket?: string;
  location?: string;
  agent?: string;
}

export interface PrizeBreakdown {
  amounts?: Record<string, string>;
  consolation?: string[];
  "1st"?: string[];
  "2nd"?: string[];
  "3rd"?: string[];
  "4th"?: string[];
  "5th"?: string[];
  "6th"?: string[];
  "7th"?: string[];
  "8th"?: string[];
  "9th"?: string[];
}

export interface DrawResult {
  id?: number;
  draw_date: string;
  draw_name: string;
  draw_code: string;
  lottery_code: string;
  first?: WinnerInfo;
  prizes?: PrizeBreakdown;
  created_at?: string;
}

export interface SearchMatch {
  draw_date: string;
  draw_name: string;
  draw_code: string;
  lottery_code: string;
  prize_tier: string;
  prize_amount?: string;
  ticket_matched: string;
}

export function hasAnyDrawResult(draw: DrawResult | null | undefined): boolean {
  if (!draw) return false;
  if (
    draw.first?.ticket &&
    draw.first.ticket.trim().length > 0 &&
    draw.first.ticket.toLowerCase() !== "pending" &&
    draw.first.ticket.toLowerCase() !== "n/a"
  ) {
    return true;
  }
  if (!draw.prizes) return false;
  const tiers = [
    "consolation",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
  ] as const;
  for (const tier of tiers) {
    const arr = (draw.prizes as any)?.[tier];
    if (Array.isArray(arr) && arr.length > 0) {
      return true;
    }
  }
  for (const key of Object.keys(draw.prizes)) {
    if (["amounts", "guess", "mc"].includes(key)) continue;
    const val = (draw.prizes as any)[key];
    if (Array.isArray(val) && val.length > 0) return true;
  }
  return false;
}

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Fetch all lotteries (weekly + bumper) dynamically from Supabase database with offline cache
 */
export async function fetchLotteriesFromDb(): Promise<{ weekly: LotteryMeta[]; bumper: LotteryMeta[] }> {
  try {
    const { data, error } = await supabase
      .from("lotteries")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data && data.length > 0) {
      // Query recent draw results to get real live 1st prize amounts from DB
      const { data: drawData } = await supabase
        .from("draw_results")
        .select("lottery_code, prizes")
        .order("draw_date", { ascending: false })
        .limit(100);

      const dbPrizeMap: Record<string, string> = {};
      if (drawData && drawData.length > 0) {
        drawData.forEach((row: any) => {
          if (row.lottery_code && !dbPrizeMap[row.lottery_code]) {
            try {
              const prizesObj = typeof row.prizes === "string" ? JSON.parse(row.prizes) : row.prizes;
              if (prizesObj?.amounts?.["1st"]) {
                dbPrizeMap[row.lottery_code] = prizesObj.amounts["1st"];
              }
            } catch {}
          }
        });
      }

      const weekly: LotteryMeta[] = [];
      const bumper: LotteryMeta[] = [];
      const monthOrder = ["XN", "SB", "VB", "MB", "TH", "PB"];

      const DEFAULT_WEEKLY_PRIZES: Record<string, string> = {
        BT: "₹1 Crore",
        SS: "₹75 Lakhs",
        DL: "₹1 Crore",
        KN: "₹80 Lakhs",
        SK: "₹70 Lakhs",
        KR: "₹80 Lakhs",
        SM: "₹70 Lakhs",
      };

      data.forEach((d: any) => {
        const isBumper = d.is_bumper ?? d.day.toLowerCase().includes("bumper");
        const defaultJackpot = isBumper
          ? (BUMPER_LOTTERIES.find((b) => b.code === d.code)?.jackpot || "₹10 Crore")
          : (DEFAULT_WEEKLY_PRIZES[d.code] || "₹80 Lakhs");

        const defaultTicketPrice = isBumper
          ? (d.code === "TH" ? "₹500" : d.code === "XN" ? "₹400" : "₹300")
          : "₹50";

        const item: LotteryMeta = {
          code: d.code,
          name: d.name,
          nameMl: d.name_ml || d.name,
          day: d.day,
          drawTime: d.draw_time || (isBumper ? "2:00 PM" : "3:00 PM"),
          isBumper,
          jackpot: d.jackpot || dbPrizeMap[d.code] || defaultJackpot,
          drawSeason: d.draw_season || (BUMPER_LOTTERIES.find((b) => b.code === d.code)?.drawSeason || d.day),
          draw_date: d.draw_date || undefined,
          ticket_price: d.ticket_price || defaultTicketPrice,
        };
        if (isBumper) {
          bumper.push(item);
        } else {
          weekly.push(item);
        }
      });

      bumper.sort((a, b) => {
        const ai = monthOrder.indexOf(a.code);
        const bi = monthOrder.indexOf(b.code);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      const result = {
        weekly: weekly.length > 0 ? weekly : WEEKLY_LOTTERIES,
        bumper: bumper.length > 0 ? bumper : BUMPER_LOTTERIES,
      };

      // Persist snapshot to AsyncStorage for offline instant startup
      AsyncStorage.setItem("@lotteries_meta_cache", JSON.stringify(result)).catch(() => {});
      return result;
    }
  } catch (e) {
    console.warn("fetchLotteriesFromDb error, falling back to cache:", e);
  }

  try {
    const cached = await AsyncStorage.getItem("@lotteries_meta_cache");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return { weekly: WEEKLY_LOTTERIES, bumper: BUMPER_LOTTERIES };
}

/**
 * Fetch all draw results directly from Supabase database with offline cache
 */
export async function fetchAllDraws(): Promise<DrawResult[]> {
  try {
    const { data, error } = await supabase
      .from("draw_results")
      .select("*")
      .order("draw_date", { ascending: false });

    if (!error && data && data.length > 0) {
      const parsedDraws: DrawResult[] = data.map((row) => {
        let firstObj: WinnerInfo = {};
        let prizesObj: PrizeBreakdown = {};
        try {
          firstObj = typeof row.first_prize === "string" ? JSON.parse(row.first_prize) : (row.first_prize || {});
        } catch {
          firstObj = {};
        }
        try {
          prizesObj = typeof row.prizes === "string" ? JSON.parse(row.prizes) : (row.prizes || {});
        } catch {
          prizesObj = {};
        }
        return {
          id: row.id,
          draw_date: row.draw_date,
          draw_name: row.draw_name,
          draw_code: row.draw_code,
          lottery_code: row.lottery_code,
          first: firstObj,
          prizes: prizesObj,
          created_at: row.created_at,
        };
      });

      // Persist snapshot to AsyncStorage for offline viewing
      AsyncStorage.setItem("@draw_results_cache", JSON.stringify(parsedDraws)).catch(() => {});
      return parsedDraws;
    }
  } catch (e) {
    console.warn("Supabase fetchAll error, falling back to offline cache:", e);
  }

  try {
    const cached = await AsyncStorage.getItem("@draw_results_cache");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return [];
}

/**
 * Fast synchronous-like cache reader for instant sub-50ms app startup
 */
export async function getCachedDrawsQuick(): Promise<DrawResult[]> {
  try {
    const cached = await AsyncStorage.getItem("@draw_results_cache");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return [];
}

/**
 * Fetch draw history for a specific lottery code directly from Supabase
 */
export async function fetchLotteryHistory(code: string): Promise<DrawResult[]> {
  try {
    const { data, error } = await supabase
      .from("draw_results")
      .select("*")
      .eq("lottery_code", code.toUpperCase())
      .order("draw_date", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        let firstObj: WinnerInfo = {};
        let prizesObj: PrizeBreakdown = {};
        try {
          firstObj = typeof row.first_prize === "string" ? JSON.parse(row.first_prize) : (row.first_prize || {});
        } catch {
          firstObj = {};
        }
        try {
          prizesObj = typeof row.prizes === "string" ? JSON.parse(row.prizes) : (row.prizes || {});
        } catch {
          prizesObj = {};
        }
        return {
          id: row.id,
          draw_date: row.draw_date,
          draw_name: row.draw_name,
          draw_code: row.draw_code,
          lottery_code: row.lottery_code,
          first: firstObj,
          prizes: prizesObj,
          created_at: row.created_at,
        };
      });
    }
  } catch (e) {
    console.warn("Supabase fetchHistory error:", e);
  }
  return [];
}

/**
 * Fetch a single draw result by code and date directly from Supabase
 */
export async function fetchDrawByDate(code: string, date: string): Promise<DrawResult | null> {
  try {
    const { data, error } = await supabase
      .from("draw_results")
      .select("*")
      .eq("lottery_code", code.toUpperCase())
      .eq("draw_date", date)
      .limit(1);

    if (!error && data && data.length > 0) {
      const row = data[0];
      let firstObj: WinnerInfo = {};
      let prizesObj: PrizeBreakdown = {};
      try {
        firstObj = typeof row.first_prize === "string" ? JSON.parse(row.first_prize) : (row.first_prize || {});
      } catch {
        firstObj = {};
      }
      try {
        prizesObj = typeof row.prizes === "string" ? JSON.parse(row.prizes) : (row.prizes || {});
      } catch {
        prizesObj = {};
      }
      return {
        id: row.id,
        draw_date: row.draw_date,
        draw_name: row.draw_name,
        draw_code: row.draw_code,
        lottery_code: row.lottery_code,
        first: firstObj,
        prizes: prizesObj,
        created_at: row.created_at,
      };
    }
  } catch (e) {
    console.warn("Supabase fetchDrawByDate error:", e);
  }
  return null;
}

/**
 * Fetch draw result for any lottery by date
 */
export async function fetchDrawResultByAnyDate(date: string): Promise<DrawResult | null> {
  try {
    const { data, error } = await supabase
      .from("draw_results")
      .select("*")
      .eq("draw_date", date)
      .limit(1);

    if (!error && data && data.length > 0) {
      const row = data[0];
      let firstObj: WinnerInfo = {};
      let prizesObj: PrizeBreakdown = {};
      try {
        firstObj = typeof row.first_prize === "string" ? JSON.parse(row.first_prize) : (row.first_prize || {});
      } catch {
        firstObj = {};
      }
      try {
        prizesObj = typeof row.prizes === "string" ? JSON.parse(row.prizes) : (row.prizes || {});
      } catch {
        prizesObj = {};
      }
      return {
        id: row.id,
        draw_date: row.draw_date,
        draw_name: row.draw_name,
        draw_code: row.draw_code,
        lottery_code: row.lottery_code,
        first: firstObj,
        prizes: prizesObj,
        created_at: row.created_at,
      };
    }
  } catch (e) {
    console.warn("Supabase fetchDrawResultByAnyDate error:", e);
  }
  return null;
}

/**
 * Search winning ticket number against all published draws directly in Supabase
 */
export async function searchTicketNumber(queryTicket: string, targetDate?: string): Promise<SearchMatch[]> {
  const rawQuery = queryTicket.trim().toUpperCase();
  const digitsOnly = rawQuery.replace(/\D/g, "");
  const normalizedQuery = rawQuery.replace(/\s+/g, "");
  const querySeries = rawQuery.replace(/[^A-Z]/gi, "").trim();

  const allResults = await fetchAllDraws();
  const matches: SearchMatch[] = [];

  for (const draw of allResults) {
    if (targetDate && draw.draw_date !== targetDate) {
      continue;
    }
    const firstTicketRaw = (draw.first?.ticket || "").trim().toUpperCase();
    const firstTicketDigits = firstTicketRaw.replace(/\D/g, "");
    const firstSeries = firstTicketRaw.replace(/[^A-Z]/gi, "").trim();

    // 1st Prize requires exact 6 digits
    if (firstTicketDigits.length === 6 && digitsOnly.length === 6 && firstTicketDigits === digitsOnly) {
      if (querySeries && firstSeries && querySeries !== firstSeries) {
        // Consolation prize: same 6 digits but different series
        matches.push({
          draw_date: draw.draw_date,
          draw_name: draw.draw_name,
          draw_code: draw.draw_code,
          lottery_code: draw.lottery_code,
          prize_tier: "Consolation Prize",
          prize_amount: draw.prizes?.amounts?.["consolation"] || "₹8,000/-",
          ticket_matched: `${querySeries} ${digitsOnly}`,
        });
      } else {
        matches.push({
          draw_date: draw.draw_date,
          draw_name: draw.draw_name,
          draw_code: draw.draw_code,
          lottery_code: draw.lottery_code,
          prize_tier: "1st Prize Winner",
          prize_amount: draw.prizes?.amounts?.["1st"] || "1,00,00,000/-",
          ticket_matched: draw.first?.ticket || "",
        });
      }
    }

    const tiers = [
      "consolation",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
    ] as const;

    for (const tier of tiers) {
      const nums = (draw.prizes as any)?.[tier] as string[] | undefined;
      const amount = draw.prizes?.amounts?.[tier];

      if (nums && Array.isArray(nums)) {
        for (const num of nums) {
          const normNum = num.trim().toUpperCase().replace(/\s+/g, "");
          const numDigits = normNum.replace(/\D/g, "");
          const numSeries = normNum.replace(/[^A-Z]/gi, "").trim();

          const matchesItemSeries = !querySeries || !numSeries || querySeries === numSeries;

          let isTierMatch = false;
          if (numDigits.length === 6) {
            // 6-digit prize requires 6 digits from user
            if (digitsOnly.length === 6 && numDigits === digitsOnly && matchesItemSeries) {
              isTierMatch = true;
            }
          } else if (numDigits.length >= 4) {
            // 4-digit prize: matches if query ends with prize digits or exact match
            if (digitsOnly === numDigits || (digitsOnly.length >= numDigits.length && digitsOnly.endsWith(numDigits))) {
              isTierMatch = true;
            }
          }

          if (isTierMatch) {
            matches.push({
              draw_date: draw.draw_date,
              draw_name: draw.draw_name,
              draw_code: draw.draw_code,
              lottery_code: draw.lottery_code,
              prize_tier: tier === "consolation" ? "Consolation Prize" : `${tier} Prize`,
              prize_amount: amount,
              ticket_matched: num,
            });
          }
        }
      }
    }
  }

  return matches;
}

export interface TopPrizeHint {
  tier: string;
  ticket: string;
  amount?: string;
}

/**
 * Detects if a 4-digit query matches the trailing digits of top prizes (1st, 2nd, 3rd, Consolation)
 */
export function findTopPrizePartialHint(
  rawQuery: string,
  draw: { first?: WinnerInfo; prizes?: PrizeBreakdown }
): TopPrizeHint | null {
  const queryDigits = rawQuery.replace(/\D/g, "");
  if (!queryDigits || queryDigits.length < 4 || queryDigits.length >= 6) {
    return null;
  }

  // 1. Check 1st Prize
  if (draw.first?.ticket) {
    const firstDigits = draw.first.ticket.replace(/\D/g, "");
    if (firstDigits.length === 6 && firstDigits.endsWith(queryDigits)) {
      return {
        tier: "1st Prize",
        ticket: draw.first.ticket,
        amount: draw.prizes?.amounts?.["1st"] || "₹70,00,000/-",
      };
    }
  }

  // 2. Check 2nd, 3rd, Consolation
  const topTiers = ["2nd", "3rd", "consolation"] as const;
  for (const tier of topTiers) {
    const nums = (draw.prizes as any)?.[tier] as string[] | undefined;
    const amount = draw.prizes?.amounts?.[tier];
    if (nums && Array.isArray(nums)) {
      for (const num of nums) {
        const numDigits = String(num).replace(/\D/g, "");
        if (numDigits.length === 6 && numDigits.endsWith(queryDigits)) {
          return {
            tier: tier === "consolation" ? "Consolation Prize" : `${tier} Prize`,
            ticket: String(num),
            amount,
          };
        }
      }
    }
  }

  return null;
}

export function formatTicketSearchInput(text: string): string {
  if (!text) return "";

  // Extract up to 2 letters (series) and up to 6 digits (ticket number)
  const letters = text.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
  const digits = text.replace(/\D/g, "").slice(0, 6);

  if (letters.length > 0) {
    if (digits.length > 0) {
      return `${letters} ${digits}`;
    }
    // If user typed a space after letters, retain it
    if (text.endsWith(" ") || text.includes(" ")) {
      return `${letters} `;
    }
    return letters;
  }

  // If digits only
  return digits;
}

export function getSearchFeedbackMessage(
  queryInput: string,
  language: string = "en",
  drawDate?: string,
  topHint?: TopPrizeHint | null
): string {
  const queryDigits = queryInput.replace(/\D/g, "");
  const isMl = language === "ml";

  if (topHint) {
    if (isMl) {
      return `ശ്രദ്ധിക്കുക: 4 അക്ക തിരച്ചിൽ "${queryInput}" ഉയർന്ന സമ്മാനത്തിന്റെ അവസാന അക്കങ്ങളുമായി (${topHint.tier}: ${topHint.ticket}) സാമ്യമുണ്ട്. സമ്മാനം ലഭിച്ചിട്ടുണ്ടോ എന്നറിയാൻ മുഴുവൻ 6 അക്ക നമ്പറും നൽകുക. 4 അക്കങ്ങൾക്ക് 4-ാം സമ്മാനം മുതൽ മാത്രമേ ലഭിക്കൂ.`;
    }
    return `Note: 4-digit search "${queryInput}" matches ending digits of ${topHint.tier} (${topHint.ticket}${topHint.amount ? ` • ${topHint.amount}` : ""}). Enter your full 6-digit ticket with series to verify. 4-digit searches only win prizes starting from 4th Prize.`;
  }

  if (queryDigits.length >= 4 && queryDigits.length < 6) {
    if (isMl) {
      return `ടിക്കറ്റ് "${queryInput}" 4 മുതൽ 9 വരെയുള്ള സമ്മാനങ്ങളിൽ ഇല്ല. 1, 2, 3 സമ്മാനങ്ങളും സമാശ്വാസ സമ്മാനവും പരിശോധിക്കാൻ മുഴുവൻ 6 അക്ക ടിക്കറ്റ് നമ്പർ നൽകുക.`;
    }
    return `Ticket "${queryInput}" did not match any prize from 4th to 9th Prize. To check 1st, 2nd, 3rd, or Consolation prizes, please enter your full 6-digit ticket number.`;
  }

  if (isMl) {
    return `ടിക്കറ്റ് "${queryInput}" ഈ നറുക്കെടുപ്പിൽ സമ്മാനം നേടിയിട്ടില്ല.`;
  }
  return `Ticket "${queryInput}" did not win any prize in this draw.`;
}

/**
 * Fetch all lotteries master data directly from Supabase
 */
export async function fetchLotteries(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("lotteries")
      .select("*")
      .order("id", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        day: d.day,
        name: d.name,
        nameMl: d.name_ml || d.name,
        code: d.code,
        drawTime: d.draw_time || "3:00 PM",
        is_bumper: d.is_bumper ?? d.day.toLowerCase().includes("bumper"),
        jackpot: d.jackpot,
        draw_season: d.draw_season,
      }));
    }
  } catch (e) {
    console.warn("Supabase fetchLotteries error:", e);
  }
  return [];
}

/**
 * Fetch Bumper lotteries from Supabase
 */
export async function fetchBumperLotteries(): Promise<LotteryMeta[]> {
  try {
    const { data, error } = await supabase
      .from("lotteries")
      .select("*")
      .eq("is_bumper", true)
      .order("id", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        day: d.day,
        name: d.name,
        nameMl: d.name_ml || d.name,
        code: d.code,
        drawTime: d.draw_time || "2:00 PM",
        is_bumper: true,
        jackpot: d.jackpot,
        ticket_price: d.ticket_price,
        draw_date: d.draw_date,
        draw_season: d.draw_season,
      }));
    }
  } catch (e) {
    console.warn("Supabase fetchBumperLotteries error:", e);
  }
  return BUMPER_LOTTERIES;
}

export interface PostponedDraw {
  id?: number;
  draw_date: string;
  lottery_code: string;
  status: string; // 'postponed' | 'cancelled' | 'no_draw' | 'holiday'
  reason: string;
  rescheduled_date?: string | null;
  disable_cron?: boolean;
}

/**
 * Fetch list of postponed/no-draw dates from Supabase
 */
export async function fetchPostponedDraws(date?: string): Promise<PostponedDraw[]> {
  try {
    let query = supabase
      .from("postponed_draws")
      .select("*")
      .order("draw_date", { ascending: false });

    if (date) {
      query = query.eq("draw_date", date);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as PostponedDraw[];
    }
  } catch (e) {
    console.warn("fetchPostponedDraws note:", e);
  }
  return [];
}

/**
 * Check if a date or lottery is marked as postponed
 */
export async function checkIsDatePostponed(
  date: string,
  lotteryCode?: string
): Promise<PostponedDraw | null> {
  try {
    const list = await fetchPostponedDraws(date);
    if (!list || list.length === 0) return null;

    if (lotteryCode) {
      const codeUpper = lotteryCode.toUpperCase();
      const match = list.find(
        (p) => p.lottery_code.toUpperCase() === codeUpper || p.lottery_code.toUpperCase() === "ALL"
      );
      return match || null;
    }

    return list[0] || null;
  } catch (e) {
    console.warn("checkIsDatePostponed error:", e);
    return null;
  }
}

const BACKEND_API_BASE = "https://www.keralalotteryresultstoday.in";

/**
 * Scan a Kerala Lottery ticket image using Gemini Vision on Mobile
 */
export async function scanTicketWithGeminiVision(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<{ ticketNumber: string; series?: string; lotteryName?: string; drawDate?: string }> {
  const GEMINI_API_KEY =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");

  const prompt = `
You are an expert Kerala State Lottery ticket scanner.
Analyze this ticket photo and extract:
1. "series": 2-letter ticket prefix (e.g. "KN", "WA", "SS")
2. "ticket_number": 6-digit ticket number (e.g. "482910")
3. "lottery_name": Name of the lottery if visible
4. "draw_date": Draw date in YYYY-MM-DD if visible

Return ONLY JSON:
{"series": "KN", "ticket_number": "482910", "lottery_name": "Karunya Plus", "draw_date": "2026-03-15"}
`;

  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];
  if (GEMINI_API_KEY) {
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
          const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
          const parsed = JSON.parse(cleaned);

          const num = parsed.ticket_number || "";
          const series = parsed.series || "";
          const fullTicket = series && num ? `${series} ${num}` : num || series;

          return {
            ticketNumber: fullTicket,
            series: parsed.series,
            lotteryName: parsed.lottery_name,
            drawDate: parsed.draw_date,
          };
        }
      } catch (e) {
        console.warn(`Mobile Gemini direct scan failed with ${model}:`, e);
      }
    }
  }

  // Backup fallback: Call backend server endpoint
  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/ai/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanBase64, mimeType }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.ticket) {
        const t = json.ticket;
        const fullTicket = t.series && t.ticket_number ? `${t.series} ${t.ticket_number}` : t.ticket_number || t.series || "";
        return {
          ticketNumber: fullTicket,
          series: t.series,
          lotteryName: t.lottery_name,
          drawDate: t.draw_date,
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend scan fallback error:", backendErr);
  }

  throw new Error("Unable to read ticket digits. Please ensure the ticket number is clearly visible.");
}

/**
 * Mobile Gemini AI Voice & Chat Assistant
 */
export async function chatWithGeminiAssistantMobile(
  userMessage: string,
  history: Array<{ role: "user" | "model"; text: string }> = [],
  contextData?: string
): Promise<string> {
  const GEMINI_API_KEY =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

  const systemInstruction = `
You are the Official Kerala State Lottery AI Assistant for the mobile app.
Help users in natural, friendly Malayalam (മലയാളം) or English with live results, ticket verification, claim procedures, 30% TDS tax rules, and bumper draw dates.

Official Rules:
- Daily draws at 3:00 PM IST from Gorky Bhavan, Thiruvananthapuram.
- Claim validity: 30 days.
- 30% TDS on prizes > ₹10,000 + 10% agent commission.
- Claim offices: Up to ₹5,000 at local agents; ₹5,000-₹1L at DLO; above ₹1L at Directorate.

Grounding Context:
${contextData || "No extra context."}
`;

  // Filter history to ensure contents[0] has role: "user"
  const validHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const h of history) {
    if (!h.text || !h.text.trim()) continue;
    if (validHistory.length === 0 && h.role === "model") continue;
    if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === h.role) {
      validHistory[validHistory.length - 1].parts[0].text += `\n${h.text}`;
    } else {
      validHistory.push({
        role: h.role,
        parts: [{ text: h.text }],
      });
    }
  }

  const contents = [
    ...validHistory,
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];

  if (GEMINI_API_KEY) {
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstruction }],
              },
              contents,
              generationConfig: {
                temperature: 0.4,
                max_output_tokens: 800,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) return replyText;
        }
      } catch (e) {
        console.warn(`Mobile direct chat model ${model} error:`, e);
      }
    }
  }

  // Backup fallback: Call backend server endpoint
  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, history }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.reply) {
        return json.reply;
      }
    }
  } catch (backendErr) {
    console.warn("Backend chat fallback error:", backendErr);
  }

  throw new Error("AI Assistant is currently unavailable. Please try again.");
}

export interface AudioChatResponse {
  userTranscript: string;
  reply: string;
}

/**
 * Mobile Gemini AI Direct Audio Voice Assistant
 * Sends recorded microphone audio in Malayalam or English directly to Gemini
 */
export async function chatWithGeminiAudioMobile(
  base64Audio: string,
  mimeType: string = "audio/m4a",
  history: Array<{ role: "user" | "model"; text: string }> = [],
  contextData?: string
): Promise<AudioChatResponse> {
  const GEMINI_API_KEY =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

  const systemInstruction = `
You are the Official Kerala State Lottery AI Voice Assistant.
The user is speaking to you in Malayalam (മലയാളം) or English.
1. Transcribe the user's spoken words accurately into "user_transcript".
2. Provide a clear, helpful, and concise answer in "reply" in the user's language (Malayalam or English).

Return ONLY valid JSON matching this schema:
{
  "user_transcript": "Exact transcription of user voice query in Malayalam or English",
  "reply": "Your helpful lottery answer in Malayalam or English"
}

Official Rules:
- Daily draws at 3:00 PM IST from Gorky Bhavan, Thiruvananthapuram.
- Claim validity: 30 days.
- 30% TDS on prizes > ₹10,000 + 10% agent commission.
- Claim offices: Up to ₹5,000 at local agents; ₹5,000-₹1L at DLO; above ₹1L at Directorate.

Grounding Context:
${contextData || "No extra context."}
`;

  const validHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const h of history) {
    if (!h.text || !h.text.trim()) continue;
    if (validHistory.length === 0 && h.role === "model") continue;
    validHistory.push({
      role: h.role,
      parts: [{ text: h.text }],
    });
  }

  const cleanAudio = base64Audio.replace(/^data:[^;]+;base64,/, "");

  const contents = [
    ...validHistory,
    {
      role: "user",
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: cleanAudio,
          },
        },
        {
          text: "Listen to the user's spoken audio query in Malayalam or English. 1. Transcribe their question into 'user_transcript'. 2. Provide a helpful, accurate lottery answer in 'reply'. Return JSON: {\"user_transcript\": \"...\", \"reply\": \"...\"}",
        },
      ],
    },
  ];

  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];

  let lastErrorMsg = "";

  if (GEMINI_API_KEY) {
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstruction }],
              },
              contents,
              generationConfig: {
                temperature: 0.2,
                max_output_tokens: 800,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
          const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
          try {
            const parsed = JSON.parse(cleaned);
            return {
              userTranscript: parsed.user_transcript || "🎙️ Voice Question",
              reply: parsed.reply || cleaned,
            };
          } catch {
            return {
              userTranscript: "🎙️ Voice Question",
              reply: cleaned || "Here is your lottery information.",
            };
          }
        } else {
          const errText = await response.text();
          console.warn(`Gemini audio model ${model} HTTP ${response.status}:`, errText);
          lastErrorMsg = errText;
        }
      } catch (e: any) {
        console.warn(`Mobile audio chat model ${model} error:`, e);
        lastErrorMsg = e?.message || "";
      }
    }
  }

  throw new Error(`AI Audio processing failed: ${lastErrorMsg || "Please try again."}`);
}

export interface MobileSocialDigest {
  whatsapp_malayalam: string;
  whatsapp_english: string;
  telegram_post: string;
}

/**
 * Generate viral WhatsApp Status & Telegram text for a draw result
 */
export async function generateSocialMediaDigestsMobile(
  draw: any
): Promise<MobileSocialDigest> {
  const GEMINI_API_KEY =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

  const prompt = `
Generate viral WhatsApp Status and Telegram broadcast message for this Kerala Lottery draw:
Draw: ${draw.draw_name || draw.name} (${draw.draw_code || draw.code})
Date: ${draw.draw_date || ""}
1st Prize: ${draw.first?.ticket || draw.first_prize?.ticket || "N/A"} (${draw.first?.location || "Kerala"})
Website: https://www.keralalotteryresultstoday.in

Return ONLY JSON:
{
  "whatsapp_malayalam": "...",
  "whatsapp_english": "...",
  "telegram_post": "..."
}
`;

  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];
  if (GEMINI_API_KEY) {
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.3,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
          const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
          const parsed = JSON.parse(cleaned);
          return {
            whatsapp_malayalam: parsed.whatsapp_malayalam || "",
            whatsapp_english: parsed.whatsapp_english || "",
            telegram_post: parsed.telegram_post || "",
          };
        }
      } catch (e) {
        console.warn(`Digest model ${model} error:`, e);
      }
    }
  }

  // Backup fallback: Call backend server endpoint
  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/ai/digest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draw }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.digest) {
        return json.digest;
      }
    }
  } catch (backendErr) {
    console.warn("Backend digest fallback error:", backendErr);
  }

  return {
    whatsapp_malayalam: `🎉 ${draw.draw_name || "കേരള ലോട്ടറി"} (${draw.draw_date})\n🏆 ഒന്നാം സമ്മാനം: ${draw.first?.ticket || "ഫലം ലഭ്യമാണ്"}\n👉 ലൈവ് റിസൾട്ട്: https://www.keralalotteryresultstoday.in`,
    whatsapp_english: `🎉 ${draw.draw_name || "Kerala Lottery"} (${draw.draw_date})\n🏆 1st Prize: ${draw.first?.ticket || "Published"}\n👉 Live Result: https://www.keralalotteryresultstoday.in`,
    telegram_post: `📢 Kerala Lottery Result: ${draw.draw_name} (${draw.draw_date})\n🏆 1st Prize Winner: ${draw.first?.ticket || "N/A"}\n👉 Check all prizes: https://www.keralalotteryresultstoday.in`,
  };
}

// ---------------------------------------------------------------------------
// Gemini AI Pattern & Digit Predictor Interfaces & Functions
// ---------------------------------------------------------------------------

export interface LotteryAiPatternAnalysis {
  lottery_name: string;
  lottery_code: string;
  sample_draws_count: number;
  summary: string;
  summary_ml: string;
  hot_digits: {
    overall: Array<{ digit: number; frequency_pct: number; label: string }>;
    positional: {
      first_pos: number[];
      second_pos: number[];
      third_pos: number[];
      last_pos: number[];
    };
  };
  double_patterns: Array<{
    pattern: string;
    type: string;
    description: string;
    historical_frequency: string;
    recommended_examples: string[];
  }>;
  high_value_analysis: {
    recommended_sum_range: string;
    even_odd_ratio: string;
    high_low_ratio: string;
    insight: string;
  };
  prize_focus_patterns: {
    second_prize_strategies: string[];
    sixth_prize_strategies: string[];
    key_patterns: Array<{
      title: string;
      probability_rank: number;
      pattern_structure: string;
      predicted_numbers: string[];
      reasoning: string;
    }>;
  };
  top_predicted_numbers: Array<{
    number: string;
    category: "Hot 4-Digit" | "Double Pattern" | "Balanced Sum" | "2nd/6th Target";
    confidence_score: number;
    rationale: string;
  }>;
  disclaimer: string;
}

export interface CachedAiPatternRecord {
  id?: number;
  lottery_code: string;
  lottery_name: string;
  draws_count: number;
  latest_draw_date?: string;
  analysis: LotteryAiPatternAnalysis;
  updated_at?: string;
}

/**
 * Fetch cached AI pattern prediction from Supabase for Mobile
 * Tries `ai_pattern_predictions` table first, falls back to `app_config` table
 */
export async function getCachedAiPatternPrediction(
  lotteryCode: string
): Promise<CachedAiPatternRecord | null> {
  const code = (lotteryCode || "ALL").toUpperCase();

  // 1. Try dedicated ai_pattern_predictions table
  try {
    const { data, error } = await supabase
      .from("ai_pattern_predictions")
      .select("*")
      .eq("lottery_code", code)
      .maybeSingle();

    if (data && !error && data.analysis) {
      return data as CachedAiPatternRecord;
    }
  } catch (err) {
    console.warn("Mobile ai_pattern_predictions table check note:", err);
  }

  // 2. Fallback to app_config table
  try {
    const { data } = await supabase
      .from("app_config")
      .select("value, updated_at")
      .eq("key", `ai_pred_${code}`)
      .maybeSingle();

    if (data?.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      return {
        ...parsed,
        updated_at: data.updated_at || parsed.updated_at,
      } as CachedAiPatternRecord;
    }
  } catch (err) {
    console.warn("Mobile app_config AI cache fallback note:", err);
  }

  return null;
}

/**
 * Save or update AI pattern prediction in Supabase from Mobile
 */
export async function saveAiPatternPrediction(
  record: CachedAiPatternRecord
): Promise<boolean> {
  const code = (record.lottery_code || "ALL").toUpperCase();
  const now = new Date().toISOString();
  let saved = false;

  // 1. Try upserting to ai_pattern_predictions table
  try {
    const { error } = await supabase
      .from("ai_pattern_predictions")
      .upsert(
        {
          lottery_code: code,
          lottery_name: record.lottery_name,
          draws_count: record.draws_count,
          latest_draw_date: record.latest_draw_date || null,
          analysis: record.analysis,
          updated_at: now,
        },
        { onConflict: "lottery_code" }
      );

    if (!error) {
      saved = true;
    }
  } catch (err) {
    console.warn("Mobile ai_pattern_predictions upsert note:", err);
  }

  // 2. Backup copy in app_config
  try {
    await supabase.from("app_config").upsert(
      {
        key: `ai_pred_${code}`,
        value: JSON.stringify({
          ...record,
          updated_at: now,
        }),
        updated_at: now,
      },
      { onConflict: "key" }
    );
    saved = true;
  } catch (err) {
    console.warn("Mobile app_config fallback upsert note:", err);
  }

  return saved;
}

/**
 * Direct Gemini client call for Lottery Pattern Analysis on mobile
 */
export async function analyzeLotteryPatternsWithGeminiMobile(
  lotteryName: string,
  lotteryCode: string,
  draws: DrawResult[],
  lang: string = "en"
): Promise<LotteryAiPatternAnalysis> {
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

  if (!GEMINI_API_KEY) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not configured.");
  }

  const formattedDraws = draws.slice(0, 40).map((d, index) => {
    const p = d.prizes || {};
    return {
      draw_index: index + 1,
      draw_date: d.draw_date,
      lottery_name: d.draw_name,
      lottery_code: d.draw_code || d.lottery_code,
      first_prize: d.first?.ticket || "N/A",
      second_prize: p["2nd"] || [],
      third_prize: p["3rd"] || [],
      fourth_prize: p["4th"] || [],
      fifth_prize: p["5th"] || [],
      sixth_prize: p["6th"] || [],
      seventh_prize: p["7th"] || [],
      eighth_prize: p["8th"] || [],
      ninth_prize: p["9th"] || [],
    };
  });

  const prompt = `
### Role & Objective:
Act as an expert statistical data analyst specializing in numerical pattern recognition and probability distribution for Kerala State Lotteries.
Analyze the provided multi-week historical lottery results for "${lotteryName}" (${lotteryCode === "ALL" ? "All Weekly Lotteries Collective Analysis" : `Lottery Code: ${lotteryCode}`}) containing ${draws.length} historical draw records.

Each draw record includes winning ticket numbers across **all available prize tiers from 1st Prize through 9th Prize** (1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, and 9th prizes; consolation prizes excluded).

### Analysis Tasks Across ALL 1st to 9th Prize Records:
1. **Hot & Cold Digit Frequency Analysis (1st to 9th Prizes):**
   - Aggregate digit occurrences across all 1st through 9th prize numbers in the dataset to identify the most frequent "Hot Digits" (0-9) overall and by positional column (1st, 2nd, 3rd, 4th positions).
   - Compute frequency percentages based on the full 1st to 9th prize dataset.

2. **Double & Repeating Pattern Detection:**
   - Detect repeated pairs, double numbers (consecutive pairs like AA, mirrors ABBA, center doubles XYYX, double endings XX) across all 1st through 9th prize numbers.
   - Suggest 4-digit double examples.

3. **High-Value & Sum Range Analysis:**
   - Compute the most frequent 4-digit sum ranges (e.g., 14-22), even/odd parity balance, and high (5-9) vs low (0-4) ratio.

4. **Prize Tier Specific Strategies (including 2nd & 6th Prize Targets):**
   - Specifically evaluate the distributions and patterns across 2nd Prize, 6th Prize, and other major tiers.
   - Formulate 4 to 5 distinct high-probability number patterns / templates.

5. **Top Concrete Predicted / Strategy Numbers:**
   - Provide concrete 4-digit number recommendations based on the findings with confidence scores and rationale.

### Historical Dataset:
${JSON.stringify(formattedDraws)}

### Output Requirements:
Return strictly a valid JSON object matching this exact schema without markdown code blocks:
{
  "lottery_name": "${lotteryName}",
  "lottery_code": "${lotteryCode}",
  "sample_draws_count": ${draws.length},
  "summary": "English executive summary detailing key statistical trends, anomalies, and repeating patterns.",
  "summary_ml": "മലയാളത്തിൽ പ്രധാന പാറ്റേണുകളുടെയും ട്രെൻഡുകളുടെയും സമഗ്രമായ വിവരണം.",
  "hot_digits": {
    "overall": [
      { "digit": 7, "frequency_pct": 82, "label": "Very Hot" },
      { "digit": 3, "frequency_pct": 74, "label": "Hot" },
      { "digit": 9, "frequency_pct": 68, "label": "Hot" },
      { "digit": 2, "frequency_pct": 61, "label": "Warm" },
      { "digit": 5, "frequency_pct": 58, "label": "Warm" }
    ],
    "positional": {
      "first_pos": [7, 3, 5],
      "second_pos": [2, 9, 8],
      "third_pos": [3, 6, 1],
      "last_pos": [9, 7, 4]
    }
  },
  "double_patterns": [
    {
      "pattern": "Consecutive Pairs (e.g. 55XX or XX77)",
      "type": "Consecutive Pair",
      "description": "Double identical digits appearing in adjacent positions.",
      "historical_frequency": "Appeared in 64% of recent draws",
      "recommended_examples": ["5593", "7724", "3884", "9912"]
    },
    {
      "pattern": "Mirror Patterns (ABBA)",
      "type": "Mirror Reflection",
      "description": "Symmetrical reflection digit pairs matching across edges.",
      "historical_frequency": "High occurrence in 6th prize",
      "recommended_examples": ["4884", "2772", "9119", "5335"]
    }
  ],
  "high_value_analysis": {
    "recommended_sum_range": "16 - 24",
    "even_odd_ratio": "2 Even : 2 Odd (54% occurrence)",
    "high_low_ratio": "2 High (5-9) : 2 Low (0-4)",
    "insight": "Winning 4-digit tickets lean towards balanced odd/even parity with sum clusters centered around 18-22."
  },
  "prize_focus_patterns": {
    "second_prize_strategies": [
      "Concentrate on 6-digit tickets where middle digits form consecutive hot pairs.",
      "Watch for repeating series patterns matching previous draw weeks."
    ],
    "sixth_prize_strategies": [
      "Last 4 digits heavily favor consecutive twin combinations.",
      "Balanced sum between 14 and 22 shows highest historical hit rate."
    ],
    "key_patterns": [
      {
        "title": "Strategy 1: Hot Positional Vector Template",
        "probability_rank": 1,
        "pattern_structure": "[Hot 1st Pos] + [Hot 2nd Pos] + [Hot 3rd Pos] + [Hot Last Pos]",
        "predicted_numbers": ["7239", "3967", "5814", "7964"],
        "reasoning": "Constructed by joining the highest frequency individual digit per positional column."
      },
      {
        "title": "Strategy 2: High Probability Consecutive Double",
        "probability_rank": 2,
        "pattern_structure": "[Double Pair AA] + [Hot Positional YZ]",
        "predicted_numbers": ["5593", "7724", "9912", "3384"],
        "reasoning": "Leverages the strong double-pair recurrence observed in 6th & 7th prize historical prize structures."
      },
      {
        "title": "Strategy 3: 2nd Prize Target Mirror Reflection",
        "probability_rank": 3,
        "pattern_structure": "[Digit A] + [Double Pair BB] + [Digit A]",
        "predicted_numbers": ["4884", "2772", "9119", "3663"],
        "reasoning": "Symmetrical patterns have historically shown above-average clustering in 2nd prize outcomes."
      },
      {
        "title": "Strategy 4: Balanced Sum Cluster",
        "probability_rank": 4,
        "pattern_structure": "Sum(D1..D4) in range 16-24 with 2E:2O",
        "predicted_numbers": ["2749", "5866", "8712", "8860"],
        "reasoning": "Maintains golden mathematical parity ratio of 2 odd and 2 even digits with optimal sum."
      }
    ]
  },
  "top_predicted_numbers": [
    {
      "number": "5593",
      "category": "Double Pattern",
      "confidence_score": 94,
      "rationale": "Consecutive double 55 in 1st/2nd position with hot ending 93."
    },
    {
      "number": "7239",
      "category": "Hot 4-Digit",
      "confidence_score": 91,
      "rationale": "Combines #1 hot digits across all 4 positional index slots."
    },
    {
      "number": "4884",
      "category": "2nd/6th Target",
      "confidence_score": 88,
      "rationale": "High-probability ABBA mirror pattern targeted for 2nd & 6th prize structures."
    },
    {
      "number": "2749",
      "category": "Balanced Sum",
      "confidence_score": 86,
      "rationale": "Sum=22, 2 Even/2 Odd, 2 High/2 Low optimal balance distribution."
    },
    {
      "number": "5866",
      "category": "Double Pattern",
      "confidence_score": 84,
      "rationale": "Ending double 66 with high frequency initial pair 58."
    },
    {
      "number": "9924",
      "category": "Double Pattern",
      "confidence_score": 82,
      "rationale": "Leading double 99 combined with warm ending pair 24."
    }
  ],
  "disclaimer": "These patterns and predictions are generated using mathematical statistical frequency analysis and Google Gemini AI pattern recognition on historical Kerala Lottery results for informational and research purposes only. Lottery outcomes are games of chance."
}
`;

  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];

  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        return JSON.parse(cleaned);
      } else {
        const errText = await response.text();
        console.warn(`Mobile Gemini Pattern model ${model} HTTP ${response.status}:`, errText);
      }
    } catch (e) {
      lastError = e;
      console.warn(`Mobile Pattern model ${model} error:`, e);
    }
  }

  throw lastError || new Error("Failed to analyze lottery patterns with Gemini AI.");
}

/**
 * Intelligent fetch for Gemini AI Pattern Prediction on Mobile:
 * 1. Database Cache check (0 Gemini calls)
 * 2. Backend POST API attempt
 * 3. Direct Gemini client fallback + Supabase persistence
 * 4. Stale cache fallback if unavailable
 */
export async function fetchAiPatternPredictionMobile(
  lotteryName: string = "All Kerala Lotteries",
  lotteryCode: string = "ALL",
  draws: DrawResult[] = [],
  lang: string = "en",
  forceRefresh: boolean = false
): Promise<{
  success: boolean;
  analysis: LotteryAiPatternAnalysis;
  cached: boolean;
  warning?: string;
  drawsCount: number;
}> {
  const code = (lotteryCode || "ALL").toUpperCase();
  const currentDrawCount = draws.length;
  const latestDrawDate = draws[0]?.draw_date;

  // --- STEP 1: Check Database Cache ---
  let cachedRecord: CachedAiPatternRecord | null = null;
  try {
    cachedRecord = await getCachedAiPatternPrediction(code);
  } catch (e) {
    console.warn("Mobile DB cache check note:", e);
  }

  if (!forceRefresh && cachedRecord && cachedRecord.analysis) {
    if (cachedRecord.draws_count === currentDrawCount || currentDrawCount === 0) {
      return {
        success: true,
        analysis: cachedRecord.analysis,
        cached: true,
        drawsCount: cachedRecord.draws_count,
      };
    }
  }

  // --- STEP 2: Try Backend API ---
  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/ai/pattern-predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lotteryName,
        lotteryCode: code,
        draws,
        lang,
        forceRefresh,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.analysis) {
        return {
          success: true,
          analysis: data.analysis,
          cached: Boolean(data.cached),
          warning: data.warning,
          drawsCount: data.drawsCount || currentDrawCount,
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend pattern predict failed, trying direct Gemini:", backendErr);
  }

  // --- STEP 3: Direct Gemini Client Call ---
  try {
    const freshAnalysis = await analyzeLotteryPatternsWithGeminiMobile(
      lotteryName,
      code,
      draws,
      lang
    );

    // Save to Supabase cache asynchronously
    saveAiPatternPrediction({
      lottery_code: code,
      lottery_name: lotteryName,
      draws_count: currentDrawCount,
      latest_draw_date: latestDrawDate,
      analysis: freshAnalysis,
    }).catch((saveErr) => console.warn("Failed to persist to Supabase:", saveErr));

    return {
      success: true,
      analysis: freshAnalysis,
      cached: false,
      drawsCount: currentDrawCount,
    };
  } catch (geminiErr: any) {
    console.error("Direct Gemini pattern analysis error:", geminiErr);

    // --- STEP 4: Fallback to existing cached analysis if available ---
    if (cachedRecord && cachedRecord.analysis) {
      return {
        success: true,
        analysis: cachedRecord.analysis,
        cached: true,
        drawsCount: cachedRecord.draws_count,
        warning: "Showing previous AI pattern analysis as network generation is temporarily congested.",
      };
    }

    throw geminiErr;
  }
}




