import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

/**
 * Asks for a Play Store / App Store rating only after genuinely good moments
 * (a winning ticket, a share, planning a claim), never after a "no prize" result,
 * and at most once every 4 months. Google/Apple also rate-limit the dialog themselves.
 */

const STORAGE_KEY = "rating_prompt_v1";
export const MIN_DAYS_SINCE_FIRST_USE = 3;
export const MIN_POSITIVE_MOMENTS = 3;
export const DAYS_BETWEEN_PROMPTS = 120;
const DAY_MS = 86_400_000;

export type PositiveMoment = "ticket_win" | "result_shared" | "claim_calculator" | "read_aloud_finished";

export interface RatingState {
  firstSeenAt: number | null;
  positiveMoments: number;
  lastPromptAt: number | null;
}

const EMPTY_STATE: RatingState = { firstSeenAt: null, positiveMoments: 0, lastPromptAt: null };

/** Pure eligibility rule (unit tested). */
export const shouldAskForRating = (state: RatingState, nowMs: number): boolean => {
  if (!state.firstSeenAt) return false;
  if (nowMs - state.firstSeenAt < MIN_DAYS_SINCE_FIRST_USE * DAY_MS) return false;
  if (state.positiveMoments < MIN_POSITIVE_MOMENTS) return false;
  if (state.lastPromptAt && nowMs - state.lastPromptAt < DAYS_BETWEEN_PROMPTS * DAY_MS) return false;
  return true;
};

const readState = async (): Promise<RatingState> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<RatingState>) } : EMPTY_STATE;
  } catch (err: unknown) {
    console.warn("[rating] Could not read state:", err instanceof Error ? err.message : String(err));
    return EMPTY_STATE;
  }
};

let inFlight = false;

/** Call after a good moment. May show the native rating dialog (never blocks the UI). */
export const recordPositiveMoment = async (moment: PositiveMoment, nowMs: number = Date.now()): Promise<void> => {
  if (Platform.OS === "web" || inFlight) return;
  inFlight = true;
  try {
    const previous = await readState();
    const state: RatingState = {
      ...previous,
      firstSeenAt: previous.firstSeenAt ?? nowMs,
      positiveMoments: previous.positiveMoments + 1,
    };

    if (shouldAskForRating(state, nowMs) && (await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
      state.lastPromptAt = nowMs;
      state.positiveMoments = 0;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err: unknown) {
    console.warn(`[rating] ${moment} not recorded:`, err instanceof Error ? err.message : String(err));
  } finally {
    inFlight = false;
  }
};
