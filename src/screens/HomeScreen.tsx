import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import {
  WEEKLY_LOTTERIES,
  getLotteryMalayalamName,
} from "../constants/lotteries";
import {
  fetchAllDraws,
  DrawResult,
  searchTicketNumber,
  SearchMatch,
  supabase,
  fetchLotteries,
} from "../api/lotteryApi";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import BarcodeResultModal from "../components/BarcodeResultModal";

export default function HomeScreen({ navigation }: any) {
  const [allDraws, setAllDraws] = useState<DrawResult[]>([]);
  const [lotteriesList, setLotteriesList] = useState(WEEKLY_LOTTERIES);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const getIsBefore245PM = () => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });
      const [hStr, mStr] = timeStr.split(":");
      const totalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      return totalMinutes < 14 * 60 + 45; // Before 2:45 PM IST
    } catch {
      return false;
    }
  };

  const [isBefore245PM, setIsBefore245PM] =
    useState<boolean>(getIsBefore245PM());
  const [isAfter3PM, setIsAfter3PM] = useState<boolean>(false);
  // Hero Section Tab: 0 = Today's Draw, 1 = Yesterday's Result
  // Before 2:45 PM IST, default to Yesterday's Result (1), after 2:45 PM default to Today's Draw (0)
  const [heroTab, setHeroTab] = useState<number>(getIsBefore245PM() ? 1 : 0);

  // Quick Ticket Checker State
  const [ticketInput, setTicketInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[] | null>(
    null,
  );

  // Barcode Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isBarcodeResultOpen, setIsBarcodeResultOpen] = useState(false);
  const [targetScanLotteryCode, setTargetScanLotteryCode] = useState<
    string | null
  >(null);

  const handleBarcodeScanned = (scannedValue: string) => {
    setIsScannerOpen(false);
    setScannedBarcode(scannedValue);
    setTicketInput(scannedValue);
    setIsBarcodeResultOpen(true);
  };

  const handleScanForLottery = (lotteryCode: string) => {
    setTargetScanLotteryCode(lotteryCode);
    setIsScannerOpen(true);
  };

  const loadData = async () => {
    try {
      const [draws, lotteries] = await Promise.all([
        fetchAllDraws(),
        fetchLotteries(),
      ]);
      setAllDraws(draws);
      if (lotteries && lotteries.length > 0) {
        setLotteriesList(lotteries);
      }
    } catch {
      setAllDraws([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const checkTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        });
        const [hStr, mStr] = timeStr.split(":");
        const hours = parseInt(hStr, 10);
        const minutes = parseInt(mStr, 10);
        const totalMinutes = hours * 60 + minutes;
        setIsBefore245PM(totalMinutes < 14 * 60 + 45);
        setIsAfter3PM(hours >= 15);
      } catch {
        setIsBefore245PM(false);
        setIsAfter3PM(false);
      }
    };
    checkTime();

    // Realtime listener for live cron job updates
    const channel = supabase
      .channel("realtime-mobile-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draw_results" },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleQuickCheck = async () => {
    if (!ticketInput.trim()) return;
    setIsChecking(true);
    try {
      const matches = await searchTicketNumber(ticketInput.trim());
      setSearchResults(matches);
    } catch {
      setSearchResults([]);
    } finally {
      setIsChecking(false);
    }
  };

  // Identify Today's Lottery metadata based on IST weekday
  const todayISTDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const istDayName = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  const todayLottery =
    lotteriesList.find(
      (l) => l.day.toLowerCase() === istDayName.toLowerCase(),
    ) || lotteriesList[1];

  const todayDraw = allDraws.find((d) => d.draw_date === todayISTDate) || null;
  const previousDraw =
    allDraws.find((d) => d.draw_date !== todayISTDate) ||
    (allDraws.length > 1 ? allDraws[1] : allDraws[0]) ||
    null;

  // Active draw based on selected hero tab
  const activeDraw = heroTab === 0 ? todayDraw : previousDraw;

  // Map latest draw per lottery code for weekly schedule cards
  const recentDrawsMap: Record<string, DrawResult> = {};
  allDraws.forEach((d) => {
    if (!recentDrawsMap[d.lottery_code]) {
      recentDrawsMap[d.lottery_code] = d;
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* App Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.brandRow,
              { justifyContent: "space-between", flex: 1 },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={styles.logoBadge}>
                <Image
                  source={require("../../assets/icon.png")}
                  style={{ width: 44, height: 44, borderRadius: 10 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.appName}>Kerala Lottery Results</Text>
                <Text style={styles.appSubtitle}>Live Updates & Checker</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hero Tab Switcher: Today's Draw vs Yesterday's Result */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.heroTabScrollView}
        >
          <View style={styles.heroTabBar}>
            {isBefore245PM ? (
              <>
                {previousDraw && (
                  <TouchableOpacity
                    style={[
                      styles.heroTab,
                      heroTab === 1 && styles.heroTabActiveGold,
                    ]}
                    onPress={() => setHeroTab(1)}
                  >
                    <Ionicons
                      name="trophy-outline"
                      size={14}
                      color={heroTab === 1 ? COLORS.white : COLORS.gold}
                    />
                    <Text
                      style={[
                        styles.heroTabText,
                        heroTab === 1 && styles.heroTabActiveText,
                      ]}
                    >
                      Yesterday&apos;s Result ({previousDraw.draw_date})
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.heroTab,
                    heroTab === 0 && styles.heroTabActiveGreen,
                  ]}
                  onPress={() => setHeroTab(0)}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={heroTab === 0 ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.heroTabText,
                      heroTab === 0 && styles.heroTabActiveText,
                    ]}
                  >
                    Today&apos;s Draw (
                    {todayDraw
                      ? `${todayDraw.draw_name} ${todayDraw.lottery_code}`
                      : `${todayLottery.name} ${todayLottery.code}`}
                    )
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.heroTab,
                    heroTab === 0 && styles.heroTabActiveGreen,
                  ]}
                  onPress={() => setHeroTab(0)}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={heroTab === 0 ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.heroTabText,
                      heroTab === 0 && styles.heroTabActiveText,
                    ]}
                  >
                    Today&apos;s Draw (
                    {todayDraw
                      ? `${todayDraw.draw_name} ${todayDraw.lottery_code}`
                      : `${todayLottery.name} ${todayLottery.code}`}
                    )
                  </Text>
                </TouchableOpacity>

                {previousDraw && (
                  <TouchableOpacity
                    style={[
                      styles.heroTab,
                      heroTab === 1 && styles.heroTabActiveGold,
                    ]}
                    onPress={() => setHeroTab(1)}
                  >
                    <Ionicons
                      name="trophy-outline"
                      size={14}
                      color={heroTab === 1 ? COLORS.white : COLORS.gold}
                    />
                    <Text
                      style={[
                        styles.heroTabText,
                        heroTab === 1 && styles.heroTabActiveText,
                      ]}
                    >
                      Yesterday&apos;s Result ({previousDraw.draw_date})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Quick Ticket Checker Card */}
        {(() => {
          const isScannerDisabled = heroTab === 0 && !todayDraw;
          return (
            <View style={styles.checkerCard}>
              <View
                style={[
                  styles.checkerTitleRow,
                  { justifyContent: "space-between" },
                ]}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons name="search" size={18} color={COLORS.primary} />
                  <Text style={styles.checkerTitle}>
                    {heroTab === 0
                      ? todayDraw
                        ? `Check ${todayDraw.draw_name} Ticket`
                        : `Check ${todayLottery.name} Ticket`
                      : `Check ${previousDraw?.draw_name || "Previous"} Ticket`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.scanChipBtn,
                    isScannerDisabled && styles.disabledScanChipBtn,
                  ]}
                  onPress={() => setIsScannerOpen(true)}
                  disabled={isScannerDisabled}
                >
                  <Ionicons
                    name="camera"
                    size={15}
                    color={
                      isScannerDisabled ? COLORS.textLight : COLORS.primary
                    }
                  />
                  <Text
                    style={[
                      styles.scanChipText,
                      isScannerDisabled && styles.disabledScanChipText,
                    ]}
                  >
                    {isScannerDisabled ? "Scanner Active Soon" : "Scan Barcode"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.checkerSubtitle}>
                {heroTab === 0
                  ? todayDraw
                    ? `Checking ticket against ${todayDraw.draw_name} (${todayDraw.draw_code}) from ${todayDraw.draw_date}.`
                    : `Ticket checker for ${todayLottery.name} (${todayLottery.code}) will be active at Soon  once results are published.`
                  : `Checking ticket against ${previousDraw?.draw_name} (${previousDraw?.draw_code}) from ${previousDraw?.draw_date}.`}
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={
                    heroTab === 0
                      ? todayDraw
                        ? `Enter ticket for ${todayDraw.draw_code}...`
                        : `Enter ticket for ${todayLottery.code}...`
                      : `Enter ticket for ${previousDraw?.draw_code || "draw"}...`
                  }
                  placeholderTextColor={COLORS.textLight}
                  value={ticketInput}
                  onChangeText={setTicketInput}
                  keyboardType="default"
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  style={[
                    styles.cameraIconBtn,
                    isScannerDisabled && styles.disabledCameraIconBtn,
                  ]}
                  onPress={() => setIsScannerOpen(true)}
                  disabled={isScannerDisabled}
                >
                  <Ionicons
                    name="camera"
                    size={22}
                    color={
                      isScannerDisabled ? COLORS.textLight : COLORS.primary
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    heroTab === 0 &&
                      !todayDraw && { backgroundColor: COLORS.textLight },
                    heroTab === 1 && { backgroundColor: COLORS.gold },
                  ]}
                  onPress={handleQuickCheck}
                  disabled={isChecking || (heroTab === 0 && !todayDraw)}
                >
                  {isChecking ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.checkButtonText}>
                      {heroTab === 0 && !todayDraw
                        ? "Coming Soon"
                        : "Check Now"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Search Result Display */}
              {searchResults !== null && (
                <View style={styles.searchResultsContainer}>
                  {searchResults.length > 0 ? (
                    searchResults.map((m, idx) => (
                      <View key={idx} style={styles.matchItem}>
                        <Text style={styles.matchPrize}>
                          🎉 {m.prize_tier}: {m.prize_amount || ""}
                        </Text>
                        <Text style={styles.matchDetail}>
                          {m.draw_name} ({m.draw_code}) on {m.draw_date} •
                          Ticket: {m.ticket_matched}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noMatchText}>
                      No winning prize match found for &quot;{ticketInput}
                      &quot;. Try checking all lotteries.
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })()}

        {heroTab === 0 &&
          (todayDraw && todayDraw.first?.ticket ? (
            /* Today's Draw Published Card */
            <View style={styles.winnerCard}>
              <View style={styles.winnerHeader}>
                <Ionicons name="trophy" size={16} color={COLORS.successText} />
                <Text style={styles.winnerTextBadge}>
                  LATEST DRAW • {todayDraw.draw_date}
                </Text>
              </View>

              <Text style={styles.winnerTitle}>
                {todayDraw.draw_name} ({todayDraw.draw_code})
              </Text>
              <Text
                style={[styles.winnerPrizeLabel, { color: COLORS.primary }]}
              >
                1ST PRIZE ({todayDraw.prizes?.amounts?.["1st"] || "₹70 Lakhs"})
              </Text>
              <Text style={styles.winnerTicketNumber}>
                {todayDraw.first?.ticket || "N/A"}
              </Text>
              {((todayDraw.first?.location &&
                todayDraw.first.location.toLowerCase() !== "n/a" &&
                todayDraw.first.location.toLowerCase() !== "nan" &&
                todayDraw.first.location.toLowerCase() !== "null") ||
                (todayDraw.first?.agent &&
                  todayDraw.first.agent.toLowerCase() !== "n/a" &&
                  todayDraw.first.agent.toLowerCase() !== "nan" &&
                  todayDraw.first.agent.toLowerCase() !== "null")) && (
                <Text style={styles.winnerMeta}>
                  {todayDraw.first?.location &&
                  todayDraw.first.location.toLowerCase() !== "n/a" &&
                  todayDraw.first.location.toLowerCase() !== "nan" &&
                  todayDraw.first.location.toLowerCase() !== "null"
                    ? `Location: ${todayDraw.first.location}`
                    : ""}
                  {todayDraw.first?.agent &&
                  todayDraw.first.agent.toLowerCase() !== "n/a" &&
                  todayDraw.first.agent.toLowerCase() !== "nan" &&
                  todayDraw.first.agent.toLowerCase() !== "null"
                    ? `${todayDraw.first?.location && todayDraw.first.location.toLowerCase() !== "n/a" && todayDraw.first.location.toLowerCase() !== "nan" && todayDraw.first.location.toLowerCase() !== "null" ? "  |  " : ""}Agent: ${todayDraw.first.agent}`
                    : ""}
                </Text>
              )}

              <Text
                style={[
                  styles.sectionHeader,
                  { marginTop: 12, marginBottom: 6 },
                ]}
              >
                Complete Prize Breakdown
              </Text>
              {[
                {
                  key: "consolation",
                  label: "Consolation Prize",
                  color: "#7F8C8D",
                },
                { key: "2nd", label: "2nd Prize", color: "#D4AF37" },
                { key: "3rd", label: "3rd Prize", color: "#2980B9" },
                { key: "4th", label: "4th Prize", color: "#8E44AD" },
                { key: "5th", label: "5th Prize", color: "#2C3E50" },
                { key: "6th", label: "6th Prize", color: "#16A085" },
                { key: "7th", label: "7th Prize", color: "#D35400" },
                { key: "8th", label: "8th Prize", color: "#C0392B" },
                { key: "9th", label: "9th Prize", color: "#7F8C8D" },
              ].map((tier) => {
                const numbers = (todayDraw.prizes as any)?.[tier.key] as
                  | string[]
                  | undefined;
                const amount = todayDraw.prizes?.amounts?.[tier.key];
                if (!numbers || numbers.length === 0) return null;

                return (
                  <View key={tier.key} style={styles.tierCard}>
                    <View style={styles.tierHeader}>
                      <Text style={[styles.tierTitle, { color: tier.color }]}>
                        {tier.label}
                      </Text>
                      {amount && (
                        <Text style={styles.tierAmount}>{amount}</Text>
                      )}
                    </View>

                    <View style={styles.numbersGrid}>
                      {numbers.map((num, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.numberChip,
                            {
                              backgroundColor: tier.color,
                              borderColor: tier.color,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.numberChipText,
                              { color: "#FFFFFF" },
                            ]}
                          >
                            {num}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : isAfter3PM ? (
            /* Drawing in progress card after 3 PM */
            <View
              style={[
                styles.scheduledCard,
                { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" },
              ]}
            >
              <View style={styles.scheduledBadgeRow}>
                <Ionicons name="alert-circle" size={14} color="#3B82F6" />
                <Text style={[styles.scheduledBadgeText, { color: "#1E40AF" }]}>
                  DRAWING IN PROGRESS
                </Text>
              </View>

              <Text style={styles.scheduledTitle}>
                {todayLottery.name}{" "}
                {todayLottery.nameMl ? `(${todayLottery.nameMl})` : ""} (
                {todayLottery.code})
              </Text>
              <Text style={[styles.scheduledSubtitle, { color: "#1E40AF" }]}>
                Result will update shortly
              </Text>
              <Text style={[styles.scheduledDesc, { color: "#1E40AF" }]}>
                The live draw is currently in progress. Results will update
                automatically shortly on this page.
              </Text>
            </View>
          ) : (
            /* Today's Draw Coming Soon Scheduled Card */
            <View style={styles.scheduledCard}>
              <View style={styles.scheduledBadgeRow}>
                <Ionicons name="time" size={14} color={COLORS.gold} />
                <Text style={styles.scheduledBadgeText}>
                  RESULT COMING SOON
                </Text>
              </View>

              <Text style={styles.scheduledTitle}>
                {todayLottery.name}{" "}
                {todayLottery.nameMl ? `(${todayLottery.nameMl})` : ""} (
                {todayLottery.code})
              </Text>
              <Text style={styles.scheduledSubtitle}>
                Draw Scheduled Today at 3:00 PM
              </Text>
              <Text style={styles.scheduledDesc}>
                Winning results for {todayLottery.name} ({todayLottery.code})
                will be published automatically.
              </Text>
            </View>
          ))}

        {/* HERO TAB 1: YESTERDAY'S / PREVIOUS DRAW RESULT */}
        {heroTab === 1 && previousDraw && (
          <View style={[styles.winnerCard, styles.winnerCardGold]}>
            <View style={styles.winnerHeader}>
              <Ionicons name="trophy" size={16} color={COLORS.gold} />
              <Text style={[styles.winnerTextBadge, { color: COLORS.gold }]}>
                PREVIOUS DRAW RESULT • {previousDraw.draw_date}
              </Text>
            </View>

            <Text style={styles.winnerTitle}>
              {previousDraw.draw_name}{" "}
              {getLotteryMalayalamName(previousDraw.lottery_code)
                ? `(${getLotteryMalayalamName(previousDraw.lottery_code)})`
                : ""}{" "}
              ({previousDraw.draw_code})
            </Text>
            <Text style={styles.winnerPrizeLabel}>
              1ST PRIZE ({previousDraw.prizes?.amounts?.["1st"] || "₹70 Lakhs"})
            </Text>

            <Text style={[styles.winnerTicketNumber, { color: COLORS.gold }]}>
              {previousDraw.first?.ticket || "N/A"}
            </Text>

            {previousDraw.first?.location && (
              <Text style={styles.winnerMeta}>
                Location:{" "}
                <Text style={styles.boldText}>
                  {previousDraw.first.location}
                </Text>
                {previousDraw.first?.agent
                  ? `  |  Agent: ${previousDraw.first.agent}`
                  : ""}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.viewBreakdownBtn,
                { backgroundColor: COLORS.goldLight },
              ]}
              onPress={() =>
                navigation.navigate("DrawBreakdown", {
                  code: previousDraw.lottery_code,
                  date: previousDraw.draw_date,
                })
              }
            >
              <Text style={[styles.viewBreakdownText, { color: COLORS.gold }]}>
                View Full Breakdown for {previousDraw.draw_date} →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly Schedule Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Lottery Schedule</Text>
          <Text style={styles.sectionSubtitle}>
            Daily draws conducted by Kerala State Lotteries Dept
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.scheduleGrid}>
            {lotteriesList.map((lottery) => {
              const latest = recentDrawsMap[lottery.code];
              const isTodayLottery =
                lottery.day.toLowerCase() === istDayName.toLowerCase();
              return (
                <TouchableOpacity
                  key={lottery.code}
                  style={[
                    styles.lotteryCard,
                    isTodayLottery && styles.todayLotteryCard,
                  ]}
                  onPress={() =>
                    navigation.navigate("LotteryArchive", {
                      code: lottery.code,
                    })
                  }
                >
                  <View style={styles.lotteryCardTop}>
                    <View
                      style={[
                        styles.dayChip,
                        isTodayLottery && styles.todayDayChip,
                      ]}
                    >
                      {isTodayLottery && (
                        <Ionicons
                          name="sparkles"
                          size={11}
                          color={COLORS.white}
                        />
                      )}
                      <Text
                        style={[
                          styles.dayChipText,
                          isTodayLottery && styles.todayDayChipText,
                        ]}
                      >
                        {lottery.day} {isTodayLottery ? "• TODAY" : ""}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View style={styles.codeChip}>
                        <Text style={styles.codeChipText}>{lottery.code}</Text>
                      </View>
                      {(() => {
                        const isCardScannerDisabled =
                          isTodayLottery &&
                          (!latest || latest.draw_date !== todayISTDate);
                        return (
                          <TouchableOpacity
                            style={[
                              styles.cardScanBtn,
                              isCardScannerDisabled &&
                                styles.disabledCardScanBtn,
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleScanForLottery(lottery.code);
                            }}
                            disabled={isCardScannerDisabled}
                          >
                            <Ionicons
                              name="camera"
                              size={13}
                              color={
                                isCardScannerDisabled
                                  ? COLORS.textLight
                                  : COLORS.primary
                              }
                            />
                            <Text
                              style={[
                                styles.cardScanBtnText,
                                isCardScannerDisabled &&
                                  styles.disabledCardScanBtnText,
                              ]}
                            >
                              {isCardScannerDisabled ? "Active Soon" : "Scan"}
                            </Text>
                          </TouchableOpacity>
                        );
                      })()}
                    </View>
                  </View>

                  <Text style={styles.lotteryName}>{lottery.name}</Text>
                  <Text style={styles.drawTimeText}>Draw: 3:00 PM</Text>

                  {isTodayLottery && (
                    <View style={styles.todayTicketTag}>
                      <Ionicons name="time" size={13} color={COLORS.primary} />
                      <Text style={styles.todayTicketTagText}>
                        TODAY&apos;S TICKET • DRAW AT 3:00 PM
                      </Text>
                    </View>
                  )}

                  {latest ? (
                    latest.draw_date === todayISTDate ? (
                      <View
                        style={[
                          styles.latestHighlight,
                          {
                            backgroundColor: COLORS.cardBg,
                            borderColor: COLORS.primary,
                          },
                        ]}
                      >
                        <View style={styles.latestHeaderRow}>
                          <Text
                            style={[
                              styles.highlightLabel,
                              { color: COLORS.primary },
                            ]}
                          >
                            TODAY&apos;S RESULT PUBLISHED
                          </Text>
                          <Text
                            style={[
                              styles.highlightDate,
                              { color: COLORS.primary },
                            ]}
                          >
                            {latest.draw_date}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: COLORS.primary,
                            marginTop: 4,
                          }}
                        >
                          Search ticket or tap below to view result →
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.latestHighlight}>
                        <View style={styles.latestHeaderRow}>
                          <Text style={styles.highlightLabel}>
                            LATEST 1ST PRIZE
                          </Text>
                          <Text style={styles.highlightDate}>
                            {latest.draw_date}
                          </Text>
                        </View>
                        <Text style={styles.highlightTicket}>
                          {latest.first?.ticket || "N/A"}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.archiveNoticeBox}>
                      <Text style={styles.archiveNotice}>Daily Updates</Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>
                      View Archives & Results
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Information Section */}
        <View style={styles.seoContainer}>
          <Text style={styles.seoTitle}>
            Kerala Lottery Results Today – Live Winning Numbers & Details
          </Text>
          <Text style={styles.seoText}>
            If you're searching for the kerala lottery results today, you've
            landed on the right app. This app publishes the kerala lottery
            result today the moment the official draw closes, so you never have
            to dig through old posts to find your kerala lottery results today
            result. Whether you're tracking today kerala lottery result for a
            routine weekly draw or the kerala lottery ticket result today for a
            specific series, everything here is organised by date, draw name and
            prize tier.
          </Text>

          <Text style={styles.seoSubtitle}>When Does the Draw Go Live?</Text>
          <Text style={styles.seoText}>
            The lottery result today kerala telecast begins at 2:55 PM on
            Kairali TV, Kaumudy TV and Jai Hind TV, and the full today's kerala
            lottery result sheet — first prize down to consolation — is usually
            finalised between 3:00 PM and 4:30 PM. Our today lottery result
            kerala table refreshes automatically as the Directorate confirms
            each tier, so the kerala result today lottery list you see is always
            the verified, official one.
          </Text>

          <Text style={styles.seoSubtitle}>Today's Draw, by Lottery Name</Text>
          <Text style={styles.seoText}>
            Kerala runs a different lottery each day. The win win lottery result
            today kerala publishes every Monday, Tuesday belongs to kerala
            lottery result today sthree sakthi, Wednesday to kerala lottery
            result today karunya plus, and Thursday to kerala lottery result
            today nirmal. Friday is kerala lottery result today karunya, and
            Saturday brings kerala lottery result today fifty fifty.
          </Text>

          <Text style={styles.seoSubtitle}>Checking Your Ticket</Text>
          <Text style={styles.seoText}>
            To find the lottery result kerala today for your ticket, use the
            search bar or browse by draw name. What we provide is the confirmed
            kerala lottery results today live results today feed, cross-checked
            against the government gazette.
          </Text>

          <Text style={styles.seoSubtitle}>Jackpots and Big Wins</Text>
          <Text style={styles.seoText}>
            The number one thing readers want is the kerala lottery result today
            jackpot, and we lead every screen with it. You'll find the kerala
            lottery jackpot result today, the kerala jackpot lottery result
            today, and the jackpot kerala lottery result today figure right at
            the top of today's card.
          </Text>

          <Text style={styles.seoSubtitle}>A Note on Accuracy</Text>
        </View>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Barcode Result Modal */}
      <BarcodeResultModal
        visible={isBarcodeResultOpen}
        scannedBarcode={scannedBarcode}
        availableDraws={allDraws}
        targetLotteryCode={targetScanLotteryCode}
        onClose={() => {
          setIsBarcodeResultOpen(false);
          setTargetScanLotteryCode(null);
        }}
        onRescan={() => {
          setIsBarcodeResultOpen(false);
          setIsScannerOpen(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  appSubtitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  heroTabScrollView: { marginBottom: 14 },
  heroTabBar: { flexDirection: "row", gap: 8 },
  heroTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTabActiveGreen: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  heroTabActiveGold: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  heroTabText: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  heroTabActiveText: { color: COLORS.white, fontWeight: "800" },
  winnerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  winnerCardGold: {
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
  },
  winnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  winnerTextBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.successText,
  },
  winnerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  winnerPrizeLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.gold,
    marginBottom: 6,
  },
  winnerTicketNumber: {
    fontSize: 26,
    fontWeight: "900",
    fontFamily: "monospace",
    color: COLORS.primary,
    marginBottom: 8,
  },
  winnerMeta: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  boldText: { fontWeight: "700", color: COLORS.textDark },
  viewBreakdownBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  viewBreakdownText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  scheduledCard: {
    backgroundColor: COLORS.goldLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginBottom: 16,
  },
  scheduledBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  scheduledBadgeText: { fontSize: 11, fontWeight: "800", color: COLORS.gold },
  scheduledTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  scheduledSubtitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.gold,
    marginBottom: 6,
  },
  scheduledDesc: { fontSize: 12, color: COLORS.textDark, lineHeight: 18 },
  checkerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  checkerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  checkerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  scanChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  disabledScanChipBtn: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  scanChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  disabledScanChipText: {
    color: COLORS.textLight,
  },
  checkerSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
  },
  cameraIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledCameraIconBtn: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  cardScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  disabledCardScanBtn: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  cardScanBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  disabledCardScanBtnText: {
    color: COLORS.textLight,
  },
  checkButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  searchResultsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  matchItem: {
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  matchPrize: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  matchDetail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  noMatchText: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  sectionSubtitle: { fontSize: 12, color: COLORS.textMuted },
  scheduleGrid: { gap: 12 },
  lotteryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayLotteryCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: "#F0FDF4",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  todayDayChip: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  todayDayChipText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  todayTicketTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  todayTicketTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  lotteryCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayChipText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  codeChip: {
    backgroundColor: COLORS.chipBlueBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeChipText: { fontSize: 11, fontWeight: "900", color: COLORS.chipBlueText },
  lotteryName: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  drawTimeText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10 },
  latestHighlight: {
    backgroundColor: COLORS.goldLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  latestHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  highlightLabel: { fontSize: 10, fontWeight: "800", color: COLORS.gold },
  highlightDate: { fontSize: 10, fontWeight: "700", color: COLORS.gold },
  highlightTicket: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
    color: COLORS.gold,
  },
  archiveNoticeBox: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  archiveNotice: { fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  footerText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  seoContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 4,
  },
  seoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  seoSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
    marginTop: 12,
  },
  seoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  tierCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  tierTitle: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  tierAmount: { fontSize: 13, fontWeight: "900", color: COLORS.gold },
  numbersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  numberChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  numberChipText: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "700",
    color: COLORS.textDark,
  },
});
