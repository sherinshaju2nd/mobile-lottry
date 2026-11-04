import * as Speech from "expo-speech";
import { DrawResult } from "../api/lotteryApi";
import { getLotteryTranslatedName } from "../constants/lotteries";
import {
  PRIZE_TIER_ORDER,
  PrizeTier,
  formatSpokenAmount,
  getTierAmount,
} from "./prizeAmounts";
import { toSpeechLanguage } from "./speechLocale";

export type ReadAloudLanguage = "en" | "ml";

export interface SpeechChunk {
  /** Tier being read (null for the intro / closing lines). */
  tier: PrizeTier | null;
  text: string;
}

// Long tiers (8th/9th have 100+ numbers) are split so progress updates and Stop react quickly.
const NUMBERS_PER_CHUNK = 12;
const SPEECH_RATE = 0.85; // a little slower than normal: easier for older listeners

const TIER_LABELS: Record<PrizeTier, Record<ReadAloudLanguage, string>> = {
  "1st": { en: "First prize", ml: "ഒന്നാം സമ്മാനം" },
  consolation: { en: "Consolation prize", ml: "സമാശ്വാസ സമ്മാനം" },
  "2nd": { en: "Second prize", ml: "രണ്ടാം സമ്മാനം" },
  "3rd": { en: "Third prize", ml: "മൂന്നാം സമ്മാനം" },
  "4th": { en: "Fourth prize", ml: "നാലാം സമ്മാനം" },
  "5th": { en: "Fifth prize", ml: "അഞ്ചാം സമ്മാനം" },
  "6th": { en: "Sixth prize", ml: "ആറാം സമ്മാനം" },
  "7th": { en: "Seventh prize", ml: "ഏഴാം സമ്മാനം" },
  "8th": { en: "Eighth prize", ml: "എട്ടാം സമ്മാനം" },
  "9th": { en: "Ninth prize", ml: "ഒൻപതാം സമ്മാനം" },
};

const MONTHS: Record<ReadAloudLanguage, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ml: ["ജനുവരി", "ഫെബ്രുവരി", "മാർച്ച്", "ഏപ്രിൽ", "മെയ്", "ജൂൺ", "ജൂലൈ", "ഓഗസ്റ്റ്", "സെപ്റ്റംബർ", "ഒക്ടോബർ", "നവംബർ", "ഡിസംബർ"],
};

const PHRASES = {
  en: {
    intro: (name: string, date: string) => `${name} lottery result for ${date}.`,
    ticket: "Ticket number",
    soldAt: "Sold at",
    numbers: (count: number) => (count === 1 ? "Winning number:" : `${count} winning numbers:`),
    more: "continued:",
    end: "That is the complete result. Please verify with the official gazette before claiming.",
  },
  ml: {
    intro: (name: string, date: string) => `${name} ലോട്ടറി, ${date} നറുക്കെടുപ്പ് ഫലം.`,
    ticket: "ടിക്കറ്റ് നമ്പർ",
    soldAt: "വിറ്റ സ്ഥലം",
    numbers: (count: number) => (count === 1 ? "വിജയിച്ച നമ്പർ:" : `വിജയിച്ച ${count} നമ്പറുകൾ:`),
    more: "തുടരുന്നു:",
    end: "ഫലം പൂർത്തിയായി. സമ്മാനം ക്ലെയിം ചെയ്യുന്നതിന് മുമ്പ് ഔദ്യോഗിക ഗസറ്റുമായി ഒത്തുനോക്കുക.",
  },
} as const;

/** Display / spoken label for a prize tier. */
export const getPrizeTierLabel = (tier: PrizeTier, language: ReadAloudLanguage): string =>
  TIER_LABELS[tier][language];

/** "DN 862528" → "D N 8 6 2 5 2 8": read digit by digit so numbers are easy to follow. */
export const spellTicketForSpeech = (ticket: string): string =>
  ticket.toUpperCase().replace(/[^A-Z0-9]/g, "").split("").join(" ");

// Feed locations are upper-case ("PAYYANNUR"); some voices spell out all-caps words.
const toTitleCase = (text: string): string =>
  text
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");

const formatSpokenDate = (isoDate: string, language: ReadAloudLanguage): string => {
  const [y, m, d] = isoDate.split("-").map((part) => parseInt(part, 10));
  const month = MONTHS[language][(m ?? 0) - 1];
  if (!y || !month || !d) return isoDate;
  return language === "ml" ? `${y} ${month} ${d}` : `${d} ${month} ${y}`;
};

const isRealTicket = (ticket: string | undefined): ticket is string => {
  const value = ticket?.trim().toLowerCase() ?? "";
  return value.length > 0 && value !== "n/a" && value !== "pending";
};

