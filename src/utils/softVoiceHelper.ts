import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { Language } from "../constants/translations";

let cachedFemaleVoiceId: Record<string, string> = {};
let cachedHasMalayalamVoice: boolean | null = null;

const KNOWN_FEMALE_KEYWORDS = [
  "female",
  "woman",
  "samantha",
  "veena",
  "lekha",
  "priya",
  "ananya",
  "karen",
  "moira",
  "siri",
  "zira",
  "ava",
  "victoria",
  "sangeeta",
  "tessa",
  "cora",
  "serena",
  "catherine",
  "-f-",
  "-d-",
  "-e-",
];

/**
 * Check if the user's device has a native Malayalam (ml-IN) voice installed.
 */
export async function isMalayalamVoiceAvailable(): Promise<boolean> {
  if (cachedHasMalayalamVoice !== null) {
    return cachedHasMalayalamVoice;
  }

  try {
    const availableVoices = await Speech.getAvailableVoicesAsync();
    if (!availableVoices || availableVoices.length === 0) {
      cachedHasMalayalamVoice = false;
      return false;
    }

    const hasMl = availableVoices.some((v) => {
      const vLang = (v.language || "").toLowerCase().replace("_", "-");
      return vLang === "ml-in" || vLang.startsWith("ml");
    });

    cachedHasMalayalamVoice = hasMl;
    return hasMl;
  } catch (err) {
    console.warn("Could not check available voices:", err);
    cachedHasMalayalamVoice = false;
    return false;
  }
}

/**
 * Automatically discover and select the most natural, soft female voice
 * installed on the user's Android, iOS, or Web device.
 */
export async function getBestSoftLadyVoice(
  locale: string
): Promise<string | undefined> {
  if (cachedFemaleVoiceId[locale]) {
    return cachedFemaleVoiceId[locale];
  }

  try {
    const availableVoices = await Speech.getAvailableVoicesAsync();
    if (!availableVoices || availableVoices.length === 0) {
      return undefined;
    }

    const normalizedLocale = locale.toLowerCase().replace("_", "-");
    const langPrefix = normalizedLocale.split("-")[0];

    // 1. Exact locale match with female keyword
    const exactFemale = availableVoices.find((v) => {
      const vLang = (v.language || "").toLowerCase().replace("_", "-");
      const vName = (v.name || "").toLowerCase();
      const vId = (v.identifier || "").toLowerCase();

      const isSameLocale =
        vLang === normalizedLocale || vLang.startsWith(normalizedLocale);
      const isFemale = KNOWN_FEMALE_KEYWORDS.some(
        (kw) => vName.includes(kw) || vId.includes(kw)
      );

      return isSameLocale && isFemale;
    });

    if (exactFemale) {
      cachedFemaleVoiceId[locale] = exactFemale.identifier;
      return exactFemale.identifier;
    }

    // 2. Language prefix match with female keyword
    const prefixFemale = availableVoices.find((v) => {
      const vLang = (v.language || "").toLowerCase().replace("_", "-");
      const vName = (v.name || "").toLowerCase();
      const vId = (v.identifier || "").toLowerCase();

      const isSameLang = vLang.startsWith(langPrefix);
      const isFemale = KNOWN_FEMALE_KEYWORDS.some(
        (kw) => vName.includes(kw) || vId.includes(kw)
      );

      return isSameLang && isFemale;
    });

    if (prefixFemale) {
      cachedFemaleVoiceId[locale] = prefixFemale.identifier;
      return prefixFemale.identifier;
    }

    // 3. Any voice for this exact locale
    const exactVoice = availableVoices.find((v) => {
      const vLang = (v.language || "").toLowerCase().replace("_", "-");
      return vLang === normalizedLocale || vLang.startsWith(normalizedLocale);
    });

    if (exactVoice) {
      cachedFemaleVoiceId[locale] = exactVoice.identifier;
      return exactVoice.identifier;
    }
  } catch (err) {
    console.warn("Soft female voice selection error:", err);
  }

  return undefined;
}

/**
 * Phonetic transliteration / conversion for common Malayalam lottery terms.
 * When the user's phone does NOT have a Malayalam TTS voice installed,
 * passing raw Malayalam Unicode into an English TTS engine causes the infamous
 * "sas sas sas" stuttering bug. This cleanly converts terms to natural,
 * pleasant English / Manglish speech for Indian English TTS.
 */
