export type LotteryIntentType =
  | "LOTTERY_RESULT"
  | "LOTTERY_HISTORY"
  | "LOTTERY_SCHEDULE"
  | "LOTTERY_PRIZE_STRUCTURE"
  | "TICKET_CHECK"
  | "NUMBER_SEARCH"
  | "WINNING_NUMBERS"
  | "LOTTERY_INFORMATION"
  | "SCHEDULE_VENUE"
  | "CLAIM_PROCEDURE"
  | "TAX_COMMISSION"
  | "PRIZE_STRUCTURE"
  | "APP_HELP"
  | "GENERAL_QUESTION"
  | "UNKNOWN";

export type AssistantVoiceState =
  | "IDLE"
  | "GREETING"
  | "READY"
  | "LISTENING"
  | "TRANSCRIBING"
  | "THINKING"
  | "SEARCHING"
  | "PROCESSING"
  | "RESPONDING"
  | "SPEAKING"
  | "COMPLETED"
  | "SUCCESS"
  | "ERROR";

export interface ActivityStep {
  id: string;
  label: string;
  labelMl: string;
  status: "completed" | "in_progress" | "pending";
}

export interface StructuredIntent {
  intent: LotteryIntentType;
  lottery: string | null; // e.g. "Karunya", "Bhagyathara", "Dhanalekshmi", "Sthree Sakthi", etc.
  lotteryCode: string | null; // e.g. "KR", "KN", "SS", "BT", "DL", "SK", "SM", "TH"
  date: string | null; // "today", "yesterday", or "YYYY-MM-DD"
  ticketNumber: string | null; // e.g. "123456", "WA 123456"
  prizeTier?: string | null; // e.g. "1st", "2nd", "3rd", "consolation"
  confidence?: number;
  rawQuestion: string;
  isAmbiguous?: boolean;
  clarificationPrompt?: string;
}

export interface ConversationTurn {
  role: "user" | "model";
  text: string;
  timestamp?: number;
}

export interface ConversationContext {
  lastLottery: string | null;
  lastLotteryCode: string | null;
  lastDate: string | null;
  lastTicketNumber: string | null;
  history: ConversationTurn[];
}

export interface VerifiedLotteryData {
  found: boolean;
  queryType: LotteryIntentType;
  lotteryName?: string;
  lotteryCode?: string;
  drawDate?: string;
  drawCode?: string;
  firstPrizeTicket?: string;
  firstPrizeAmount?: string;
  firstPrizeLocation?: string;
  firstPrizeAgent?: string;
  ticketChecked?: string;
  isWinner?: boolean;
  winningTier?: string;
  winningAmount?: string;
  allPrizes?: Record<string, string | string[]>;
  prizesList?: Array<{ tier: string; amount: string; numbers: string[] }>;
  scheduleInfo?: {
    drawTime: string;
    venue: string;
    dayOfWeek?: string;
    ticketPrice?: string;
  };
  reason?: "NOT_IN_DATABASE" | "FUTURE_DRAW" | "API_ERROR" | "MISSING_TICKET_NUMBER" | "AMBIGUOUS_LOTTERY";
  details?: Array<{ label: string; value: string }>;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  speechText?: string;
  timestamp: number;
  intent?: LotteryIntentType;
  structuredIntent?: StructuredIntent;
  verifiedData?: VerifiedLotteryData;
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
  error?: boolean;
}
