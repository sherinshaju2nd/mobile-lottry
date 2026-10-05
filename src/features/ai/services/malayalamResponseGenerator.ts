import {
  StructuredIntent,
  VerifiedLotteryData,
  ChatMessage,
} from "../types/aiTypes";
import { Language } from "../../../constants/translations";

export interface GeneratedAssistantResponse {
  displayText: string;
  speechText: string;
  cardData?: ChatMessage["cardData"];
}

/**
 * Generate authentic, natural Malayalam (or English) response based ONLY on verified data.
 * Pure Kerala Malayalam idioms, respectful tone, no robotic artifacts.
 */
export function generateNaturalMalayalamResponse(
  intent: StructuredIntent,
  verified: VerifiedLotteryData,
  language: Language = "ml"
): GeneratedAssistantResponse {
  const isMl = language === "ml";

  // 1. TICKET CHECK RESPONSES
  if (intent.intent === "TICKET_CHECK" || intent.intent === "NUMBER_SEARCH") {
    // Missing ticket number prompt
    if (verified.reason === "MISSING_TICKET_NUMBER") {
      const displayText = isMl
        ? "തീർച്ചയായും. നിങ്ങളുടെ 6 അക്ക ടിക്കറ്റ് നമ്പർ പറയൂ. ഞാൻ ഔദ്യോഗിക ഡാറ്റാബേസിൽ പരിശോധിച്ച് ഫലം അറിയിക്കാം."
        : "Sure! Please speak or enter your 6-digit ticket number. I will verify it against official published draws.";

      return {
        displayText,
        speechText: displayText,
        cardData: {
          type: "ticket_prompt",
          title: isMl ? "ടിക്കറ്റ് നമ്പർ നൽകുക" : "Enter Ticket Number",
          subtitle: isMl ? "തത്സമയ പരിശോധന" : "Instant Verification",
          primaryHighlight: "e.g. 123456 / WA 123456",
          secondaryHighlight: isMl ? "6 അക്ക നമ്പർ നൽകുക" : "Provide 6 digits to verify",
          badgeText: "AWAITING TICKET",
        },
      };
    }

    // Ticket WON a prize
    if (verified.found && verified.isWinner) {
      const displayText = isMl
        ? `അഭിനന്ദനങ്ങൾ! നിങ്ങളുടെ ടിക്കറ്റ് ${verified.ticketChecked} വിജയിച്ചിരിക്കുന്നു. ${verified.lotteryName} (${verified.drawCode}) നറുക്കെടുപ്പിൽ ${verified.winningTier} ലഭിച്ചു. സമ്മാനത്തുക: ${verified.winningAmount} രൂപ.`
        : `Congratulations! Your ticket ${verified.ticketChecked} is a winner! In ${verified.lotteryName} (${verified.drawCode}), you won ${verified.winningTier} with prize amount ${verified.winningAmount}.`;

      return {
        displayText,
        speechText: displayText,
        cardData: {
          type: "ticket_match",
          title: `🎉 ${verified.winningTier}!`,
          subtitle: `${verified.lotteryName} (${verified.drawCode}) • ${verified.drawDate}`,
          primaryHighlight: `${verified.winningAmount} രൂപ`,
          secondaryHighlight: `ടിക്കറ്റ്: ${verified.ticketChecked}`,
          badgeText: "VERIFIED WINNER",
          details: verified.details,
        },
      };
    }

    // Ticket checked but NO match
    if (verified.ticketChecked && !verified.isWinner) {
      const displayText = isMl
        ? `നിങ്ങളുടെ ടിക്കറ്റ് ${verified.ticketChecked} പരിശോധിച്ചു. ഔദ്യോഗിക ഡാറ്റാബേസിൽ പ്രസിദ്ധീകരിച്ച നറുക്കെടുപ്പ് ഫലങ്ങളിൽ ഈ നമ്പറിന് സമ്മാനങ്ങൾ ഒന്നും ലഭിച്ചിട്ടില്ല. അടുത്ത തവണ ഭാഗ്യം തുണയ്ക്കട്ടെ!`
        : `Your ticket ${verified.ticketChecked} was verified against all published Kerala Lottery draws. No winning prize match was found. Wishing you better luck next time!`;

      return {
        displayText,
        speechText: displayText,
        cardData: {
          type: "ticket_no_match",
          title: isMl ? "സമ്മാനം ലഭിച്ചിട്ടില്ല" : "No Winning Match",
          subtitle: `Ticket: ${verified.ticketChecked}`,
          primaryHighlight: isMl ? "ഔദ്യോഗിക പരിശോധന പൂർത്തിയായി" : "Checked Official Draws",
          secondaryHighlight: isMl ? "പ്രസിദ്ധീകരിച്ച ലിസ്റ്റിൽ ഈ നമ്പർ ഇല്ല" : "Zero winning matches found",
          badgeText: "VERIFIED NO MATCH",
          details: verified.details,
        },
      };
    }
  }

  // 2. LOTTERY RESULT RESPONSES
  if (intent.intent === "LOTTERY_RESULT" || intent.intent === "WINNING_NUMBERS") {
    // Ambiguous lottery name question: e.g. "ഇന്നത്തെ result?"
    if (verified.reason === "AMBIGUOUS_LOTTERY" || intent.isAmbiguous) {
      const displayText = isMl
        ? "ഏത് ലോട്ടറിയുടെ ഇന്നത്തെ ഫലമാണ് നിങ്ങൾക്ക് വേണ്ടത്? വിൻ വിൻ, കാരുണ്യ, ഫിഫ്റ്റി ഫിഫ്റ്റി, സ്ത്രീശക്തി തുടങ്ങിയ ലോട്ടറിയുടെ പേര് പറയൂ."
        : "Which lottery result are you looking for today? Please mention Win-Win, Karunya, Fifty-Fifty, or Sthree Sakthi.";

      return {
        displayText,
        speechText: displayText,
        cardData: {
          type: "schedule_info",
          title: isMl ? "ഏത് ലോട്ടറിയുടെ ഫലമാണ് വേണ്ടത്?" : "Select Lottery",
          subtitle: isMl ? "ദയവായി ലോട്ടറിയുടെ പേര് വ്യക്തമാക്കുക" : "Please specify lottery name",
          primaryHighlight: isMl ? "ലോട്ടറി പേര് പറയുക" : "Mention Lottery Name",
          badgeText: "CHOOSE LOTTERY",
        },
      };
    }

    // Result NOT in database
    if (verified.reason === "NOT_IN_DATABASE") {
      const displayText = isMl
        ? "ഇന്നത്തെ ഫലം ഇപ്പോൾ ഞങ്ങളുടെ ഡാറ്റാബേസിൽ ലഭ്യമല്ല. ഉച്ചയ്ക്ക് 3:00 മണിക്ക് ശേഷം നറുക്കെടുപ്പ് പൂർത്തിയാകുമ്പോൾ തത്സമയം ലഭ്യമാകും."
        : "Today's result is not yet available in our database. It will update live after 3:00 PM IST once the official draw concludes.";

      return {
        displayText,
        speechText: displayText,
        cardData: {
          type: "schedule_info",
          title: isMl ? "ഫലം ലഭ്യമായിട്ടില്ല" : "Result Not Available",
          subtitle: isMl ? "ഔദ്യോഗിക നറുക്കെടുപ്പ് ഉച്ചയ്ക്ക് 3:00 മണിക്ക്" : "Official draw at 3:00 PM IST",
          primaryHighlight: isMl ? "3:00 മണിക്ക് ശേഷം പരിശോധിക്കുക" : "Available after 3:00 PM",
          badgeText: "PENDING DRAW",
        },
      };
    }

    // Verified Draw Result Found
    if (verified.found && verified.firstPrizeTicket) {
      const locText = verified.firstPrizeLocation ? ` (${verified.firstPrizeLocation}-ൽ വിറ്റത്)` : "";
      const displayText = isMl
        ? `തീർച്ചയായും. ${verified.drawDate}-ലെ ${verified.lotteryName} (${verified.drawCode}) ലോട്ടറി ഫലം ഇതാ. ഒന്നാം സമ്മാനം ലഭിച്ച നമ്പർ ${verified.firstPrizeTicket} ആണ്. സമ്മാനത്തുക: ${verified.firstPrizeAmount}${locText}.`
        : `Official Result for ${verified.lotteryName} (${verified.drawCode}) on ${verified.drawDate}: 1st Prize of ${verified.firstPrizeAmount} won by ticket ${verified.firstPrizeTicket}${locText}.`;

      return {
        displayText,
        speechText: displayText,
        cardData: {
          type: "draw_result",
          title: `🏆 ${verified.lotteryName} (${verified.drawCode})`,
          subtitle: `${isMl ? "നറുക്കെടുപ്പ് തീയതി" : "Draw Date"}: ${verified.drawDate}`,
          primaryHighlight: verified.firstPrizeTicket,
          secondaryHighlight: `${isMl ? "ഒന്നാം സമ്മാനം" : "1st Prize"}: ${verified.firstPrizeAmount}`,
          badgeText: isMl ? "ഔദ്യോഗിക ഫലം" : "VERIFIED DRAW",
          details: verified.details,
          fullPrizes: verified.allPrizes,
        },
      };
    }
  }

  // 3. PRIZE STRUCTURE RESPONSES
  if (intent.intent === "LOTTERY_PRIZE_STRUCTURE") {
    if (verified.found) {
      const displayText = isMl
        ? `${verified.lotteryName} ലോട്ടറിയുടെ ഒന്നാം സമ്മാനം ${verified.firstPrizeAmount} ആണ്.`
        : `The 1st Prize for ${verified.lotteryName} is ${verified.firstPrizeAmount}.`;

      return {
        displayText,
        speechText: displayText,
        cardData: {
          type: "draw_result",
          title: `💰 ${verified.lotteryName} സമ്മാനങ്ങൾ`,
          subtitle: isMl ? "ഔദ്യോഗിക സമ്മാന ഘടന" : "Official Prize Structure",
          primaryHighlight: verified.firstPrizeAmount,
          secondaryHighlight: isMl ? "ഒന്നാം സമ്മാനം" : "1st Prize",
          badgeText: "PRIZE AMOUNTS",
          details: verified.details,
          fullPrizes: verified.allPrizes,
        },
      };
    }
  }

  // 4. SCHEDULE RESPONSES
  if (intent.intent === "LOTTERY_SCHEDULE") {
    const s = verified.scheduleInfo;
    const displayText = isMl
      ? `${verified.lotteryName} ലോട്ടറി നറുക്കെടുപ്പ് ${s?.dayOfWeek || "എല്ലാ ദിവസവും"} ഉച്ചയ്ക്ക് 3:00 മണിക്ക് തിരുവനന്തപുരം ഗോർക്കി ഭവനിൽ വച്ച് നടക്കും. ടിക്കറ്റ് വില: ${s?.ticketPrice || "₹50"}.`
      : `${verified.lotteryName} draws take place on ${s?.dayOfWeek || "daily"} at 3:00 PM IST at Gorky Bhavan, Thiruvananthapuram. Ticket price: ${s?.ticketPrice || "₹50"}.`;

    return {
      displayText,
      speechText: displayText,
      cardData: {
        type: "schedule_info",
        title: isMl ? "നറുക്കെടുപ്പ് സമയം" : "Draw Schedule",
        subtitle: isMl ? "ഗോർക്കി ഭവൻ, തിരുവനന്തപുരം" : "Gorky Bhavan, TVM",
        primaryHighlight: "3:00 PM IST",
        secondaryHighlight: s?.dayOfWeek || "Daily",
        badgeText: "SCHEDULE",
        details: verified.details,
      },
    };
  }

  // 5. TAX & CLAIM INFORMATION
  if (intent.intent === "LOTTERY_INFORMATION") {
    const displayText = isMl
      ? "കേരള ലോട്ടറിയിൽ 10,000 രൂപയ്ക്ക് മുകളിലുള്ള സമ്മാനങ്ങൾക്ക് ആദായനികുതി നിയമം സെക്ഷൻ 194B പ്രകാരം ഫ്ലാറ്റ് 30% TDS നികുതിയും 10% ഏജന്റ് കമ്മീഷനും കുറച്ചാണ് ബാക്കി തുക ബാങ്കിൽ ലഭിക്കുക. സമ്മാനങ്ങൾ നറുക്കെടുപ്പ് തീയതി മുതൽ 30 ദിവസത്തിനകം ഒറിജിനൽ ടിക്കറ്റും രേഖകളും സഹിതം സമർപ്പിക്കണം."
      : "For lottery winnings above ₹10,000, a flat 30% TDS is deducted under Section 194B, plus 10% agent commission. Prizes must be claimed within 30 days of the draw with original signed ticket and ID proofs.";

    return {
      displayText,
      speechText: displayText,
      cardData: {
        type: "tax_calculator",
        title: isMl ? "ലോട്ടറി നിയമങ്ങളും നികുതിയും" : "Lottery Tax & Claims",
        subtitle: isMl ? "ആദായനികുതി സെക്ഷൻ 194B" : "Section 194B Rules",
        primaryHighlight: isMl ? "ഫ്ലാറ്റ് 30% TDS" : "Flat 30% TDS",
        secondaryHighlight: isMl ? "30 ദിവസത്തിനകം ക്ലെയിം ചെയ്യുക" : "Claim within 30 days",
        badgeText: "TAX & CLAIMS",
        details: verified.details,
      },
    };
  }

  // 6. GENERAL / ERROR FALLBACK
  if (verified.reason === "API_ERROR") {
    const displayText = isMl
      ? "ക്ഷമിക്കണം, ഇപ്പോൾ ഫലം ലഭ്യമാക്കുന്നതിൽ ചെറിയ പ്രശ്നമുണ്ട്. കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ."
      : "Sorry, there was a temporary issue retrieving data. Please try again in a few moments.";

    return {
      displayText,
      speechText: displayText,
      cardData: {
        type: "schedule_info",
        title: isMl ? "ഡാറ്റാബേസ് കണക്ഷൻ തകരാർ" : "Connection Issue",
        subtitle: isMl ? "ദയവായി വീണ്ടും ശ്രമിക്കുക" : "Please try again",
        primaryHighlight: isMl ? "വീണ്ടും ശ്രമിക്കൂ" : "Retry",
        badgeText: "RETRY",
      },
    };
  }

  const defaultText = isMl
    ? "ഞാൻ നിങ്ങളുടെ കേരള ലോട്ടറി AI അസിസ്റ്റന്റാണ്. ഇന്നത്തെ നറുക്കെടുപ്പ് ഫലം, ടിക്കറ്റ് പരിശോധന, സമ്മാനത്തുക, സമയം എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ."
    : "I am your Kerala Lottery AI Assistant. Ask me about today's lottery results, ticket verification, prize amounts, or draw schedule.";

  return {
    displayText: defaultText,
    speechText: defaultText,
  };
}