/** Builds the full spoken script for a draw: intro, every published tier in official order, closing line. */
export const buildResultSpeechChunks = (draw: DrawResult, language: ReadAloudLanguage): SpeechChunk[] => {
  const phrases = PHRASES[language];
  const lotteryName = getLotteryTranslatedName(draw.lottery_code, language).trim() || draw.draw_name;
  const chunks: SpeechChunk[] = [
    { tier: null, text: phrases.intro(lotteryName, formatSpokenDate(draw.draw_date, language)) },
  ];

  const tierHeading = (tier: PrizeTier) => {
    const amount = getTierAmount(draw.prizes, tier);
    return amount ? `${TIER_LABELS[tier][language]}, ${formatSpokenAmount(amount, language)}.` : `${TIER_LABELS[tier][language]}.`;
  };

  for (const tier of PRIZE_TIER_ORDER) {
    if (tier === "1st") {
      const ticket = draw.first?.ticket;
      if (!isRealTicket(ticket)) continue;
      const location = draw.first?.location?.trim();
      const soldAt = location && location.toLowerCase() !== "n/a" ? ` ${phrases.soldAt}: ${toTitleCase(location)}.` : "";
      chunks.push({ tier, text: `${tierHeading(tier)} ${phrases.ticket}: ${spellTicketForSpeech(ticket)}.${soldAt}` });
      continue;
    }

    const numbers = (draw.prizes?.[tier] ?? []).filter(isRealTicket);
    if (numbers.length === 0) continue;

    for (let start = 0; start < numbers.length; start += NUMBERS_PER_CHUNK) {
      const spoken = numbers
        .slice(start, start + NUMBERS_PER_CHUNK)
        .map(spellTicketForSpeech)
        .join(", ");
      const heading = start === 0 ? `${tierHeading(tier)} ${phrases.numbers(numbers.length)}` : phrases.more;
      chunks.push({ tier, text: `${heading} ${spoken}.` });
    }
  }

  chunks.push({ tier: null, text: phrases.end });
  return chunks;
};

/**
 * True when the phone has a Malayalam text-to-speech voice. If the voice list is empty
 * (some Android engines report nothing until first use) we assume yes and let the engine try.
 */
export const hasMalayalamVoice = async (): Promise<boolean> => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length === 0 || voices.some((v) => v.language?.toLowerCase().startsWith("ml"));
  } catch (err: unknown) {
    console.warn("[speech] Could not list voices:", err instanceof Error ? err.message : String(err));
    return true;
  }
};

interface PlayCallbacks {
  onTierChange?: (tier: PrizeTier | null) => void;
  onFinish?: () => void;
}

let activeSessionId = 0;

/** Reads the chunks in order. Starting a new session (or calling stopResultSpeech) cancels the previous one. */
export const playResultSpeech = async (
  chunks: SpeechChunk[],
  language: ReadAloudLanguage,
  { onTierChange, onFinish }: PlayCallbacks = {},
): Promise<void> => {
  const sessionId = ++activeSessionId;
  const isCurrent = () => sessionId === activeSessionId;
  try {
    await Speech.stop(); // clear anything still queued from an earlier session
  } catch (err: unknown) {
    console.warn("[speech] Could not clear previous speech:", err instanceof Error ? err.message : String(err));
  }
  // Stop / blur / a newer session may have happened while we were waiting.
  if (!isCurrent()) return;

  const finish = () => {
    if (!isCurrent()) return;
    activeSessionId++;
    onFinish?.();
  };

  chunks.forEach((chunk, index) => {
    const isLast = index === chunks.length - 1;
    Speech.speak(chunk.text, {
      language: toSpeechLanguage(language === "ml" ? "ml-IN" : "en-IN"),
      rate: SPEECH_RATE,
      onStart: () => {
        if (isCurrent()) onTierChange?.(chunk.tier);
      },
      onDone: isLast ? finish : undefined,
      onError: (err) => {
        console.warn("[speech] Utterance failed:", err instanceof Error ? err.message : String(err));
        if (!isCurrent()) return;
        // Don't keep reading a half-broken result: stop the rest of the queue.
        Speech.stop().catch((stopErr: unknown) =>
          console.warn("[speech] Stop after error failed:", stopErr instanceof Error ? stopErr.message : String(stopErr)),
        );
        finish();
      },
    });
  });
};

export const stopResultSpeech = async (): Promise<void> => {
  activeSessionId++;
  try {
    await Speech.stop();
  } catch (err: unknown) {
    console.warn("[speech] Stop failed:", err instanceof Error ? err.message : String(err));
  }
};
