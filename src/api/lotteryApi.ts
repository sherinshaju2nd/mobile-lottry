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
      const weekly: LotteryMeta[] = [];
      const bumper: LotteryMeta[] = [];
      const monthOrder = ["XN", "SB", "VB", "MB", "TH", "PB"];

      data.forEach((d: any) => {
        const isBumper = d.is_bumper ?? d.day.toLowerCase().includes("bumper");
        const item: LotteryMeta = {
          code: d.code,
          name: d.name,
          nameMl: d.name_ml || d.name,
          day: d.day,
          drawTime: d.draw_time || (isBumper ? "2:00 PM" : "3:00 PM"),
          isBumper,
          jackpot: d.jackpot || (BUMPER_LOTTERIES.find((b) => b.code === d.code)?.jackpot || "₹10 Crore"),
          drawSeason: d.draw_season || (BUMPER_LOTTERIES.find((b) => b.code === d.code)?.drawSeason || d.day),
          draw_date: d.draw_date || undefined,
          ticket_price: d.ticket_price || undefined,
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

