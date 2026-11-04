import { DrawResult, WinnerInfo } from "../api/lotteryApi";
import { KERALA_DISTRICTS } from "./notificationSettingsStorage";

export type KeralaDistrict = (typeof KERALA_DISTRICTS)[number];

/**
 * First letter of the selling agency number → district lottery office.
 * Derived from the results data: every agency in a given district shares the letter
 * (e.g. "C 7248" Payyannur and "C 4328" Kannur are both Kannur district).
 */
const AGENCY_PREFIX_DISTRICT: Record<string, KeralaDistrict> = {
  A: "Alappuzha",
  C: "Kannur",
  D: "Kozhikode",
  E: "Ernakulam",
  H: "Pathanamthitta",
  K: "Kottayam",
  M: "Malappuram",
  P: "Palakkad",
  Q: "Kollam",
  R: "Thrissur",
  S: "Kasaragod",
  T: "Thiruvananthapuram",
  W: "Wayanad",
  Y: "Idukki",
};

/** Towns (and old / alternate spellings) where tickets are sold → district. */
const TOWNS_BY_DISTRICT: Record<KeralaDistrict, string[]> = {
  Thiruvananthapuram: ["THIRUVANANTHAPURAM", "TRIVANDRUM", "NEYYATTINKARA", "ATTINGAL", "NEDUMANGAD", "VARKALA", "KATTAKKADA"],
  Kollam: ["KOLLAM", "QUILON", "KARUNAGAPPALLY", "KARUNAGAPALLY", "PUNALUR", "KOTTARAKKARA", "KOTTARAKARA", "CHATHANNOOR"],
  Pathanamthitta: ["PATHANAMTHITTA", "ADOOR", "THIRUVALLA", "TIRUVALLA", "RANNI", "KOZHENCHERRY"],
  Alappuzha: ["ALAPPUZHA", "ALLEPPEY", "KAYAMKULAM", "CHERTHALA", "MAVELIKKARA", "MAVELIKARA", "HARIPAD", "CHENGANNUR"],
  Kottayam: ["KOTTAYAM", "VAIKKOM", "VAIKOM", "PALA", "PALAI", "CHANGANASSERY", "CHANGANACHERRY", "KANJIRAPPALLY", "ETTUMANOOR"],
  Idukki: ["IDUKKI", "ADIMALY", "ADIMALI", "THODUPUZHA", "KATTAPPANA", "KATTAPANA", "MUNNAR", "NEDUMKANDAM"],
  Ernakulam: ["ERNAKULAM", "KOCHI", "COCHIN", "MOOVATTUPUZHA", "MUVATTUPUZHA", "ALUVA", "ALWAYE", "PERUMBAVOOR", "KOTHAMANGALAM", "ANGAMALY", "ANGAMALI", "NORTH PARAVUR"],
  Thrissur: ["THRISSUR", "TRICHUR", "IRINJALAKKUDA", "IRINJALAKUDA", "GURUVAYOOR", "GURUVAYUR", "CHALAKUDY", "KODUNGALLUR", "KUNNAMKULAM", "WADAKKANCHERY"],
  Palakkad: ["PALAKKAD", "PALGHAT", "PATTAMBI", "CHITTUR", "OTTAPALAM", "MANNARKKAD", "MANNARKAD", "ALATHUR", "SHORANUR"],
  Malappuram: ["MALAPPURAM", "THIRUR", "TIRUR", "MANJERI", "PERINTHALMANNA", "PONNANI", "TIRURANGADI", "NILAMBUR", "KOTTAKKAL"],
  Kozhikode: ["KOZHIKODE", "KOZHIKKODE", "CALICUT", "THAMARASSERY", "VADAKARA", "VATAKARA", "KOYILANDY", "QUILANDY", "FEROKE"],
  Wayanad: ["WAYANAD", "WAYANADU", "KALPETTA", "MANANTHAVADY", "SULTHAN BATHERY", "SULTAN BATHERY", "BATHERY"],
  Kannur: ["KANNUR", "CANNANORE", "PAYYANNUR", "THALASSERY", "TELLICHERRY", "TALIPARAMBA", "THALIPARAMBA", "IRITTY", "MATTANNUR"],
  Kasaragod: ["KASARAGOD", "KASARGOD", "KASARAGODE", "KANHANGAD", "NILESHWAR", "NILESHWARAM", "CHERUVATHUR"],
};

const normalisePlace = (value: string | undefined): string =>
  (value ?? "").toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();

const TOWN_TO_DISTRICT = new Map<string, KeralaDistrict>(
  (Object.entries(TOWNS_BY_DISTRICT) as [KeralaDistrict, string[]][]).flatMap(([district, towns]) =>
    towns.map((town) => [town, district] as const),
  ),
);

