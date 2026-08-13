import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Trophy,
  Camera,
  AlertCircle,
  RotateCw,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { WEEKLY_LOTTERIES } from "../constants/lotteries";
import {
  fetchDrawByDate,
  fetchAllDraws,
  DrawResult,
  supabase,
} from "../api/lotteryApi";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import BarcodeResultModal from "../components/BarcodeResultModal";
import { useLanguage } from "../context/LanguageContext";

export default function DrawBreakdownScreen({ route, navigation }: any) {
  const { t, language } = useLanguage();
  const { code, date, highlight } = route.params || { code: "BT", date: "2026-08-10" };
  const codeUpper = code.toUpperCase();

  const lotteryMeta = WEEKLY_LOTTERIES.find((l) => l.code === codeUpper) || {
    name: `${codeUpper} Lottery`,
    nameMl: "",
    code: codeUpper,
    day: "Scheduled Draw",
  };

  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
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
    setScannedBarcode(scannedValue);
    setCheckTicket(scannedValue);
    setIsBarcodeResultOpen(true);
    handleVerifyTicket(scannedValue);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const result = await fetchDrawByDate(codeUpper, date);
        setDrawResult(result);
      } catch {
        setDrawResult(null);
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
          filter: `lottery_code=eq.${codeUpper}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow && newRow.draw_date === date) {
            loadData();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [codeUpper, date]);

  // Auto-highlight: when draw data loads and a highlight ticket was passed in route params
  useEffect(() => {
    if (!highlight || !drawResult) return;
    const query = String(highlight).trim();
    const queryDigits = query.replace(/\D/g, "");
    if (queryDigits.length < 4) return;

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

    if (queryDigits === prizeDigits) {
      digitsMatch = true;
    } else if (queryDigits.length === 6 && prizeDigits.length < 6 && prizeDigits.length >= 2) {
      digitsMatch = queryDigits.endsWith(prizeDigits);
    } else if (queryDigits.length < 6 && prizeDigits.length === 6 && queryDigits.length >= 4) {
      digitsMatch = prizeDigits.endsWith(queryDigits);
    } else if (queryDigits.length < 6 && prizeDigits.length < 6 && queryDigits.length >= 4 && prizeDigits.length >= 4) {
      digitsMatch = queryDigits.endsWith(prizeDigits) || prizeDigits.endsWith(queryDigits);
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

    // Require at least 4 digits
    const queryDigits = query.replace(/\D/g, "");
    if (queryDigits.length < 4) {
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

    // 1st Prize check
    if (drawResult.first?.ticket) {
      const matchRes = validateTicketMatch(query, drawResult.first.ticket);
      if (matchRes.isMatch) {
        matchesList.push({
          tier: language === "ml" ? "1-ാം സമ്മാന വിജയി" : "1st Prize Winner",
          amount: drawResult.prizes.amounts?.["1st"] || "₹70 Lakhs",
          matchedNumber: drawResult.first.ticket,
          seriesNote: matchRes.seriesNote,
        });
      }
    }

    // Check Other Tiers
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

    for (const t of tiers) {
      const nums = (drawResult.prizes as any)[t] as string[] | undefined;
      const amount = drawResult.prizes.amounts?.[t] || "";
      const label = t === "consolation" ? (language === "ml" ? "സമാശ്വാസ സമ്മാനം" : "Consolation Prize") : `${t} Prize`;

      if (nums && Array.isArray(nums)) {
        for (const num of nums) {
          const matchRes = validateTicketMatch(query, num);
          if (matchRes.isMatch) {
            matchesList.push({
              tier: label,
              amount: amount,
              matchedNumber: num,
              seriesNote: matchRes.seriesNote,
            });
          }
        }
      }
    }

    if (matchesList.length > 0) {
      setCheckMatches(matchesList);
      setCheckErrorMsg(null);
    } else {
      setCheckMatches(null);
      setCheckErrorMsg(
        language === "ml"
          ? `ടിക്കറ്റ് "${targetTicket}" ലോട്ടറി ഫലത്തിൽ സമ്മാനം ഒന്നും നേടിയിട്ടില്ല.`
          : `Ticket "${targetTicket}" did not win a prize in this draw.`
      );
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
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
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
              style={[
                styles.title,
                language === "ml" && { fontSize: 16, lineHeight: 24 },
              ]}
            >
              {language === "ml" && lotteryMeta.nameMl ? lotteryMeta.nameMl : lotteryMeta.name} {language === "ml" ? "ഫലം" : "Result"}
            </Text>
            <Text
              style={[
                styles.subtitle,
                language === "ml" && { fontSize: 11 },
              ]}
            >
              {t("draw_date")}: {date} ({t("draw_code")}: {codeUpper})
            </Text>
          </View>
        </View>

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

                <View style={styles.heroTicketBox}>
                  <Text style={styles.winnerTicket}>
                    {drawResult.first?.ticket || "N/A"}
                  </Text>
                </View>

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
                <Text style={styles.verifierTitle}>
                  {language === "ml" ? "കാരുണ്യ ടിക്കറ്റ് പരിശോധിക്കുക" : "Verify Your Ticket"}
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
                  placeholder={language === "ml" ? "ടിക്കറ്റ് നമ്പർ നൽകുക (ഉദാ: 263322)" : "Enter ticket number (e.g. 263322)"}
                  placeholderTextColor={COLORS.textLight}
                  value={checkTicket}
                  onChangeText={setCheckTicket}
                  autoCapitalize="characters"
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
                    checkTicket.replace(/\D/g, "").length < 4 && styles.verifyBtnDisabled,
                  ]}
                  onPress={() => handleVerifyTicket()}
                  disabled={checkTicket.replace(/\D/g, "").length < 4}
                >
                  <Text style={styles.verifyBtnText}>
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
            <Text style={styles.sectionHeader}>{t("complete_prize_breakdown")}</Text>

            {prizeTiers.map((tier) => {
              const numbers = (drawResult.prizes as any)?.[tier.key] as
                | string[]
                | undefined;
              const amount = drawResult.prizes?.amounts?.[tier.key];
              if (!numbers || numbers.length === 0) return null;

              return (
                <View key={tier.key} style={styles.tierCard}>
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierTitle}>
                      {tier.label}
                    </Text>
                    {amount && <Text style={styles.tierAmount}>{amount}</Text>}
                  </View>

                  <View style={styles.numbersGrid}>
                    {numbers.map((num, idx) => (
                      <View
                        key={idx}
                        style={styles.numberChip}
                      >
                        <Text style={styles.numberChipText}>
                          {num}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <AlertCircle
              size={32}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyText}>
              No draw result record found for date {date}.
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
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { marginTop: 8, fontSize: 13, color: COLORS.textMuted },
});
