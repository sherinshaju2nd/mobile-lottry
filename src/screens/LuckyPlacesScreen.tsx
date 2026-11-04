import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { MapPin, RotateCw, Share2, Store, Trophy } from "lucide-react-native";
import SafeScreenContainer from "../components/SafeScreenContainer";
import ScreenHeader from "../components/ScreenHeader";
import { COLORS } from "../constants/colors";
import { getDistrictTranslatedName } from "../constants/translations";
import { useLanguage } from "../context/LanguageContext";
import { DrawResult, fetchFirstPrizeHistory } from "../api/lotteryApi";
import {
  KeralaDistrict,
  LuckyPeriod,
  computeLuckyPlaceStats,
} from "../utils/luckyPlaces";
import { formatSafeDateDisplay, getSafeTodayISTDate } from "../utils/formatters";
import { universalShare } from "../utils/shareHelper";
import { triggerLightHaptic } from "../utils/haptics";

const WEBSITE_URL = "https://www.keralalotteryresultstoday.in";

// Stylised Kerala: districts north → south, x = horizontal offset in tile units (coast on the left).
const MAP_ROWS: { district: KeralaDistrict; x: number }[][] = [
  [{ district: "Kasaragod", x: 0 }],
  [{ district: "Kannur", x: 0.3 }, { district: "Wayanad", x: 1.3 }],
  [{ district: "Kozhikode", x: 0.6 }],
  [{ district: "Malappuram", x: 0.9 }, { district: "Palakkad", x: 1.9 }],
  [{ district: "Thrissur", x: 1.2 }],
  [{ district: "Ernakulam", x: 1.4 }, { district: "Idukki", x: 2.4 }],
  [{ district: "Alappuzha", x: 1.4 }, { district: "Kottayam", x: 2.4 }],
  [{ district: "Kollam", x: 1.6 }, { district: "Pathanamthitta", x: 2.6 }],
  [{ district: "Thiruvananthapuram", x: 1.8 }],
];
const MAP_UNITS_WIDE = 3.7;
const TILE_GAP = 4;
const TOP_AGENCIES = 10;

const PERIODS: { key: LuckyPeriod; en: string; ml: string }[] = [
  { key: "this_year", en: "This year", ml: "ഈ വർഷം" },
  { key: "last_12_months", en: "Last 12 months", ml: "കഴിഞ്ഞ 12 മാസം" },
  { key: "all", en: "All time", ml: "എല്ലാം" },
];

const heatColor = (count: number, max: number): string => {
  if (count === 0) return "#F1F5F9";
  const strength = 0.25 + 0.75 * (count / max);
  return `rgba(220, 38, 38, ${strength.toFixed(2)})`;
};

