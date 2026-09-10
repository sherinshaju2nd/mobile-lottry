import * as Speech from "expo-speech";
import { DrawResult } from "../api/lotteryApi";
import { getLotteryMalayalamName } from "../constants/lotteries";

let isSpeakingState = false;

export async function speakLotteryResult(
  draw: DrawResult,
  language: "ml" | "en" = "ml",
  onDone?: () => void
): Promise<void> {
  try {
    await Speech.stop();

    const lotteryNameMl =
      getLotteryMalayalamName(draw.lottery_code) || draw.draw_name;
    const firstTicket = draw.first?.ticket || "N/A";
    const firstLocation = draw.first?.location || "കേരളം";
    const firstAmount =
      draw.prizes?.amounts?.["1st"] || "ഒന്നാം സമ്മാനം";

    let textToSpeak = "";
    if (language === "ml") {
      textToSpeak = `ഇന്നത്തെ ${lotteryNameMl} ലോട്ടറി നറുക്കെടുപ്പ് ഫലം. ${firstAmount} ലഭിച്ച ഒന്നാം സമ്മാന നമ്പർ: ${firstTicket.split("").join(" ")}. വിറ്റ സ്ഥലം: ${firstLocation}. കൂടുതൽ വിവരങ്ങൾക്ക് ആപ്പ് പരിശോധിക്കുക.`;
    } else {
      textToSpeak = `Today's ${draw.draw_name} lottery result. First prize ${firstAmount} winning ticket is: ${firstTicket}. Sold at: ${firstLocation}. Check the app for complete prize breakdown.`;
    }

    isSpeakingState = true;

    Speech.speak(textToSpeak, {
      language: language === "ml" ? "ml-IN" : "en-IN",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        isSpeakingState = false;
        onDone?.();
      },
      onStopped: () => {
        isSpeakingState = false;
        onDone?.();
      },
      onError: () => {
        isSpeakingState = false;
        onDone?.();
      },
    });
  } catch (err) {
    console.warn("Speech synthesis error:", err);
    isSpeakingState = false;
    onDone?.();
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
    isSpeakingState = false;
  } catch {
    // Ignore error
  }
}

export function isCurrentlySpeaking(): boolean {
  return isSpeakingState;
}
