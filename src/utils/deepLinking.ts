import type { LinkingOptions } from "@react-navigation/native";

export const WEBSITE_HOSTS = ["www.keralalotteryresultstoday.in", "keralalotteryresultstoday.in"] as const;

/**
 * Website URL slug → lottery code. Mirrors SLUG_TO_LOTTERY_CODE in
 * frontend/lib/supabase.ts (separate package); keep the two in sync.
 */
const SLUG_TO_LOTTERY_CODE: Record<string, string> = {
  bhagyathara: "BT",
  sthreesakthi: "SS",
  "sthree-sakthi": "SS",
  dhanalekshmi: "DL",
  karunyaplus: "KN",
  "karunya-plus": "KN",
  suvarnakeralam: "SK",
  "suvarna-keralam": "SK",
  karunya: "KR",
  samrudhi: "SM",
  "christmas-new-year-bumper": "XN",
  "christmas-new-year": "XN",
  "xmas-new-year-bumper": "XN",
  "summer-bumper": "SB",
  "vishu-bumper": "VB",
  "monsoon-bumper": "MB",
  "thiruvonam-bumper": "TH",
  "onam-bumper": "TH",
  "pooja-bumper": "PB",
};

// Route names registered in App.tsx (root stack / bottom tabs).
type AppRoute =
  | { name: "MainTabs"; params?: { screen: "HomeTab" | "SearchTab" | "LotteriesTab" } }
  | { name: "LotteryArchive"; params: { code: string } }
  | { name: "DrawBreakdown"; params: { code: string; date: string; highlight?: string } }
  | { name: "ClaimCalculator"; params?: Record<string, never> };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Maps a website / custom-scheme path to the in-app screen.
 *   /                         → Home
 *   /search?ticket=…          → Search tab
 *   /claim                    → Claim calculator
 *   /lotteries                → Lotteries tab
 *   /karunya                  → that lottery's results archive
 *   /karunya/2026-11-04       → that draw's full result (?highlight=TICKET supported)
 * Anything else → Home (never a dead end).
 */
export const resolveAppLink = (path: string): AppRoute => {
  const [pathname = "", query = ""] = path.replace(/#.*$/, "").split("?");
  const segments = pathname
    .split("/")
    .map((s) => decodeURIComponentSafe(s).trim().toLowerCase())
    .filter(Boolean);
  const [first, second] = segments;

  if (!first) return { name: "MainTabs", params: { screen: "HomeTab" } };
  if (first === "search") return { name: "MainTabs", params: { screen: "SearchTab" } };
  if (first === "claim") return { name: "ClaimCalculator" };
  if (first === "lotteries") return { name: "MainTabs", params: { screen: "LotteriesTab" } };

  // Old /lottery/<slug>/<date> URLs (the website redirects them to /<slug>/<date>).
  const [slug, date] = first === "lottery" ? [second, segments[2]] : [first, second];
  const code = slug ? SLUG_TO_LOTTERY_CODE[slug] : undefined;
  if (!code) return { name: "MainTabs", params: { screen: "HomeTab" } };

  if (date && ISO_DATE.test(date)) {
    const highlight = getQueryParam(query, "highlight")?.trim();
    return { name: "DrawBreakdown", params: { code, date, ...(highlight ? { highlight } : {}) } };
  }
  return { name: "LotteryArchive", params: { code } };
};

// React Native's URLSearchParams polyfill is incomplete, so parse the query string by hand.
const getQueryParam = (query: string, key: string): string | undefined => {
  for (const pair of query.split("&")) {
    const [rawKey = "", rawValue = ""] = pair.split("=");
    if (decodeURIComponentSafe(rawKey) === key) return decodeURIComponentSafe(rawValue.replace(/\+/g, " "));
  }
  return undefined;
};

const decodeURIComponentSafe = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value; // malformed escape (e.g. "%E0"): use the raw segment
  }
};

/** React Navigation linking: deep links land on the right screen with Home underneath (Back works). */
export const appLinking: LinkingOptions<Record<string, object | undefined>> = {
  prefixes: ["keralalottery://", ...WEBSITE_HOSTS.map((host) => `https://${host}`)],
  getStateFromPath: (path) => {
    const route = resolveAppLink(path);
    if (route.name === "MainTabs") {
      return { routes: [{ name: "MainTabs", state: { routes: [{ name: route.params?.screen ?? "HomeTab" }] } }] };
    }
    return { routes: [{ name: "MainTabs" }, { name: route.name, params: route.params }] };
  },
};
