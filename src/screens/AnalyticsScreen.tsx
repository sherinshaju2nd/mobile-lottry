import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Flame,
  Snowflake,
  MapPin,
  TrendingUp,
  BarChart3,
  Trophy,
  Sparkles,
  Info,
  Calendar,
  Search,
  X,
  Dices,
  Zap,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { fetchAllDraws, DrawResult } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";
import { KERALA_DISTRICTS } from "../utils/notificationSettingsStorage";
import { triggerLightHaptic } from "../utils/haptics";
import ShimmerSkeleton from "../components/ShimmerSkeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const QUICK_PICKS = [
  { num: "5593", bg: "#EEF2FF", text: "#2563EB", border: "#C7D2FE" },
  { num: "5866", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  { num: "2749", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
  { num: "9924", bg: "#F3E8FF", text: "#9333EA", border: "#E9D5FF" },
  { num: "8712", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  { num: "8860", bg: "#CCFBF1", text: "#0D9488", border: "#99F6E4" },
  { num: "0096", bg: "#FDF2F8", text: "#DB2777", border: "#FBCFE8" },
  { num: "1234", bg: "#EFF6FF", text: "#0284C7", border: "#BAE6FD" },
];

const ITEM_HEIGHT = 46;
const DIGITS_LIST = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SNAP_OFFSETS = DIGITS_LIST.map((d) => d * ITEM_HEIGHT);
const WHEEL_ITEMS = [-1, ...DIGITS_LIST, 10];

function SingleDigitWheel({
  value,
  onChange,
}: {
  value: number;
  onChange: (newVal: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const lastIndexRef = useRef(value);

  // Sync scroll position when value changes externally (e.g. Quick Picks)
  useEffect(() => {
    if (lastIndexRef.current !== value) {
      lastIndexRef.current = value;
      scrollRef.current?.scrollTo({
        y: value * ITEM_HEIGHT,
        animated: true,
      });
    }
  }, [value]);

  // Initial scroll position
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: value * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(9, Math.round(offsetY / ITEM_HEIGHT)));
    if (index !== lastIndexRef.current) {
      lastIndexRef.current = index;
      triggerLightHaptic();
      onChange(index);
    }
  };

  const handleScrollEnd = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(9, Math.round(offsetY / ITEM_HEIGHT)));
    if (index !== lastIndexRef.current) {
      lastIndexRef.current = index;
      triggerLightHaptic();
      onChange(index);
    }
  };

  return (
    <View style={styles.wheelCol}>
      {/* Center active highlight lens */}
      <View style={styles.wheelActiveLens} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToOffsets={SNAP_OFFSETS}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        nestedScrollEnabled={true}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        {WHEEL_ITEMS.map((d, idx) => {
          if (d === -1 || d === 10) {
            return <View key={`spacer-${idx}`} style={styles.wheelSpacer} />;
          }
          const isSelected = d === value;
          return (
            <TouchableOpacity
              key={d}
              activeOpacity={0.8}
              style={styles.wheelItem}
              onPress={() => {
                triggerLightHaptic();
                lastIndexRef.current = d;
                onChange(d);
                scrollRef.current?.scrollTo({
                  y: d * ITEM_HEIGHT,
                  animated: true,
                });
              }}
            >
              <Text
                style={[
                  styles.wheelItemText,
                  isSelected
                    ? styles.wheelItemTextActive
                    : styles.wheelItemTextInactive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Kerala State Lottery - Analytics & Frequency Statistics
export default function AnalyticsScreen({ navigation }: any) {
  const { language } = useLanguage();
  const isMl = language === "ml";

  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [horizon, setHorizon] = useState<"30" | "90" | "all">("30");
  const [activeTab, setActiveTab] = useState<"numbers" | "districts">(
    "numbers",
  );
  const [digits, setDigits] = useState<[number, number, number, number]>([0, 0, 9, 6]);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  const handleDigitChange = (colIndex: number, newVal: number) => {
    setDigits((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[colIndex] = newVal;
      return next;
    });
  };

  const handleSelectQuickPick = (numStr: string) => {
    triggerLightHaptic();
    const clean = numStr.trim().replace(/\D/g, "");
    const padded = clean.padStart(4, "0").slice(-4);
    const dArr: [number, number, number, number] = [
      parseInt(padded[0], 10) || 0,
      parseInt(padded[1], 10) || 0,
      parseInt(padded[2], 10) || 0,
      parseInt(padded[3], 10) || 0,
    ];
    setDigits(dArr);
    setSubmittedQuery(clean);
  };

  const handleCheckHistory = () => {
    triggerLightHaptic();
    setSubmittedQuery(digits.join(""));
  };

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllDraws();
      setDraws(data || []);
    } catch {
      setDraws([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter draws by selected time horizon
  const filteredDraws = useMemo(() => {
    if (horizon === "all") return draws;
    const limit = horizon === "30" ? 30 : 90;
    return draws.slice(0, limit);
  }, [draws, horizon]);

  // Compute 4-digit and 2-digit ending frequencies
  const numberStats = useMemo(() => {
    const ending4Map: Record<string, number> = {};
    const ending2Map: Record<string, number> = {};
    const singleDigitMap: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
    };

    let totalPrizesCounted = 0;

    filteredDraws.forEach((draw) => {
      // 1st Prize
      if (draw.first?.ticket && draw.first.ticket !== "N/A") {
        const digits = draw.first.ticket.replace(/\D/g, "");
        if (digits.length >= 4) {
          const e4 = digits.slice(-4);
          const e2 = digits.slice(-2);
          ending4Map[e4] = (ending4Map[e4] || 0) + 1;
          ending2Map[e2] = (ending2Map[e2] || 0) + 1;
        }
        const lastD = parseInt(digits.slice(-1), 10);
        if (!isNaN(lastD)) singleDigitMap[lastD]++;
        totalPrizesCounted++;
      }

      // Other Prizes
      if (draw.prizes) {
        const tiers = [
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
        tiers.forEach((t) => {
          const nums = draw.prizes![t];
          if (Array.isArray(nums)) {
            nums.forEach((num) => {
              const digits = num.replace(/\D/g, "");
              if (digits.length >= 4) {
                const e4 = digits.slice(-4);
                ending4Map[e4] = (ending4Map[e4] || 0) + 1;
              }
              if (digits.length >= 2) {
                const e2 = digits.slice(-2);
                ending2Map[e2] = (ending2Map[e2] || 0) + 1;
              }
              const lastD = parseInt(digits.slice(-1), 10);
              if (!isNaN(lastD)) singleDigitMap[lastD]++;
              totalPrizesCounted++;
            });
          }
        });
      }
    });

    // Top 8 Hot 4-digit numbers
    const hot4 = Object.entries(ending4Map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Top 8 Hot 2-digit numbers
    const hot2 = Object.entries(ending2Map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Least frequent / Cold 2-digit numbers
    const cold2 = Object.entries(ending2Map)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 6);

    return { hot4, hot2, cold2, singleDigitMap, totalPrizesCounted };
  }, [filteredDraws]);

  // Compute District Heatmap Leaderboard
  const districtStats = useMemo(() => {
    const distCounts: Record<
      string,
      { count: number; totalWonStr: string; lotteries: string[] }
    > = {};
    KERALA_DISTRICTS.forEach((d) => {
      distCounts[d] = { count: 0, totalWonStr: "", lotteries: [] };
    });

    let totalJackpotDraws = 0;

    filteredDraws.forEach((draw) => {
      const loc = (draw.first?.location || "").toLowerCase();
      if (loc && loc !== "n/a") {
        totalJackpotDraws++;
        for (const dist of KERALA_DISTRICTS) {
          if (loc.includes(dist.toLowerCase())) {
            distCounts[dist].count += 1;
            distCounts[dist].lotteries.push(
              draw.draw_name || draw.lottery_code,
            );
            break;
          }
        }
      }
    });

    const ranked = Object.entries(distCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...ranked.map((r) => r.count), 1);

    return { ranked, maxCount, totalJackpotDraws };
  }, [filteredDraws]);

  // Interactive custom number lookup (evaluated on Check History or Quick Pick)
  const searchResult = useMemo(() => {
    if (!submittedQuery || submittedQuery.length < 2) return null;
    const query = submittedQuery.trim().replace(/\D/g, "");
    if (!query || query.length < 2) return null;

    let totalMatches = 0;
    const tierBreakdown: Record<string, number> = {};
    const matchedDraws: Array<{
      date: string;
      name: string;
      tier: string;
      fullTicket: string;
    }> = [];

    filteredDraws.forEach((draw) => {
      // 1st Prize
      if (draw.first?.ticket && draw.first.ticket !== "N/A") {
        const d = draw.first.ticket.replace(/\D/g, "");
        if (d.endsWith(query) || d === query) {
          totalMatches++;
          tierBreakdown["1st Prize"] = (tierBreakdown["1st Prize"] || 0) + 1;
          matchedDraws.push({
            date: draw.draw_date,
            name: draw.draw_name || draw.lottery_code,
            tier: "1st Prize",
            fullTicket: draw.first.ticket,
          });
        }
      }

      // Other Prizes
      if (draw.prizes) {
        const tiers = [
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
        tiers.forEach((t) => {
          const nums = draw.prizes![t];
          if (Array.isArray(nums)) {
            nums.forEach((num) => {
              const d = String(num).replace(/\D/g, "");
              if (d.endsWith(query) || d === query) {
                totalMatches++;
                const tierName =
                  t === "consolation"
                    ? "Consolation"
                    : `${t.toUpperCase()} Prize`;
                tierBreakdown[tierName] = (tierBreakdown[tierName] || 0) + 1;
                matchedDraws.push({
                  date: draw.draw_date,
                  name: draw.draw_name || draw.lottery_code,
                  tier: tierName,
                  fullTicket: String(num),
                });
              }
            });
          }
        });
      }
    });

    const hitRatePct =
      filteredDraws.length > 0
        ? Math.min(100, Math.round((totalMatches / filteredDraws.length) * 100))
        : 0;

    return {
      query,
      totalMatches,
      tierBreakdown,
      hitRatePct,
      matchedDraws: matchedDraws.slice(0, 8),
    };
  }, [submittedQuery, filteredDraws]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {navigation?.canGoBack && navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.headerTitleCol}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BarChart3 size={17} color={COLORS.primary} />
            <Text
              style={[
                styles.headerTitle,
                isMl && { fontSize: 14.5, lineHeight: 20 },
              ]}
            >
              {isMl ? "ഫല സ്ഥിതിവിവരക്കണക്കുകൾ" : "Analytics & Trends"}
            </Text>
          </View>
          <Text
            style={[styles.headerSub, isMl && { fontSize: 10, lineHeight: 14 }]}
          >
            {isMl
              ? `${filteredDraws.length} നറുക്കെടുപ്പുകളുടെ വിശകലനം`
              : `Deep trends across ${filteredDraws.length} recent draws`}
          </Text>
        </View>
      </View>

      {/* Horizon Selector (30 Days / 90 Days / All) */}
      <View style={styles.horizonBar}>
        {[
          { key: "30", label: isMl ? "30 നറുക്കെടുപ്പ്" : "Last 30 Draws" },
          { key: "90", label: isMl ? "90 നറുക്കെടുപ്പ്" : "Last 90 Draws" },
          { key: "all", label: isMl ? "മുഴുവൻ ഫലം" : "All History" },
        ].map((tab) => {
          const active = horizon === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.horizonChip, active && styles.horizonChipActive]}
              onPress={() => {
                triggerLightHaptic();
                setHorizon(tab.key as any);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.horizonChipText,
                  active && styles.horizonChipTextActive,
                  isMl && { fontSize: 10, lineHeight: 13, fontWeight: "800" },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Tab Switcher (Numbers vs Districts) */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "numbers" && styles.tabBtnActive,
          ]}
          onPress={() => {
            triggerLightHaptic();
            setActiveTab("numbers");
          }}
          activeOpacity={0.8}
        >
          <Flame
            size={15}
            color={activeTab === "numbers" ? "#EA580C" : "#64748B"}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "numbers" && styles.tabBtnTextActive,
              isMl && { fontSize: 11, lineHeight: 15 },
            ]}
            numberOfLines={1}
          >
            {isMl ? "ഹോട്ട് / കോൾഡ് നമ്പറുകൾ" : "Number Trends"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "districts" && styles.tabBtnActive,
          ]}
          onPress={() => {
            triggerLightHaptic();
            setActiveTab("districts");
          }}
          activeOpacity={0.8}
        >
          <MapPin
            size={15}
            color={activeTab === "districts" ? "#DC2626" : "#64748B"}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "districts" && styles.tabBtnTextActive,
              isMl && { fontSize: 11, lineHeight: 15 },
            ]}
            numberOfLines={1}
          >
            {isMl ? "ഭാഗ്യ സ്ഥലങ്ങൾ" : "Lucky Locations"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading ? (
          <View style={{ gap: 14 }}>
            <ShimmerSkeleton width="100%" height={160} borderRadius={20} />
            <ShimmerSkeleton width="100%" height={220} borderRadius={20} />
          </View>
        ) : activeTab === "numbers" ? (
          <>
            {/* Instant Number Explorer Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBoxBlue}>
                  <Search size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isMl && { fontSize: 13.5, lineHeight: 18 },
                    ]}
                  >
                    {isMl ? "🔍 ലക്കി പിക്ക്" : "🔍 4 Digit history"}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      isMl && { fontSize: 10, lineHeight: 14 },
                    ]}
                  >
                    {isMl
                      ? "2, 3, 4 അക്കങ്ങളുടെ മുൻകാല വിജയ ചരിത്രം പരിശോധിക്കുക"
                      : "Check frequency, hit rate & prize tiers for any digits"}
                  </Text>
                </View>
              </View>

              {/* 4 Digit Scrollable Roller Wheels */}
              <View style={styles.wheelsRow}>
                {digits.map((digitVal, colIdx) => (
                  <SingleDigitWheel
                    key={colIdx}
                    value={digitVal}
                    onChange={(newVal) => handleDigitChange(colIdx, newVal)}
                  />
                ))}
              </View>

              {/* Check History Action Button with Brand Color */}
              <TouchableOpacity
                style={styles.checkHistoryBtn}
                activeOpacity={0.85}
                onPress={handleCheckHistory}
              >
                <View style={styles.checkHistoryBtnContent}>
                  <Search size={18} color="#FFFFFF" />
                  <Text style={styles.checkHistoryBtnText}>
                    {isMl ? "ചരിത്രം പരിശോധിക്കുക" : "Check History"}
                  </Text>
                </View>
                <View style={styles.checkHistoryArrowCircle}>
                  <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              {/* Quick Picks Header */}
              <View style={styles.quickPicksHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Zap size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.quickPicksTitle}>
                    {isMl ? "ദ്രുത തിരഞ്ഞെടുപ്പ്" : "Quick Picks"}
                  </Text>
                </View>
                <Text style={styles.quickPicksSub}>
                  {isMl ? "ഉടൻ പരിശോധിക്കാൻ നമ്പർ തൊടുക" : "Tap a number to check instantly"}
                </Text>
              </View>

              {/* Quick Picks Scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPicksScrollContent}
              >
                {QUICK_PICKS.map((item) => {
                  const isSelected = submittedQuery === item.num;
                  return (
                    <TouchableOpacity
                      key={item.num}
                      style={[
                        styles.quickPickPill,
                        { backgroundColor: item.bg, borderColor: item.border },
                        isSelected && styles.quickPickPillActive,
                      ]}
                      onPress={() => handleSelectQuickPick(item.num)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.quickPickPillText,
                          { color: item.text },
                          isSelected && { fontWeight: "900" },
                        ]}
                      >
                        {item.num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {searchResult ? (
                <View style={{ marginTop: 12, gap: 10 }}>
                  {/* Hero Stat Box */}
                  <View style={styles.searchHeroBox}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <View>
                        <Text style={styles.searchHeroDigitsTag}>
                          {searchResult.query.length}-DIGIT COMBINATION
                        </Text>
                        <Text style={styles.searchHeroDigits}>
                          {searchResult.query}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <View
                          style={[
                            styles.searchHitsBadge,
                            searchResult.totalMatches === 0 && {
                              backgroundColor: "#94A3B8",
                            },
                          ]}
                        >
                          <Text style={styles.searchHitsBadgeText}>
                            {searchResult.totalMatches}{" "}
                            {isMl ? "തവണ വിജയിച്ചു" : "Times Drawn"}
                          </Text>
                        </View>
                        {searchResult.totalMatches > 0 && (
                          <Text style={styles.searchHitRateText}>
                            {searchResult.hitRatePct}%{" "}
                            {isMl ? "ഡ്രോകളിൽ" : "Draw Hit Rate"}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Tier Breakdown Chips */}
                    {searchResult.totalMatches > 0 &&
                      Object.keys(searchResult.tierBreakdown).length > 0 && (
                        <View style={styles.tierBreakdownRow}>
                          {Object.entries(searchResult.tierBreakdown).map(
                            ([tier, count]) => (
                              <View key={tier} style={styles.tierPill}>
                                <Text style={styles.tierPillText}>
                                  {tier}: {count}x
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      )}
                  </View>

                  {/* Matching Draws List */}
                  {searchResult.matchedDraws.length > 0 ? (
                    <View style={{ gap: 6 }}>
                      <Text
                        style={[
                          styles.recentDrawsLabel,
                          isMl && { fontSize: 10 },
                        ]}
                      >
                        {isMl ? "സമീപകാല വിജയങ്ങൾ:" : "RECENT MATCHING DRAWS:"}
                      </Text>
                      {searchResult.matchedDraws.map((m, idx) => (
                        <View key={idx} style={styles.drawMatchRow}>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={styles.drawMatchName}
                              numberOfLines={1}
                            >
                              {m.name}
                            </Text>
                            <Text style={styles.drawMatchDate}>
                              {m.date} • {m.tier}
                            </Text>
                          </View>
                          <View style={styles.drawMatchTicketBadge}>
                            <Text style={styles.drawMatchTicketText}>
                              {m.fullTicket}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noMatchBox}>
                      <Text
                        style={[styles.noMatchText, isMl && { fontSize: 11 }]}
                      >
                        {isMl
                          ? `കഴിഞ്ഞ ${filteredDraws.length} നറുക്കെടുപ്പുകളിൽ ഈ നമ്പർ വന്നിട്ടില്ല.`
                          : `No winning matches found for '${searchResult.query}' in selected draws.`}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.searchIdleBox}>
                  <Sparkles size={18} color="#2563EB" />
                  <Text
                    style={[styles.searchIdleText, isMl && { fontSize: 10.5 }]}
                  >
                    {isMl
                      ? "ഒരു 2, 3 അല്ലെങ്കിൽ 4 അക്ക നമ്പർ നൽകുകയോ മുകളിലെ സൂചനകളിൽ തൊടുകയോ ചെയ്യുക."
                      : "Enter any 2, 3, or 4 digits or tap a quick suggestion above to see full prize history."}
                  </Text>
                </View>
              )}
            </View>

            {/* Hot 4-Digit Endings */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBoxOrange}>
                  <Flame size={18} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isMl && { fontSize: 13.5, lineHeight: 18 },
                    ]}
                  >
                    {isMl
                      ? "🔥 ആവർത്തിച്ച 4-അക്കങ്ങൾ"
                      : "🔥 Repeated 4-Digit Numbers"}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      isMl && { fontSize: 10, lineHeight: 14 },
                    ]}
                  >
                    {isMl
                      ? "കഴിഞ്ഞ നറുക്കെടുപ്പുകളിൽ കൂടുതൽ തവണ വന്ന അവസാന 4 അക്കങ്ങൾ"
                      : "Most recurring last 4 digits in prize tiers"}
                  </Text>
                </View>
              </View>

              <View style={styles.grid2Col}>
                {numberStats.hot4.map(([num, count], i) => {
                  const maxHot4 = numberStats.hot4[0]?.[1] || 1;
                  const barPct = Math.round((count / maxHot4) * 100);
                  return (
                    <View key={num} style={styles.numChip}>
                      <View style={styles.numChipHeader}>
                        <Text style={styles.rankBadge}>#{i + 1}</Text>
                        <Text style={styles.numChipNumber}>{num}</Text>
                        <Text style={styles.numChipCount}>{count}x</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFillOrange,
                            { width: `${barPct}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Hot 2-Digit Endings */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBoxEmerald}>
                  <TrendingUp size={18} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isMl && { fontSize: 13.5, lineHeight: 18 },
                    ]}
                  >
                    {isMl
                      ? "⚡ ആവർത്തിച്ച 2-അക്കങ്ങൾ"
                      : "⚡ Repeated 2-Digit Numbers"}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      isMl && { fontSize: 10, lineHeight: 14 },
                    ]}
                  >
                    {isMl
                      ? "കൂടുതൽ സമ്മാനങ്ങളിൽ ആവർത്തിച്ച 2 അക്കങ്ങൾ"
                      : "Top recurring 2-digit ending combinations"}
                  </Text>
                </View>
              </View>

              <View style={styles.chipsWrap}>
                {numberStats.hot2.map(([num, count], idx) => (
                  <View key={num} style={styles.badgeChipGreen}>
                    <Text style={styles.badgeChipGreenNum}>{num}</Text>
                    <Text
                      style={[
                        styles.badgeChipGreenCount,
                        isMl && { fontSize: 9.5 },
                      ]}
                    >
                      {count} {isMl ? "തവണ" : "draws"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Cold / Overdue Numbers */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBoxBlue}>
                  <Snowflake size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isMl && { fontSize: 13.5, lineHeight: 18 },
                    ]}
                  >
                    {isMl
                      ? "❄️ ആവർത്തിക്കാത്ത നമ്പറുകൾ"
                      : "❄️ Non-Repeated Numbers"}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      isMl && { fontSize: 10, lineHeight: 14 },
                    ]}
                  >
                    {isMl
                      ? "ഈ കാലയളവിൽ ഏറ്റവും കുറവ് തവണ മാത്രം വന്ന 2 അക്കങ്ങൾ"
                      : "Least frequently drawn pairs during this period"}
                  </Text>
                </View>
              </View>

              <View style={styles.chipsWrap}>
                {numberStats.cold2.map(([num, count]) => (
                  <View key={num} style={styles.badgeChipBlue}>
                    <Text style={styles.badgeChipBlueNum}>{num}</Text>
                    <Text
                      style={[
                        styles.badgeChipBlueCount,
                        isMl && { fontSize: 9.5 },
                      ]}
                    >
                      {count} {isMl ? "തവണ" : "only"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Single Last-Digit (0-9) Frequency Distribution */}
            <View style={styles.sectionCard}>
              <Text
                style={[
                  styles.cardTitle,
                  isMl && { fontSize: 13.5, lineHeight: 18 },
                ]}
              >
                {isMl
                  ? "📊 അവസാന അക്ക വിതരണം (0 - 9)"
                  : "📊 Last Digit Distribution (0 - 9)"}
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  isMl && { fontSize: 10, lineHeight: 14 },
                ]}
              >
                {isMl
                  ? "ലോട്ടറി നമ്പറുകളുടെ അവസാന അക്കത്തിന്റെ സാന്നിധ്യം"
                  : "How often each individual digit (0–9) ends a winning prize"}
              </Text>

              <View style={styles.digitDistributionRow}>
                {Object.entries(numberStats.singleDigitMap).map(
                  ([digit, count]) => {
                    const maxD = Math.max(
                      ...Object.values(numberStats.singleDigitMap),
                      1,
                    );
                    const heightPct = Math.max(
                      15,
                      Math.round((count / maxD) * 100),
                    );
                    return (
                      <View key={digit} style={styles.digitCol}>
                        <Text style={styles.digitCountLabel}>{count}</Text>
                        <View style={styles.digitColBarTrack}>
                          <View
                            style={[
                              styles.digitColBarFill,
                              { height: `${heightPct}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.digitNumberLabel}>{digit}</Text>
                      </View>
                    );
                  },
                )}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* District Leaderboard Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBoxRed}>
                  <Trophy size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isMl && { fontSize: 13.5, lineHeight: 18 },
                    ]}
                  >
                    {isMl ? "🏆 ഭാഗ്യ സ്ഥലങ്ങൾ" : "🏆 Lucky Locations"}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      isMl && { fontSize: 10, lineHeight: 14 },
                    ]}
                  >
                    {isMl
                      ? `ആകെ ${districtStats.totalJackpotDraws} നറുക്കെടുപ്പുകളിലെ ജില്ല തിരിച്ചുള്ള വിജയികൾ`
                      : `Distribution of 1st prize tickets across Kerala's 14 districts`}
                  </Text>
                </View>
              </View>

              <View style={styles.districtList}>
                {districtStats.ranked.map((dist, idx) => {
                  const pct = Math.round(
                    (dist.count / districtStats.maxCount) * 100,
                  );
                  const isTop3 = idx < 3 && dist.count > 0;
                  return (
                    <View
                      key={dist.name}
                      style={[
                        styles.districtRow,
                        isTop3 && styles.districtRowTop3,
                      ]}
                    >
                      <View style={styles.distRankBox}>
                        <Text
                          style={[
                            styles.distRankText,
                            isTop3 && styles.distRankTextTop3,
                          ]}
                        >
                          #{idx + 1}
                        </Text>
                      </View>

                      <View style={styles.distInfoCol}>
                        <View style={styles.distNameRow}>
                          <Text
                            style={[styles.distName, isMl && { fontSize: 12 }]}
                          >
                            {dist.name}
                          </Text>
                          <Text
                            style={[
                              styles.distJackpotCount,
                              isMl && { fontSize: 10.5 },
                            ]}
                          >
                            {dist.count}{" "}
                            {isMl
                              ? "വിജയികൾ"
                              : dist.count === 1
                                ? "win"
                                : "wins"}
                          </Text>
                        </View>

                        <View style={styles.distBarTrack}>
                          <View
                            style={[
                              styles.distBarFill,
                              isTop3 && styles.distBarFillTop3,
                              { width: `${pct}%` },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Disclaimer Note */}
        <View style={styles.infoBanner}>
          <Info size={16} color="#64748B" />
          <Text
            style={[styles.infoText, isMl && { fontSize: 10, lineHeight: 15 }]}
          >
            {isMl
              ? "സ്ഥിതിവിവരക്കണക്കുകൾ മുൻകാല ഡാറ്റ അടിസ്ഥാനമാക്കിയുള്ളതാണ്. ലോട്ടറി നറുക്കെടുപ്പ് പൂർണ്ണമായും ഗവൺമെന്റ് മെഷീൻ റാൻഡം പ്രക്രിയയാണ്."
              : "Analytics are computed purely from official past draw records. Kerala Lottery draws are 100% random and independent."}
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  horizonBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 8,
  },
  horizonChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  horizonChipActive: {
    backgroundColor: COLORS.primary,
  },
  horizonChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  horizonChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  tabSwitcher: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: "#E2E8F0",
    padding: 3,
    borderRadius: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#0F172A",
    fontWeight: "800",
  },
  scrollContent: {
    padding: 14,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  iconBoxOrange: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxEmerald: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  grid2Col: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  numChip: {
    width: "48.5%",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  numChipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rankBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EA580C",
  },
  numChipNumber: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
  },
  numChipCount: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C",
  },
  barTrack: {
    height: 4,
    backgroundColor: "#FED7AA",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFillOrange: {
    height: "100%",
    backgroundColor: "#EA580C",
    borderRadius: 2,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badgeChipGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  badgeChipGreenNum: {
    fontSize: 15,
    fontWeight: "900",
    color: "#065F46",
    letterSpacing: 0.5,
  },
  badgeChipGreenCount: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#047857",
  },
  badgeChipBlue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  badgeChipBlueNum: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E40AF",
  },
  badgeChipBlueCount: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#2563EB",
  },
  digitDistributionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  digitCol: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  digitCountLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 4,
  },
  digitColBarTrack: {
    width: 14,
    height: 75,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  digitColBarFill: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  digitNumberLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 6,
  },
  districtList: {
    gap: 8,
  },
  districtRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  districtRowTop3: {
    backgroundColor: "#FEF2F2",
  },
  distRankBox: {
    width: 28,
    alignItems: "center",
  },
  distRankText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
  },
  distRankTextTop3: {
    color: "#DC2626",
    fontWeight: "900",
  },
  distInfoCol: {
    flex: 1,
  },
  distNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  distName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  distJackpotCount: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#DC2626",
  },
  distBarTrack: {
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 2.5,
    overflow: "hidden",
  },
  distBarFill: {
    height: "100%",
    backgroundColor: "#94A3B8",
    borderRadius: 2.5,
  },
  distBarFillTop3: {
    backgroundColor: "#DC2626",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 16,
  },
  wheelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 14,
    gap: 8,
  },
  wheelCol: {
    flex: 1,
    height: 138,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(59, 130, 246, 0.25)",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  wheelActiveLens: {
    position: "absolute",
    top: 46,
    left: 4,
    right: 4,
    height: 46,
    backgroundColor: "rgba(239, 246, 255, 0.9)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    zIndex: 0,
  },
  wheelSpacer: {
    height: 46,
  },
  wheelItem: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemText: {
    textAlign: "center",
  },
  wheelItemTextActive: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },
  wheelItemTextInactive: {
    fontSize: 20,
    fontWeight: "700",
    color: "#94A3B8",
    opacity: 0.35,
  },
  checkHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
    marginBottom: 16,
  },
  checkHistoryBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkHistoryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  checkHistoryArrowCircle: {
    position: "absolute",
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickPicksHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quickPicksTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#0F172A",
  },
  quickPicksSub: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#64748B",
  },
  quickPicksScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 3,
  },
  quickPickPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quickPickPillActive: {
    borderWidth: 2,
    transform: [{ scale: 1.04 }],
  },
  quickPickPillText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  searchHeroBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 12,
  },
  searchHeroDigitsTag: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  searchHeroDigits: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  searchHitsBadge: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  searchHitsBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  searchHitRateText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
    marginTop: 3,
  },
  tierBreakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(37, 99, 235, 0.15)",
  },
  tierPill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#93C5FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierPillText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#1E40AF",
  },
  recentDrawsLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 4,
  },
  drawMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
  },
  drawMatchName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  drawMatchDate: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  drawMatchTicketBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  drawMatchTicketText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0369A1",
    letterSpacing: 0.5,
  },
  noMatchBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  noMatchText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  searchIdleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#86EFAC",
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  searchIdleText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
    lineHeight: 15,
  },
});
