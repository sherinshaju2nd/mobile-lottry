import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Linking,
  Platform,
  LayoutAnimation,
  UIManager,
  AppState,
  AppStateStatus,
  Vibration,
  KeyboardAvoidingView,
  Modal,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(globalThis as any).nativeFabricUIManager
) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch {}
}
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Trophy,
  Clock,
  Search,
  Camera,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Globe,
  RotateCw,
  Download,
  Bell,
  Zap,
  Star,
  BarChart3,
  Share2,
  Radio,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { DrawCardSkeleton } from "../components/ShimmerSkeleton";
import { shareDrawResultToWhatsApp } from "../utils/whatsappShareHelper";
import {
  triggerLightHaptic,
  triggerSuccessHaptic,
  triggerLiveChimeHaptic,
} from "../utils/haptics";
import {
  sendInstantWinnerNotification,
  sendFullResultPublishedNotification,
  checkSavedTicketsAndSendWinAlert,
  sendDistrictWinnerNotification,
  syncAllDrawNotifications,
} from "../utils/notificationScheduler";
import {
  getFavoriteLotteries,
  toggleFavoriteLottery,
} from "../utils/favorites";
import {
  WEEKLY_LOTTERIES,
  BUMPER_LOTTERIES,
  getLotteryMalayalamName,
  getLotteryTranslatedName,
  LotteryMeta,
  getDayTranslated,
  getIsBeforeSwitchTime,
  getIsAfterDrawTime,
  calculateDrawCountdown,
  getIsPollingWindow,
  getDrawTimeDisplay,
} from "../constants/lotteries";
import { SUPPORTED_LANGUAGES, isIndic } from "../constants/translations";
import {
  fetchAllDraws,
  getCachedDrawsQuick,
  fetchLotteries,
  fetchBumperLotteries,
  DrawResult,
  SearchMatch,
  searchTicketNumber,
  supabase,
  checkIsDatePostponed,
  PostponedDraw,
  hasAnyDrawResult,
  formatTicketSearchInput,
} from "../api/lotteryApi";
import { useFocusEffect } from "@react-navigation/native";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import BarcodeResultModal from "../components/BarcodeResultModal";
import AiVoiceAssistantModal from "../components/AiVoiceAssistantModal";
import AiSocialDigestModal from "../components/AiSocialDigestModal";
import GeminiAiFloatingButton from "../components/GeminiAiFloatingButton";
import { useLanguage } from "../context/LanguageContext";

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage, setShowLanguageModal } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Core Data States
  const [allDraws, setAllDraws] = useState<DrawResult[]>([]);
  const [lotteriesList, setLotteriesList] =
    useState<LotteryMeta[]>(WEEKLY_LOTTERIES);
  const [bumperLotteries, setBumperLotteries] =
    useState<LotteryMeta[]>(BUMPER_LOTTERIES);
  const bumperLotteriesRef = useRef<LotteryMeta[]>(BUMPER_LOTTERIES);
  const [todayPostponement, setTodayPostponement] =
    useState<PostponedDraw | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAiDigestOpen, setIsAiDigestOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState<
    "connecting" | "connected" | "live_updating"
  >("connecting");
  const [countdown, setCountdown] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isDrawPassed: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isDrawPassed: false,
  });

  const [isBeforeSwitchTime, setIsBeforeSwitchTime] = useState<boolean>(() => {
    return getIsBeforeSwitchTime(false);
  });
  const [isAfter3PM, setIsAfter3PM] = useState<boolean>(() => {
    return getIsAfterDrawTime(false);
  });
  // Hero Section Tab: 0 = Today's Draw, 1 = Yesterday's Result
  // Before switch threshold (e.g. 2:45 PM for regular, 1:30 PM for bumper), default to Yesterday's Result (1)
  const [heroTab, setHeroTab] = useState<number>(() => {
    return getIsBeforeSwitchTime(false) ? 1 : 0;
  });

  // UX Upgrade State: Favorites
  const [favoriteLotteries, setFavoriteLotteries] = useState<string[]>([]);

  useEffect(() => {
    getFavoriteLotteries().then(setFavoriteLotteries);
  }, []);

  const handleToggleFavorite = async (code: string) => {
    triggerLightHaptic();
    const res = await toggleFavoriteLottery(code);
    setFavoriteLotteries(res.favorites);
  };

  const handleHeroTabChange = (newTab: number) => {
    if (newTab === heroTab) return;
    triggerLightHaptic();
    LayoutAnimation.configureNext({
      duration: 260,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setHeroTab(newTab);
    setTicketInput("");
    setSearchResults(null);
  };

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
    const trimmed = scannedValue.trim();
    const digitsOnly = trimmed.replace(/\D/g, "");
    let extractedTicket = trimmed;
    if (digitsOnly.length > 6 && /^\d+$/.test(trimmed)) {
      extractedTicket = digitsOnly.slice(-6);
    } else {
      const match = trimmed.match(/^([A-Za-z]{1,3})\s*(\d{6})$/);
      if (match) {
        extractedTicket = `${match[1].toUpperCase()} ${match[2]}`;
      }
    }
    setScannedBarcode(extractedTicket);
    setTicketInput(extractedTicket);
    setIsBarcodeResultOpen(true);
  };

  const handleScanForLottery = (lotteryCode: string) => {
    setTargetScanLotteryCode(lotteryCode);
    setIsScannerOpen(true);
  };

  const loadData = async () => {
    try {
      // Instant sub-50ms render from offline cache
      const cached = await getCachedDrawsQuick();
      if (cached && cached.length > 0 && allDraws.length === 0) {
        setAllDraws(cached);
        setIsLoading(false);
      }

      const todayDate = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      const [draws, lotteries, bumpers, postponement] = await Promise.all([
        fetchAllDraws(),
        fetchLotteries(),
        fetchBumperLotteries(),
        checkIsDatePostponed(todayDate),
      ]);
      setAllDraws(draws);
      if (lotteries && lotteries.length > 0) {
        setLotteriesList(lotteries);
      }
      if (bumpers && bumpers.length > 0) {
        bumperLotteriesRef.current = bumpers;
        setBumperLotteries(bumpers);
      }

      const todayBumper = (bumpers || []).find((b: any) => b.draw_date === todayDate);
      if (todayBumper) {
        if (postponement && (postponement.lottery_code === "ALL" || postponement.lottery_code === todayBumper.code)) {
          setTodayPostponement(postponement);
        } else {
          setTodayPostponement(null);
        }
      } else {
        setTodayPostponement(postponement);
      }
      syncAllDrawNotifications().catch(() => {});
    } catch {
      if (allDraws.length === 0) setAllDraws([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const updateCountdown = () => {
      try {
        const todayDate = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });
        const isBumperDay = (bumperLotteriesRef.current || []).some((b: any) => b.draw_date === todayDate);

        const beforeDrawSwitch = getIsBeforeSwitchTime(isBumperDay);
        const afterDrawTime = getIsAfterDrawTime(isBumperDay);
        setIsBeforeSwitchTime(beforeDrawSwitch);
        setIsAfter3PM(afterDrawTime);

        const cd = calculateDrawCountdown(isBumperDay);
        setCountdown(cd);
      } catch {
        setIsBeforeSwitchTime(false);
        setIsAfter3PM(false);
        setCountdown({ hours: 0, minutes: 0, seconds: 0, isDrawPassed: true });
      }
    };
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    const timeInterval = setInterval(updateCountdown, 15000);

    // Realtime listener for live cron job updates, admin updates, and draw announcements
    const channelName = `realtime-mobile-home-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draw_results" },
        (payload) => {
          const newRow = payload.new as any;
          const currentToday = new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
          });
          if (newRow && newRow.draw_date === currentToday) {
            // Auto-switch to today's tab when results start streaming in
            setHeroTab(0);
            setSocketStatus("live_updating");
            try {
              triggerLiveChimeHaptic();
            } catch {}
            setTimeout(() => setSocketStatus("connected"), 4000);

            // Dispatch instant stage push notification if enabled
            if (newRow.first?.ticket && newRow.first.ticket !== "N/A") {
              sendInstantWinnerNotification(
                newRow.lottery_code,
                newRow.draw_name,
                newRow.draw_date,
                newRow.first.ticket,
                newRow.first.location,
                newRow.prizes?.amounts?.["1st"]
              );
              sendDistrictWinnerNotification(
                newRow.lottery_code,
                newRow.draw_name,
                newRow.draw_date,
                newRow.first.location,
                newRow.first.ticket,
                newRow.prizes?.amounts?.["1st"]
              );
            }
            if (hasAnyDrawResult(newRow)) {
              sendFullResultPublishedNotification(
                newRow.lottery_code,
                newRow.draw_name,
                newRow.draw_date
              );
              // Auto-match saved tickets against all prizes & notify on win
              checkSavedTicketsAndSendWinAlert(newRow);
            }
          }
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "postponed_draws" },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lotteries" },
        () => {
          loadData();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setSocketStatus("connected");
          console.log("[Mobile Socket] Subscribed to live draw results channel.");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSocketStatus("connecting");
        }
      });

    // Intelligent Polling Backup: Poll every 15s during active draw window
    const pollInterval = setInterval(() => {
      try {
        const todayDate = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });
        const isBumperDay = (bumperLotteriesRef.current || []).some((b: any) => b.draw_date === todayDate);
        if (getIsPollingWindow(isBumperDay)) {
          loadData();
        }
      } catch {}
    }, 15000);

    // AppState listener: Instant live data refresh when app returns from background
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        updateCountdown();
        loadData();
      }
    };
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(countdownInterval);
      clearInterval(timeInterval);
      clearInterval(pollInterval);
      appStateSub.remove();
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    loadData();
  };

  // Identify Today's Lottery metadata based on IST weekday
  const todayISTDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const istDayName = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  const todayBumperLottery =
    bumperLotteries.find((b) => b.draw_date === todayISTDate) || null;

  const isTodayBumper = Boolean(todayBumperLottery);

  const todayLottery =
    todayBumperLottery ||
    lotteriesList.find(
      (l) => l.day.toLowerCase() === istDayName.toLowerCase(),
    ) || lotteriesList[1];

  const todayDraw = allDraws.find((d) => d.draw_date === todayISTDate) || null;
  const hasTodayResult =
    Boolean(todayDraw) &&
    todayDraw?.draw_date === todayISTDate &&
    hasAnyDrawResult(todayDraw);
  const previousDraw =
    allDraws.find((d) => d.draw_date !== todayISTDate) ||
    (allDraws.length > 1 ? allDraws[1] : allDraws[0]) ||
    null;

  const yesterdayISTDate = (() => {
    try {
      const now = new Date();
      const istDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      );
      istDate.setDate(istDate.getDate() - 1);
      const year = istDate.getFullYear();
      const month = String(istDate.getMonth() + 1).padStart(2, "0");
      const day = String(istDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  })();

  const isPreviousDrawYesterday = Boolean(
    previousDraw && previousDraw.draw_date === yesterdayISTDate,
  );

  const handleQuickCheck = async () => {
    if (!ticketInput.trim()) return;
    const digits = ticketInput.replace(/\D/g, "");
    if (digits.length < 4) return;
    setIsChecking(true);
    try {
      const targetDate = heroTab === 0 ? todayISTDate : previousDraw?.draw_date;
      const matches = await searchTicketNumber(ticketInput.trim(), targetDate);
      setSearchResults(matches);
    } catch {
      setSearchResults([]);
    } finally {
      setIsChecking(false);
    }
  };

  // Reset checker state when navigating away from HomeScreen
  useFocusEffect(
    useCallback(() => {
      return () => {
        setTicketInput("");
        setSearchResults(null);
      };
    }, [])
  );

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews={Platform.OS === "android"}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
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
                  numberOfLines={1}
                  style={[
                    styles.appName,
                    isIndic(language) && { fontSize: 13, lineHeight: 18, fontWeight: "800" },
                  ]}
                >
                  {t("app_header_title")}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.appSubtitle,
                    isIndic(language) && { fontSize: 9.5, lineHeight: 13 },
                  ]}
                >
                  {t("app_header_subtitle")}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TouchableOpacity
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: COLORS.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                }}
                onPress={() => {
                  triggerLightHaptic();
                  navigation.navigate("Search");
                }}
                accessibilityLabel="Lottery Ticket Checker"
              >
                <Search size={15} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: COLORS.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                }}
                onPress={() => navigation.navigate("Reminders")}
              >
                <Bell size={15} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: COLORS.primaryLight,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 8,
                  gap: 3,
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                }}
                onPress={() => {
                  triggerLightHaptic();
                  setShowLangDropdown((prev) => !prev);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Select Language"
              >
                <Globe size={13} color={COLORS.primary} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: COLORS.primary,
                    letterSpacing: 0.5,
                  }}
                >
                  {language.toUpperCase()}
                </Text>
                <ChevronDown size={11} color={COLORS.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>


        {/* Hero Banner Skeleton or Real Content */}
        {isLoading ? (
          <View style={{ gap: 16, marginTop: 8, paddingHorizontal: 4 }}>
            {/* Tab Bar Skeleton */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ width: 140, height: 36, borderRadius: 20, backgroundColor: "#E2E8F0" }} />
              <View style={{ width: 140, height: 36, borderRadius: 20, backgroundColor: "#E2E8F0" }} />
            </View>

            {/* Quick Check Card Skeleton */}
            <View style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              padding: 16,
            }}>
              <View style={{ width: 180, height: 16, borderRadius: 4, backgroundColor: "#E2E8F0", marginBottom: 12 }} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: "#E2E8F0" }} />
                <View style={{ width: 100, height: 40, borderRadius: 8, backgroundColor: "#E2E8F0" }} />
              </View>
            </View>

            {/* Results Card Skeleton */}
            <View style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              padding: 16,
              gap: 12,
            }}>
              <View style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: "#E2E8F0" }} />
              <View style={{ width: 220, height: 22, borderRadius: 4, backgroundColor: "#E2E8F0" }} />
              <View style={{ width: 150, height: 16, borderRadius: 4, backgroundColor: "#E2E8F0" }} />
              
              <View style={{
                height: 60,
                backgroundColor: "#E2E8F0",
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <View style={{ width: 120, height: 28, borderRadius: 4, backgroundColor: "#CBD5E1" }} />
              </View>
              
              <View style={{ width: 200, height: 14, borderRadius: 4, backgroundColor: "#E2E8F0" }} />
              <View style={{ width: 140, height: 36, borderRadius: 8, backgroundColor: "#E2E8F0" }} />
            </View>
          </View>
        ) : (
          <>
            {/* Hero Tab Switcher: Today's Draw vs Yesterday's Result */}
            <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.heroTabScrollView}
        >
          <View style={styles.heroTabBar}>
            {isBeforeSwitchTime ? (
              <>
                {previousDraw && (
                  <TouchableOpacity
                    style={[
                      styles.heroTab,
                      heroTab === 1 && styles.heroTabActiveGreen,
                    ]}
                    onPress={() => handleHeroTabChange(1)}
                  >
                    <Trophy
                      size={14}
                      color={heroTab === 1 ? COLORS.white : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.heroTabText,
                        heroTab === 1 && styles.heroTabActiveText,
                        language === "ml" && { fontSize: 11 },
                      ]}
                      numberOfLines={1}
                    >
                      {isPreviousDrawYesterday
                        ? language === "ml"
                          ? "ഇന്നലത്തെ ഫലം"
                          : "Yesterday's Result"
                        : language === "ml"
                          ? "മുൻകാല ഫലം"
                          : "Previous Result"}{" "}
                      ({previousDraw.draw_date})
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.heroTab,
                    heroTab === 0 && styles.heroTabActiveGreen,
                  ]}
                  onPress={() => handleHeroTabChange(0)}
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
                  onPress={() => handleHeroTabChange(0)}
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
                    onPress={() => handleHeroTabChange(1)}
                  >
                    <Trophy
                      size={14}
                      color={heroTab === 1 ? COLORS.white : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.heroTabText,
                        heroTab === 1 && styles.heroTabActiveText,
                        language === "ml" && { fontSize: 11 },
                      ]}
                      numberOfLines={1}
                    >
                      {isPreviousDrawYesterday
                        ? language === "ml"
                          ? "ഇന്നലത്തെ ഫലം"
                          : "Yesterday's Result"
                        : language === "ml"
                          ? "മുൻകാല ഫലം"
                          : "Previous Result"}{" "}
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
          const ticketDigits = ticketInput.replace(/\D/g, "");
          const hasMinDigits = ticketDigits.length >= 4;
          const isSearchDisabled =
            isChecking || !ticketInput.trim() || !hasMinDigits || (heroTab === 0 && !todayDraw);
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
                  onChangeText={(text) => setTicketInput(formatTicketSearchInput(text))}
                  keyboardType="default"
                  autoCapitalize="characters"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 50, animated: true });
                    }, 150);
                  }}
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

              {/* Validation hint label */}
              {ticketInput.trim().length > 0 && !hasMinDigits && (
                <Text style={{
                  fontSize: 11,
                  color: "#EF4444",
                  fontWeight: "700",
                  marginTop: 4,
                  marginLeft: 2,
                }}>
                  {language === "ml"
                    ? "കുറഞ്ഞത് 4 അക്കങ്ങൾ നൽകുക"
                    : "Enter at least 4 digits"}
                </Text>
              )}

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
                        ? `"${ticketInput}" നമ്പർ സമ്മാനാർഹമായ ഫലങ്ങളിൽ ലഭിച്ചില്ല.`
                        : `No winning prize match found for "${ticketInput}"`}
                    </Text>
                  )}
                  {/* Reset button after results */}
                  <TouchableOpacity
                    onPress={() => { setTicketInput(""); setSearchResults(null); }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      alignSelf: "flex-start",
                      marginTop: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.background,
                    }}
                  >
                    <RotateCw size={13} color={COLORS.textMuted} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.textMuted }}>
                      {language === "ml" ? "മായ്ക്കുക" : "Reset"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })()}

        {heroTab === 0 &&
          (hasTodayResult && todayDraw ? (
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
                    {todayDraw.first?.ticket
                      ? `${t("first_prize")} (${todayDraw.prizes?.amounts?.["1st"] || "₹70 Lakhs"})`
                      : language === "ml"
                        ? "തത്സമയ സമ്മാനങ്ങൾ (1-9 & സമാശ്വാസം)"
                        : "LIVE PRIZES (1-9th & Consolation)"}
                  </Text>
                </View>

                <View style={styles.heroTicketBox}>
                  <Text style={styles.winnerTicketNumber}>
                    {todayDraw.first?.ticket || (language === "ml" ? "ഫലങ്ങൾ വരുന്നു..." : "LIVE DRAWING...")}
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

                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={styles.heroDownloadPdfBtn}
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL(`https://www.keralalotteryresultstoday.in/api/pdf/${todayDraw.lottery_code}/${todayDraw.draw_date}`)}
                  >
                    <Download size={15} color="#FFFFFF" />
                    <Text style={styles.heroDownloadPdfBtnText}>
                      {t("download_pdf")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroShareBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerLightHaptic();
                      shareDrawResultToWhatsApp(todayDraw, language);
                    }}
                  >
                    <Share2 size={15} color="#FFFFFF" />
                    <Text style={styles.heroShareBtnText}>
                      {language === "ml" ? "ഷെയർ" : "Share"}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                  color: "#475569",
                },
                {
                  key: "9th",
                  label: language === "ml" ? "ഒൻപതാം സമ്മാനം" : "9th Prize",
                  color: "#6B7280",
                },
              ].map(({ key, label, color }) => {
                const numbers = (todayDraw.prizes as any)?.[key] as
                  | string[]
                  | undefined;
                const amount = todayDraw.prizes?.amounts?.[key];
                if (!numbers || !Array.isArray(numbers) || numbers.length === 0)
                  return null;

                const is3Col =
                  ["5th", "6th", "7th", "8th", "9th", "guess", "mc"].includes(key) ||
                  numbers.length >= 6;

                return (
                  <View key={key} style={styles.tierCard}>
                    <View style={styles.tierHeader}>
                      <Text style={styles.tierTitle}>{label}</Text>
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
                            is3Col && styles.numberChip3Col,
                          ]}
                        >
                          <Text
                            style={[
                              styles.numberChipText,
                              is3Col && styles.numberChipText3Col,
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
          ) : todayPostponement ? (
            /* Today's Draw Postponed / Holiday Notice Card (Clean Modern UI) */
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 18,
                padding: 16,
                borderWidth: 1.5,
                borderColor: "#FEE2E2",
                shadowColor: "#E11D48",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              {/* Top Accent Indicator Bar */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: todayPostponement.status === "holiday" ? "#F43F5E" : "#E11D48",
                }}
              />

              {/* Header Badge & Lottery Code */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  marginTop: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#FFE4E6",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "#FECDD3",
                  }}
                >
                  <AlertCircle size={13} color="#E11D48" />
                  <Text
                    style={{
                      color: "#BE123C",
                      fontWeight: "800",
                      fontSize: language === "ml" ? 11 : 11.5,
                      letterSpacing: 0.3,
                    }}
                  >
                    {language === "ml"
                      ? `ഇന്നത്തെ നറുക്കെടുപ്പ് ${todayPostponement.status === "holiday" ? "അവധിയാണ്" : "മാറ്റിവെച്ചു"}`
                      : `DRAW ${todayPostponement.status.toUpperCase()} TODAY`}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "#F1F5F9",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "900", color: "#475569" }}>
                    {todayLottery.code}
                  </Text>
                </View>
              </View>

              {/* Main Lottery Title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: "#1E293B",
                  marginBottom: 10,
                  letterSpacing: -0.2,
                }}
              >
                {language === "ml" && todayLottery.nameMl ? todayLottery.nameMl : todayLottery.name}
              </Text>

              {/* Official Reason Notice Box */}
              <View
                style={{
                  backgroundColor: "#FFF1F2",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#FFE4E6",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <Text style={{ fontSize: 14 }}>📢</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: "800",
                        color: "#9F1239",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: 2,
                      }}
                    >
                      {language === "ml" ? "ഔദ്യോഗിക അറിയിപ്പ്" : "Official Notice"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#881337",
                        lineHeight: 18,
                        textTransform: "capitalize",
                      }}
                    >
                      {todayPostponement.reason}
                    </Text>
                  </View>
                </View>

                {/* Rescheduled Date if available */}
                {todayPostponement.rescheduled_date && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#FECDD3",
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>🗓️</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#9F1239",
                      }}
                    >
                      {language === "ml" ? "മാറ്റിവെച്ച തീയതി: " : "Rescheduled Date: "}
                      <Text style={{ fontWeight: "900", color: "#881337" }}>
                        {todayPostponement.rescheduled_date}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : isAfter3PM ? (
            /* Today's Draw Live In-Progress Card */
            <View style={styles.scheduledCard}>
              {/* Header Badges Row */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#FEF2F2",
                    borderWidth: 1,
                    borderColor: "#FECACA",
                    paddingVertical: 5,
                    paddingHorizontal: 11,
                    borderRadius: 20,
                  }}
                >
                  <Radio size={13} color="#DC2626" />
                  <Text
                    style={{
                      fontSize: language === "ml" ? 10.5 : 11,
                      fontWeight: "900",
                      color: "#DC2626",
                      letterSpacing: 0.4,
                    }}
                  >
                    {t("live_draw_in_progress")}
                  </Text>
                </View>

                {/* Live Socket Status Pill */}
                {socketStatus === "live_updating" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF3C7", paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 14, borderWidth: 1, borderColor: "#F59E0B" }}>
                    <Zap size={11} color="#B45309" />
                    <Text style={{ fontSize: 9.5, fontWeight: "900", color: "#92400E" }}>{t("streaming_live")}</Text>
                  </View>
                ) : getIsPollingWindow(isTodayBumper) && socketStatus === "connected" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 14, borderWidth: 1, borderColor: "#BBF7D0" }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" }} />
                    <Text style={{ fontSize: 9.5, fontWeight: "800", color: "#166534" }}>{t("live_sync_active")}</Text>
                  </View>
                ) : null}
              </View>

              {/* Lottery Title */}
              <Text
                style={[
                  styles.scheduledTitle,
                  { color: "#0F172A", marginTop: 0, marginBottom: 12 },
                  language === "ml" && { fontSize: 20, lineHeight: 28, fontWeight: "900" },
                ]}
              >
                {getLotteryTranslatedName(todayLottery.code, language) || todayLottery.name} ({todayLottery.code})
              </Text>

              {/* Status Info Box */}
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <Clock size={15} color={COLORS.primary} />
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: "800",
                      color: "#0F172A",
                    }}
                  >
                    {t("draw_happening_now")}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                    lineHeight: 18,
                    marginBottom: 10,
                  }}
                >
                  {t("live_draw_venue_desc")}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#EFF6FF",
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ transform: [{ scale: 0.7 }] }} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.primary }}>
                    {t("live_streaming_numbers")}
                  </Text>
                </View>
              </View>

              {/* Live Draw Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  triggerLightHaptic();
                  navigation.navigate("DrawBreakdown", {
                    code: todayLottery.code,
                    date: todayISTDate,
                  });
                }}
                style={[styles.viewBreakdownBtn, { flexDirection: "row", gap: 6 }]}
              >
                <Text style={styles.viewBreakdownText}>
                  {t("open_live_breakdown")}
                </Text>
                <ChevronRight size={15} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Today's Draw Coming Soon Scheduled Card */
            <View
              style={[
                styles.scheduledCard,
                isTodayBumper && {
                  borderColor: "#F59E0B",
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <View style={styles.scheduledBadgeRow}>
                  {isTodayBumper ? (
                    <Sparkles size={16} color="#92400E" />
                  ) : (
                    <Clock size={16} color="#92400E" />
                  )}
                  <Text
                    style={[
                      styles.scheduledBadgeText,
                      language === "ml" && { fontSize: 11 },
                    ]}
                  >
                    {isTodayBumper
                      ? (language === "ml"
                        ? "👑 കേരള ബംപർ ലോട്ടറി ഇന്ന്"
                        : "👑 KERALA BUMPER LOTTERY TODAY")
                      : t("result_coming_soon")}
                  </Text>
                </View>

                {/* Live Socket Status Pill */}
                {socketStatus === "live_updating" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#F59E0B" }}>
                    <Zap size={11} color="#B45309" />
                    <Text style={{ fontSize: 9.5, fontWeight: "900", color: "#92400E" }}>⚡ STREAMING LIVE</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.scheduledTitle,
                  language === "ml" && { fontSize: 20, lineHeight: 28 },
                ]}
              >
                {language === "ml" && todayLottery.nameMl ? todayLottery.nameMl : todayLottery.name} ({todayLottery.code})
              </Text>

              {/* Bumper Quick Badges */}
              {isTodayBumper && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  <View style={{ backgroundColor: "#D97706", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 11 }}>
                      🏆 {todayLottery.jackpot || "₹25 Crore"}
                    </Text>
                  </View>
                  {todayLottery.ticket_price && (
                    <View style={{ backgroundColor: "#FDE68A", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#F59E0B" }}>
                      <Text style={{ color: "#78350F", fontWeight: "800", fontSize: 11 }}>
                        🎟️ {todayLottery.ticket_price}
                      </Text>
                    </View>
                  )}
                  <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#FCD34D" }}>
                    <Text style={{ color: "#78350F", fontWeight: "800", fontSize: 11 }}>
                      ⏰ {todayLottery.drawTime || "2:00 PM"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Digital Countdown Timer Box */}
              {!countdown.isDrawPassed && (
                <View
                  style={[
                    styles.countdownContainer,
                    isTodayBumper && {
                      backgroundColor: "#FFFBEB",
                      borderColor: "#FDE68A",
                    },
                  ]}
                >
                  <View style={styles.countdownHeaderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={[
                          styles.countdownLiveDot,
                          isTodayBumper && { backgroundColor: "#D97706" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.countdownHeaderText,
                          isTodayBumper && { color: "#92400E" },
                        ]}
                      >
                        {language === "ml" ? "നറുക്കെടുപ്പ് കൗണ്ട്ഡൗൺ" : "LIVE DRAW COUNTDOWN"} ({todayLottery.drawTime || (isTodayBumper ? "2:00 PM" : "3:00 PM")})
                      </Text>
                    </View>
                    <Text style={styles.countdownIstText}>Official IST</Text>
                  </View>

                  <View style={styles.countdownDigitsRow}>
                    <View style={styles.countdownDigitCard}>
                      <Text
                        style={[
                          styles.countdownDigitNum,
                          isTodayBumper && { color: "#B45309" },
                        ]}
                      >
                        {String(countdown.hours).padStart(2, "0")}
                      </Text>
                      <Text style={styles.countdownDigitLabel}>HRS</Text>
                    </View>
                    <View
                      style={[
                        styles.countdownDivider,
                        isTodayBumper && { backgroundColor: "#FDE68A" },
                      ]}
                    />
                    <View style={styles.countdownDigitCard}>
                      <Text
                        style={[
                          styles.countdownDigitNum,
                          isTodayBumper && { color: "#B45309" },
                        ]}
                      >
                        {String(countdown.minutes).padStart(2, "0")}
                      </Text>
                      <Text style={styles.countdownDigitLabel}>MIN</Text>
                    </View>
                    <View
                      style={[
                        styles.countdownDivider,
                        isTodayBumper && { backgroundColor: "#FDE68A" },
                      ]}
                    />
                    <View style={styles.countdownDigitCard}>
                      <Text
                        style={[
                          styles.countdownDigitNum,
                          isTodayBumper && { color: "#B45309" },
                        ]}
                      >
                        {String(countdown.seconds).padStart(2, "0")}
                      </Text>
                      <Text style={styles.countdownDigitLabel}>SEC</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Scheduled Information Section */}
              <View style={styles.scheduledInfoSection}>
                <View style={styles.scheduledInfoTitleRow}>
                  <View
                    style={[
                      styles.scheduledAccentBar,
                      isTodayBumper && { backgroundColor: "#D97706" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.scheduledSubtitle,
                      language === "ml" && { fontSize: 14, lineHeight: 20 },
                    ]}
                  >
                    {isTodayBumper
                      ? (language === "ml" ? `പ്രത്യേക ബംപർ നറുക്കെടുപ്പ് ഉച്ചയ്ക്ക് ${todayLottery.drawTime || "2:00 PM"} മണിക്ക്` : `Special Bumper Draw Scheduled Today at ${todayLottery.drawTime || "2:00 PM"}`)
                      : (language === "ml" ? "ഇന്നത്തെ നറുക്കെടുപ്പ് ഉച്ചയ്ക്ക് 3:00 മണിക്ക്" : "Draw Scheduled Today at 3:00 PM")}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.scheduledDesc,
                    language === "ml" && { fontSize: 12, lineHeight: 18 },
                  ]}
                >
                  {isTodayBumper
                    ? (language === "ml"
                        ? `${todayLottery.nameMl || todayLottery.name} (${todayLottery.code}) ബംപർ നറുക്കെടുപ്പ് ഫലം തത്സമയം ലഭ്യമാകും.`
                        : `Winning results for ${todayLottery.name} (${todayLottery.code}) will be published live at ${todayLottery.drawTime || "2:00 PM"}.`)
                    : (language === "ml"
                        ? `${todayLottery.nameMl || todayLottery.name} (${todayLottery.code}) നറുക്കെടുപ്പ് ഫലം തത്സമയം ലഭ്യമാകും.`
                        : `Winning results for ${todayLottery.name} (${todayLottery.code}) will be published automatically.`)}
                </Text>
              </View>
            </View>
          ))}

        {/* HERO TAB 1: YESTERDAY'S / PREVIOUS DRAW RESULT */}
        {heroTab === 1 && previousDraw && (
          <View style={styles.winnerCard}>
            <View style={styles.winnerHeroSection}>
              <View style={styles.winnerHeader}>
                <Trophy size={15} color={COLORS.primary} />
                <Text style={styles.winnerTextBadge}>
                  {isPreviousDrawYesterday
                    ? language === "ml"
                      ? "ഇന്നലത്തെ നറുക്കെടുപ്പ് ഫലം"
                      : "YESTERDAY'S DRAW RESULT"
                    : language === "ml"
                      ? "മുൻകാല നറുക്കെടുപ്പ് ഫലം"
                      : "PREVIOUS DRAW RESULT"}{" "}
                  • {previousDraw.draw_date}
                </Text>
              </View>

              <Text
                style={[
                  styles.winnerTitle,
                  language === "ml" && { fontSize: 16.5, lineHeight: 24 },
                ]}
              >
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

              {((previousDraw.first?.location &&
                previousDraw.first.location.toLowerCase() !== "n/a" &&
                previousDraw.first.location.toLowerCase() !== "nan" &&
                previousDraw.first.location.toLowerCase() !== "null") ||
                (previousDraw.first?.agent &&
                  previousDraw.first.agent.toLowerCase() !== "n/a" &&
                  previousDraw.first.agent.toLowerCase() !== "nan" &&
                  previousDraw.first.agent.toLowerCase() !== "null")) && (
                <View style={styles.winnerMetaBox}>
                  <Text style={styles.winnerMeta}>
                    {previousDraw.first?.location &&
                    previousDraw.first.location.toLowerCase() !== "n/a" &&
                    previousDraw.first.location.toLowerCase() !== "nan" &&
                    previousDraw.first.location.toLowerCase() !== "null"
                      ? `${t("location")}: ${previousDraw.first.location}`
                      : ""}
                    {previousDraw.first?.agent &&
                    previousDraw.first.agent.toLowerCase() !== "n/a" &&
                    previousDraw.first.agent.toLowerCase() !== "nan" &&
                    previousDraw.first.agent.toLowerCase() !== "null"
                      ? `${previousDraw.first?.location && previousDraw.first.location.toLowerCase() !== "n/a" && previousDraw.first.location.toLowerCase() !== "nan" && previousDraw.first.location.toLowerCase() !== "null" ? "  |  " : ""}${t("agent")}: ${previousDraw.first.agent}`
                      : ""}
                  </Text>
                </View>
              )}

                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={styles.heroDownloadPdfBtn}
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL(`https://www.keralalotteryresultstoday.in/api/pdf/${previousDraw.lottery_code}/${previousDraw.draw_date}`)}
                  >
                    <Download size={15} color="#FFFFFF" />
                    <Text style={styles.heroDownloadPdfBtnText}>
                      {t("download_pdf")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroShareBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerLightHaptic();
                      shareDrawResultToWhatsApp(previousDraw, language);
                    }}
                  >
                    <Share2 size={15} color="#FFFFFF" />
                    <Text style={styles.heroShareBtnText}>
                      {language === "ml" ? "ഷെയർ" : "Share"}
                    </Text>
                  </TouchableOpacity>
                </View>
            </View>

            {/* Complete Full Prize Breakdown for Yesterday / Previous Draw */}
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
                color: "#475569",
              },
              {
                key: "9th",
                label: language === "ml" ? "ഒൻപതാം സമ്മാനം" : "9th Prize",
                color: "#6B7280",
              },
            ].map(({ key, label }) => {
              const numbers = (previousDraw.prizes as any)?.[key] as
                | string[]
                | undefined;
              const amount = previousDraw.prizes?.amounts?.[key];
              if (!numbers || !Array.isArray(numbers) || numbers.length === 0)
                return null;

              const is3Col =
                ["5th", "6th", "7th", "8th", "9th", "guess", "mc"].includes(key) ||
                numbers.length >= 6;

              return (
                <View key={key} style={styles.tierCard}>
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierTitle}>{label}</Text>
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
                          is3Col && styles.numberChip3Col,
                        ]}
                      >
                        <Text
                          style={[
                            styles.numberChipText,
                            is3Col && styles.numberChipText3Col,
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
        )}
      </>
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
                        const isFav = favoriteLotteries.includes(lottery.code);
                        return (
                          <TouchableOpacity
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              backgroundColor: isFav ? "#FEF3C7" : "#F8FAFC",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 1,
                              borderColor: isFav ? "#F59E0B" : "#E2E8F0",
                            }}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(lottery.code);
                            }}
                            accessibilityLabel="Toggle Favorite Lottery"
                          >
                            <Star
                              size={12}
                              color={isFav ? "#D97706" : "#94A3B8"}
                              fill={isFav ? "#F59E0B" : "transparent"}
                            />
                          </TouchableOpacity>
                        );
                      })()}
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

                  {isTodayLottery ? (
                    latest && latest.draw_date === todayISTDate && hasAnyDrawResult(latest) && isAfter3PM ? (
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
                      <View
                        style={[
                          styles.latestHighlight,
                          {
                            backgroundColor: "#FFFBEB",
                            borderColor: "#FCD34D",
                          },
                        ]}
                      >
                        <View style={styles.latestHeaderRow}>
                          <Text
                            style={[
                              styles.highlightLabel,
                              { color: "#B45309" },
                            ]}
                          >
                            {isAfter3PM
                              ? (language === "ml" ? "തത്സമയം നടക്കുന്നു" : "DRAW IN PROGRESS")
                              : (language === "ml" ? "ഇന്നത്തെ നറുക്കെടുപ്പ്" : "DRAW SCHEDULED TODAY")}
                          </Text>
                          <Text
                            style={[
                              styles.highlightDate,
                              { color: "#92400E" },
                            ]}
                          >
                            3:00 PM
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: "700",
                            color: "#92400E",
                            marginTop: 3,
                          }}
                        >
                          {isAfter3PM
                            ? (language === "ml" ? "ഫലം ഉടൻ വരും →" : "Results coming soon →")
                            : (language === "ml" ? "ഫലം ഉച്ചയ്ക്ക് 3:10 ന് →" : "Results publish today at 3:10 PM →")}
                        </Text>
                      </View>
                    )
                  ) : latest ? (
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
        </View> */}

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.keralalotteryresultstoday.in/claim")}>
            <Text style={styles.footerLink}>{language === "ml" ? "സമ്മാന ക്ലെയിം" : "Claim"}</Text>
          </TouchableOpacity>
          <Text style={styles.footerBullet}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.keralalotteryresultstoday.in/guide")}>
            <Text style={styles.footerLink}>{language === "ml" ? "ഗൈഡ്" : "Guide"}</Text>
          </TouchableOpacity>
          <Text style={styles.footerBullet}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.keralalotteryresultstoday.in/faq")}>
            <Text style={styles.footerLink}>{language === "ml" ? "പതിവ് ചോദ്യങ്ങൾ" : "FAQ"}</Text>
          </TouchableOpacity>
          <Text style={styles.footerBullet}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.keralalotteryresultstoday.in/terms-conditions")}>
            <Text style={styles.footerLink}>{language === "ml" ? "നിബന്ധനകൾ" : "Terms"}</Text>
          </TouchableOpacity>
          <Text style={styles.footerBullet}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.keralalotteryresultstoday.in/privacy-policy")}>
            <Text style={styles.footerLink}>{language === "ml" ? "സ്വകാര്യത" : "Privacy"}</Text>
          </TouchableOpacity>
          <Text style={styles.footerBullet}>•</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Contact")}>
            <Text style={styles.footerLink}>{language === "ml" ? "ബന്ധപ്പെടുക" : "Contact"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

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

      {/* Google Gemini Style Floating AI Assistant Launcher Button */}
      <GeminiAiFloatingButton
        onPress={() => setIsAiAssistantOpen(true)}
      />

      {/* AI Voice & Chat Assistant Modal */}
      <AiVoiceAssistantModal
        visible={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />

      {/* AI Social Digest Generator Modal */}
      <AiSocialDigestModal
        visible={isAiDigestOpen}
        onClose={() => setIsAiDigestOpen(false)}
        drawData={allDraws[0] || {}}
      />

      {/* Quick Language Dropdown / Select Menu */}
      <Modal
        visible={showLangDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLangDropdown(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            paddingTop: insets.top + 48,
            paddingRight: 16,
          }}
          activeOpacity={1}
          onPress={() => setShowLangDropdown(false)}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 14,
              padding: 6,
              width: 195,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 10,
              elevation: 10,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Globe size={13} color={COLORS.textLight} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: COLORS.textLight,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t("change_language")}
              </Text>
            </View>

            {SUPPORTED_LANGUAGES.map((item) => {
              const isActive = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: isActive ? COLORS.primaryLight : "transparent",
                    marginTop: 2,
                  }}
                  onPress={() => {
                    triggerLightHaptic();
                    setLanguage(item.code);
                    setShowLangDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 16 }}>{item.flag}</Text>
                    <View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? "700" : "600",
                          color: isActive ? COLORS.primary : COLORS.textDark,
                        }}
                      >
                        {item.nativeName}
                      </Text>
                      <Text style={{ fontSize: 10, color: COLORS.textLight }}>
                        {item.name} ({item.shortCode})
                      </Text>
                    </View>
                  </View>
                  {isActive && (
                    <Check size={16} color={COLORS.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  scheduledBadgeRow: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  scheduledBadgeText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#92400E",
    letterSpacing: 0.5,
  },
  scheduledTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 6,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  countdownContainer: {
    backgroundColor: "#F0FDF4",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: 16,
  },
  countdownHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  countdownLiveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#16A34A",
    marginRight: 7,
  },
  countdownHeaderText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 0.3,
  },
  countdownIstText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  countdownDigitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  countdownDigitCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  countdownDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#D1FAE5",
  },
  countdownDigitNum: {
    fontSize: 28,
    fontWeight: "900",
    color: "#047857",
  },
  countdownDigitLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  scheduledInfoSection: {
    marginTop: 2,
  },
  scheduledInfoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scheduledAccentBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#16A34A",
    marginRight: 8,
  },
  scheduledSubtitle: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#0F172A",
  },
  scheduledDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    marginTop: 2,
  },
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
    backgroundColor: "#EBF5FF",
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
    gap: 6,
  },
  numberChip: {
    width: "48.8%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  numberChip3Col: {
    width: "31.8%",
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  numberChipText: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  numberChipText3Col: {
    fontSize: 13.5,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    textDecorationLine: "underline",
  },
  footerBullet: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },
  actionBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    width: "100%",
  },
  heroDownloadPdfBtn: {
    flex: 1,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    gap: 6,
  },
  heroDownloadPdfBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  heroShareBtn: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    gap: 5,
  },
  heroShareBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  floatingAiBtn: {
    position: "absolute",
    bottom: 20,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#0B3C5D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  floatingAiBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
