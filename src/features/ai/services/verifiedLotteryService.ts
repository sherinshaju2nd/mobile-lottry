import {
  fetchAllDraws,
  getCachedDrawsQuick,
  searchTicketNumber,
  fetchBumperLotteries,
  DrawResult,
  SearchMatch,
} from "../../../api/lotteryApi";
import { StructuredIntent, VerifiedLotteryData } from "../types/aiTypes";
import { KERALA_LOTTERIES, LotteryAliasInfo } from "../utils/lotteryNormalizer";
import { BUMPER_LOTTERIES, WEEKLY_LOTTERIES, LotteryMeta } from "../../../constants/lotteries";

/**
 * Fetch fast snapshot of draws with offline cache fallback
 */
async function getDrawSnapshot(): Promise<DrawResult[]> {
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
 * Query the verified database based on the extracted structured intent.
 * Database is the SINGLE SOURCE OF TRUTH.
 */
export async function queryVerifiedLotteryData(
  intent: StructuredIntent
): Promise<VerifiedLotteryData> {
  // 1. TICKET CHECK INTENT
  if (intent.intent === "TICKET_CHECK" || intent.intent === "NUMBER_SEARCH") {
    if (!intent.ticketNumber) {
      return {
        found: false,
        queryType: "TICKET_CHECK",
        reason: "MISSING_TICKET_NUMBER",
      };
    }

    try {
      const matches: SearchMatch[] = await searchTicketNumber(intent.ticketNumber);

      if (matches && matches.length > 0) {
        const top = matches[0];
        return {
          found: true,
          queryType: "TICKET_CHECK",
          ticketChecked: intent.ticketNumber,
          isWinner: true,
          lotteryName: top.draw_name,
          lotteryCode: top.lottery_code,
          drawCode: top.draw_code,
          drawDate: top.draw_date,
          winningTier: top.prize_tier,
          winningAmount: top.prize_amount || "ലിസ്റ്റ് പ്രകാരം",
          details: [
            { label: "നറുക്കെടുപ്പ്", value: `${top.draw_name} (${top.draw_code})` },
            { label: "തീയതി", value: top.draw_date },
            { label: "സമ്മാനം", value: top.prize_tier },
            { label: "സമ്മാനത്തുക", value: top.prize_amount || top.prize_tier },
            { label: "ടിക്കറ്റ്", value: intent.ticketNumber },
          ],
        };
      } else {
        return {
          found: false,
          queryType: "TICKET_CHECK",
          ticketChecked: intent.ticketNumber,
          isWinner: false,
          details: [
            { label: "പരിശോധിച്ച ടിക്കറ്റ്", value: intent.ticketNumber },
            { label: "സ്ഥിതി", value: "സമ്മാനം ലഭിച്ചിട്ടില്ല" },
          ],
        };
      }
    } catch (e) {
      console.warn("Ticket verification error:", e);
      return {
        found: false,
        queryType: "TICKET_CHECK",
        reason: "API_ERROR",
      };
    }
  }

  // 2. LOTTERY RESULT INTENT
  if (intent.intent === "LOTTERY_RESULT" || intent.intent === "WINNING_NUMBERS") {
    // Only ambiguous if not asking about today's draw and missing both lottery name and code
    if (intent.isAmbiguous && intent.date !== "today") {
      return {
        found: false,
        queryType: "LOTTERY_RESULT",
        reason: "AMBIGUOUS_LOTTERY",
      };
    }

    try {
      const draws = await getDrawSnapshot();
      if (!draws || draws.length === 0) {
        return {
          found: false,
          queryType: "LOTTERY_RESULT",
          reason: "NOT_IN_DATABASE",
        };
      }

      let targetDraw: DrawResult | null = null;

      // Filter by lottery code or name if provided
      const filteredByLottery = intent.lotteryCode
        ? draws.filter(
            (d) =>
              (d.lottery_code && d.lottery_code.toUpperCase() === intent.lotteryCode!.toUpperCase()) ||
              (d.draw_code && d.draw_code.toUpperCase().startsWith(intent.lotteryCode!.toUpperCase()))
          )
        : intent.lottery
        ? draws.filter((d) => d.draw_name?.toLowerCase().includes(intent.lottery!.toLowerCase()))
        : draws;

      if (intent.date === "yesterday") {
        targetDraw = filteredByLottery.length > 1 ? filteredByLottery[1] : (draws.length > 1 ? draws[1] : null);
      } else if (intent.date && intent.date !== "today") {
        // Specific ISO date
        targetDraw = filteredByLottery.find((d) => d.draw_date === intent.date) || draws.find((d) => d.draw_date === intent.date) || null;
      } else {
        // "today" / latest draw: use filtered draw if available, otherwise latest database draw
        targetDraw = filteredByLottery.length > 0 ? filteredByLottery[0] : (draws.length > 0 ? draws[0] : null);
      }

      if (targetDraw) {
        const firstTicket = targetDraw.first?.ticket || "Pending";
        const firstAmount = targetDraw.prizes?.amounts?.["1st"] || "₹80 Lakhs";
        const location = targetDraw.first?.location || "Kerala";
        const agent = targetDraw.first?.agent || "Authorized Agency";

        return {
          found: true,
          queryType: "LOTTERY_RESULT",
          lotteryName: targetDraw.draw_name,
          lotteryCode: targetDraw.lottery_code,
          drawCode: targetDraw.draw_code,
          drawDate: targetDraw.draw_date,
          firstPrizeTicket: firstTicket,
          firstPrizeAmount: firstAmount,
          firstPrizeLocation: location,
          firstPrizeAgent: agent,
          allPrizes: targetDraw.prizes?.amounts || {},
          details: [
            { label: "ലോട്ടറി", value: `${targetDraw.draw_name} (${targetDraw.draw_code})` },
            { label: "തീയതി", value: targetDraw.draw_date },
            { label: "ഒന്നാം സമ്മാനം", value: firstAmount },
            { label: "വിജയിച്ച ടിക്കറ്റ്", value: firstTicket },
            { label: "വിറ്റ സ്ഥലം", value: location },
            { label: "ഏജന്റ്", value: agent },
          ],
        };
      } else {
        return {
          found: false,
          queryType: "LOTTERY_RESULT",
          lotteryName: intent.lottery || undefined,
          lotteryCode: intent.lotteryCode || undefined,
          drawDate: intent.date || undefined,
          reason: "NOT_IN_DATABASE",
        };
      }
    } catch (e) {
      console.warn("Lottery result search error:", e);
      return {
        found: false,
        queryType: "LOTTERY_RESULT",
        reason: "API_ERROR",
      };
    }
  }

  // 3. PRIZE STRUCTURE INTENT
  if (intent.intent === "LOTTERY_PRIZE_STRUCTURE") {
    try {
      const draws = await getDrawSnapshot();
      let matchedDraw: DrawResult | null = null;

      if (intent.lotteryCode) {
        matchedDraw = draws.find((d) => d.lottery_code?.toUpperCase() === intent.lotteryCode?.toUpperCase()) || null;
      } else if (intent.lottery) {
        matchedDraw = draws.find((d) => d.draw_name?.toLowerCase().includes(intent.lottery!.toLowerCase())) || null;
      }
      if (!matchedDraw && draws.length > 0) {
        matchedDraw = draws[0];
      }

      if (matchedDraw) {
        const tier = intent.prizeTier || "1st";
        const amounts = matchedDraw.prizes?.amounts || {};
        const prizeAmt = amounts[tier] || amounts["1st"] || "₹80 Lakhs";

        return {
          found: true,
          queryType: "LOTTERY_PRIZE_STRUCTURE",
          lotteryName: matchedDraw.draw_name,
          lotteryCode: matchedDraw.lottery_code,
          firstPrizeAmount: prizeAmt,
          allPrizes: amounts,
          details: [
            { label: "ലോട്ടറി", value: matchedDraw.draw_name },
            { label: `${tier} സമ്മാനത്തുക`, value: prizeAmt },
            { label: "ഡാറ്റാബേസ് തീയതി", value: matchedDraw.draw_date },
          ],
        };
      }
    } catch (e) {
      console.warn("Prize structure search error:", e);
    }
  }

  // 4. LOTTERY SCHEDULE INTENT
  if (intent.intent === "LOTTERY_SCHEDULE") {
    let day = "Daily";
    let lotteryName = intent.lottery || "Kerala State Lotteries";
    let price = "₹40 - ₹50";

    if (intent.lottery) {
      const foundWeekly = WEEKLY_LOTTERIES.find((w) => w.name.toLowerCase().includes(intent.lottery!.toLowerCase()));
      if (foundWeekly) {
        day = foundWeekly.day;
        lotteryName = foundWeekly.name;
        price = foundWeekly.ticket_price || "₹50";
      }
    }

    return {
      found: true,
      queryType: "LOTTERY_SCHEDULE",
      lotteryName,
      scheduleInfo: {
        drawTime: "3:00 PM IST",
        venue: "ഗോർക്കി ഭവൻ, ബേക്കറി ജങ്ഷൻ, തിരുവനന്തപുരം",
        dayOfWeek: day,
        ticketPrice: price,
      },
      details: [
        { label: "സമയം", value: "ഉച്ചയ്ക്ക് 3:00 മണി" },
        { label: "വേദി", value: "ഗോർക്കി ഭവൻ, തിരുവനന്തപുരം" },
        { label: "ദിവസം", value: day },
        { label: "ടിക്കറ്റ് വില", value: price },
      ],
    };
  }

  // 5. LOTTERY INFORMATION (Tax / Claim / General)
  if (intent.intent === "LOTTERY_INFORMATION") {
    return {
      found: true,
      queryType: "LOTTERY_INFORMATION",
      details: [
        { label: "TDS നികുതി", value: "സെക്ഷൻ 194B പ്രകാരം ഫ്ലാറ്റ് 30% (₹10,000-ൽ കൂടുതൽ)" },
        { label: "ഏജന്റ് കമ്മീഷൻ", value: "10%" },
        { label: "ക്ലെയിം കാലാവധി", value: "നറുക്കെടുപ്പ് തീയതി മുതൽ 30 ദിവസത്തിനകം" },
        { label: "സമ്മാനം വാങ്ങാൻ", value: "₹5,000 വരെ ഏജന്റിൽ നിന്നും, ₹1L വരെ DLO-യിൽ നിന്നും" },
      ],
    };
  }

  // Default fallback
  return {
    found: false,
    queryType: "UNKNOWN",
  };
}
