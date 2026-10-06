import {
  KERALA_LOTTERY_100_QUESTIONS,
  matchOfflineQuestion,
} from "../src/features/ai/data/offlineLotteryQuestions";
import {
  KERALA_LOTTERIES,
  identifyLotteryFromText,
} from "../src/features/ai/utils/lotteryNormalizer";
import { WEEKLY_LOTTERIES, BUMPER_LOTTERIES } from "../src/constants/lotteries";

console.log("=================================================");
console.log("   TESTING 115 OFFLINE QUESTIONS & LOTTERY CONFIG ");
console.log("=================================================\n");

console.log(
  `Total offline questions defined: ${KERALA_LOTTERY_100_QUESTIONS.length}`,
);
console.log(`Weekly lotteries configured: ${WEEKLY_LOTTERIES.length}`);
console.log(`Bumper lotteries configured: ${BUMPER_LOTTERIES.length}`);
console.log(
  `Total active lotteries in normalizer: ${Object.keys(KERALA_LOTTERIES).length}\n`,
);

// 1. Verify Weekly lotteries:
console.log("--- 7 WEEKLY LOTTERIES VERIFICATION ---");
WEEKLY_LOTTERIES.forEach((w) => {
  console.log(
    `✓ ${w.day}: ${w.name} (${w.code}) - ${w.nameMl} - 1st Prize: ${w.jackpot} - Price: ${w.ticket_price}`,
  );
});

// 2. Verify Bumper lotteries:
console.log("\n--- 6 BUMPER LOTTERIES VERIFICATION ---");
BUMPER_LOTTERIES.forEach((b) => {
  console.log(
    `✓ ${b.drawSeason || b.day}: ${b.name} (${b.code}) - ${b.nameMl} - Jackpot: ${b.jackpot} - Price: ${b.ticket_price}`,
  );
});

// 3. Test question pattern matching speed & accuracy:
console.log("\n--- TESTING QUESTION MATCHING FOR 15 RANDOM SAMPLES ---");
const samples = [
  "weekly schedule",
  "monday lottery",
  "which lottery on wednesday",
  "friday lottery",
  "bhagyathara details",
  "dhanalekshmi first prize",
  "suvarna keralam result",
  "onam bumper",
  "christmas new year bumper",
  "summer bumper",
  "vishu bumper prize",
  "monsoon bumper result",
  "pooja bumper",
  "how many bumper lotteries",
  "1 crore lottery",
];

let matchCount = 0;
for (const sample of samples) {
  const t0 = performance.now();
  const res = matchOfflineQuestion(sample);
  const dur = (performance.now() - t0).toFixed(3);
  if (res && res.item) {
    matchCount++;
    console.log(
      `[PASS] (${dur}ms) "${sample}" -> ${res.item.id} [${res.item.category}] (${res.item.lotteryName || "General"})`,
    );
  } else {
    console.log(`[FAIL] "${sample}" had no match`);
  }
}

console.log(`\nSamples matched: ${matchCount}/${samples.length}`);

// 4. Verify no legacy lotteries in question dataset
const legacyKeywords = ["nirmal", "akshaya", "നിർമ്മൽ", "അക്ഷയ"];
let legacyMatches = 0;
for (const q of KERALA_LOTTERY_100_QUESTIONS) {
  const jsonStr = JSON.stringify(q).toLowerCase();
  for (const kw of legacyKeywords) {
    if (jsonStr.includes(kw.toLowerCase())) {
      console.warn(`WARNING: Found ${kw} in ${q.id}: ${q.questionEn}`);
      legacyMatches++;
    }
  }
}

if (legacyMatches === 0) {
  console.log(
    "\n>>> SUCCESS: ZERO legacy lottery references in all 115 offline questions! <<<",
  );
} else {
  console.error(
    `\n>>> FAILED: ${legacyMatches} legacy lottery occurrences found! <<<`,
  );
}
