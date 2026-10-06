import {
  StructuredIntent,
  ConversationContext,
  LotteryIntentType,
} from "../types/aiTypes";
import {
  identifyLotteryFromText,
  extractTicketNumber,
  extractDateIntent,
  extractPrizeTier,
  KERALA_LOTTERIES,
  LotteryAliasInfo,
} from "../utils/lotteryNormalizer";
import { matchOfflineQuestion } from "../data/offlineLotteryQuestions";

/**
 * Resolve Kerala lottery scheduled for a given day in Indian Standard Time (IST)
 */
export function getScheduledLotteryForDay(date: Date = new Date()): LotteryAliasInfo {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 3600000 * 5.5);
  const day = ist.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayCodes = ["SM", "BT", "SS", "DL", "KN", "SK", "KR"];
  const code = dayCodes[day] || "BT";
  const found = Object.values(KERALA_LOTTERIES).find((l) => l.code === code);
  return found || KERALA_LOTTERIES.bhagyathara;
}



const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

/**
 * Fast Local Intent Detector (< 5ms)
 * Understands Malayalam, Manglish, and English with zero API latency.
 * Checks 100+ pre-computed questions dataset to avoid calling Gemini!
 */
export function detectIntentLocally(
  query: string,
  context?: ConversationContext
): StructuredIntent | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 0. CHECK PRE-COMPUTED 100+ KERALA LOTTERY FAQ & INTENT DATASET
  // Sub-1ms execution. Zero Gemini API calls needed!
  const offlineMatch = matchOfflineQuestion(query);
  if (offlineMatch) {
    const item = offlineMatch.item;
    const ticketFromQuery = extractTicketNumber(query);
    let matchedLottery = item.lotteryName
      ? { officialName: item.lotteryName, code: item.lotteryCode || "" }
      : identifyLotteryFromText(query);

    // Auto-resolve today's lottery if query is about today and no specific lottery was named
    if (!matchedLottery && (item.dateTarget === "today" || extractDateIntent(query).type === "today")) {
      const todaySched = getScheduledLotteryForDay();
      matchedLottery = todaySched;
    }

    return {
      intent: item.intent,
      lottery: matchedLottery?.officialName || context?.lastLottery || null,
      lotteryCode: item.lotteryCode || matchedLottery?.code || context?.lastLotteryCode || null,
      date: item.dateTarget || extractDateIntent(query).type || context?.lastDate || "today",
      ticketNumber: ticketFromQuery || null,
      prizeTier: item.prizeTier || extractPrizeTier(query) || null,
      rawQuestion: query,
      confidence: 1.0,
      isAmbiguous: false,
    };
  }

  // 1. TICKET CHECK INTENT (Explicit ticket number or check keyword)
  const ticket = extractTicketNumber(query);
  const isTicketPromptKeyword =
    q.includes("ticket") ||
    q.includes("ടിക്കറ്റ്") ||
    q.includes("ടിക്കറ്റിന്") ||
    q.includes("check") ||
    q.includes("പരിശോധിക്കുക") ||
    q.includes("ജയിച്ചോ") ||
    q.includes("സമ്മാനം ഉണ്ടോ") ||
    q.includes("kittiyo") ||
    q.includes("adicho") ||
    q.includes("ente ticket");

  if (ticket) {
    const lottery = identifyLotteryFromText(query) || (context?.lastLottery ? { officialName: context.lastLottery, code: context.lastLotteryCode || "" } : null);
    return {
      intent: "TICKET_CHECK",
      lottery: lottery?.officialName || null,
      lotteryCode: lottery?.code || null,
      date: extractDateIntent(query).type || context?.lastDate || null,
      ticketNumber: ticket,
      rawQuestion: query,
      confidence: 0.98,
    };
  }

  if (isTicketPromptKeyword && !ticket) {
    return {
      intent: "TICKET_CHECK",
      lottery: null,
      lotteryCode: null,
      date: null,
      ticketNumber: null,
      rawQuestion: query,
      confidence: 0.95,
      isAmbiguous: true,
      clarificationPrompt: "തീർച്ചയായും. നിങ്ങളുടെ 6 അക്ക ടിക്കറ്റ് നമ്പർ പറയൂ. ഞാൻ ഉടൻ പരിശോധിച്ച് ഫലം അറിയിക്കാം.",
    };
  }

  // 2. PRIZE STRUCTURE QUERY (e.g. "ഒന്നാം സമ്മാനം എത്രയാണ്?", "what is the first prize?", "second prize?")
  const prizeTier = extractPrizeTier(query);
  const isAskingPrizeAmount =
    q.includes("എത്രയാണ്") ||
    q.includes("ethra") ||
    q.includes("how much") ||
    q.includes("prize amount") ||
    q.includes("സമ്മാനത്തുക") ||
    q.includes("സമ്മാനം എത്ര");

  if (prizeTier || isAskingPrizeAmount) {
    const matchedLottery = identifyLotteryFromText(query);
    const lotteryName = matchedLottery?.officialName || context?.lastLottery || null;
    const lotteryCode = matchedLottery?.code || context?.lastLotteryCode || null;

    if (lotteryName || prizeTier) {
      return {
        intent: "LOTTERY_PRIZE_STRUCTURE",
        lottery: lotteryName,
        lotteryCode,
        date: extractDateIntent(query).type || context?.lastDate || "today",
        ticketNumber: null,
        prizeTier: prizeTier || "1st",
        rawQuestion: query,
        confidence: 0.92,
      };
    }
  }

  // 3. SCHEDULE INTENT (e.g. "അടുത്ത നറുക്കെടുപ്പ് എപ്പോഴാണ്?", "next draw when?", "draw time")
  if (
    q.includes("schedule") ||
    q.includes("സമയം") ||
    q.includes("എപ്പോഴാണ്") ||
    q.includes("samayam") ||
    q.includes("eppozhanu") ||
    q.includes("when is the next draw") ||
    q.includes("next draw") ||
    q.includes("അടുത്ത നറുക്കെടുപ്പ്")
  ) {
    const matchedLottery = identifyLotteryFromText(query);
    return {
      intent: "LOTTERY_SCHEDULE",
      lottery: matchedLottery?.officialName || context?.lastLottery || null,
      lotteryCode: matchedLottery?.code || context?.lastLotteryCode || null,
      date: null,
      ticketNumber: null,
      rawQuestion: query,
      confidence: 0.95,
    };
  }

  // 4. TAX / CLAIM / INFORMATION INTENT
  if (
    q.includes("tax") ||
    q.includes("tds") ||
    q.includes("ടാക്സ്") ||
    q.includes("നികുതി") ||
    q.includes("claim") ||
    q.includes("ക്ലെയിം") ||
    q.includes("വാങ്ങാൻ") ||
    q.includes("office") ||
    q.includes("documents")
  ) {
    return {
      intent: "LOTTERY_INFORMATION",
      lottery: null,
      lotteryCode: null,
      date: null,
      ticketNumber: null,
      rawQuestion: query,
      confidence: 0.96,
    };
  }

  // 5. LOTTERY RESULT INTENT
  let matchedLottery = identifyLotteryFromText(query);
  const dateIntent = extractDateIntent(query);
  const isResultKeyword =
    q.includes("result") ||
    q.includes("ഫലം") ||
    q.includes("റിസൾട്ട്") ||
    q.includes("winner") ||
    q.includes("വിജയി") ||
    q.includes("ലോട്ടറി") ||
    q.includes("draw") ||
    q.includes("പറയാമോ") ||
    q.includes("entha") ||
    q.includes("എന്താണ്");

  // Auto-resolve today's lottery if asking about today
  const isAskingToday = dateIntent.type === "today" || q.includes("today") || q.includes("innathe") || q.includes("ഇന്നത്തെ");
  if (!matchedLottery && isResultKeyword && isAskingToday) {
    const todaySched = getScheduledLotteryForDay();
    matchedLottery = todaySched;
  }

  // Ambiguous query: asking for result without specifying today, date, or lottery name
  if (
    isResultKeyword &&
    !matchedLottery &&
    !context?.lastLottery &&
    !isAskingToday
  ) {
    return {
      intent: "LOTTERY_RESULT",
      lottery: null,
      lotteryCode: null,
      date: "today",
      ticketNumber: null,
      rawQuestion: query,
      confidence: 0.92,
      isAmbiguous: true,
      clarificationPrompt: "ഏത് ലോട്ടറിയുടെ ഫലമാണ് നിങ്ങൾക്ക് വേണ്ടത്?",
    };
  }

  // Matched a specific lottery OR user asked about a result with context
  if (matchedLottery || (isResultKeyword && context?.lastLottery)) {
    const lotName = matchedLottery?.officialName || context?.lastLottery || null;
    const lotCode = matchedLottery?.code || context?.lastLotteryCode || null;

    let targetDate = "today";
    if (dateIntent.type === "yesterday") {
      targetDate = "yesterday";
    } else if (dateIntent.type === "specific" && dateIntent.dateStr) {
      targetDate = dateIntent.dateStr;
    } else if (context?.lastDate && !dateIntent.type) {
      targetDate = context.lastDate;
    }

    return {
      intent: "LOTTERY_RESULT",
      lottery: lotName,
      lotteryCode: lotCode,
      date: targetDate,
      ticketNumber: null,
      rawQuestion: query,
      confidence: 0.94,
    };
  }

  return null;
}

