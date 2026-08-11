import { createClient } from "@supabase/supabase-js";

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

/**
 * Fetch all draw results directly from Supabase database
 */
export async function fetchAllDraws(): Promise<DrawResult[]> {
  try {
    const { data, error } = await supabase
      .from("draw_results")
      .select("*")
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
    console.warn("Supabase fetchAll error:", e);
  }
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
 * Search winning ticket number against all published draws directly in Supabase
 */
export async function searchTicketNumber(queryTicket: string): Promise<SearchMatch[]> {
  const rawQuery = queryTicket.trim().toUpperCase();
  const digitsOnly = rawQuery.replace(/\D/g, "");
  const normalizedQuery = rawQuery.replace(/\s+/g, "");
  const querySeries = rawQuery.replace(/\d/g, "").trim();

  const allResults = await fetchAllDraws();
  const matches: SearchMatch[] = [];

  for (const draw of allResults) {
    const firstTicketRaw = (draw.first?.ticket || "").trim().toUpperCase();
    const firstTicketNormalized = firstTicketRaw.replace(/\s+/g, "");
    const firstTicketDigits = firstTicketRaw.replace(/\D/g, "");
    const firstSeries = firstTicketRaw.replace(/\d/g, "").trim();

    const matchesFirstSeries = !querySeries || querySeries === firstSeries;

    if (
      firstTicketNormalized &&
      matchesFirstSeries &&
      (firstTicketNormalized === normalizedQuery ||
        (digitsOnly.length === 6 && firstTicketDigits === digitsOnly) ||
        (digitsOnly.length >= 2 && digitsOnly.length < 6 && firstTicketDigits.endsWith(digitsOnly)))
    ) {
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
          const numSeries = normNum.replace(/\d/g, "").trim();

          const matchesItemSeries = !querySeries || !numSeries || querySeries === numSeries;

          if (
            matchesItemSeries &&
            (normNum === normalizedQuery ||
              (digitsOnly.length === 6 && numDigits === digitsOnly) ||
              (digitsOnly.length >= 2 && digitsOnly.length < 6 && numDigits.endsWith(digitsOnly)))
          ) {
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
