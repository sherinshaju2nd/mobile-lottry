import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Trophy,
  Camera,
  AlertCircle,
  RotateCw,
  Download,
  Clock,
  Share2,
  Sparkles,
  Zap,
  Radio,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  ALL_LOTTERIES,
  BUMPER_LOTTERIES,
  LotteryMeta,
  getDrawTimeDisplay,
  calculateDrawCountdown,
  getIsAfterDrawTime,
  getLotteryTranslatedName,
} from "../constants/lotteries";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";
import {
  fetchDrawByDate,
  fetchAllDraws,
  DrawResult,
  supabase,
  checkIsDatePostponed,
  PostponedDraw,
  findTopPrizePartialHint,
  getSearchFeedbackMessage,
  hasAnyDrawResult,
  WinnerInfo,
  PrizeBreakdown,
} from "../api/lotteryApi";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import BarcodeResultModal from "../components/BarcodeResultModal";
import ConfettiCelebration from "../components/ConfettiCelebration";
import { shareDrawResultToWhatsApp } from "../utils/whatsappShareHelper";
import { useLanguage } from "../context/LanguageContext";

export default function DrawBreakdownScreen({ route, navigation }: any) {
  const { t, language } = useLanguage();
  const { code, date, highlight } = route.params || { code: "BT", date: "2026-08-10" };
  const codeUpper = code.toUpperCase();

  const todayISTDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const lotteryMeta: LotteryMeta = ALL_LOTTERIES.find((l) => l.code === codeUpper) || {
    name: `${codeUpper} Lottery`,
    nameMl: "",
    code: codeUpper,
    day: "Scheduled Draw",
    drawTime: getDrawTimeDisplay(false),
  };

  const isBumper = Boolean(
    lotteryMeta?.isBumper ||
    BUMPER_LOTTERIES.some((b) => b.code.toUpperCase() === codeUpper)
  );

  const [countdown, setCountdown] = useState(() =>
    calculateDrawCountdown(isBumper)
  );

  useEffect(() => {
    if (date !== todayISTDate) return;
    const updateCountdown = () => {
      setCountdown(calculateDrawCountdown(isBumper));
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isBumper, date, todayISTDate]);

  const isAfter3PM = date === todayISTDate && getIsAfterDrawTime(isBumper);

  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [postponement, setPostponement] = useState<PostponedDraw | null>(null);
  const [allDraws, setAllDraws] = useState<DrawResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // In-page ticket check
  const [checkTicket, setCheckTicket] = useState("");
  const [checkMessage, setCheckMessage] = useState<{
    win: boolean;
    text: string;
  } | null>(null);

  // Barcode scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isBarcodeResultOpen, setIsBarcodeResultOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Confetti & Multi-Ticket Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDetails, setCelebrationDetails] = useState<{
    prizeTier?: string;
    amount?: string;
    ticket?: string;
  }>({});

  const handleCopyTicket = (ticketNum: string) => {
    if (!ticketNum || ticketNum === "N/A") return;
    setCopiedToast(
      language === "ml"
        ? `ടിക്കറ്റ് ${ticketNum} കോപ്പി ചെയ്തു!`
        : `Ticket ${ticketNum} copied!`
    );
    setTimeout(() => {
      setCopiedToast(null);
    }, 2200);
  };

  // Refs for auto-scroll to checker
  const scrollViewRef = useRef<ScrollView>(null);
  const checkerYOffset = useRef<number>(0);

  useEffect(() => {
    fetchAllDraws()
      .then(setAllDraws)
      .catch(() => setAllDraws([]));
  }, []);

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
    setCheckTicket(extractedTicket);
    setIsBarcodeResultOpen(true);
    handleVerifyTicket(extractedTicket);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [result, postp] = await Promise.all([
          fetchDrawByDate(codeUpper, date),
          checkIsDatePostponed(date, codeUpper),
        ]);
        if (result) setDrawResult(result);
        setPostponement(postp);
      } catch {
        // Keep current state on transient failure
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    const channelName = `realtime-details-${codeUpper}-${date}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "draw_results",
        },
        (payload) => {
          const newRow = payload.new as any;
          if (
            newRow &&
            newRow.draw_date === date &&
            (!newRow.lottery_code ||
              newRow.lottery_code.toUpperCase() === codeUpper)
          ) {
            // Immediate UI hydration from socket payload
            try {
              let firstObj: WinnerInfo = {};
              let prizesObj: PrizeBreakdown = {};
              firstObj =
                typeof newRow.first_prize === "string"
                  ? JSON.parse(newRow.first_prize)
                  : newRow.first_prize || {};
              prizesObj =
                typeof newRow.prizes === "string"
                  ? JSON.parse(newRow.prizes)
                  : newRow.prizes || {};

              const liveDraw: DrawResult = {
                id: newRow.id,
                draw_date: newRow.draw_date,
                draw_name: newRow.draw_name,
                draw_code: newRow.draw_code,
                lottery_code: newRow.lottery_code,
                first: firstObj,
                prizes: prizesObj,
                created_at: newRow.created_at,
              };
              if (hasAnyDrawResult(liveDraw)) {
                setDrawResult(liveDraw);
              }
            } catch {}

            loadData();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "postponed_draws",
        },
        () => {
          loadData();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Mobile Socket] Subscribed to ${codeUpper} (${date})`);
        }
      });

    // Smart polling for today's draw
    const todayDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const pollInterval = setInterval(() => {
      if (date === todayDate && (!drawResult || !hasAnyDrawResult(drawResult))) {
        loadData();
      }
    }, 15000);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        loadData();
      }
    };
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      appStateSub.remove();
    };
  }, [codeUpper, date]);

  // Auto-highlight: when draw data loads and a highlight ticket was passed in route params
  useEffect(() => {
    if (!highlight || !drawResult) return;
    const query = String(highlight).trim();
    if (query.replace(/\D/g, "").length < 4) return;

    // Auto-fill and run verify
    setCheckTicket(query);
    handleVerifyTicket(query);

    // Scroll to checker section after a short delay
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: checkerYOffset.current, animated: true });
    }, 500);
  }, [drawResult, highlight]);

  const [checkMatches, setCheckMatches] = useState<Array<{
    tier: string;
    amount?: string;
    matchedNumber: string;
    seriesNote?: string;
  }> | null>(null);
  const [checkErrorMsg, setCheckErrorMsg] = useState<string | null>(null);

  const validateTicketMatch = (queryInput: string, prizeNumberStr: string) => {
    const rawQuery = queryInput.trim().toUpperCase();
    const rawPrize = prizeNumberStr.trim().toUpperCase();

    const queryDigits = rawQuery.replace(/\D/g, "");
    const querySeries = rawQuery.replace(/[^A-Z]/gi, "").trim();

    const prizeDigits = rawPrize.replace(/\D/g, "");
    const prizeSeries = rawPrize.replace(/[^A-Z]/gi, "").trim();

    if (!queryDigits || !prizeDigits || queryDigits.length < 4) {
      return { isMatch: false, exactSeriesMatch: false };
    }

    let digitsMatch = false;

    if (prizeDigits.length === 6) {
      // 6-digit prize requires 6 digits from user
      if (queryDigits.length === 6 && queryDigits === prizeDigits) {
        digitsMatch = true;
      } else {
        return { isMatch: false, exactSeriesMatch: false };
      }
    } else {
      // 4-digit or partial prize
      if (queryDigits === prizeDigits) {
        digitsMatch = true;
      } else if (queryDigits.length >= prizeDigits.length) {
        digitsMatch = queryDigits.endsWith(prizeDigits);
      } else {
        return { isMatch: false, exactSeriesMatch: false };
      }
    }

    if (!digitsMatch) {
      return { isMatch: false, exactSeriesMatch: false };
    }

    if (prizeSeries) {
      if (querySeries) {
        if (querySeries === prizeSeries) {
          return { isMatch: true, exactSeriesMatch: true };
        } else {
          return { isMatch: false, exactSeriesMatch: false };
        }
      } else {
        return {
          isMatch: true,
          exactSeriesMatch: false,
          seriesNote: `Requires series '${prizeSeries}'`,
        };
      }
    }

    return { isMatch: true, exactSeriesMatch: true };
  };

  const handleVerifyTicket = (overrideTicket?: string) => {
    const targetTicket = overrideTicket || checkTicket;
    if (!targetTicket.trim() || !drawResult || !drawResult.prizes) return;
    const query = targetTicket.trim();

    // Support multi-ticket parsing (e.g. "WA 136429, 6429, 8812")
    const subTickets = query.split(/[,;\n]+/).map((s) => s.trim()).filter((s) => s.length > 0);
    const targetQueries = subTickets.length > 1 ? subTickets : [query];

    // Require at least 4 digits in queries
    const validQueries = targetQueries.filter((q) => q.replace(/\D/g, "").length >= 4);

    if (validQueries.length === 0) {
      setCheckMatches(null);
      setCheckErrorMsg(
        language === "ml"
          ? "തിരയാൻ കുറഞ്ഞത് 4 അക്കങ്ങൾ നൽകുക (ഉദാ: 6935, BT 236935)"
          : "Please enter at least 4 digits to search (e.g. 6935, BT 236935)."
      );
      return;
    }

    const matchesList: Array<{
      tier: string;
      amount?: string;
      matchedNumber: string;
      seriesNote?: string;
    }> = [];

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

    for (const q of validQueries) {
      // 1st Prize check
      if (drawResult.first?.ticket) {
        const matchRes = validateTicketMatch(q, drawResult.first.ticket);
        if (matchRes.isMatch) {
          matchesList.push({
            tier: language === "ml" ? "1-ാം സമ്മാന വിജയി" : "1st Prize Winner",
            amount: drawResult.prizes.amounts?.["1st"] || "1st Prize",
            matchedNumber: drawResult.first.ticket,
            seriesNote: matchRes.seriesNote ? `${matchRes.seriesNote} (${q})` : undefined,
          });
        }
      }

      // Check Other Tiers
      for (const t of tiers) {
        const nums = (drawResult.prizes as any)[t] as string[] | undefined;
        const amount = drawResult.prizes.amounts?.[t] || "";
        const label = t === "consolation" ? (language === "ml" ? "സമാശ്വാസ സമ്മാനം" : "Consolation Prize") : `${t} Prize`;

        if (nums && Array.isArray(nums)) {
          for (const num of nums) {
            const matchRes = validateTicketMatch(q, num);
            if (matchRes.isMatch) {
              matchesList.push({
                tier: label,
                amount: amount,
                matchedNumber: num,
                seriesNote: matchRes.seriesNote ? `${matchRes.seriesNote} (${q})` : undefined,
              });
            }
          }
        }
      }
    }

    if (matchesList.length > 0) {
      setCheckMatches(matchesList);
      setCheckErrorMsg(null);
      triggerSuccessHaptic();

      // Trigger Celebration Confetti Modal
      setCelebrationDetails({
        prizeTier: matchesList[0].tier,
        amount: matchesList[0].amount,
        ticket: targetTicket,
      });
      setShowCelebration(true);
    } else {
      setCheckMatches(null);
      const topHint = findTopPrizePartialHint(validQueries[0], drawResult);
      setCheckErrorMsg(getSearchFeedbackMessage(targetTicket, language, date, topHint));
    }
  };

  const prizeTiers = [
    { key: "consolation", label: language === "ml" ? "സമാശ്വാസ സമ്മാനം" : "Consolation Prize", color: "#64748B" },
    { key: "2nd", label: language === "ml" ? "രണ്ടാം സമ്മാനം" : "2nd Prize", color: "#D97706" },
    { key: "3rd", label: language === "ml" ? "മൂന്നാം സമ്മാനം" : "3rd Prize", color: "#2563EB" },
    { key: "4th", label: language === "ml" ? "നാലാം സമ്മാനം" : "4th Prize", color: "#9333EA" },
    { key: "5th", label: language === "ml" ? "അഞ്ചാം സമ്മാനം" : "5th Prize", color: "#334155" },
    { key: "6th", label: language === "ml" ? "ആറാം സമ്മാനം" : "6th Prize", color: "#0D9488" },
    { key: "7th", label: language === "ml" ? "ഏഴാം സമ്മാനം" : "7th Prize", color: "#EA580C" },
    { key: "8th", label: language === "ml" ? "എട്ടാം സമ്മാനം" : "8th Prize", color: "#DC2626" },
    { key: "9th", label: language === "ml" ? "ഒൻപതാം സമ്മാനം" : "9th Prize", color: "#475569" },
    { key: "guess", label: language === "ml" ? "ഭാഗ്യ സംഖ്യകൾ (Guess Numbers)" : "Guessing Numbers", color: "#8B5CF6" },
    { key: "mc", label: language === "ml" ? "മെഷീൻ ക്ലബ്ബ് (MC) സംഖ്യകൾ" : "Machine Center (MC) Numbers", color: "#EC4899" },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
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
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                language === "ml" && { fontSize: 14, lineHeight: 20 },
              ]}
            >
              {language === "ml" && lotteryMeta.nameMl ? lotteryMeta.nameMl : lotteryMeta.name} {language === "ml" ? "ഫലം" : "Result"}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.subtitle,
                language === "ml" && { fontSize: 10.5, lineHeight: 15 },
              ]}
            >
              {t("draw_date")}: {date} ({t("draw_code")}: {codeUpper})
            </Text>
          </View>
          {drawResult && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TouchableOpacity
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: "#25D366",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => {
                  triggerLightHaptic();
                  shareDrawResultToWhatsApp(drawResult, language);
                }}
              >
                <Share2 size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pdfDownloadBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => Linking.openURL(`https://www.keralalotteryresultstoday.in/api/pdf/${codeUpper}/${date}`)}
              >
                <Download size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Floating Copied Toast */}
        {copiedToast && (
          <View
            style={{
              position: "absolute",
              top: 70,
              alignSelf: "center",
              zIndex: 999,
              backgroundColor: "#065F46",
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 25,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 12.5 }}>
              ✅ {copiedToast}
            </Text>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 40 }}
          />
        ) : drawResult ? (
          <View style={styles.content}>
            {/* 1st Prize Winner Highlights Card */}
            <View style={styles.winnerCard}>
              <View style={styles.winnerHeroSection}>
                <View style={styles.winnerBadgeRow}>
                  <Trophy size={15} color={COLORS.primary} />
                  <Text style={styles.winnerBadgeText}>
                    {language === "ml" ? "1-ാം സമ്മാന വിജയി" : "1ST PRIZE WINNER"}
                  </Text>
                </View>

                <View style={styles.prizeBadgeContainer}>
                  <Text style={styles.prizeAmount}>
                    {drawResult.prizes?.amounts?.["1st"] || "₹70 Lakhs"}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleCopyTicket(drawResult.first?.ticket || "")}
                  style={styles.heroTicketBox}
                >
                  <Text style={styles.winnerTicket}>
                    {drawResult.first?.ticket || (language === "ml" ? "ഫലം വരുന്നു..." : "DRAWING IN PROGRESS")}
                  </Text>
                </TouchableOpacity>

                <View style={styles.winnerDetailsRow}>
                  <Text style={styles.winnerMeta}>
                    {t("location")}: {drawResult.first?.location || "N/A"}
                    {drawResult.first?.agent ? `  |  ${t("agent")}: ${drawResult.first.agent}` : ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* In-page Ticket Verification Widget with Barcode Scanner */}
            <View
              style={styles.verifierCard}
              onLayout={(e) => { checkerYOffset.current = e.nativeEvent.layout.y; }}
            >
              {/* Header row: title + reset */}
              <View style={styles.verifierHeader}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.verifierTitle,
                    language === "ml" && { fontSize: 12.5, lineHeight: 18 },
                  ]}
                >
                  {language === "ml"
                    ? `${lotteryMeta.nameMl || lotteryMeta.name} ടിക്കറ്റ് പരിശോധിക്കുക`
                    : `Verify ${lotteryMeta.name} Ticket`}
                </Text>
                {(checkTicket.trim().length > 0 || checkMatches || checkErrorMsg) && (
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => {
                      setCheckTicket("");
                      setCheckMatches(null);
                      setCheckErrorMsg(null);
                    }}
                  >
                    <RotateCw size={13} color={COLORS.primary} />
                    <Text style={styles.resetBtnText}>
                      {language === "ml" ? "മായ്ക്കുക" : "Reset"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.verifierInputRow}>
                <TextInput
                  style={styles.verifierInput}
                  placeholder={language === "ml" ? "ടിക്കറ്റ് നമ്പർ നൽകുക..." : "Enter ticket number (e.g. 263322)"}
                  placeholderTextColor={COLORS.textLight}
                  value={checkTicket}
                  onChangeText={setCheckTicket}
                  autoCapitalize="characters"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                    }, 150);
                  }}
                />

                <TouchableOpacity
                  style={styles.cameraIconBtn}
                  onPress={() => setIsScannerOpen(true)}
                >
                  <Camera size={20} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.verifyBtn,
                    language === "ml" && { paddingHorizontal: 10 },
                    checkTicket.replace(/\D/g, "").length < 4 && styles.verifyBtnDisabled,
                  ]}
                  onPress={() => handleVerifyTicket()}
                  disabled={checkTicket.replace(/\D/g, "").length < 4}
                >
                  <Text
                    style={[
                      styles.verifyBtnText,
                      language === "ml" && { fontSize: 11.5 },
                    ]}
                  >
                    {language === "ml" ? "പരിശോധിക്കുക" : "Verify"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 4-digit validation hint */}
              {checkTicket.trim().length > 0 && checkTicket.replace(/\D/g, "").length < 4 && (
                <Text style={styles.validationHint}>
                  {language === "ml"
                    ? "കുറഞ്ഞത് 4 അക്കങ്ങൾ നൽകുക (ഉദാ: 6935, BT 236935)"
                    : "Enter at least 4 digits (e.g. 6935 or BT 263322)"}
                </Text>
              )}

              {checkMatches && checkMatches.length > 0 ? (() => {
                const firstPrize = checkMatches.find(m => m.tier.toLowerCase().includes("1st"));
                const consolations = checkMatches.filter(m => m.tier.toLowerCase().includes("consolation"));
                const others = checkMatches.filter(m => !m.tier.toLowerCase().includes("1st") && !m.tier.toLowerCase().includes("consolation"));

                return (
                  <View style={styles.winMsgBox}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Text style={{ fontSize: 22 }}>🎉</Text>
                      <View>
                        <Text style={styles.winMsgTitle}>
                          {language === "ml" ? "വിജയി!" : "WINNER!"}
                        </Text>
                        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700" }}>
                          {checkMatches.length} {checkMatches.length > 1 ? (language === "ml" ? "ഫലങ്ങൾ" : "matching results") : (language === "ml" ? "ഫലം" : "matching result")}
                        </Text>
                      </View>
                    </View>

                    {/* 1st Prize Hero Card */}
                    {firstPrize && (
                      <View style={styles.firstPrizeCard}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Text style={{ fontSize: 16 }}>🏆</Text>
                          <Text style={styles.firstPrizeLabel}>{firstPrize.tier}</Text>
                        </View>
                        <Text style={styles.firstPrizeAmount}>{firstPrize.amount}</Text>
                        <Text style={styles.firstPrizeTicket}>{firstPrize.matchedNumber}</Text>
                        {firstPrize.seriesNote && (
                          <View style={styles.seriesNoteChip}>
                            <Text style={{ fontSize: 10, color: "#92400E", fontWeight: "800" }}>⚠ {firstPrize.seriesNote}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Consolation Prizes — grouped chips */}
                    {consolations.length > 0 && (
                      <View style={styles.consolationGroup}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <Text style={styles.consolationGroupTitle}>
                            🎫 {language === "ml" ? "സമാശ്വാസ സമ്മാനം" : "Consolation Prize"}
                          </Text>
                          <Text style={styles.consolationAmount}>
                            {consolations[0]?.amount || ""}
                          </Text>
                        </View>
                        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "600", marginBottom: 6 }}>
                          {language === "ml" ? "പൊരുത്തപ്പെടുന്ന ടിക്കറ്റുകൾ" : "Matched tickets"}
                        </Text>
                        <View style={styles.consolationGrid}>
                          {consolations.map((c, ci) => (
                            <View key={ci} style={styles.consolationChip}>
                              <Text style={styles.consolationChipText}>{c.matchedNumber}</Text>
                            </View>
                          ))}
                        </View>
                        {consolations[0]?.seriesNote && (
                          <Text style={{ color: "#FEF3C7", fontSize: 10, fontWeight: "700", marginTop: 6 }}>
                            ⚠ {language === "ml" ? "ഓരോ ടിക്കറ്റിനും ശരിയായ സീരിസ് ആവശ്യമാണ്" : "Each requires matching series letter"}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Other Prizes */}
                    {others.map((m, i) => (
                      <View key={i} style={styles.otherPrizeRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.otherPrizeTier}>✔ {m.tier}</Text>
                          <Text style={styles.otherPrizeTicket}>{m.matchedNumber}</Text>
                          {m.seriesNote && (
                            <Text style={styles.seriesNoteText}>⚠ {m.seriesNote}</Text>
                          )}
                        </View>
                        {m.amount && (
                          <Text style={styles.otherPrizeAmount}>{m.amount}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })() : checkErrorMsg ? (
                <View style={styles.noWinMsgBox}>
                  <Text style={styles.noWinMsgText}>{checkErrorMsg}</Text>
                </View>
              ) : null}
            </View>

            {/* Full Prize Tiers Breakdown Table */}
            <Text
              style={[
                styles.sectionHeader,
                language === "ml" && { fontSize: 15, lineHeight: 22, marginTop: 8 },
              ]}
            >
              {t("complete_prize_breakdown")}
            </Text>

            {prizeTiers.map((tier) => {
              const numbers = (drawResult.prizes as any)?.[tier.key] as
                | string[]
                | undefined;
              const amount = drawResult.prizes?.amounts?.[tier.key];
              if (!numbers || numbers.length === 0) return null;

              const is3Col =
                ["5th", "6th", "7th", "8th", "9th", "guess", "mc"].includes(tier.key) ||
                numbers.length >= 6;

              return (
                <View key={tier.key} style={styles.tierCard}>
                  <View style={styles.tierHeader}>
                    <Text
                      style={[
                        styles.tierTitle,
                        language === "ml" && { fontSize: 13.5, lineHeight: 19 },
                      ]}
                    >
                      {tier.label}
                    </Text>
                    {amount && <Text style={styles.tierAmount}>{amount}</Text>}
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
        ) : postponement ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#FEE2E2",
              shadowColor: "#E11D48",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
              marginVertical: 16,
              alignItems: "center",
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
                backgroundColor: postponement.status === "holiday" ? "#F43F5E" : "#E11D48",
              }}
            />

            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: "#FFE4E6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
                marginTop: 4,
              }}
            >
              <AlertCircle size={22} color="#E11D48" />
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: "#1E293B",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {language === "ml"
                ? `ഈ തീയതിയിലെ (${date}) നറുക്കെടുപ്പ് ${postponement.status === "holiday" ? "അവധിയാണ്" : "മാറ്റിവെച്ചു"}`
                : `DRAW ${postponement.status.toUpperCase()} ON ${date}`}
            </Text>

            <View
              style={{
                backgroundColor: "#FFF1F2",
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: "#FFE4E6",
                alignSelf: "stretch",
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: "800",
                  color: "#9F1239",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 2,
                  textAlign: "center",
                }}
              >
                📢 {language === "ml" ? "ഔദ്യോഗിക അറിയിപ്പ്" : "Official Notice"}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#881337",
                  textAlign: "center",
                  lineHeight: 18,
                  textTransform: "capitalize",
                }}
              >
                {postponement.reason}
              </Text>

              {postponement.rescheduled_date && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
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
                      {postponement.rescheduled_date}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : date >= todayISTDate ? (
          isAfter3PM ? (
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

                {/* Live Sync Active Badge */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 14, borderWidth: 1, borderColor: "#BBF7D0" }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" }} />
                  <Text style={{ fontSize: 9.5, fontWeight: "800", color: "#166534" }}>{t("live_sync_active")}</Text>
                </View>
              </View>

              {/* Lottery Title */}
              <Text
                style={[
                  styles.scheduledTitle,
                  { color: "#0F172A", marginTop: 0, marginBottom: 12 },
                  language === "ml" && { fontSize: 20, lineHeight: 28, fontWeight: "900" },
                ]}
              >
                {getLotteryTranslatedName(lotteryMeta.code, language) || lotteryMeta.name} ({lotteryMeta.code})
              </Text>

              {/* Status Info Box */}
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
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
            </View>
          ) : (
            /* Today's / Upcoming Draw Coming Soon Scheduled Card */
            <View
              style={[
                styles.scheduledCard,
                isBumper && {
                  borderColor: "#F59E0B",
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <View style={styles.scheduledBadgeRow}>
                  {isBumper ? (
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
                    {isBumper
                      ? (language === "ml"
                        ? (date === todayISTDate ? "👑 കേരള ബംപർ ലോട്ടറി ഇന്ന്" : "👑 കേരള ബംപർ ലോട്ടറി")
                        : (date === todayISTDate ? "👑 KERALA BUMPER LOTTERY TODAY" : "👑 KERALA BUMPER LOTTERY"))
                      : (date === todayISTDate ? t("result_coming_soon") : (language === "ml" ? "അടുത്ത നറുക്കെടുപ്പ്" : "UPCOMING SCHEDULED DRAW"))}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.scheduledTitle,
                  language === "ml" && { fontSize: 20, lineHeight: 28 },
                ]}
              >
                {language === "ml" && lotteryMeta.nameMl ? lotteryMeta.nameMl : lotteryMeta.name} ({lotteryMeta.code})
              </Text>

              {/* Bumper Quick Badges */}
              {isBumper && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  <View style={{ backgroundColor: "#D97706", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 11 }}>
                      🏆 {lotteryMeta.jackpot || "₹25 Crore"}
                    </Text>
                  </View>
                  {lotteryMeta.ticket_price && (
                    <View style={{ backgroundColor: "#FDE68A", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#F59E0B" }}>
                      <Text style={{ color: "#78350F", fontWeight: "800", fontSize: 11 }}>
                        🎟️ {lotteryMeta.ticket_price}
                      </Text>
                    </View>
                  )}
                  <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#FCD34D" }}>
                    <Text style={{ color: "#78350F", fontWeight: "800", fontSize: 11 }}>
                      ⏰ {lotteryMeta.drawTime || "2:00 PM"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Digital Countdown Timer Box (if today and draw not passed) */}
              {date === todayISTDate && !countdown.isDrawPassed && (
                <View
                  style={[
                    styles.countdownContainer,
                    isBumper && {
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
                          isBumper && { backgroundColor: "#D97706" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.countdownHeaderText,
                          isBumper && { color: "#92400E" },
                        ]}
                      >
                        {language === "ml" ? "നറുക്കെടുപ്പ് കൗണ്ട്ഡൗൺ" : "LIVE DRAW COUNTDOWN"} ({lotteryMeta.drawTime || (isBumper ? "2:00 PM" : "3:00 PM")})
                      </Text>
                    </View>
                    <Text style={styles.countdownIstText}>Official IST</Text>
                  </View>

                  <View style={styles.countdownDigitsRow}>
                    <View style={styles.countdownDigitCard}>
                      <Text
                        style={[
                          styles.countdownDigitNum,
                          isBumper && { color: "#B45309" },
                        ]}
                      >
                        {String(countdown.hours).padStart(2, "0")}
                      </Text>
                      <Text style={styles.countdownDigitLabel}>HRS</Text>
                    </View>
                    <View
                      style={[
                        styles.countdownDivider,
                        isBumper && { backgroundColor: "#FDE68A" },
                      ]}
                    />
                    <View style={styles.countdownDigitCard}>
                      <Text
                        style={[
                          styles.countdownDigitNum,
                          isBumper && { color: "#B45309" },
                        ]}
                      >
                        {String(countdown.minutes).padStart(2, "0")}
                      </Text>
                      <Text style={styles.countdownDigitLabel}>MIN</Text>
                    </View>
                    <View
                      style={[
                        styles.countdownDivider,
                        isBumper && { backgroundColor: "#FDE68A" },
                      ]}
                    />
                    <View style={styles.countdownDigitCard}>
                      <Text
                        style={[
                          styles.countdownDigitNum,
                          isBumper && { color: "#B45309" },
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
                      isBumper && { backgroundColor: "#D97706" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.scheduledSubtitle,
                      language === "ml" && { fontSize: 14, lineHeight: 20 },
                    ]}
                  >
                    {isBumper
                      ? (language === "ml"
                        ? (date === todayISTDate
                          ? `പ്രത്യേക ബംപർ നറുക്കെടുപ്പ് ഉച്ചയ്ക്ക് ${lotteryMeta.drawTime || "2:00 PM"} മണിക്ക്`
                          : `പ്രത്യേക ബംപർ നറുക്കെടുപ്പ് തീയതി: ${date}`)
                        : (date === todayISTDate
                          ? `Special Bumper Draw Scheduled Today at ${lotteryMeta.drawTime || "2:00 PM"}`
                          : `Special Bumper Draw Scheduled on ${date}`))
                      : (language === "ml"
                        ? (date === todayISTDate
                          ? `ഇന്നത്തെ നറുക്കെടുപ്പ് ഉച്ചയ്ക്ക് ${lotteryMeta.drawTime || "3:00 PM"} മണിക്ക്`
                          : `നറുക്കെടുപ്പ് തീയതി: ${date}`)
                        : (date === todayISTDate
                          ? `Draw Scheduled Today at ${lotteryMeta.drawTime || "3:00 PM"}`
                          : `Draw Scheduled on ${date}`))}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.scheduledDesc,
                    language === "ml" && { fontSize: 12, lineHeight: 18 },
                  ]}
                >
                  {isBumper
                    ? (language === "ml"
                        ? `${lotteryMeta.nameMl || lotteryMeta.name} (${lotteryMeta.code}) ബംപർ നറുക്കെടുപ്പ് ഫലം തത്സമയം ലഭ്യമാകും.`
                        : `Winning results for ${lotteryMeta.name} (${lotteryMeta.code}) will be published live at ${lotteryMeta.drawTime || "2:00 PM"}.`)
                    : (language === "ml"
                        ? `${lotteryMeta.nameMl || lotteryMeta.name} (${lotteryMeta.code}) നറുക്കെടുപ്പ് ഫലം തത്സമയം ലഭ്യമാകും.`
                        : `Winning results for ${lotteryMeta.name} (${lotteryMeta.code}) will be published automatically.`)}
                </Text>
              </View>
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <AlertCircle
              size={32}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyText}>
              {language === "ml"
                ? `${date} തീയതിയിലെ ഫലങ്ങൾ രേഖപ്പെടുത്തിയിട്ടില്ല.`
                : `No draw result record found for date ${date}.`}
            </Text>
          </View>
        )}
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
        availableDraws={drawResult ? [drawResult, ...allDraws] : allDraws}
        targetLotteryCode={codeUpper}
        onClose={() => setIsBarcodeResultOpen(false)}
        onRescan={() => {
          setIsBarcodeResultOpen(false);
          setIsScannerOpen(true);
        }}
      />

      {/* Confetti Celebration on Prize Match */}
      <ConfettiCelebration
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
        prizeTier={celebrationDetails.prizeTier}
        prizeAmount={celebrationDetails.amount}
        ticketNumber={celebrationDetails.ticket}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  subtitle: { fontSize: 12, color: COLORS.textMuted },
  content: { gap: 16 },
  winnerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  winnerHeroSection: {
    alignItems: "center",
    width: "100%",
  },
  winnerBadgeRow: {
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
  winnerBadgeText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.primary,
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
  prizeAmount: {
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
  winnerTicket: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0B3C5D",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  winnerDetailsRow: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
    alignItems: "center",
  },
  winnerMeta: { fontSize: 12.5, fontWeight: "600", color: "#475569", textAlign: "center" },
  boldText: { fontWeight: "700", color: COLORS.textDark },
  verifierCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifierTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  scanChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  scanChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  verifierInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  verifierInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: COLORS.background,
  },
  cameraIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  msgBox: { marginTop: 10, padding: 10, borderRadius: 8 },
  verifierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  validationHint: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "700",
    marginTop: 5,
    marginLeft: 2,
  },
  verifyBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  winMsgBox: { backgroundColor: COLORS.primary, marginTop: 10, padding: 14, borderRadius: 14 },
  noWinMsgBox: { backgroundColor: COLORS.goldLight, marginTop: 10, padding: 12, borderRadius: 10 },
  winMsgTitle: { color: COLORS.white, fontWeight: "900", fontSize: 16, marginBottom: 0 },
  winItemRow: { marginBottom: 6 },
  winMsgText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  seriesNoteText: { color: "#FEF3C7", fontWeight: "700", fontSize: 10, marginLeft: 12, marginTop: 2 },
  noWinMsgText: { color: COLORS.gold, fontWeight: "700", fontSize: 13 },
  // First Prize Hero
  firstPrizeCard: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  firstPrizeLabel: { color: "#FDE68A", fontWeight: "900", fontSize: 13 },
  firstPrizeAmount: { color: "#FFFFFF", fontWeight: "900", fontSize: 20, marginTop: 2, letterSpacing: 0.5 },
  firstPrizeTicket: { color: "rgba(255,255,255,0.85)", fontWeight: "800", fontSize: 13, marginTop: 2, fontFamily: "monospace" },
  seriesNoteChip: {
    marginTop: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  // Consolation Group
  consolationGroup: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  consolationGroupTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  consolationAmount: { color: "#FDE68A", fontWeight: "900", fontSize: 12 },
  consolationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  consolationChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  consolationChipText: { color: "#FFFFFF", fontWeight: "800", fontSize: 11, fontFamily: "monospace" },
  // Other prizes
  otherPrizeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  otherPrizeTier: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  otherPrizeTicket: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 11, marginTop: 2, fontFamily: "monospace" },
  otherPrizeAmount: { color: "#FDE68A", fontWeight: "900", fontSize: 12, marginLeft: 8 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 8,
  },
  tierCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { marginTop: 8, fontSize: 13, color: COLORS.textMuted },
  pdfDownloadBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  scheduledCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginVertical: 16,
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
});
