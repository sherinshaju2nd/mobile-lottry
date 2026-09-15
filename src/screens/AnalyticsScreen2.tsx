import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Snowflake,
  MapPin,
  BarChart3,
  Search,
  Zap,
  Info,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { fetchAllDraws, DrawResult } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";
import { isIndic, getDistrictTranslatedName } from "../constants/translations";
import { getLotteryTranslatedName } from "../constants/lotteries";
import { KERALA_DISTRICTS } from "../utils/notificationSettingsStorage";
import { triggerLightHaptic } from "../utils/haptics";
import ShimmerSkeleton from "../components/ShimmerSkeleton";

const BRAND_BLUE = COLORS.primary;

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

  useEffect(() => {
    if (lastIndexRef.current !== value) {
      lastIndexRef.current = value;
      scrollRef.current?.scrollTo({
        y: value * ITEM_HEIGHT,
        animated: true,
      });
    }
  }, [value]);

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

function chunkPairs<T>(arr: T[]): [T, T | undefined][] {
  const chunks: [T, T | undefined][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    chunks.push([arr[i], arr[i + 1]]);
  }
  return chunks;
}

// Normal / Classic UI Statistics Screen
export default function AnalyticsScreen2({ navigation }: any) {
  const { t, language } = useLanguage();

  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [horizon, setHorizon] = useState<"30" | "90" | "all">("90");
  const [digits, setDigits] = useState<[number, number, number, number]>([0, 0, 4, 1]);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  const handleDigitChange = (colIndex: number, newVal: number) => {
    setDigits((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[colIndex] = newVal;
      return next;
    });
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
    let isMounted = true;
    const fetchData = async () => {
      try {
        const data = await fetchAllDraws();
        if (isMounted) setDraws(data || []);
      } catch {
        if (isMounted) setDraws([]);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter draws by selected time horizon (defaults to 90 Draws)
  const filteredDraws = useMemo(() => {
    if (horizon === "all") return draws;
    const limit = horizon === "30" ? 30 : 90;
    return draws.slice(0, limit);
  }, [draws, horizon]);

  // Compute 4-digit draw occurrence statistics (count of distinct draws containing each number)
  const numberStats = useMemo(() => {
    const ending4DrawMap: Record<string, number> = {};
    let totalPrizesCounted = 0;

    filteredDraws.forEach((draw) => {
      const drawEnding4Set = new Set<string>();

      // 1st Prize
      if (draw.first?.ticket && draw.first.ticket !== "N/A") {
        const digits = draw.first.ticket.replace(/\D/g, "");
        if (digits.length >= 4) {
          const e4 = digits.slice(-4);
          drawEnding4Set.add(e4);
        }
        totalPrizesCounted++;
      }

      // Other Prizes (2nd through 9th)
      if (draw.prizes) {
        const tiers = [
          "2nd",
          "3rd",
          "4th",
          "5th",
          "6th",
          "7th",
          "8th",
          "9th",
        ] as const;
        tiers.forEach((tier) => {
          const nums = draw.prizes![tier];
          if (Array.isArray(nums)) {
            nums.forEach((num) => {
              const digits = String(num).replace(/\D/g, "");
              if (digits.length >= 4) {
                const e4 = digits.slice(-4);
                drawEnding4Set.add(e4);
              }
              totalPrizesCounted++;
            });
          }
        });
      }

      // Count each unique 4-digit number once per draw
      drawEnding4Set.forEach((e4) => {
        ending4DrawMap[e4] = (ending4DrawMap[e4] || 0) + 1;
      });
    });

    // Top 8 Hot 4-digit numbers (Repeated 4-Digit Numbers by draw count)
    const hot4 = Object.entries(ending4DrawMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Least frequent 8 Hot 4-digit numbers (Non-Repeated 4-Digit Numbers by draw count)
    const cold4 = Object.entries(ending4DrawMap)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 8);

    const maxHot4Count = hot4[0]?.[1] || 1;
    const maxCold4Count = cold4[cold4.length - 1]?.[1] || 1;

    return { hot4, cold4, maxHot4Count, maxCold4Count, totalPrizesCounted };
  }, [filteredDraws]);

  // Compute District Leaderboard (Top 5 Lucky Locations)
  const districtStats = useMemo(() => {
    const distCounts: Record<
      string,
      { count: number; lotteries: string[] }
    > = {};
    KERALA_DISTRICTS.forEach((d) => {
      distCounts[d] = { count: 0, lotteries: [] };
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
              (draw.lottery_code ? getLotteryTranslatedName(draw.lottery_code, language) : "") ||
                draw.draw_name ||
                draw.lottery_code,
            );
            break;
          }
        }
      }
    });

    const ranked = Object.entries(distCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    const top5 = ranked.slice(0, 5);
    const maxCount = Math.max(...top5.map((r) => r.count), 1);

    return { top5, ranked, maxCount, totalJackpotDraws };
  }, [filteredDraws, language]);

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
            name:
              (draw.lottery_code ? getLotteryTranslatedName(draw.lottery_code, language) : "") ||
              draw.draw_name ||
              draw.lottery_code,
            tier: t("tier_1st") || "1st Prize",
            fullTicket: draw.first.ticket,
          });
        }
      }

      // Other Prizes (2nd through 9th)
      if (draw.prizes) {
        const tiers = [
          "2nd",
          "3rd",
          "4th",
          "5th",
          "6th",
          "7th",
          "8th",
          "9th",
        ] as const;
        tiers.forEach((tierKey) => {
          const nums = draw.prizes![tierKey];
          if (Array.isArray(nums)) {
            nums.forEach((num) => {
              const d = String(num).replace(/\D/g, "");
              if (d.endsWith(query) || d === query) {
                totalMatches++;
                const tierName = t(`tier_${tierKey}` as any) || `${tierKey} Prize`;
                tierBreakdown[tierName] = (tierBreakdown[tierName] || 0) + 1;
                matchedDraws.push({
                  date: draw.draw_date,
                  name:
                    (draw.lottery_code ? getLotteryTranslatedName(draw.lottery_code, language) : "") ||
                    draw.draw_name ||
                    draw.lottery_code,
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
  }, [submittedQuery, filteredDraws, language, t]);

  const getDrawCountLabel = (count: number) => {
    if (language === "en") {
      return `${count} ${count === 1 ? "Draw" : "Draws"}`;
    }
    return `${count} ${t("draws_count_suffix")}`;
  };

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
            <ChevronLeft size={24} color={BRAND_BLUE} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.headerTitleCol}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BarChart3 size={18} color={BRAND_BLUE} />
            <Text
              style={[
                styles.headerTitle,
                isIndic(language) && { fontSize: 15, lineHeight: 21 },
              ]}
            >
              {t("tab_statistics")}
            </Text>
          </View>
          <Text
            style={[
              styles.headerSub,
              isIndic(language) && { fontSize: 10.5, lineHeight: 14 },
            ]}
          >
            {`${t("analytics_sub_prefix")} ${filteredDraws.length} ${t("analytics_sub_suffix")}`.trim()}
          </Text>
        </View>
      </View>

      {/* Horizon Selector (30 Draws / 90 Draws / All) */}
      <View style={styles.horizonBar}>
        {[
          { key: "30", label: t("last_30_draws") },
          { key: "90", label: t("last_90_draws") },
          { key: "all", label: t("all_history") },
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
                  isIndic(language) && { fontSize: 10, lineHeight: 13, fontWeight: "800" },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_BLUE]}
          />
        }
      >
        {loading ? (
          <View style={{ gap: 14 }}>
            <ShimmerSkeleton width="100%" height={220} borderRadius={18} />
            <ShimmerSkeleton width="100%" height={220} borderRadius={18} />
            <ShimmerSkeleton width="100%" height={180} borderRadius={18} />
          </View>
        ) : (
          <>
            {/* 4 Digit History Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.brandIconCircle}>
                  <Search size={18} color={BRAND_BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.mainCardTitle,
                      isIndic(language) && { fontSize: 14, lineHeight: 19 },
                    ]}
                  >
                    {t("analytics_4digit_history")}
                  </Text>
                  <Text
                    style={[
                      styles.mainCardSub,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 14 },
                    ]}
                  >
                    {t("analytics_4digit_desc")}
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
                    {t("check_history_btn")}
                  </Text>
                </View>
                <View style={styles.checkHistoryArrowCircle}>
                  <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              {/* Search Result Display (When a query is checked or selected) */}
              {searchResult && (
                <View style={{ marginTop: 14, gap: 10 }}>
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
                            {searchResult.totalMatches} {t("times_drawn")}
                          </Text>
                        </View>
                        {searchResult.totalMatches > 0 && (
                          <Text style={styles.searchHitRateText}>
                            {searchResult.hitRatePct}% {t("draw_hit_rate")}
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
                          isIndic(language) && { fontSize: 10 },
                        ]}
                      >
                        {t("recent_matching_draws")}
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
                        style={[styles.noMatchText, isIndic(language) && { fontSize: 11 }]}
                      >
                        {t("no_matches_found")}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 1. Repeated 4-Digit Numbers Card (2-Column Row Layout) */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.brandIconCircle}>
                  <Flame size={18} color={BRAND_BLUE} fill={BRAND_BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.mainCardTitle,
                      isIndic(language) && { fontSize: 14, lineHeight: 19 },
                    ]}
                  >
                    {t("repeated_4digit_title")}
                  </Text>
                  <Text
                    style={[
                      styles.mainCardSub,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 14 },
                    ]}
                  >
                    {t("repeated_4digit_sub")}
                  </Text>
                </View>
              </View>

              {/* 2-Column Pairs */}
              <View style={styles.gridContainer}>
                {chunkPairs(numberStats.hot4).map(([item1, item2], rowIdx) => {
                  const idx1 = rowIdx * 2;
                  const idx2 = rowIdx * 2 + 1;
                  const barPct1 = Math.max(
                    12,
                    Math.round((item1[1] / numberStats.maxHot4Count) * 100),
                  );
                  const barPct2 = item2
                    ? Math.max(
                        12,
                        Math.round((item2[1] / numberStats.maxHot4Count) * 100),
                      )
                    : 0;

                  return (
                    <View key={`row-hot-${rowIdx}`} style={styles.twoColumnRow}>
                      {/* Left Column Item */}
                      <View style={styles.statGridItem}>
                        <View style={styles.statItemTopRow}>
                          <Text style={styles.rankBrandText}>#{idx1 + 1}</Text>
                          <Text style={styles.statNumberText}>{item1[0]}</Text>
                          <Text style={styles.countBrandText}>{getDrawCountLabel(item1[1])}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFillBrand,
                              { width: `${barPct1}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Right Column Item */}
                      {item2 ? (
                        <View style={styles.statGridItem}>
                          <View style={styles.statItemTopRow}>
                            <Text style={styles.rankBrandText}>#{idx2 + 1}</Text>
                            <Text style={styles.statNumberText}>{item2[0]}</Text>
                            <Text style={styles.countBrandText}>{getDrawCountLabel(item2[1])}</Text>
                          </View>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFillBrand,
                                { width: `${barPct2}%` },
                              ]}
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 2. Non-Repeated Numbers (4-Digit) Card (2-Column Row Layout) */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.brandIconCircle}>
                  <Snowflake size={18} color={BRAND_BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.mainCardTitle,
                      isIndic(language) && { fontSize: 14, lineHeight: 19 },
                    ]}
                  >
                    {t("cold_4digit_title")}
                  </Text>
                  <Text
                    style={[
                      styles.mainCardSub,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 14 },
                    ]}
                  >
                    {t("cold_4digit_sub")}
                  </Text>
                </View>
              </View>

              {/* 2-Column Pairs */}
              <View style={styles.gridContainer}>
                {chunkPairs(numberStats.cold4).map(([item1, item2], rowIdx) => {
                  const idx1 = rowIdx * 2;
                  const idx2 = rowIdx * 2 + 1;
                  const barPct1 = Math.min(100, Math.max(16, item1[1] * 25));
                  const barPct2 = item2
                    ? Math.min(100, Math.max(16, item2[1] * 25))
                    : 0;

                  return (
                    <View key={`row-cold-${rowIdx}`} style={styles.twoColumnRow}>
                      {/* Left Column Item */}
                      <View style={styles.statGridItem}>
                        <View style={styles.statItemTopRow}>
                          <Text style={styles.rankBrandText}>#{idx1 + 1}</Text>
                          <Text style={styles.statNumberText}>{item1[0]}</Text>
                          <Text style={styles.countBrandText}>{getDrawCountLabel(item1[1])}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFillBrand,
                              { width: `${barPct1}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Right Column Item */}
                      {item2 ? (
                        <View style={styles.statGridItem}>
                          <View style={styles.statItemTopRow}>
                            <Text style={styles.rankBrandText}>#{idx2 + 1}</Text>
                            <Text style={styles.statNumberText}>{item2[0]}</Text>
                            <Text style={styles.countBrandText}>{getDrawCountLabel(item2[1])}</Text>
                          </View>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFillBrand,
                                { width: `${barPct2}%` },
                              ]}
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 3. Top 5 Locations (Lucky Locations) Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.brandIconCircle}>
                  <MapPin size={18} color={BRAND_BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.mainCardTitle,
                      isIndic(language) && { fontSize: 14, lineHeight: 19 },
                    ]}
                  >
                    {t("top_5_locations_title")}
                  </Text>
                  <Text
                    style={[
                      styles.mainCardSub,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 14 },
                    ]}
                  >
                    {t("top_5_locations_sub")}
                  </Text>
                </View>
              </View>

              <View style={styles.locationsList}>
                {districtStats.top5.map((dist, idx) => {
                  const pct = Math.round(
                    (dist.count / districtStats.maxCount) * 100,
                  );
                  const isTop1 = idx === 0 && dist.count > 0;
                  return (
                    <View
                      key={dist.name}
                      style={[
                        styles.locationRow,
                        isTop1 && styles.locationRowTop1,
                      ]}
                    >
                      <View
                        style={[
                          styles.locationRankBadge,
                          isTop1 && styles.locationRankBadgeTop1,
                        ]}
                      >
                        <Text
                          style={[
                            styles.locationRankText,
                            isTop1 && styles.locationRankTextTop1,
                          ]}
                        >
                          #{idx + 1}
                        </Text>
                      </View>

                      <View style={styles.locationInfoCol}>
                        <View style={styles.locationNameRow}>
                          <Text
                            style={[
                              styles.locationNameText,
                              isIndic(language) && { fontSize: 12.5 },
                            ]}
                          >
                            {getDistrictTranslatedName(dist.name, language)}
                          </Text>
                          <View style={styles.winPill}>
                            <Text style={styles.winPillText}>
                              {dist.count}{" "}
                              {dist.count === 1
                                ? t("win_singular")
                                : t("wins_count")}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.locationBarTrack}>
                          <View
                            style={[
                              styles.locationBarFill,
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

            {/* Disclaimer */}
            <View style={styles.infoBanner}>
              <Info size={16} color="#64748B" />
              <Text
                style={[
                  styles.infoText,
                  isIndic(language) && { fontSize: 10, lineHeight: 15 },
                ]}
              >
                {t("analytics_disclaimer")}
              </Text>
            </View>

            <View style={{ height: 28 }} />
          </>
        )}
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
    backgroundColor: BRAND_BLUE,
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
  scrollContent: {
    padding: 14,
    gap: 14,
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  brandIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EBF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  mainCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  mainCardSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  gridContainer: {
    gap: 8,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 8,
  },
  statGridItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  statItemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  rankBrandText: {
    fontSize: 11,
    fontWeight: "800",
    color: BRAND_BLUE,
  },
  statNumberText: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  countBrandText: {
    fontSize: 11,
    fontWeight: "800",
    color: BRAND_BLUE,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  barFillBrand: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: BRAND_BLUE,
  },
  locationsList: {
    gap: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    gap: 10,
  },
  locationRowTop1: {
    backgroundColor: "#F0F7FF",
    borderColor: "#BFDBFE",
  },
  locationRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  locationRankBadgeTop1: {
    backgroundColor: BRAND_BLUE,
  },
  locationRankText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  locationRankTextTop1: {
    color: "#FFFFFF",
  },
  locationInfoCol: {
    flex: 1,
  },
  locationNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  locationNameText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  winPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  winPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: BRAND_BLUE,
  },
  locationBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  locationBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: BRAND_BLUE,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  infoText: {
    flex: 1,
    fontSize: 10.5,
    color: "#64748B",
    lineHeight: 15,
  },

  // 4-Digit Wheel Explorer Styles
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
    borderColor: "rgba(11, 60, 93, 0.22)",
    overflow: "hidden",
    position: "relative",
    shadowColor: BRAND_BLUE,
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
    backgroundColor: "rgba(235, 245, 255, 0.9)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(11, 60, 93, 0.2)",
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
    backgroundColor: BRAND_BLUE,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
    marginBottom: 0,
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
    color: BRAND_BLUE,
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
    backgroundColor: BRAND_BLUE,
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
    color: BRAND_BLUE,
    marginTop: 3,
  },
  tierBreakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(11, 60, 93, 0.15)",
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
    color: BRAND_BLUE,
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
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
});