export function convertMalayalamToCleanSpeech(text: string): string {
  // If the text has no Malayalam characters, return as is
  if (!/[\u0D00-\u0D7F]/.test(text)) {
    return text;
  }

  let s = text;

  // Common sentence phrases
  s = s.replace(
    /നമസ്കാരം!?\s*ഞാൻ നിങ്ങളുടെ കേരള ലോട്ടറി AI അസിസ്റ്റന്റാണ്\.?\s*ചോദിക്കൂ,?\s*ഞാൻ കേൾക്കുന്നുണ്ട്\.{0,3}/gi,
    "Namaskaram, I am your Kerala Lottery AI Assistant, please ask your question, I am listening"
  );
  s = s.replace(
    /ഞാൻ നിങ്ങളുടെ കേരള ലോട്ടറി AI അസിസ്റ്റന്റാണ്/gi,
    "I am your Kerala Lottery AI Assistant"
  );
  s = s.replace(
    /ചോദിക്കൂ,\s*ഞാൻ കേൾക്കുന്നുണ്ട്/gi,
    "Please ask, I am listening"
  );
  s = s.replace(
    /നറുക്കെടുപ്പ് ഫലം/gi,
    "Draw Result"
  );
  s = s.replace(
    /ഒന്നാം സമ്മാനം/gi,
    "First Prize"
  );
  s = s.replace(
    /സമ്മാനത്തുക/gi,
    "Prize Amount"
  );
  s = s.replace(
    /വിറ്റ സ്ഥലം/gi,
    "Sold at"
  );
  s = s.replace(
    /ടിക്കറ്റ് നമ്പർ/gi,
    "Ticket Number"
  );
  s = s.replace(
    /വിജയിച്ചിരിക്കുന്നു/gi,
    "is a confirmed winner"
  );
  s = s.replace(
    /അഭിനന്ദനങ്ങൾ!?/gi,
    "Congratulations"
  );
  s = s.replace(
    /സമ്മാനം ലഭിച്ചിട്ടില്ല/gi,
    "No winning prize found"
  );
  s = s.replace(
    /അടുത്ത ബംപർ ലോട്ടറി/gi,
    "Next Mega Bumper Lottery"
  );
  s = s.replace(
    /ടിക്കറ്റ് വില/gi,
    "Ticket price"
  );
  s = s.replace(
    /എല്ലാ ദിവസവും ഉച്ചയ്ക്ക് 3:00 മണിക്ക് തിരുവനന്തപുരം ഗോർക്കി ഭവനിൽ വച്ചാണ്/gi,
    "Every day at 3:00 PM at Gorky Bhavan Thiruvananthapuram"
  );
  s = s.replace(
    /നിങ്ങളുടെ 6 അക്ക ടിക്കറ്റ് നമ്പർ പറയുക അല്ലെങ്കിൽ താഴെ നൽകുക/gi,
    "Please enter or speak your 6 digit ticket number"
  );
  s = s.replace(
    /ഞാൻ ഉടൻ തന്നെ ഔദ്യോഗിക ലിസ്റ്റുമായി പരിശോധിച്ച് ഫലം അറിയിക്കാം/gi,
    "I will verify it with the official database instantly"
  );
  s = s.replace(
    /ആദായനികുതി നിയമം സെക്ഷൻ 194B പ്രകാരം ഫ്ലാറ്റ് 30% TDS നികുതിയും 10% ഏജന്റ് കമ്മീഷനും കുറച്ചാണ് ബാക്കി തുക ബാങ്കിൽ ലഭിക്കുക/gi,
    "Under Section 194B 30% TDS tax and 10% agent commission is deducted and 60% net amount is credited to bank"
  );
  s = s.replace(
    /സമ്മാനം നറുക്കെടുപ്പ് തീയതി മുതൽ 30 ദിവസത്തിനകം ക്ലെയിം ചെയ്യണം/gi,
    "Prizes must be claimed within 30 days of the draw date"
  );
  s = s.replace(
    /ജില്ലാ ലോട്ടറി ഓഫീസിലും/gi,
    "District Lottery Office"
  );
  s = s.replace(
    /വികാസ് ഭവനിലെ ലോട്ടറി ഡയറക്ടറേറ്റിലും/gi,
    "Lottery Directorate at Vikas Bhavan"
  );
  s = s.replace(/കോടി രൂപ/gi, "Crore Rupees");
  s = s.replace(/ലക്ഷം രൂപ/gi, "Lakh Rupees");
  s = s.replace(/രൂപ/gi, "Rupees");
  s = s.replace(/ആണ്\.?/gi, " ");
  s = s.replace(/നേടിയ/gi, "won by");

  // Fallback cleanup: If any unmapped Malayalam unicode glyphs remain,
  // strip them so the English TTS synthesizer never makes "sas sas sas" sounds!
  s = s.replace(/[\u0D00-\u0D7F]+/g, " ");

  // Remove all periods and full stop artifacts so TTS engines NEVER pronounce "full stop"
  s = s
    .replace(/\.{2,}/g, " ")
    .replace(/\./g, " , ")
    .replace(/!/g, " , ")
    .replace(/\?/g, " , ")
    .replace(/\b(full\s*stop|period)\b/gi, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/[,.\s]+$/, "")
    .trim();

  return s;
}

