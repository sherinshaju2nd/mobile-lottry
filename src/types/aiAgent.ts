import {
  LotteryIntentType,
  StructuredIntent,
  VerifiedLotteryData,
  ActivityStep,
} from "../features/ai/types/aiTypes";

export type AgentState =
  | "idle"
  | "greeting"
  | "listening"
  | "transcribing"
  | "thinking"
  | "searching"
  | "processing"
  | "speaking"
  | "success"
  | "error";

export type AgentLanguage = "ml" | "en";

export interface AgentCardData {
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

export interface AgentMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  speechText?: string;
  timestamp: number;
  intent?: LotteryIntentType;
  structuredIntent?: StructuredIntent;
  verifiedData?: VerifiedLotteryData;
  cardData?: AgentCardData;
  error?: boolean;
}

export interface QuickActionItem {
  id: string;
  labelEn: string;
  labelMl: string;
  queryEn: string;
  queryMl: string;
  intentHint?: LotteryIntentType;
}

export interface ChatHistorySession {
  id: string;
  query: string;
  responsePreview: string;
  timestamp: number;
  language: AgentLanguage;
}

export type PermissionStatus = "granted" | "denied" | "undetermined";

export interface AIAgentContextState {
  state: AgentState;
  transcript: string;
  response: AgentMessage | null;
  messages: AgentMessage[];
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isVoiceMuted: boolean;
  language: AgentLanguage;
  activitySteps: ActivityStep[];
  audioLevel: number;
  errorMessage: string | null;
  permissionStatus: PermissionStatus;
  isOnline: boolean;
  history: ChatHistorySession[];
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancel: () => Promise<void>;
  retry: () => void;
  askQuestion: (question: string) => Promise<void>;
  setLanguage: (lang: AgentLanguage) => void;
  toggleMute: () => void;
  clearHistory: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  openSessionHistory: (sessionId: string) => void;
}
