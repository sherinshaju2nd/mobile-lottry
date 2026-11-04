import { PrizeBreakdown } from "../api/lotteryApi";

const CRORE = 10_000_000;
const LAKH = 100_000;

/** Official order in which Kerala lottery prize tiers are announced. */
export const PRIZE_TIER_ORDER = [
  "1st",
  "consolation",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
] as const;

export type PrizeTier = (typeof PRIZE_TIER_ORDER)[number];

/**
 * Parses prize amounts as they appear in results and UI into rupees.
 * Handles "1,00,00,000/-", "5.000/-" (dot used as thousands separator in the
 * official feed), "₹25 Crore", "25Cr", "75 Lakhs", "Rs. 8,000", plain numbers, and mixed
 * forms like "Rs :7500000/- [75 Lakhs]" (the unit applies only to the number next to it).
 * Returns null when the text has no usable amount.
 */
export const parsePrizeAmount = (raw: string | number | null | undefined): number | null => {
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? raw : null;
  const text = String(raw ?? "")
    .toLowerCase()
    .replace(/₹|rs\.?|inr|\/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;

  const toAmount = (value: number, unit: number): number | null =>
    Number.isFinite(value) && value >= 0 ? Math.round(value * unit) : null;

  // "1.5 crore", "25 lakhs", "25cr": a dot next to a unit is a decimal point.
  const withUnit = text.match(/(\d[\d.,]*)\s*(crores?|cr|lakhs?|lacs?)(?![a-z])/);
  if (withUnit) {
    const [, numberText = "", unitText = ""] = withUnit;
    return toAmount(parseFloat(numberText.replace(/,/g, "")), unitText.startsWith("c") ? CRORE : LAKH);
  }

  const numericText = text.match(/\d[\d.,]*/)?.[0]?.replace(/[.,]+$/, "") ?? "";
  if (!numericText) return null;

  // "5.000" / "1.00.000": dots used as thousands separators.
  if (/^\d{1,3}(\.\d{3})+$/.test(numericText)) {
    return toAmount(parseInt(numericText.replace(/\./g, ""), 10), 1);
  }
  return toAmount(parseFloat(numericText.replace(/,/g, "")), 1);
};

const trimDecimals = (n: number): string => String(Math.round(n * 100) / 100);

/** Short human label: "₹1 Crore", "₹25 Lakh", "₹5,000". */
export const formatRupeesShort = (amount: number): string => {
  if (amount >= CRORE) return `₹${trimDecimals(amount / CRORE)} Crore`;
  if (amount >= LAKH) return `₹${trimDecimals(amount / LAKH)} Lakh`;
  return `₹${formatGroupedRupees(amount)}`;
};

/** Indian digit grouping without Intl (Intl can crash on Hermes): 1,57,50,000. */
export const formatGroupedRupees = (amount: number): string => {
  const whole = String(Math.round(Math.max(0, amount)));
  if (whole.length <= 3) return whole;
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${lastThree}`;
};

/** Amount as it should be spoken by text-to-speech. */
export const formatSpokenAmount = (amount: number, language: "en" | "ml"): string => {
  if (language === "ml") {
    if (amount >= CRORE) return `${trimDecimals(amount / CRORE)} കോടി രൂപ`;
    if (amount >= LAKH) return `${trimDecimals(amount / LAKH)} ലക്ഷം രൂപ`;
    return `${Math.round(amount)} രൂപ`;
  }
  if (amount >= CRORE) return `${trimDecimals(amount / CRORE)} crore rupees`;
  if (amount >= LAKH) return `${trimDecimals(amount / LAKH)} lakh rupees`;
  return `${Math.round(amount)} rupees`;
};

/** Prize amount for a tier from a draw's prize breakdown, in rupees. */
export const getTierAmount = (prizes: PrizeBreakdown | undefined, tier: PrizeTier): number | null =>
  parsePrizeAmount(prizes?.amounts?.[tier]);
