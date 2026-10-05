import {
  detectIntentLocally,
  detectIntentWithGemini,
} from "../src/features/ai/services/intentDetector";
import { queryVerifiedLotteryData } from "../src/features/ai/services/verifiedLotteryService";
import { generateNaturalMalayalamResponse } from "../src/features/ai/services/malayalamResponseGenerator";
import { ConversationContext } from "../src/features/ai/types/aiTypes";

async function runTests() {
  console.log("=================================================");
  console.log("   TESTING GEMINI-STYLE MALAYALAM VOICE AI FLOW  ");
  console.log("=================================================\n");

  const context: ConversationContext = {
    lastLottery: null,
    lastLotteryCode: null,
    lastDate: null,
    lastTicketNumber: null,
    history: [],
  };

  const testCases = [
    {
      id: "Test 1",
      query: "ഇന്നത്തെ കാരുണ്യ ലോട്ടറി ഫലം എന്താണ്?",
      description: "Direct Malayalam Lottery Result Query",
    },
    {
      id: "Test 2",
      query: "innathe karunya result entha?",
      description: "Manglish Lottery Result Query",
    },
    {
      id: "Test 3",
      query: "What is today's Karunya result?",
      description: "English Lottery Result Query",
    },
    {
      id: "Test 4",
      query: "ഒന്നാം സമ്മാനം എത്രയാണ്?",
      description: "Contextual Follow-up Query (inherits Karunya from prior turns)",
    },
    {
      id: "Test 5",
      query: "അടുത്ത നറുക്കെടുപ്പ് എപ്പോഴാണ്?",
      description: "Lottery Schedule Query",
    },
    {
      id: "Test 6",
      query: "123456 എന്ന ടിക്കറ്റിന് സമ്മാനം ഉണ്ടോ?",
      description: "Ticket Check Query with Number 123456 (Prize Winner)",
    },
    {
      id: "Test 6b",
      query: "983719 എന്ന ടിക്കറ്റിന് സമ്മാനം ഉണ്ടോ?",
      description: "Ticket Check Query with Number 983719 (No Match)",
    },
    {
      id: "Test 7",
      query: "ഇന്നത്തെ result?",
      description: "Ambiguous Query with previous context (uses Karunya from context)",
    },
    {
      id: "Test 7b",
      query: "ഇന്നത്തെ result?",
      description: "Ambiguous Query with Clean Empty Context (Triggers Clarification Prompt)",
      useFreshContext: true,
    },
  ];

  for (const tc of testCases) {
    console.log(`--- [${tc.id}] ${tc.description} ---`);
    console.log(`User Spoken / Typed: "${tc.query}"`);

    const activeContext = tc.useFreshContext
      ? { lastLottery: null, lastLotteryCode: null, lastDate: null, lastTicketNumber: null, history: [] }
      : context;

    // 1. Detect Intent
    const intent =
      detectIntentLocally(tc.query, activeContext) ||
      (await detectIntentWithGemini(tc.query, activeContext));

    console.log("1. Detected Intent:", JSON.stringify(intent, null, 2));

    // Update Context
    if (intent.lottery) context.lastLottery = intent.lottery;
    if (intent.lotteryCode) context.lastLotteryCode = intent.lotteryCode;
    if (intent.date && intent.date !== "today") context.lastDate = intent.date;
    if (intent.ticketNumber) context.lastTicketNumber = intent.ticketNumber;

    // 2. Query Verified DB
    const verified = await queryVerifiedLotteryData(intent);
    console.log("2. Verified DB Result:", {
      found: verified.found,
      lotteryName: verified.lotteryName,
      firstPrizeTicket: verified.firstPrizeTicket,
      firstPrizeAmount: verified.firstPrizeAmount,
      winningTier: verified.winningTier,
      reason: verified.reason,
    });

    // 3. Generate Natural Malayalam Response
    const response = generateNaturalMalayalamResponse(intent, verified, "ml");
    console.log(`3. AI Malayalam Response:\n   "${response.displayText}"\n`);
  }

  console.log("All 7 Test Scenarios executed successfully!");
}

runTests().catch(console.error);
