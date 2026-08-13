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
import {
  Trophy,
  Clock,
  Search,
  Camera,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Globe,
} from "lucide-react-native";
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
import { useLanguage } from "../context/LanguageContext";

export default function HomeScreen({ navigation }: any) {
  const { language, setShowLanguageModal, t } = useLanguage();
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
    const channelName = `realtime-mobile-home-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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
              {
                justifyContent: "space-between",
                flex: 1,
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                flex: 1,
              }}
            >
              <View style={styles.logoBadge}>
                <Image
                  source={require("../../assets/icon.png")}
                  style={{ width: 44, height: 44, borderRadius: 10 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.appName,
                    language === "ml" && { fontSize: 15, lineHeight: 22 },
                  ]}
                >
                  {t("app_header_title")}
                </Text>
                <Text
                  style={[
                    styles.appSubtitle,
                    language === "ml" && { fontSize: 10.5, lineHeight: 15 },
                  ]}
                >
                  {t("app_header_subtitle")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: COLORS.primaryLight,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: COLORS.primary,
              }}
              onPress={() => setShowLanguageModal(true)}
            >
              <Globe size={14} color={COLORS.primary} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: COLORS.primary,
                }}
              >
                {language === "ml" ? "മലയാളം" : "EN"}
              </Text>
            </TouchableOpacity>
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
                      heroTab === 1 && styles.heroTabActiveGreen,
                    ]}
                    onPress={() => setHeroTab(1)}
                  >
                    <Trophy
                      size={14}
                      color={heroTab === 1 ? COLORS.white : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.heroTabText,
                        heroTab === 1 && styles.heroTabActiveText,
                      ]}
                      numberOfLines={1}
                    >
                      {language === "ml"
                        ? "ഇന്നലത്തെ ഫലം"
                        : "Yesterday's Result"}{" "}
                      ({previousDraw.draw_date})
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
                  <Clock
                    size={14}
                    color={heroTab === 0 ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.heroTabText,
                      heroTab === 0 && styles.heroTabActiveText,
                    ]}
                    numberOfLines={1}
                  >
                    {language === "ml" ? "ഇന്നത്തെ ഫലം" : "Today's Draw"} (
                    {todayDraw
                      ? `${todayDraw.lottery_code}`
                      : `${todayLottery.code}`}
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
                  onPress={() => {
                    setHeroTab(0);
                    setTicketInput("");
                    setSearchResults(null);
                  }}
                >
                  <Clock
                    size={14}
                    color={heroTab === 0 ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.heroTabText,
                      heroTab === 0 && styles.heroTabActiveText,
                    ]}
                    numberOfLines={1}
                  >
                    {language === "ml" ? "ഇന്നത്തെ ഫലം" : "Today's Draw"} (
                    {todayDraw
                      ? `${todayDraw.lottery_code}`
                      : `${todayLottery.code}`}
                    )
                  </Text>
                </TouchableOpacity>

                {previousDraw && (
                  <TouchableOpacity
                    style={[
                      styles.heroTab,
                      heroTab === 1 && styles.heroTabActiveGreen,
                    ]}
                    onPress={() => {
                      setHeroTab(1);
                      setTicketInput("");
                      setSearchResults(null);
                    }}
                  >
                    <Trophy
                      size={14}
                      color={heroTab === 1 ? COLORS.white : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.heroTabText,
                        heroTab === 1 && styles.heroTabActiveText,
                      ]}
                      numberOfLines={1}
                    >
                      {language === "ml"
                        ? "ഇന്നലത്തെ ഫലം"
                        : "Yesterday's Result"}{" "}
                      ({previousDraw.draw_date})
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
          const isSearchDisabled = isChecking || !ticketInput.trim() || (heroTab === 0 && !todayDraw);
          const lotteryDisplayName =
            heroTab === 0
              ? todayDraw
                ? language === "ml" &&
                  getLotteryMalayalamName(todayDraw.lottery_code)
                  ? getLotteryMalayalamName(todayDraw.lottery_code)
                  : todayDraw.draw_name
                : language === "ml" && todayLottery.nameMl
                  ? todayLottery.nameMl
                  : todayLottery.name
              : previousDraw
                ? language === "ml" &&
                  getLotteryMalayalamName(previousDraw.lottery_code)
                  ? getLotteryMalayalamName(previousDraw.lottery_code)
                  : previousDraw.draw_name
                : language === "ml"
                  ? "മുൻ"
                  : "Previous";

          return (
            <View style={styles.checkerCard}>
              <View style={styles.checkerTitleRow}>
                <Search size={18} color={COLORS.primary} />
                <Text
                  style={[
                    styles.checkerTitle,
                    language === "ml" && { fontSize: 13, lineHeight: 18 },
                  ]}
                  numberOfLines={1}
                >
                  {language === "ml"
                    ? `${lotteryDisplayName} ടിക്കറ്റ് പരിശോധിക്കുക`
                    : `Check ${lotteryDisplayName} Ticket`}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={
                    heroTab === 0
                      ? todayDraw
                        ? language === "ml"
                          ? `${todayDraw.draw_code} ടിക്കറ്റ് നമ്പർ നൽകുക...`
                          : `Enter ticket for ${todayDraw.draw_code}...`
                        : language === "ml"
                          ? `${todayLottery.code} ടിക്കറ്റ് നമ്പർ നൽകുക...`
                          : `Enter ticket for ${todayLottery.code}...`
                      : language === "ml"
                        ? `${previousDraw?.draw_code || "ടിക്കറ്റ്"} നമ്പർ നൽകുക...`
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
                    styles.checkButton,
                    isSearchDisabled && { backgroundColor: "#94A3B8" },
                    language === "ml" && { paddingHorizontal: 12 },
                  ]}
                  onPress={handleQuickCheck}
                  disabled={isSearchDisabled}
                >
                  {isChecking ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text
                      style={[
                        styles.checkButtonText,
                        language === "ml" && { fontSize: 11.5 },
                      ]}
                    >
                      {heroTab === 0 && !todayDraw
                        ? language === "ml"
                          ? "ഉടൻ വരും"
                          : "Coming Soon"
                        : t("check_now")}
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
                          {language === "ml" ? "ടിക്കറ്റ്:" : "Ticket:"}{" "}
                          {m.ticket_matched}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noMatchText}>
                      {language === "ml"
                        ? `"${ticketInput}" നമ്പർ സമ്മാനാർഹമായ ഫലങ്ങളിൽ ലഭിച്ചില്ല. എല്ലാ ലോട്ടറികളും പരിശോധിക്കുക.`
                        : `No winning prize match found for "${ticketInput}". Try checking all lotteries.`}
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
              <View style={styles.winnerHeroSection}>
                <View style={styles.winnerHeader}>
                  <Trophy size={15} color={COLORS.primary} />
                  <Text style={styles.winnerTextBadge}>
                    {t("latest_draw_badge")} • {todayDraw.draw_date}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.winnerTitle,
                    language === "ml" && { fontSize: 17.5, lineHeight: 25 },
                  ]}
                >
                  {language === "ml" &&
                  getLotteryMalayalamName(todayDraw.lottery_code)
                    ? getLotteryMalayalamName(todayDraw.lottery_code)
                    : todayDraw.draw_name}{" "}
                  ({todayDraw.draw_code})
                </Text>

                <View style={styles.prizeBadgeContainer}>
                  <Text style={styles.winnerPrizeLabel}>
                    {t("first_prize")} (
                    {todayDraw.prizes?.amounts?.["1st"] || "₹70 Lakhs"})
                  </Text>
                </View>

                <View style={styles.heroTicketBox}>
                  <Text style={styles.winnerTicketNumber}>
                    {todayDraw.first?.ticket || "N/A"}
                  </Text>
                </View>

                {((todayDraw.first?.location &&
                  todayDraw.first.location.toLowerCase() !== "n/a" &&
                  todayDraw.first.location.toLowerCase() !== "nan" &&
                  todayDraw.first.location.toLowerCase() !== "null") ||
                  (todayDraw.first?.agent &&
                    todayDraw.first.agent.toLowerCase() !== "n/a" &&
                    todayDraw.first.agent.toLowerCase() !== "nan" &&
                    todayDraw.first.agent.toLowerCase() !== "null")) && (
                  <View style={styles.winnerMetaBox}>
                    <Text style={styles.winnerMeta}>
                      {todayDraw.first?.location &&
                      todayDraw.first.location.toLowerCase() !== "n/a" &&
                      todayDraw.first.location.toLowerCase() !== "nan" &&
                      todayDraw.first.location.toLowerCase() !== "null"
                        ? `${t("location")}: ${todayDraw.first.location}`
                        : ""}
                      {todayDraw.first?.agent &&
                      todayDraw.first.agent.toLowerCase() !== "n/a" &&
                      todayDraw.first.agent.toLowerCase() !== "nan" &&
                      todayDraw.first.agent.toLowerCase() !== "null"
                        ? `${todayDraw.first?.location && todayDraw.first.location.toLowerCase() !== "n/a" && todayDraw.first.location.toLowerCase() !== "nan" && todayDraw.first.location.toLowerCase() !== "null" ? "  |  " : ""}${t("agent")}: ${todayDraw.first.agent}`
                        : ""}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.sectionHeader,
                  { marginTop: 12, marginBottom: 6 },
                ]}
              >
                {t("complete_prize_breakdown")}
              </Text>
              {[
                {
                  key: "consolation",
                  label:
                    language === "ml"
                      ? "സമാശ്വാസ സമ്മാനം"
                      : "Consolation Prize",
                  color: "#64748B",
                },
                {
                  key: "2nd",
                  label: language === "ml" ? "രണ്ടാം സമ്മാനം" : "2nd Prize",
                  color: "#D97706",
                },
                {
                  key: "3rd",
                  label: language === "ml" ? "മൂന്നാം സമ്മാനം" : "3rd Prize",
                  color: "#2563EB",
                },
                {
                  key: "4th",
                  label: language === "ml" ? "നാലാം സമ്മാനം" : "4th Prize",
                  color: "#9333EA",
                },
                {
                  key: "5th",
                  label: language === "ml" ? "അഞ്ചാം സമ്മാനം" : "5th Prize",
                  color: "#334155",
                },
                {
                  key: "6th",
                  label: language === "ml" ? "ആറാം സമ്മാനം" : "6th Prize",
                  color: "#0D9488",
                },
                {
                  key: "7th",
                  label: language === "ml" ? "ഏഴാം സമ്മാനം" : "7th Prize",
                  color: "#EA580C",
                },
                {
                  key: "8th",
                  label: language === "ml" ? "എട്ടാം സമ്മാനം" : "8th Prize",
                  color: "#DC2626",
                },
                {
                  key: "9th",
                  label: language === "ml" ? "ഒൻപതാം സമ്മാനം" : "9th Prize",
                  color: "#475569",
                },
              ].map((tier) => {
                const numbers = (todayDraw.prizes as any)?.[tier.key] as
                  | string[]
                  | undefined;
                const amount = todayDraw.prizes?.amounts?.[tier.key];
                if (!numbers || numbers.length === 0) return null;

                return (
                  <View key={tier.key} style={styles.tierCard}>
                    <View style={styles.tierHeader}>
                      <Text style={styles.tierTitle}>{tier.label}</Text>
                      {amount && (
                        <Text style={styles.tierAmount}>{amount}</Text>
                      )}
                    </View>

                    <View style={styles.numbersGrid}>
                      {numbers.map((num, idx) => (
                        <View key={idx} style={styles.numberChip}>
                          <Text style={styles.numberChipText}>{num}</Text>
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
                <AlertCircle size={14} color="#3B82F6" />
                <Text style={[styles.scheduledBadgeText, { color: "#1E40AF" }]}>
                  {language === "ml"
                    ? "നറുക്കെടുപ്പ് നടക്കുന്നു"
                    : "DRAWING IN PROGRESS"}
                </Text>
              </View>

              <Text style={styles.scheduledTitle}>
                {todayLottery.nameMl || todayLottery.name} ({todayLottery.code})
              </Text>
              <Text style={[styles.scheduledSubtitle, { color: "#1E40AF" }]}>
                {language === "ml"
                  ? "ഫലം ഉടൻ അപ്‌ഡേറ്റ് ചെയ്യും"
                  : "Result will update shortly"}
              </Text>
              <Text style={[styles.scheduledDesc, { color: "#1E40AF" }]}>
                {language === "ml"
                  ? "തത്സമയ നറുക്കെടുപ്പ് ഇപ്പോൾ നടന്നു കൊണ്ടിരിക്കുന്നു. ഫലം ഉടൻ ലൈവായി ലഭ്യമാകും."
                  : "The live draw is currently in progress. Results will update automatically shortly on this page."}
              </Text>
            </View>
          ) : (
            /* Today's Draw Coming Soon Scheduled Card */
            <View style={styles.scheduledCard}>
              <View style={styles.scheduledBadgeRow}>
                <Clock size={14} color={COLORS.primary} />
                <Text
                  style={[styles.scheduledBadgeText, { color: COLORS.primary }]}
                >
                  {language === "ml"
                    ? "ഫലം ഉടൻ ലഭ്യമാകും"
                    : "RESULT COMING SOON"}
                </Text>
              </View>

              <Text style={styles.scheduledTitle}>
                {todayLottery.nameMl || todayLottery.name} ({todayLottery.code})
              </Text>
              <Text
                style={[styles.scheduledSubtitle, { color: COLORS.primary }]}
              >
                {language === "ml"
                  ? "ഇന്നത്തെ നറുക്കെടുപ്പ് ഉച്ചയ്ക്ക് 3:00 മണിക്ക്"
                  : "Draw Scheduled Today at 3:00 PM"}
              </Text>
              <Text style={styles.scheduledDesc}>
                {language === "ml"
                  ? `${todayLottery.nameMl || todayLottery.name} (${todayLottery.code}) നറുക്കെടുപ്പ് ഫലം തത്സമയം ലഭ്യമാകും.`
                  : `Winning results for ${todayLottery.name} (${todayLottery.code}) will be published automatically.`}
              </Text>
            </View>
          ))}

        {/* HERO TAB 1: YESTERDAY'S / PREVIOUS DRAW RESULT */}
        {heroTab === 1 && previousDraw && (
          <View style={styles.winnerCard}>
            <View style={styles.winnerHeader}>
              <Trophy size={15} color={COLORS.primary} />
              <Text style={styles.winnerTextBadge}>
                {language === "ml"
                  ? "മുൻകാല നറുക്കെടുപ്പ് ഫലം"
                  : "PREVIOUS DRAW RESULT"}{" "}
                • {previousDraw.draw_date}
              </Text>
            </View>

            <Text style={styles.winnerTitle}>
              {language === "ml" &&
              getLotteryMalayalamName(previousDraw.lottery_code)
                ? getLotteryMalayalamName(previousDraw.lottery_code)
                : previousDraw.draw_name}{" "}
              ({previousDraw.draw_code})
            </Text>

            <View style={styles.prizeBadgeContainer}>
              <Text style={styles.winnerPrizeLabel}>
                {t("first_prize")} (
                {previousDraw.prizes?.amounts?.["1st"] || "₹70 Lakhs"})
              </Text>
            </View>

            <View style={styles.heroTicketBox}>
              <Text style={styles.winnerTicketNumber}>
                {previousDraw.first?.ticket || "N/A"}
              </Text>
            </View>

            {previousDraw.first?.location && (
              <View style={styles.winnerMetaBox}>
                <Text style={styles.winnerMeta}>
                  {t("location")}: {previousDraw.first.location}
                  {previousDraw.first?.agent
                    ? `  |  ${t("agent")}: ${previousDraw.first.agent}`
                    : ""}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.viewBreakdownBtn}
              onPress={() =>
                navigation.navigate("DrawBreakdown", {
                  code: previousDraw.lottery_code,
                  date: previousDraw.draw_date,
                })
              }
            >
              <Text style={styles.viewBreakdownText}>
                {language === "ml"
                  ? `${previousDraw.draw_date} തീയതിയിലെ സമ്പൂർണ്ണ ഫലം കാണുക →`
                  : `View Full Breakdown for ${previousDraw.draw_date} →`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly Schedule Section */}
        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("weekly_schedule")}</Text>
          <Text style={styles.sectionSubtitle}>{t("weekly_schedule_sub")}</Text>
        </View> */}

        {/* {isLoading ? (
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
                        <Sparkles size={11} color={COLORS.white} />
                      )}
                      <Text
                        style={[
                          styles.dayChipText,
                          isTodayLottery && styles.todayDayChipText,
                        ]}
                      >
                        {language === "ml"
                          ? lottery.day.toLowerCase() === "monday"
                            ? "തിങ്കൾ"
                            : lottery.day.toLowerCase() === "tuesday"
                              ? "ചൊവ്വ"
                              : lottery.day.toLowerCase() === "wednesday"
                                ? "ബുധൻ"
                                : lottery.day.toLowerCase() === "thursday"
                                  ? "വ്യാഴം"
                                  : lottery.day.toLowerCase() === "friday"
                                    ? "വെള്ളി"
                                    : lottery.day.toLowerCase() === "saturday"
                                      ? "ശനി"
                                      : "ഞായർ"
                          : lottery.day}{" "}
                        {isTodayLottery
                          ? language === "ml"
                            ? "• ഇന്ന്"
                            : "• TODAY"
                          : ""}
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
                            <Camera
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
                              {isCardScannerDisabled
                                ? language === "ml"
                                  ? "ഉടൻ വരും"
                                  : "Active Soon"
                                : language === "ml"
                                  ? "സ്‌കാൻ"
                                  : "Scan"}
                            </Text>
                          </TouchableOpacity>
                        );
                      })()}
                    </View>
                  </View>

                  <Text style={styles.lotteryName}>
                    {language === "ml" && lottery.nameMl
                      ? lottery.nameMl
                      : lottery.name}
                  </Text>
                  <Text style={styles.drawTimeText}>
                    {language === "ml"
                      ? "നറുക്കെടുപ്പ്: ഉച്ചയ്ക്ക് 3:00 മണി"
                      : "Draw: 3:00 PM"}
                  </Text>

                  {isTodayLottery && (
                    <View style={styles.todayTicketTag}>
                      <Clock size={13} color={COLORS.primary} />
                      <Text style={styles.todayTicketTagText}>
                        {language === "ml"
                          ? "ഇന്നത്തെ ടിക്കറ്റ് • ഉച്ചയ്ക്ക് 3 മണിക്ക്"
                          : "TODAY'S TICKET • DRAW AT 3:00 PM"}
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
                            {language === "ml"
                              ? "ഇന്നത്തെ ഫലം പ്രസിദ്ധീകരിച്ചു"
                              : "TODAY'S RESULT PUBLISHED"}
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
                          {language === "ml"
                            ? "ഫലം കാണാൻ തട്ടുക →"
                            : "Search ticket or tap below to view result →"}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.latestHighlight}>
                        <View style={styles.latestHeaderRow}>
                          <Text style={styles.highlightLabel}>
                            {language === "ml"
                              ? "അവസാന 1-ാം സമ്മാനം"
                              : "LATEST 1ST PRIZE"}
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
                      <Text style={styles.archiveNotice}>
                        {language === "ml"
                          ? "ദിനംപ്രതിയുള്ള ഫലങ്ങൾ"
                          : "Daily Updates"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>
                      {language === "ml"
                        ? "പഴയ ഫലങ്ങൾ കാണുക"
                        : "View Archives & Results"}
                    </Text>
                    <ChevronRight size={14} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )} */}

        {/* Information Section */}
        {/* <View style={styles.seoContainer}>
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
        </View> */}
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
  appName: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 24,
  },
  appSubtitle: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontWeight: "500",
    lineHeight: 16,
  },
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
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  winnerHeroSection: {
    alignItems: "center",
    width: "100%",
  },
  winnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "center",
  },
  winnerTextBadge: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.primary,
  },
  winnerTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  prizeBadgeContainer: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignSelf: "center",
    marginBottom: 12,
  },
  winnerPrizeLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#B45309",
    textAlign: "center",
  },
  heroTicketBox: {
    width: "100%",
    backgroundColor: "#EBF5FF",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  winnerTicketNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0B3C5D",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  winnerMetaBox: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  winnerMeta: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    lineHeight: 16,
  },
  viewBreakdownBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 8,
    width: "100%",
  },
  viewBreakdownText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
  },
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
  tierTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  tierAmount: { fontSize: 16, fontWeight: "900", color: "#B45309" },
  numbersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  numberChip: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  numberChipText: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
