import { Linking, Share, Platform } from "react-native";
import { DrawResult } from "../api/lotteryApi";
import { getLotteryMalayalamName } from "../constants/lotteries";

export async function shareDrawResultToWhatsApp(
  draw: DrawResult,
  language: "en" | "ml" = "en"
): Promise<void> {
  const isMl = language === "ml";
  const mlName = getLotteryMalayalamName(draw.lottery_code) || draw.draw_name;
  const drawTitle = isMl ? mlName : draw.draw_name;
  const firstPrize = draw.first?.ticket || "N/A";
  const firstLoc = draw.first?.location && draw.first.location !== "N/A" ? draw.first.location : "";
  const firstAmt = draw.prizes?.amounts?.["1st"] || "1st Prize";

  let message = "";

  if (isMl) {
    message = `🌴 *കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഫലം* 🌴\n\n` +
      `🎯 *${drawTitle}* (${draw.lottery_code || ""})\n` +
      `📅 *തീയതി:* ${draw.draw_date}\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🥇 *1-ാം സമ്മാനം:* *${firstPrize}*\n` +
      (firstAmt ? `💰 *തുക:* ${firstAmt}\n` : "") +
      (firstLoc ? `📍 *വിറ്റ സ്ഥലം:* ${firstLoc}\n\n` : "\n") +
      `🥈 *2-ാം സമ്മാനം:* ${Array.isArray(draw.prizes?.["2nd"]) ? draw.prizes["2nd"].join(", ") : "ആപ്പിൽ കാണുക"}\n` +
      `🥉 *3-ാം സമ്മാനം:* ${Array.isArray(draw.prizes?.["3rd"]) ? draw.prizes["3rd"].slice(0, 5).join(", ") + (draw.prizes["3rd"].length > 5 ? "..." : "") : "ആപ്പിൽ കാണുക"}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📲 *പൂർണ്ണ ഫലവും ടിക്കറ്റ് പരിശോധനയും:* \n` +
      `കേരള ലോട്ടറി ആപ്പ് ഡൗൺലോഡ് ചെയ്യുക\n` +
      `_ഔദ്യോഗിക ഗസറ്റ് ഫലങ്ങളുമായി ഒത്തുനോക്കുക._`;
  } else {
    message = `🌴 *KERALA STATE LOTTERY RESULT* 🌴\n\n` +
      `🎯 *${draw.draw_name}* (${draw.lottery_code || ""})\n` +
      `📅 *Date:* ${draw.draw_date}\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🥇 *1st PRIZE:* *${firstPrize}*\n` +
      (firstAmt ? `💰 *Amount:* ${firstAmt}\n` : "") +
      (firstLoc ? `📍 *Location:* ${firstLoc}\n\n` : "\n") +
      `🥈 *2nd Prize:* ${Array.isArray(draw.prizes?.["2nd"]) ? draw.prizes["2nd"].join(", ") : "See in App"}\n` +
      `🥉 *3rd Prize:* ${Array.isArray(draw.prizes?.["3rd"]) ? draw.prizes["3rd"].slice(0, 5).join(", ") + (draw.prizes["3rd"].length > 5 ? "..." : "") : "See in App"}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📲 *Check Full 1st-9th Prizes & Verify Tickets:* \n` +
      `Download Kerala Lottery Live App\n` +
      `_Please verify with official Kerala Government Gazette._`;
  }

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