/**
 * AI Intent Detection with Gemini fallback for complex natural language
 */
export async function detectIntentWithGemini(
  query: string,
  context?: ConversationContext
): Promise<StructuredIntent> {
  // 1. Try ultra-fast local intent matching first (< 5ms)
  const localMatch = detectIntentLocally(query, context);
  if (localMatch && (localMatch.confidence || 0) >= 0.90) {
    return localMatch;
  }

  // 2. If ambiguous or local confidence is lower, use Gemini
  if (!GEMINI_API_KEY) {
    // If Gemini key is not configured, fall back to best local guess
    return (
      localMatch || {
        intent: "UNKNOWN",
        lottery: context?.lastLottery || null,
        lotteryCode: context?.lastLotteryCode || null,
        date: "today",
        ticketNumber: null,
        rawQuestion: query,
        confidence: 0.5,
      }
    );
  }

  const prompt = `
You are an intent detection engine for a Kerala State Lottery application.
Analyze the user's message in Malayalam, Manglish, or English.
Conversation context:
- Last discussed lottery: ${context?.lastLottery || "None"}
- Last discussed date: ${context?.lastDate || "None"}
- Last discussed ticket: ${context?.lastTicketNumber || "None"}

Allowed intents:
- LOTTERY_RESULT: User asking for winning result of a draw
- LOTTERY_HISTORY: User asking for previous results / past draws
- LOTTERY_SCHEDULE: User asking about draw timing, dates, schedule
- LOTTERY_PRIZE_STRUCTURE: User asking about 1st, 2nd, 3rd prize amounts
- TICKET_CHECK: User asking to check if their ticket won a prize
- NUMBER_SEARCH: User searching a winning number
- WINNING_NUMBERS: User asking for list of winning numbers
- LOTTERY_INFORMATION: User asking about tax (30% TDS under Section 194B), claim process, prize rules
- APP_HELP: User asking how to use the app
- GENERAL_QUESTION: General lottery inquiry
- UNKNOWN: Unrelated inquiry

Return ONLY a valid JSON object matching this schema without markdown code blocks:
{
  "intent": "LOTTERY_RESULT",
  "lottery": "Karunya",
  "lotteryCode": "KR",
  "date": "today",
  "ticketNumber": null,
  "prizeTier": null,
  "isAmbiguous": false,
  "clarificationPrompt": null
}

User Message: "${query}"
`;

  try {
    const models = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
    ];
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

          return {
            intent: parsed.intent || "GENERAL_QUESTION",
            lottery: parsed.lottery || context?.lastLottery || null,
            lotteryCode: parsed.lotteryCode || context?.lastLotteryCode || null,
            date: parsed.date || "today",
            ticketNumber: parsed.ticketNumber || extractTicketNumber(query),
            prizeTier: parsed.prizeTier || extractPrizeTier(query),
            rawQuestion: query,
            confidence: 0.95,
            isAmbiguous: Boolean(parsed.isAmbiguous),
            clarificationPrompt: parsed.clarificationPrompt,
          };
        }
      } catch (e) {
        console.warn(`Gemini intent extraction error with ${model}:`, e);
      }
    }
  } catch (err) {
    console.warn("Intent detection network error:", err);
  }

  return (
    localMatch || {
      intent: "UNKNOWN",
      lottery: context?.lastLottery || null,
      lotteryCode: context?.lastLotteryCode || null,
      date: "today",
      ticketNumber: null,
      rawQuestion: query,
      confidence: 0.4,
    }
  );
}
