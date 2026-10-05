import { Language } from "../constants/translations";
import {
  detectIntentLocally,
  detectIntentWithGemini,
} from "../features/ai/services/intentDetector";
import { queryVerifiedLotteryData } from "../features/ai/services/verifiedLotteryService";
import { generateNaturalMalayalamResponse } from "../features/ai/services/malayalamResponseGenerator";
import {
  processInternalAgentQuery,
  LocalAgentResult,
  parseTicketFromText,
} from "./localAgentEngine";

export interface AgentDbCardData {
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
}

export interface AgentAnswer {
  text: string;
  cardData?: AgentDbCardData;
  detectedIntent: string;
  speechText: string;
  latencyMs: number;
}

export function extractTicketCandidate(query: string): string | null {
  return parseTicketFromText(query);
}

/**
 * Verified Malayalam Voice AI Query Service
 * Understands natural Malayalam, Manglish, and English.
 * Queries Supabase database as single source of truth and generates natural Malayalam response.
 */
export async function queryAgentWithDatabase(
  userQuery: string,
  language: Language = "ml",
  history: Array<{ role: "user" | "model"; text: string }> = []
): Promise<AgentAnswer> {
  const startTime = Date.now();

  try {
    // 1. Detect Intent (Fast local matcher + Gemini fallback)
    const context = {
      lastLottery: null,
      lastLotteryCode: null,
      lastDate: null,
      lastTicketNumber: null,
      history,
    };
    const intent =
      detectIntentLocally(userQuery, context) ||
      (await detectIntentWithGemini(userQuery, context));

    // 2. Query Verified Database
    const verified = await queryVerifiedLotteryData(intent);

    // 3. Generate Natural Malayalam Response
    const response = generateNaturalMalayalamResponse(intent, verified, language);

    return {
      text: response.displayText,
      cardData: response.cardData as AgentDbCardData,
      detectedIntent: intent.intent,
      speechText: response.speechText,
      latencyMs: Date.now() - startTime,
    };
  } catch (err) {
    console.warn("Falling back to localAgentEngine:", err);
    const result: LocalAgentResult = await processInternalAgentQuery(
      userQuery,
      language
    );

    return {
      text: result.text,
      cardData: result.cardData,
      detectedIntent: result.intent,
      speechText: result.speechText,
      latencyMs: Date.now() - startTime,
    };
  }
}