/**
 * Speak text with soft, natural female/lady voice acoustics.
 * Automatically avoids the "sas sas sas" phone stuttering bug by checking
 * native Malayalam TTS voice support on the device.
 */
export async function speakWithSoftLadyVoice(
  text: string,
  language: Language = "ml",
  options?: {
    onDone?: () => void;
    onError?: () => void;
    onStopped?: () => void;
  }
): Promise<void> {
  const rawCleanText = text
    .replace(/[*#_`>]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[₹]/g, "Rs ")
    .trim();

  if (!rawCleanText) {
    options?.onDone?.();
    return;
  }

  // Check if device actually has a native Malayalam voice installed
  const hasMlVoice = language === "ml" ? await isMalayalamVoiceAvailable() : false;

  let textToSpeak = rawCleanText;
  let targetLocale = "en-IN";

  if (language === "ml") {
    if (hasMlVoice) {
      targetLocale = "ml-IN";
      textToSpeak = rawCleanText;
    } else {
      // Device does not have Malayalam voice: convert to phonetic English/Manglish
      // so the Indian English female voice speaks smoothly with ZERO "sas sas sas"
      targetLocale = "en-IN";
      textToSpeak = convertMalayalamToCleanSpeech(rawCleanText);
    }
  } else if (language === "hi") {
    targetLocale = "hi-IN";
  } else if (language === "ta") {
    targetLocale = "ta-IN";
  } else if (language === "kn") {
    targetLocale = "kn-IN";
  } else {
    targetLocale = "en-IN";
  }

  const voiceId = await getBestSoftLadyVoice(targetLocale);

  // Remove periods and punctuation that cause TTS engine to say "full stop"
  textToSpeak = textToSpeak
    .replace(/\.{2,}/g, " ")
    .replace(/\./g, " , ")
    .replace(/[!?]/g, " , ")
    .replace(/\b(full\s*stop|period)\b/gi, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/[,.\s]+$/, "")
    .trim();

  // Soft feminine pitch and relaxed, gentle rate
  const speechOptions: Speech.SpeechOptions = {
    language: targetLocale,
    pitch: 1.10, // Warm, gentle, soft female pitch
    rate: 0.92,  // Calm, soothing pacing
    voice: voiceId,
    onDone: options?.onDone,
    onError: options?.onError,
    onStopped: options?.onStopped,
  };

  try {
    await Speech.stop();
    Speech.speak(textToSpeak, speechOptions);
  } catch {
    // Web fallback
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = targetLocale;
        utterance.pitch = 1.12;
        utterance.rate = 0.90;

        const webVoices = window.speechSynthesis.getVoices();
        const webFemaleVoice = webVoices.find(
          (v) =>
            v.lang.startsWith(targetLocale.split("-")[0]) &&
            KNOWN_FEMALE_KEYWORDS.some((kw) =>
              v.name.toLowerCase().includes(kw)
            )
        );
        if (webFemaleVoice) {
          utterance.voice = webFemaleVoice;
        }

        utterance.onend = () => options?.onDone?.();
        utterance.onerror = () => options?.onError?.();
        window.speechSynthesis.speak(utterance);
      } catch {
        options?.onDone?.();
      }
    } else {
      options?.onDone?.();
    }
  }
}
