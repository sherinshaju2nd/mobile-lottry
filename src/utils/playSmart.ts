import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * "Play Smart": responsible-play tools. Everything is stored on the device only
 * (never uploaded) so people can be honest with themselves about spending.
 */

const ENTRIES_KEY = "play_smart_entries_v1";
const SETTINGS_KEY = "play_smart_settings_v1";
const MAX_ENTRIES = 5000;

export type PlayEntryKind = "spend" | "win";

export interface PlayEntry {
  id: string;
  kind: PlayEntryKind;
  /** Purchase date (spend) or date the money was received (win), YYYY-MM-DD. */
  date: string;
  lotteryCode?: string;
  lotteryName: string;
  /** Number of tickets (spend only). */
  tickets?: number;
  /** Price paid per ticket in ₹ (spend only). */
  pricePerTicket?: number;
  /** Total ₹: tickets × price for spends, amount received for wins. */
  amount: number;
  createdAt: string;
}

export const BREAK_OPTIONS_DAYS = [7, 30, 90] as const;

export interface PlaySettings {
  /** Monthly spending limit in ₹; null = no limit set. */
  monthlyLimit: number | null;
  /** Show the "close to your limit" warning from this share of the limit. */
  warnAtPercent: number;
  /** Last day (inclusive, YYYY-MM-DD) of an active break; null = no break. */
  breakUntil: string | null;
  /** Result of the last self-check, if taken. */
  lastSelfCheck: { date: string; flagged: boolean } | null;
}

export const DEFAULT_PLAY_SETTINGS: PlaySettings = {
  monthlyLimit: null,
  warnAtPercent: 80,
  breakUntil: null,
  lastSelfCheck: null,
};

// ---------------------------------------------------------------------------
// Pure calculations (no storage) – unit tested
// ---------------------------------------------------------------------------

/** "2026-11-04" → "2026-11". */
export const monthOf = (isoDate: string): string => isoDate.slice(0, 7);

export const daysInMonth = (month: string): number => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** Month key `offset` months away from `month` (negative = earlier). */
export const shiftMonth = (month: string, offset: number): string => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const addDays = (isoDate: string, days: number): string => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

export interface LotteryBreakdown {
  lotteryName: string;
  spent: number;
  won: number;
  tickets: number;
}

export interface MonthSummary {
  month: string;
  spent: number;
  won: number;
  /** won − spent (negative = money lost). */
  net: number;
  tickets: number;
  /** Distinct days on which tickets were bought. */
  playDays: number;
  byLottery: LotteryBreakdown[];
}

export const summarizeMonth = (entries: PlayEntry[], month: string): MonthSummary => {
  const inMonth = entries.filter((e) => monthOf(e.date) === month);
  const byLottery = new Map<string, LotteryBreakdown>();
  const playDays = new Set<string>();
  let spent = 0;
  let won = 0;
  let tickets = 0;

  for (const e of inMonth) {
    const row = byLottery.get(e.lotteryName) ?? { lotteryName: e.lotteryName, spent: 0, won: 0, tickets: 0 };
    if (e.kind === "spend") {
      spent += e.amount;
      tickets += e.tickets ?? 0;
      row.spent += e.amount;
      row.tickets += e.tickets ?? 0;
      playDays.add(e.date);
    } else {
      won += e.amount;
      row.won += e.amount;
    }
    byLottery.set(e.lotteryName, row);
  }

  return {
    month,
    spent,
    won,
    net: won - spent,
    tickets,
    playDays: playDays.size,
    byLottery: [...byLottery.values()].sort((a, b) => b.spent - a.spent || b.won - a.won),
  };
};

/** Spend and winnings for the last `count` months, oldest first, ending with `currentMonth`. */
export const monthlyTrend = (entries: PlayEntry[], currentMonth: string, count = 6) =>
  Array.from({ length: count }, (_, i) => {
    const { month, spent, won } = summarizeMonth(entries, shiftMonth(currentMonth, i - (count - 1)));
    return { month, spent, won };
  });

export interface AllTimeSummary {
  spent: number;
  won: number;
  net: number;
  /** Share of money spent that came back as winnings, 0–100+ (null when nothing spent). */
  returnPercent: number | null;
  firstDate: string | null;
}

export const summarizeAllTime = (entries: PlayEntry[]): AllTimeSummary => {
  const spent = entries.filter((e) => e.kind === "spend").reduce((n, e) => n + e.amount, 0);
  const won = entries.filter((e) => e.kind === "win").reduce((n, e) => n + e.amount, 0);
  const firstDate = entries.reduce<string | null>((first, e) => (!first || e.date < first ? e.date : first), null);
  return {
    spent,
    won,
    net: won - spent,
    returnPercent: spent > 0 ? Math.round((won / spent) * 100) : null,
    firstDate,
  };
};

export type LimitState = "none" | "ok" | "near" | "reached";

export interface LimitStatus {
  state: LimitState;
  percent: number;
  remaining: number;
}

export const getLimitStatus = (spent: number, limit: number | null, warnAtPercent = 80): LimitStatus => {
  if (!limit || limit <= 0) return { state: "none", percent: 0, remaining: Infinity };
  const percent = Math.round((spent / limit) * 100);
  const remaining = limit - spent;
  if (spent >= limit) return { state: "reached", percent, remaining };
  if (percent >= warnAtPercent) return { state: "near", percent, remaining };
  return { state: "ok", percent, remaining };
};

