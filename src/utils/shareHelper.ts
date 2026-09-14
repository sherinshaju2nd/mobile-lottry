import { Share, Platform, Linking, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Language } from "../constants/translations";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.keralalotteryresultstoday.app";

export interface UniversalShareOptions {
  message: string;
  title?: string;
  url?: string;
}

/**
 * Universal cross-platform share helper.
 * Handles iOS, Android, and Web smoothly without crashes or broken share sheets.
 */
export async function universalShare(options: UniversalShareOptions): Promise<boolean> {
  try {
    const title = options.title || "Kerala Lottery Results";
    const url = options.url || PLAY_STORE_URL;
    const baseMessage = (options.message || "").trim();
    const finalMessage = baseMessage.includes("http")
      ? baseMessage
      : `${baseMessage}\n\n📲 Download App:\n${url}`;

    // 1. Web Platform (Browser)
    if (Platform.OS === "web") {
      try {
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({
            title,
            text: baseMessage,
            url,
          });
          return true;
        }
      } catch {
        // User cancelled or unsupported
      }

      // Web Clipboard Fallback
      try {
        await Clipboard.setStringAsync(finalMessage);
        Alert.alert(
          "Link Copied!",
          "Kerala Lottery link copied to clipboard. You can now paste and share it anywhere."
        );
        return true;
      } catch {
        return false;
      }
    }

    // 2. iOS Native
    if (Platform.OS === "ios") {
      try {
        const result = await Share.share(
          {
            message: finalMessage,
            url,
            title,
          },
          {
            subject: title,
          }
        );
        return result.action === Share.sharedAction;
      } catch {
        try {
          await Share.share({ message: finalMessage });
          return true;
        } catch {
          return false;
        }
      }
    }

    // 3. Android Native
    try {
      const result = await Share.share(
        {
          message: finalMessage,
          title,
        },
        {
          dialogTitle: `Share ${title}`,
        }
      );
      return result.action === Share.sharedAction;
    } catch (androidErr) {
      console.warn("Android native share fallback:", androidErr);
      try {
        await Clipboard.setStringAsync(finalMessage);
        Alert.alert("Copied", "Share details copied to clipboard. You can paste and share it anywhere.");
        return true;
      } catch {
        return false;
      }
    }
  } catch (err) {
    console.warn("Universal share error:", err);
    return false;
  }
}

/**
 * Share the Kerala Lottery App with friends across any app (WhatsApp, Telegram, SMS, FB, etc.)
 */
export async function shareKeralaLotteryApp(language: Language = "en"): Promise<boolean> {
  let message =
    "🎰 *Kerala Lottery Results App*\n" +
    "Get instant live 3:00 PM draw updates, high-accuracy ticket barcode scanning, and detailed winning statistics!";

  let title = "Kerala Lottery Results";

  switch (language) {
    case "ml":
      message =
        "🎰 *കേരള ലോട്ടറി ഫലങ്ങൾ ആപ്പ്*\n" +
        "ലൈവ് നറുക്കെടുപ്പ് ഫലങ്ങൾ (3:00 PM), ടിക്കറ്റ് ബാർകോഡ് സ്കാനർ, സമഗ്ര സ്ഥിതിവിവരക്കണക്കുകൾ എന്നിവ വിരൽത്തുമ്പിൽ!";
      title = "കേരള ലോട്ടറി ആപ്പ്";
      break;
    case "hi":
      message =
        "🎰 *केरल लॉटरी परिणाम ऐप*\n" +
        "लाइव 3:00 PM ड्रा अपडेट, बारकोड स्कैनर और विस्तृत जीतने के आंकड़े प्राप्त करें!";
      title = "केरल लॉटरी परिणाम";
      break;
    case "ta":
      message =
        "🎰 *கேரளா லாட்டரி முடிவுகள் செயலி*\n" +
        "நேரலை 3:00 PM குலுக்கல் முடிவுகள், பார்கோடு ஸ்கேனர் மற்றும் புள்ளிவிவரங்கள்!";
      title = "கேரளா லாட்டரி செயலி";
      break;
    case "kn":
      message =
        "🎰 *ಕೇರಳ ಲಾಟರಿ ಫಲಿತಾಂಶಗಳ ಆಪ್*\n" +
        "ಲೈವ್ 3:00 PM ಡ್ರಾ ಅಪ್‌ಡೇಟ್‌ಗಳು, ಬಾರ್‌ಕೋಡ್ ಸ್ಕ್ಯಾನರ್ ಮತ್ತು ಅಂಕಿಅಂಶಗಳು!";
      title = "ಕೇರಳ ಲಾಟರಿ ಆಪ್";
      break;
    case "te":
      message =
        "🎰 *కేరళ లాటరీ ఫలితాల యాప్*\n" +
        "లైవ్ 3:00 PM డ్రా అప్‌డేట్‌లు, బార్‌కోడ్ స్కానర్ మరియు గణాంకాలు!";
      title = "కేరళ లాటరీ యాప్";
      break;
  }

  return await universalShare({
    message,
    title,
    url: PLAY_STORE_URL,
  });
}
