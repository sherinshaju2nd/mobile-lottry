/**
 * Kerala State Lottery prize claim estimate.
 *
 * Rules (keep in sync with frontend/components/AiClaimCalculator.tsx and the /claim page):
 *  - Prizes above ₹10,000: the selling agent's 10% commission is deducted first, then 30% TDS
 *    (Income Tax Act s.194B) is deducted from the remaining amount. This matches the widely
 *    reported payouts, e.g. ₹25 Cr bumper → ₹22.5 Cr after commission → ₹15.75 Cr after TDS.
 *  - Prizes up to ₹10,000: paid in full.
 *  - Surcharge and 4% health & education cess may be due when the winner files their return;
 *    they are not deducted at source here.
 */
export const TAX_FREE_LIMIT = 10_000;
export const AGENT_COMMISSION_RATE = 0.1;
export const TDS_RATE = 0.3;
/**
 * Days from the draw within which the ticket must be surrendered. Kerala rules allow 30 days;
 * late claims (up to 90 days) are accepted only with a valid reason at the Director's discretion.
 * Reminders use the 30-day date so nobody misses the normal deadline.
 */
export const CLAIM_PERIOD_DAYS = 30;
export const LATE_CLAIM_LIMIT_DAYS = 90;

export type ClaimOffice = "agent" | "district_office" | "directorate";

export interface ClaimEstimate {
  grossPrize: number;
  agentCommission: number;
  taxableAmount: number;
  tds: number;
  netAmount: number;
  claimOffice: ClaimOffice;
  needsDocuments: boolean;
}

export const getClaimOffice = (grossPrize: number): ClaimOffice => {
  if (grossPrize > 100_000) return "directorate";
  if (grossPrize > 5_000) return "district_office";
  return "agent";
};

export const calculateClaim = (grossPrizeInput: number): ClaimEstimate => {
  const grossPrize = Number.isFinite(grossPrizeInput) ? Math.max(0, Math.round(grossPrizeInput)) : 0;
  const deductionsApply = grossPrize > TAX_FREE_LIMIT;

  const agentCommission = deductionsApply ? Math.round(grossPrize * AGENT_COMMISSION_RATE) : 0;
  const taxableAmount = grossPrize - agentCommission;
  const tds = deductionsApply ? Math.round(taxableAmount * TDS_RATE) : 0;

  return {
    grossPrize,
    agentCommission,
    taxableAmount,
    tds,
    netAmount: Math.max(0, taxableAmount - tds),
    claimOffice: getClaimOffice(grossPrize),
    needsDocuments: grossPrize > 5_000,
  };
};

/** Last date to claim for a draw date (YYYY-MM-DD), as YYYY-MM-DD. Null for invalid input. */
export const getClaimDeadline = (drawDate: string | null | undefined): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(drawDate ?? "");
  if (!match) return null;
  const [, y, m, d] = match;
  const deadline = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) + CLAIM_PERIOD_DAYS));
  return Number.isNaN(deadline.getTime()) ? null : deadline.toISOString().slice(0, 10);
};

/** Whole days left until the deadline, counted from today's date (YYYY-MM-DD, IST). */
export const getDaysUntil = (deadline: string, todayIST: string): number => {
  const toUtc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return Math.round((toUtc(deadline) - toUtc(todayIST)) / 86_400_000);
};