/**
 * Projected spend for the whole month at the current pace. Only meaningful after a few
 * days, so it returns null for the first 5 days of the month or when nothing is spent.
 */
export const projectMonthSpend = (spentSoFar: number, todayIST: string): number | null => {
  const day = Number(todayIST.slice(8, 10));
  if (spentSoFar <= 0 || day < 5) return null;
  return Math.round((spentSoFar / day) * daysInMonth(monthOf(todayIST)));
};

/** What adding `amount` would do to this month's limit (used for the gentle confirm before saving). */
export const checkSpendAgainstLimit = (
  currentSpent: number,
  amount: number,
  settings: Pick<PlaySettings, "monthlyLimit" | "warnAtPercent">,
): { before: LimitStatus; after: LimitStatus; crossesLimit: boolean; crossesWarning: boolean } => {
  const before = getLimitStatus(currentSpent, settings.monthlyLimit, settings.warnAtPercent);
  const after = getLimitStatus(currentSpent + amount, settings.monthlyLimit, settings.warnAtPercent);
  return {
    before,
    after,
    crossesLimit: before.state !== "reached" && after.state === "reached",
    crossesWarning: before.state === "ok" && after.state === "near",
  };
};

export const isBreakActive = (settings: Pick<PlaySettings, "breakUntil">, todayIST: string): boolean =>
  Boolean(settings.breakUntil && settings.breakUntil >= todayIST);

/** Most recent price the user paid for a lottery (to prefill the next entry). */
export const lastPriceFor = (entries: PlayEntry[], lotteryName: string): number | null => {
  const last = entries
    .filter((e) => e.kind === "spend" && e.lotteryName === lotteryName && e.pricePerTicket)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
  return last?.pricePerTicket ?? null;
};

/**
 * Lie/Bet questionnaire (Johnson et al., 1988): two validated screening questions.
 * A "yes" to either suggests talking to someone; it is not a diagnosis.
 */
export const isSelfCheckFlagged = (answers: [boolean, boolean]): boolean => answers.some(Boolean);

/** Plain-text summary for sharing / keeping a copy. */
export const buildSummaryText = (entries: PlayEntry[], month: string, formatRupees: (n: number) => string): string => {
  const m = summarizeMonth(entries, month);
  const all = summarizeAllTime(entries);
  return [
    `Lottery spending – ${month}`,
    `Spent: ${formatRupees(m.spent)} (${m.tickets} tickets on ${m.playDays} days)`,
    `Won: ${formatRupees(m.won)}`,
    `Net: ${m.net >= 0 ? "+" : "−"}${formatRupees(Math.abs(m.net))}`,
    ...m.byLottery.map((l) => `• ${l.lotteryName}: spent ${formatRupees(l.spent)}, won ${formatRupees(l.won)}`),
    "",
    `All time: spent ${formatRupees(all.spent)}, won ${formatRupees(all.won)}`,
  ].join("\n");
};

// ---------------------------------------------------------------------------
// Storage (device only)
// ---------------------------------------------------------------------------

const isPlayEntry = (value: unknown): value is PlayEntry => {
  const e = value as Partial<PlayEntry> | null;
  return Boolean(
    e &&
      typeof e.id === "string" &&
      (e.kind === "spend" || e.kind === "win") &&
      typeof e.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
      typeof e.lotteryName === "string" &&
      typeof e.amount === "number" &&
      Number.isFinite(e.amount) &&
      e.amount >= 0,
  );
};

export const loadPlayEntries = async (): Promise<PlayEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(ENTRIES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isPlayEntry) : [];
  } catch (err: unknown) {
    console.warn("[play-smart] Could not read entries:", err instanceof Error ? err.message : String(err));
    return [];
  }
};

const saveEntries = async (entries: PlayEntry[]): Promise<void> => {
  const newestFirst = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(newestFirst.slice(0, MAX_ENTRIES)));
};

export const addPlayEntry = async (entry: Omit<PlayEntry, "id" | "createdAt">): Promise<PlayEntry> => {
  const full: PlayEntry = {
    ...entry,
    amount: Math.max(0, Math.round(entry.amount)),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await saveEntries([full, ...(await loadPlayEntries())]);
  return full;
};

export const deletePlayEntry = async (id: string): Promise<void> => {
  await saveEntries((await loadPlayEntries()).filter((e) => e.id !== id));
};

export const loadPlaySettings = async (): Promise<PlaySettings> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<PlaySettings>) : {};
    return { ...DEFAULT_PLAY_SETTINGS, ...parsed };
  } catch (err: unknown) {
    console.warn("[play-smart] Could not read settings:", err instanceof Error ? err.message : String(err));
    return DEFAULT_PLAY_SETTINGS;
  }
};

export const savePlaySettings = async (patch: Partial<PlaySettings>): Promise<PlaySettings> => {
  const next = { ...(await loadPlaySettings()), ...patch };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
};

/** Removes every Play Smart record from this phone. */
export const clearPlaySmartData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([ENTRIES_KEY, SETTINGS_KEY]);
};

/** Used by the notification scheduler: pre-draw reminders pause during a break. */
export const isPlayBreakActiveNow = async (todayIST: string): Promise<boolean> =>
  isBreakActive(await loadPlaySettings(), todayIST);
