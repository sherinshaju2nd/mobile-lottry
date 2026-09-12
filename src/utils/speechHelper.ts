import * as Speech from "expo-speech";
import { DrawResult } from "../api/lotteryApi";
import { getLotteryTranslatedName } from "../constants/lotteries";
import { Language } from "../constants/translations";

let isSpeakingState = false;

export async function speakLotteryResult(
  draw: DrawResult,
  language: Language = "en",
  onDone?: () => void
): Promise<void> {
  try {
    await Speech.stop();

    const lotteryName =
      getLotteryTranslatedName(draw.lottery_code, language) || draw.draw_name;
    const firstTicket = draw.first?.ticket || "N/A";
    const spacedDigits = firstTicket.split("").join(" ");
    const firstLocation = draw.first?.location || "";
    const firstAmount = draw.prizes?.amounts?.["1st"] || "";

    let textToSpeak = "";
    let voiceLocale = "en-IN";

    switch (language) {
      case "ml":
        voiceLocale = "ml-IN";
        textToSpeak = `ഇന്നത്തെ ${lotteryName} ലോട്ടറി നറുക്കെടുപ്പ് ഫലം. ${firstAmount ? firstAmount + " ലഭിച്ച " : ""}ഒന്നാം സമ്മാന നമ്പർ: ${spacedDigits}.${firstLocation ? " വിറ്റ സ്ഥലം: " + firstLocation + "." : ""} കൂടുതൽ വിവരങ്ങൾക്ക് ആപ്പ് പരിശോധിക്കുക.`;
        break;
      case "hi":
        voiceLocale = "hi-IN";
        textToSpeak = `आज का ${lotteryName} लॉटरी परिणाम। ${firstAmount ? firstAmount + " का " : ""}प्रथम पुरस्कार विजेता टिकट नंबर है: ${spacedDigits}।${firstLocation ? " विक्रय स्थान: " + firstLocation + "।" : ""} पूरी जानकारी के लिए ऐप देखें।`;
        break;
      case "ta":
        voiceLocale = "ta-IN";
        textToSpeak = `இன்றைய ${lotteryName} லாட்டரி குலுக்கல் முடிவு. ${firstAmount ? firstAmount + " பரிசு பெற்ற " : ""}முதல் பரிசு எண்: ${spacedDigits}.${firstLocation ? " விற்பனை இடம்: " + firstLocation + "." : ""} முழு விவரங்களுக்கு செயலியைப் பார்க்கவும்.`;
        break;
      case "kn":
        voiceLocale = "kn-IN";
        textToSpeak = `ಇಂದಿನ ${lotteryName} ಲಾಟರಿ ಡ್ರಾ ಫಲಿತಾಂಶ. ${firstAmount ? firstAmount + " ಮೊತ್ತದ " : ""}ಮೊದಲ ಬಹುಮಾನ ಸಂಖ್ಯೆ: ${spacedDigits}.${firstLocation ? " ಮಾರಾಟವಾದ ಸ್ಥಳ: " + firstLocation + "." : ""} ಸಂಪೂರ್ಣ ವಿವರಗಳಿಗಾಗಿ ಆಪ್ ನೋಡಿ.`;
        break;
      case "te":
        voiceLocale = "te-IN";
        textToSpeak = `నేటి ${lotteryName} లాటరీ డ్రా ఫలితం. ${firstAmount ? firstAmount + " గెలుచుకున్న " : ""}1వ బహుమతి సంఖ్య: ${spacedDigits}.${firstLocation ? " విక్రయించిన ప్రదేశం: " + firstLocation + "." : ""} పూర్తి వివరాల కోసం యాప్ చూడండి.`;
        break;
      default:
        voiceLocale = "en-IN";
        textToSpeak = `Today's ${draw.draw_name} lottery result. First prize ${firstAmount ? firstAmount + " " : ""}winning ticket is: ${spacedDigits}.${firstLocation ? " Sold at: " + firstLocation + "." : ""} Check the app for complete prize breakdown.`;
        break;
    }

    isSpeakingState = true;

    Speech.speak(textToSpeak, {
      language: voiceLocale,
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