export default function LuckyPlacesScreen({ navigation }: any) {
  const { language } = useLanguage();
  const isMl = language === "ml";
  const { width } = useWindowDimensions();

  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<LuckyPeriod>("this_year");
  const [selectedDistrict, setSelectedDistrict] = useState<KeralaDistrict | null>(null);

  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const next = await fetchFirstPrizeHistory();
      hasDataRef.current = next.length > 0;
      setDraws(next);
    } catch (err: unknown) {
      // Keep whatever is already on screen; only a failed first load shows the empty/retry state.
      console.warn("[LuckyPlaces] Failed to load draws:", err instanceof Error ? err.message : String(err));
      if (hasDataRef.current) {
        Alert.alert(
          isMl ? "പുതുക്കാനായില്ല" : "Couldn't refresh",
          isMl ? "ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക." : "Check your internet connection and try again.",
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isMl]);

  useEffect(() => {
    load();
  }, [load]);

  const todayIST = getSafeTodayISTDate();
  const stats = useMemo(() => computeLuckyPlaceStats(draws, period, todayIST), [draws, period, todayIST]);
  const districtName = (d: KeralaDistrict) => getDistrictTranslatedName(d, language);

  const visibleAgencies = useMemo(
    () =>
      (selectedDistrict ? stats.agencies.filter((a) => a.district === selectedDistrict) : stats.agencies).slice(
        0,
        TOP_AGENCIES,
      ),
    [stats.agencies, selectedDistrict],
  );

  const oldestDraw = draws.reduce<string | null>(
    (oldest, d) => (!oldest || d.draw_date < oldest ? d.draw_date : oldest),
    null,
  );
  const periodLabel = PERIODS.find((p) => p.key === period)?.[isMl ? "ml" : "en"] ?? "";
  const topDistrict = stats.districts[0]?.count ? stats.districts[0] : null;

  // Inner map width: screen padding 32 + card border 2 + card padding 32 + map padding 8.
  const tileWidth = (width - 74) / MAP_UNITS_WIDE;
  const tileHeight = Math.max(34, tileWidth * 0.5);

  const handleShare = async () => {
    triggerLightHaptic();
    const lines = stats.districts
      .filter((d) => d.count > 0)
      .slice(0, 5)
      .map((d, i) => `${i + 1}. ${districtName(d.district)}: ${d.count}`);
    const agencies = stats.agencies
      .slice(0, 3)
      .map((a) => `• ${a.agencyNo}${a.agent ? ` ${a.agent}` : ""}${a.town ? `, ${a.town}` : ""}: ${a.count}`);
    const title = isMl
      ? `🏆 കേരള ലോട്ടറി ഭാഗ്യ ജില്ലകൾ (${periodLabel})`
      : `🏆 Kerala Lottery lucky districts (${periodLabel})`;
    const message = [
      title,
      isMl ? `ഒന്നാം സമ്മാനങ്ങൾ: ${stats.totalWins}` : `1st prizes: ${stats.totalWins}`,
      "",
      ...lines,
      ...(agencies.length ? ["", isMl ? "ഭാഗ്യ ഏജൻസികൾ:" : "Lucky agencies:", ...agencies] : []),
      "",
      isMl ? "ഫലങ്ങൾ പരിശോധിക്കൂ:" : "Check results:",
      WEBSITE_URL,
    ].join("\n");
    await universalShare({ title, message });
  };

  const selectDistrict = (district: KeralaDistrict) => {
    triggerLightHaptic();
    setSelectedDistrict((current) => (current === district ? null : district));
  };

  return (
    <SafeScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScreenHeader
        title={isMl ? "ഭാഗ്യ ജില്ലകൾ & ഏജൻസികൾ" : "Lucky Districts & Agencies"}
        subtitle={isMl ? "ഒന്നാം സമ്മാന ടിക്കറ്റുകൾ വിറ്റ സ്ഥലങ്ങൾ" : "Where 1st prize tickets were sold"}
        onBack={() => navigation.goBack()}
        right={
          stats.totalWins > 0 ? (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel={isMl ? "പങ്കിടുക" : "Share"}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Share2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                load();
              }}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Period chips */}
          <View style={styles.chipRow}>
            {PERIODS.map((p) => {
              const active = p.key === period;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    triggerLightHaptic();
                    setPeriod(p.key);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{isMl ? p.ml : p.en}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {stats.totalWins === 0 ? (
            <View style={[styles.card, styles.center]}>
              <Text style={styles.body}>
                {draws.length === 0
                  ? isMl
                    ? "ഫലങ്ങൾ ലോഡ് ചെയ്യാനായില്ല. ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക."
                    : "Couldn't load results. Check your internet connection and try again."
                  : isMl
                    ? "ഈ കാലയളവിൽ ഒന്നാം സമ്മാന വിവരങ്ങളില്ല."
                    : "No 1st prize data for this period yet."}
              </Text>
              {draws.length === 0 ? (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => {
                    setIsLoading(true);
                    load();
                  }}
                >
                  <RotateCw size={14} color="#FFFFFF" />
                  <Text style={styles.retryText}>{isMl ? "വീണ്ടും ശ്രമിക്കുക" : "Retry"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <>
              {/* Summary */}
              <View style={styles.summary}>
                <Trophy size={18} color={COLORS.gold} />
                <Text style={styles.summaryText}>
                  {isMl
                    ? `${stats.totalWins} ഒന്നാം സമ്മാനങ്ങൾ${topDistrict ? ` · ഏറ്റവും കൂടുതൽ ${districtName(topDistrict.district)} (${topDistrict.count})` : ""}`
                    : `${stats.totalWins} first prizes${topDistrict ? ` · most in ${districtName(topDistrict.district)} (${topDistrict.count})` : ""}`}
                </Text>
              </View>

              {/* Kerala tile map */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{isMl ? "കേരള ഭൂപടം" : "Kerala map"}</Text>
                <Text style={styles.hint}>
                  {isMl ? "ഒരു ജില്ലയിൽ തൊട്ടാൽ ആ ജില്ലയിലെ ഏജൻസികൾ കാണാം" : "Tap a district to see its agencies"}
                </Text>
                <View style={styles.map}>
                  {MAP_ROWS.map((row, rowIndex) => (
                    <View key={rowIndex} style={[styles.mapRow, { height: tileHeight }]}>
                      {row.map(({ district, x }) => {
                        const stat = stats.districts.find((d) => d.district === district);
                        const count = stat?.count ?? 0;
                        const strong = count / stats.maxDistrictCount > 0.45;
                        const selected = selectedDistrict === district;
                        return (
                          <TouchableOpacity
                            key={district}
                            onPress={() => selectDistrict(district)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`${districtName(district)}, ${count} ${isMl ? "ഒന്നാം സമ്മാനങ്ങൾ" : count === 1 ? "first prize" : "first prizes"}`}
                            style={[
                              styles.tile,
                              {
                                left: x * tileWidth,
                                width: tileWidth - TILE_GAP,
                                height: tileHeight - TILE_GAP,
                                backgroundColor: heatColor(count, stats.maxDistrictCount),
                              },
                              selected && styles.tileSelected,
                            ]}
                          >
                            <Text
                              style={[styles.tileName, strong && styles.tileTextLight]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.6}
                            >
                              {districtName(district)}
                            </Text>
                            <Text style={[styles.tileCount, strong && styles.tileTextLight]}>{count}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>

              {/* District leaderboard */}
              <View style={styles.card}>
                <View style={styles.sectionTitleRow}>
                  <MapPin size={18} color="#DC2626" />
                  <Text style={styles.sectionTitle}>{isMl ? "ജില്ലാ റാങ്കിംഗ്" : "District ranking"}</Text>
                </View>
                {stats.districts
                  .filter((d) => d.count > 0)
                  .map((d, index) => (
                    <TouchableOpacity
                      key={d.district}
                      style={[styles.rankRow, selectedDistrict === d.district && styles.rankRowSelected]}
                      onPress={() => selectDistrict(d.district)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.rankIndex}>{index + 1}</Text>
                      <View style={styles.rankMain}>
                        <View style={styles.rankHeader}>
                          <Text style={styles.rankName}>{districtName(d.district)}</Text>
                          <Text style={styles.rankCount}>{d.count}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${(d.count / stats.maxDistrictCount) * 100}%` }]} />
                        </View>
                        {d.lastWinDate ? (
                          <Text style={styles.rankMeta}>
                            {isMl ? "അവസാനം: " : "Last win: "}
                            {formatSafeDateDisplay(d.lastWinDate)}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>

              {/* Agencies */}
              <View style={styles.card}>
                <View style={styles.sectionTitleRow}>
                  <Store size={18} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>
                    {selectedDistrict
                      ? isMl
                        ? `${districtName(selectedDistrict)} – ഏജൻസികൾ`
                        : `Agencies in ${districtName(selectedDistrict)}`
                      : isMl
                        ? "ഭാഗ്യ ഏജൻസികൾ"
                        : "Lucky agencies"}
                  </Text>
                </View>
                {selectedDistrict ? (
                  <TouchableOpacity onPress={() => setSelectedDistrict(null)} accessibilityRole="button">
                    <Text style={styles.clearFilter}>{isMl ? "എല്ലാ ജില്ലകളും കാണിക്കുക" : "Show all districts"}</Text>
                  </TouchableOpacity>
                ) : null}
                {visibleAgencies.length === 0 ? (
                  <Text style={styles.body}>{isMl ? "ഏജൻസി വിവരങ്ങളില്ല." : "No agency data."}</Text>
                ) : (
                  visibleAgencies.map((a) => (
                    <View key={a.agencyNo} style={styles.agencyRow}>
                      <View style={styles.agencyBadge}>
                        <Text style={styles.agencyBadgeText}>{a.count}×</Text>
                      </View>
                      <View style={styles.rankMain}>
                        <Text style={styles.agencyName} numberOfLines={1}>
                          {a.agent || a.agencyNo}
                        </Text>
                        <Text style={styles.rankMeta} numberOfLines={1}>
                          {[a.agencyNo, a.town, a.district ? districtName(a.district) : null].filter(Boolean).join(" · ")}
                        </Text>
                        <Text style={styles.rankMeta}>
                          {isMl ? "അവസാനം: " : "Last win: "}
                          {formatSafeDateDisplay(a.lastWinDate)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <Text style={styles.footnote}>
                {isMl
                  ? `${oldestDraw ? `${formatSafeDateDisplay(oldestDraw)} മുതലുള്ള` : ""} ഫലങ്ങളെ അടിസ്ഥാനമാക്കി.${stats.unresolvedWins ? ` ${stats.unresolvedWins} സമ്മാനങ്ങൾക്ക് വിറ്റ സ്ഥലം പ്രസിദ്ധീകരിച്ചിട്ടില്ല.` : ""} നറുക്കെടുപ്പുകൾ ക്രമരഹിതമാണ് – ഇത് വിനോദത്തിനുള്ള കണക്കുകൾ മാത്രം.`
                  : `Based on results${oldestDraw ? ` since ${formatSafeDateDisplay(oldestDraw)}` : ""}.${stats.unresolvedWins ? ` ${stats.unresolvedWins} ${stats.unresolvedWins === 1 ? "win has" : "wins have"} no published location.` : ""} Draws are random – these are fun facts, not predictions.`}
              </Text>
            </>
          )}
        </ScrollView>
      )}
    </SafeScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  shareBtn: { padding: 9, borderRadius: 10, backgroundColor: "#25D366" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  chipTextActive: { color: COLORS.white },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.goldLight,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  summaryText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#92400E" },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, marginBottom: 10 },
  body: { fontSize: 14, color: COLORS.textDark, lineHeight: 20, textAlign: "center" },
  map: { paddingHorizontal: 4 },
  mapRow: { position: "relative" },
  tile: {
    position: "absolute",
    top: 0,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tileSelected: { borderWidth: 2, borderColor: COLORS.primary },
  tileName: { fontSize: 11, fontWeight: "700", color: COLORS.textDark },
  tileCount: { fontSize: 13, fontWeight: "900", color: COLORS.textDark },
  tileTextLight: { color: "#FFFFFF" },
  rankRow: { flexDirection: "row", gap: 10, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10 },
  rankRowSelected: { backgroundColor: COLORS.primaryLight },
  rankIndex: { width: 20, fontSize: 14, fontWeight: "800", color: COLORS.textMuted, textAlign: "center" },
  rankMain: { flex: 1 },
  rankHeader: { flexDirection: "row", justifyContent: "space-between" },
  rankName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  rankCount: { fontSize: 15, fontWeight: "900", color: "#DC2626" },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: "#F1F5F9", marginTop: 6, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: "#DC2626" },
  rankMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  clearFilter: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 8 },
  agencyRow: { flexDirection: "row", gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  agencyBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  agencyBadgeText: { fontSize: 14, fontWeight: "900", color: COLORS.gold },
  agencyName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  footnote: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", lineHeight: 17, paddingHorizontal: 8 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
});
