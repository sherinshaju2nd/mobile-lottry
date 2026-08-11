import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { WEEKLY_LOTTERIES } from "../constants/lotteries";
import { fetchDrawByDate, DrawResult } from "../api/lotteryApi";

export default function DrawBreakdownScreen({ route, navigation }: any) {
  const { code, date } = route.params || { code: "BT", date: "2026-08-10" };
  const codeUpper = code.toUpperCase();

  const lotteryMeta = WEEKLY_LOTTERIES.find((l) => l.code === codeUpper) || {
    name: `${codeUpper} Lottery`,
    code: codeUpper,
    day: "Scheduled Draw",
  };

  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In-page ticket check
  const [checkTicket, setCheckTicket] = useState("");
  const [checkMessage, setCheckMessage] = useState<{ win: boolean; text: string } | null>(null);

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
  }, [codeUpper, date]);

  const handleVerifyTicket = () => {
    if (!checkTicket.trim() || !drawResult || !drawResult.prizes) return;
    const query = checkTicket.trim().toUpperCase();
    const queryDigits = query.replace(/\D/g, "");

    if (!queryDigits) return;

    let isWin = false;
    let winTier = "";
    let winAmount = "";

    // 1st Prize check
    const firstTicket = (drawResult.first?.ticket || "").toUpperCase();
    if (firstTicket.includes(query) || (queryDigits.length === 6 && firstTicket.includes(queryDigits))) {
      isWin = true;
      winTier = "1st Prize Winner!";
      winAmount = drawResult.prizes.amounts?.["1st"] || "₹70 Lakhs";
    }

    if (!isWin) {
      const tiers = [
        "consolation", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th",
      ] as const;

      for (const t of tiers) {
        const nums = (drawResult.prizes as any)[t] as string[] | undefined;
        if (nums && Array.isArray(nums)) {
          for (const num of nums) {
            const normNum = num.trim().toUpperCase();
            const numDigits = normNum.replace(/\D/g, "");
            if (
              normNum.includes(queryDigits) ||
              (queryDigits.length >= 2 && queryDigits.length <= 6 && numDigits.endsWith(queryDigits))
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
    { key: "consolation", label: "Consolation Prize" },
    { key: "2nd", label: "2nd Prize" },
    { key: "3rd", label: "3rd Prize" },
    { key: "4th", label: "4th Prize" },
    { key: "5th", label: "5th Prize" },
    { key: "6th", label: "6th Prize" },
    { key: "7th", label: "7th Prize" },
    { key: "8th", label: "8th Prize" },
    { key: "9th", label: "9th Prize" },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{lotteryMeta.name} Result</Text>
            <Text style={styles.subtitle}>Draw Date: {date} (Code: {codeUpper})</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : drawResult ? (
          <View style={styles.content}>
            {/* 1st Prize Winner Highlights Card */}
            <View style={styles.winnerCard}>
              <View style={styles.winnerBadgeRow}>
                <Ionicons name="trophy" size={16} color={COLORS.successText} />
                <Text style={styles.winnerBadgeText}>OFFICIAL 1ST PRIZE WINNER</Text>
              </View>

              <Text style={styles.prizeAmount}>{drawResult.prizes?.amounts?.["1st"] || "₹70 Lakhs"}</Text>
              <Text style={styles.winnerTicket}>{drawResult.first?.ticket || "N/A"}</Text>

              <View style={styles.winnerDetailsRow}>
                <Text style={styles.winnerMeta}>Location: <Text style={styles.boldText}>{drawResult.first?.location || "N/A"}</Text></Text>
                <Text style={styles.winnerMeta}>Agent: <Text style={styles.boldText}>{drawResult.first?.agent || "N/A"}</Text></Text>
              </View>
            </View>

            {/* In-page Ticket Verification Widget */}
            <View style={styles.verifierCard}>
              <Text style={styles.verifierTitle}>Verify Ticket for This Draw</Text>
              <View style={styles.verifierInputRow}>
                <TextInput
                  style={styles.verifierInput}
                  placeholder="Enter ticket number (e.g. 263322)"
                  placeholderTextColor={COLORS.textLight}
                  value={checkTicket}
                  onChangeText={setCheckTicket}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyTicket}>
                  <Text style={styles.verifyBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>

              {checkMessage && (
                <View style={[styles.msgBox, checkMessage.win ? styles.winMsgBox : styles.noWinMsgBox]}>
                  <Text style={checkMessage.win ? styles.winMsgText : styles.noWinMsgText}>{checkMessage.text}</Text>
                </View>
              )}
            </View>

            {/* Full Prize Tiers Breakdown Table */}
            <Text style={styles.sectionHeader}>Complete Prize Breakdown</Text>

            {prizeTiers.map((tier) => {
              const numbers = (drawResult.prizes as any)?.[tier.key] as string[] | undefined;
              const amount = drawResult.prizes?.amounts?.[tier.key];
              if (!numbers || numbers.length === 0) return null;

              return (
                <View key={tier.key} style={styles.tierCard}>
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierTitle}>{tier.label}</Text>
                    {amount && <Text style={styles.tierAmount}>{amount}</Text>}
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
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No draw result record found for date {date}.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  subtitle: { fontSize: 12, color: COLORS.textMuted },
  content: { gap: 16 },
  winnerCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: COLORS.primary },
  winnerBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  winnerBadgeText: { fontSize: 11, fontWeight: "800", color: COLORS.successText },
  prizeAmount: { fontSize: 13, fontWeight: "800", color: COLORS.gold, marginBottom: 4 },
  winnerTicket: { fontSize: 26, fontWeight: "900", fontFamily: "monospace", color: COLORS.primary, marginBottom: 8 },
  winnerDetailsRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.background, gap: 2 },
  winnerMeta: { fontSize: 12, color: COLORS.textMuted },
  boldText: { fontWeight: "700", color: COLORS.textDark },
  verifierCard: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  verifierTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textDark, marginBottom: 8 },
  verifierInputRow: { flexDirection: "row", gap: 8 },
  verifierInput: { flex: 1, height: 42, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, fontSize: 13, backgroundColor: COLORS.background },
  verifyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  verifyBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  msgBox: { marginTop: 10, padding: 10, borderRadius: 8 },
  winMsgBox: { backgroundColor: COLORS.successBg },
  noWinMsgBox: { backgroundColor: COLORS.goldLight },
  winMsgText: { color: COLORS.successText, fontWeight: "800", fontSize: 13 },
  noWinMsgText: { color: COLORS.gold, fontWeight: "700", fontSize: 13 },
  sectionHeader: { fontSize: 16, fontWeight: "800", color: COLORS.textDark, marginTop: 8 },
  tierCard: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  tierTitle: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  tierAmount: { fontSize: 13, fontWeight: "900", color: COLORS.gold },
  numbersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  numberChip: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  numberChipText: { fontSize: 12, fontFamily: "monospace", fontWeight: "700", color: COLORS.textDark },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { marginTop: 8, fontSize: 13, color: COLORS.textMuted },
});
