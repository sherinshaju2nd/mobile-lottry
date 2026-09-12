import { Linking, Share } from "react-native";
import { DrawResult } from "../api/lotteryApi";
import { getLotteryTranslatedName } from "../constants/lotteries";
import { Language } from "../constants/translations";

export async function shareDrawResultToWhatsApp(
  draw: DrawResult,
  language: Language = "en"
): Promise<void> {
  const drawTitle = getLotteryTranslatedName(draw.lottery_code, language) || draw.draw_name;
  const firstPrize = draw.first?.ticket || "N/A";
  const firstLoc = draw.first?.location && draw.first.location !== "N/A" ? draw.first.location : "";
  const firstAmt = draw.prizes?.amounts?.["1st"] || "";

  let headerTitle = "🌴 *KERALA STATE LOTTERY RESULT* 🌴";
  let dateLabel = "Date:";
  let firstPrizeLabel = "1st PRIZE:";
  let amtLabel = "Amount:";
  let locLabel = "Location:";
  let secondPrizeLabel = "2nd Prize:";
  let thirdPrizeLabel = "3rd Prize:";
  let seeInAppText = "See in App";
  let footerCta = "📲 *Check Full Results & Verify Tickets:* \nDownload Kerala Lottery Results App\n_Please verify with official Kerala Government Gazette._";

  switch (language) {
    case "ml":
      headerTitle = "🌴 *കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഫലം* 🌴";
      dateLabel = "തീയതി:";
      firstPrizeLabel = "1-ാം സമ്മാനം:";
      amtLabel = "തുക:";
      locLabel = "വിറ്റ സ്ഥലം:";
      secondPrizeLabel = "2-ാം സമ്മാനം:";
      thirdPrizeLabel = "3-ാം സമ്മാനം:";
      seeInAppText = "ആപ്പിൽ കാണുക";
      footerCta = "📲 *പൂർണ്ണ ഫലവും ടിക്കറ്റ് പരിശോധനയും:* \nകേരള ലോട്ടറി ആപ്പ് ഡൗൺലോഡ് ചെയ്യുക\n_ഔദ്യോഗിക ഗസറ്റ് ഫലങ്ങളുമായി ഒത്തുനോക്കുക._";
      break;
    case "hi":
      headerTitle = "🌴 *केरल राज्य लॉटरी परिणाम* 🌴";
      dateLabel = "तिथि:";
      firstPrizeLabel = "प्रथम पुरस्कार:";
      amtLabel = "राशि:";
      locLabel = "विक्रय स्थान:";
      secondPrizeLabel = "द्वितीय पुरस्कार:";
      thirdPrizeLabel = "तृतीय पुरस्कार:";
      seeInAppText = "ऐप में देखें";
      footerCta = "📲 *पूरा परिणाम और टिकट सत्यापन:* \nकेरल लॉटरी ऐप डाउनलोड करें\n_कृपया आधिकारिक सरकारी राजपत्र से पुष्टि करें।_";
      break;
    case "ta":
      headerTitle = "🌴 *கேரளா மாநில லாட்டரி முடிவு* 🌴";
      dateLabel = "தேதி:";
      firstPrizeLabel = "1-ம் பரிசு:";
      amtLabel = "தொகை:";
      locLabel = "விற்பனை இடம்:";
      secondPrizeLabel = "2-ம் பரிசு:";
      thirdPrizeLabel = "3-ம் பரிசு:";
      seeInAppText = "செயலியில் பார்க்கவும்";
      footerCta = "📲 *முழு முடிவுகள் மற்றும் டிக்கெட் சரிபார்ப்பு:* \nகேரளா லாட்டரி செயலியைப் பதிவிறக்கவும்\n_அரசு அரசிதழுடன் சரிபார்க்கவும்._";
      break;
    case "kn":
      headerTitle = "🌴 *ಕೇರಳ ರಾಜ್ಯ ಲಾಟರಿ ಫಲಿತಾಂಶ* 🌴";
      dateLabel = "ದಿನಾಂಕ:";
      firstPrizeLabel = "1ನೇ ಬಹುಮಾನ:";
      amtLabel = "ಮೊತ್ತ:";
      locLabel = "ಮಾರಾಟ ಸ್ಥಳ:";
      secondPrizeLabel = "2ನೇ ಬಹುಮಾನ:";
      thirdPrizeLabel = "3ನೇ ಬಹುಮಾನ:";
      seeInAppText = "ಆಪ್‌ನಲ್ಲಿ ನೋಡಿ";
      footerCta = "📲 *ಸಂಪೂರ್ಣ ಫಲಿತಾಂಶ ಮತ್ತು ಟಿಕೆಟ್ ಪರಿಶೀಲನೆ:* \nಕೇರಳ ಲಾಟರಿ ಆಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ\n_ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಗೆಜೆಟ್‌ನೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ._";
      break;
    case "te":
      headerTitle = "🌴 *కేరళ రాష్ట్ర లాటరీ ఫలితం* 🌴";
      dateLabel = "తేదీ:";
      firstPrizeLabel = "1వ బహుమతి:";
      amtLabel = "మొత్తం:";
      locLabel = "విక్రయ స్థలం:";
      secondPrizeLabel = "2వ బహుమతి:";
      thirdPrizeLabel = "3వ బహుమతి:";
      seeInAppText = "యాప్‌లో చూడండి";
      footerCta = "📲 *పూర్తి ఫలితాలు మరియు టిక్కెట్ ధృవీకరణ:* \nకేరళ లాటరీ యాప్‌ను డౌన్‌లోడ్ చేయండి\n_అధికారిక ప్రభుత్వ గెజిట్‌తో సరిపోల్చుకోండి._";
      break;
  }

  const secondArr = Array.isArray(draw.prizes?.["2nd"]) ? draw.prizes["2nd"].join(", ") : seeInAppText;
  const thirdArr = Array.isArray(draw.prizes?.["3rd"])
    ? draw.prizes["3rd"].slice(0, 5).join(", ") + (draw.prizes["3rd"].length > 5 ? "..." : "")
    : seeInAppText;

  const message =
    `${headerTitle}\n\n` +
    `🎯 *${drawTitle}* (${draw.lottery_code || ""})\n` +
    `📅 *${dateLabel}* ${draw.draw_date}\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `🥇 *${firstPrizeLabel}* *${firstPrize}*\n` +
    (firstAmt ? `💰 *${amtLabel}* ${firstAmt}\n` : "") +
    (firstLoc ? `📍 *${locLabel}* ${firstLoc}\n\n` : "\n") +
    `🥈 *${secondPrizeLabel}* ${secondArr}\n` +
    `🥉 *${thirdPrizeLabel}* ${thirdArr}\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `${footerCta}`;

  const encoded = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Share.share({
        message,
        title: `${draw.draw_name} Kerala Lottery Result`,
      });
    }
  } catch {
    await Share.share({
      message,
      title: `${draw.draw_name} Kerala Lottery Result`,
    });
  }
}
