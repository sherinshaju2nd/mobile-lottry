import React, { useEffect, useState } from "react";
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
  const { code, date } = route.params || { code: "BT", date: "2026-08-10" };
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

  const handleVerifyTicket = (overrideTicket?: string) => {
    const targetTicket = overrideTicket || checkTicket;
    if (!targetTicket.trim() || !drawResult || !drawResult.prizes) return;
    const query = targetTicket.trim().toUpperCase();
    const queryDigits = query.replace(/\D/g, "");

    if (!queryDigits) return;

    let isWin = false;
    let winTier = "";
    let winAmount = "";

    // 1st Prize check
    const firstTicket = (drawResult.first?.ticket || "").toUpperCase();
    if (
      firstTicket.includes(query) ||
      (queryDigits.length === 6 && firstTicket.includes(queryDigits))
    ) {
      isWin = true;
      winTier = "1st Prize Winner!";
      winAmount = drawResult.prizes.amounts?.["1st"] || "₹70 Lakhs";
    }

    if (!isWin) {
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
        if (nums && Array.isArray(nums)) {
          for (const num of nums) {
            const normNum = num.trim().toUpperCase();
            const numDigits = normNum.replace(/\D/g, "");
            if (
              normNum.includes(queryDigits) ||
              (queryDigits.length >= 2 &&
                queryDigits.length <= 6 &&
                numDigits.endsWith(queryDigits))
            ) {
              isWin = true;
              winTier = `${t === "consolation" ? "Consolation" : t} Prize Winner!`;
              winAmount = drawResult.prizes.amounts?.[t] || "";
              break;
            }
          }
        }
        if (isWin) break;
      }
    }

    if (isWin) {
      setCheckMessage({
        win: true,
        text: `🎉 WINNER! ${winTier} ${winAmount ? `Prize: ${winAmount}` : ""}`,
      });
    } else {
      setCheckMessage({
        win: false,
        text: `Ticket "${checkTicket}" did not win a prize in this draw.`,
      });
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
            <View style={styles.verifierCard}>
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
                  style={styles.verifyBtn}
                  onPress={() => handleVerifyTicket()}
                >
                  <Text style={styles.verifyBtnText}>
                    {language === "ml" ? "പരിശോധിക്കുക" : "Verify"}
                  </Text>
                </TouchableOpacity>
              </View>

              {checkMessage && (
                <View
                  style={[
                    styles.msgBox,
                    checkMessage.win ? styles.winMsgBox : styles.noWinMsgBox,
                  ]}
                >
                  <Text
                    style={
                      checkMessage.win ? styles.winMsgText : styles.noWinMsgText
                    }
                  >
                    {checkMessage.text}
                  </Text>
                </View>
              )}
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
  winMsgBox: { backgroundColor: COLORS.successBg },
  noWinMsgBox: { backgroundColor: COLORS.goldLight },
  winMsgText: { color: COLORS.successText, fontWeight: "800", fontSize: 13 },
  noWinMsgText: { color: COLORS.gold, fontWeight: "700", fontSize: 13 },
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