/**
 * District where a 1st prize ticket was sold: known town name first, then a district / town
 * name contained in the location, then the agency number's district letter.
 */
export const resolveWinnerDistrict = (winner: WinnerInfo | undefined): KeralaDistrict | null => {
  const place = normalisePlace(winner?.location);
  if (place && place !== "N A") {
    const exact = TOWN_TO_DISTRICT.get(place);
    if (exact) return exact;
    for (const [town, district] of TOWN_TO_DISTRICT) {
      if (` ${place} `.includes(` ${town} `)) return district;
    }
  }
  const prefix = (winner?.agency_no ?? "").trim().toUpperCase().charAt(0);
  return AGENCY_PREFIX_DISTRICT[prefix] ?? null;
};

export type LuckyPeriod = "this_year" | "last_12_months" | "all";

export interface DistrictStat {
  district: KeralaDistrict;
  count: number;
  lastWinDate: string | null;
  lotteryCodes: string[];
}

export interface AgencyStat {
  agencyNo: string;
  agent: string;
  town: string;
  district: KeralaDistrict | null;
  count: number;
  lastWinDate: string;
}

export interface LuckyPlaceStats {
  totalWins: number;
  unresolvedWins: number;
  districts: DistrictStat[];
  agencies: AgencyStat[];
  maxDistrictCount: number;
  fromDate: string | null;
}

const toTitleCase = (text: string): string =>
  text
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");

/** Inclusive start date (YYYY-MM-DD) for a period, relative to today's IST date. */
export const getPeriodStartDate = (period: LuckyPeriod, todayIST: string): string | null => {
  if (period === "all") return null;
  if (period === "this_year") return `${todayIST.slice(0, 4)}-01-01`;
  const year = Number(todayIST.slice(0, 4)) - 1;
  return `${year}${todayIST.slice(4)}`;
};

const hasFirstPrize = (draw: DrawResult): boolean => {
  const ticket = draw.first?.ticket?.trim().toLowerCase() ?? "";
  return ticket.length > 0 && ticket !== "n/a" && ticket !== "pending";
};

/** District and agency leaderboards of where 1st prize tickets were sold. */
export const computeLuckyPlaceStats = (
  draws: DrawResult[],
  period: LuckyPeriod,
  todayIST: string,
): LuckyPlaceStats => {
  const fromDate = getPeriodStartDate(period, todayIST);
  const byDistrict = new Map<KeralaDistrict, DistrictStat>(
    KERALA_DISTRICTS.map((district) => [district, { district, count: 0, lastWinDate: null, lotteryCodes: [] }]),
  );
  const byAgency = new Map<string, AgencyStat>();
  let totalWins = 0;
  let unresolvedWins = 0;

  for (const draw of draws) {
    if (!hasFirstPrize(draw)) continue;
    if (fromDate && draw.draw_date < fromDate) continue;
    if (draw.draw_date > todayIST) continue;
    totalWins++;

    const district = resolveWinnerDistrict(draw.first);
    if (district) {
      const stat = byDistrict.get(district);
      if (stat) {
        stat.count++;
        stat.lotteryCodes.push(draw.lottery_code);
        if (!stat.lastWinDate || draw.draw_date > stat.lastWinDate) stat.lastWinDate = draw.draw_date;
      }
    } else {
      unresolvedWins++;
    }

    const agencyNo = (draw.first?.agency_no ?? "").toUpperCase().replace(/\s+/g, " ").trim();
    if (!agencyNo) continue;
    const existing = byAgency.get(agencyNo);
    if (existing) {
      existing.count++;
      if (draw.draw_date > existing.lastWinDate) existing.lastWinDate = draw.draw_date;
    } else {
      byAgency.set(agencyNo, {
        agencyNo,
        agent: toTitleCase(draw.first?.agent?.trim() ?? ""),
        town: toTitleCase(normalisePlace(draw.first?.location)),
        district,
        count: 1,
        lastWinDate: draw.draw_date,
      });
    }
  }

  const byRecent = (a: string | null, b: string | null) => (b ?? "").localeCompare(a ?? "");
  const districts = [...byDistrict.values()].sort((a, b) => b.count - a.count || byRecent(a.lastWinDate, b.lastWinDate));
  const agencies = [...byAgency.values()].sort((a, b) => b.count - a.count || byRecent(a.lastWinDate, b.lastWinDate));

  return {
    totalWins,
    unresolvedWins,
    districts,
    agencies,
    maxDistrictCount: Math.max(1, ...districts.map((d) => d.count)),
    fromDate,
  };
};
