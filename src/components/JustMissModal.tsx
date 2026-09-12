import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  X,
  Sparkles,
  Target,
  Shuffle,
  FileText,
  AlertCircle,
  Trophy,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { DrawResult } from "../api/lotteryApi";
import { triggerLightHaptic } from "../utils/haptics";
import { useLanguage } from "../context/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface NearMissItem {
  id: string;
  prizeTier: string;
  prizeAmount?: string;
  winningTicket: string;
  winningDigits: string;
  searchedDigits: string;
  matchType: "1_digit" | "2_digits" | "shuffled" | "neighbor";
  tagEn: string;
  tagMl: string;
  diffExplanationEn: string;
  diffExplanationMl: string;
  diffIndices: number[];
}

interface JustMissModalProps {
  visible: boolean;
  onClose: () => void;
  searchedTicket: string;
  draw: DrawResult | null | undefined;
  onViewResult: () => void;
}

function formatDisplayDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function JustMissModal({
  visible,
  onClose,
  searchedTicket,
  draw,
  onViewResult,
}: JustMissModalProps) {
  const { language, t } = useLanguage();
  const isMl = language === "ml";
  const [activeTab, setActiveTab] = useState<"all" | "1_digit" | "shuffled" | "2_digits">("all");

  const cleanQueryDigits = useMemo(() => {
    return searchedTicket.replace(/\D/g, "");
  }, [searchedTicket]);

  const nearMissList = useMemo(() => {
    if (!draw || cleanQueryDigits.length < 4) return [];

    const items: NearMissItem[] = [];
    const seenWinningTickets = new Set<string>();

    const checkCandidate = (
      winTicketStr: string,
      tier: string,
      amount?: string
    ) => {
      const winDigits = winTicketStr.replace(/\D/g, "");
      if (!winDigits || seenWinningTickets.has(winTicketStr)) return;

      const q = cleanQueryDigits;
      const w = winDigits;

      // Case 1: 6-digit to 6-digit direct comparison
      if (q.length === 6 && w.length === 6) {
        const diffIndices: number[] = [];
        for (let i = 0; i < 6; i++) {
          if (q[i] !== w[i]) diffIndices.push(i);
        }

        const isNeighbor = Math.abs(Number(q) - Number(w)) === 1;
        const isShuffled = q.split("").sort().join("") === w.split("").sort().join("") && q !== w;

        if (isNeighbor) {
          seenWinningTickets.add(winTicketStr);
          items.push({
            id: `${tier}-${winTicketStr}-neighbor`,
            prizeTier: tier,
            prizeAmount: amount,
            winningTicket: winTicketStr,
            winningDigits: w,
            searchedDigits: q,
            matchType: "neighbor",
            tagEn: "Consecutive Serial (±1)",
            tagMl: "തൊട്ടടുത്ത നമ്പർ (±1)",
            diffExplanationEn: `Serial difference is only 1 number away from this winning ticket!`,
            diffExplanationMl: `വിജയിച്ച ടിക്കറ്റിൽ നിന്നും വെറും 1 നമ്പറിന്റെ മാത്രം വ്യത്യാസം!`,
            diffIndices,
          });
          return;
        }

        if (diffIndices.length === 1) {
          seenWinningTickets.add(winTicketStr);
          const idx = diffIndices[0];
          items.push({
            id: `${tier}-${winTicketStr}-1diff`,
            prizeTier: tier,
            prizeAmount: amount,
            winningTicket: winTicketStr,
            winningDigits: w,
            searchedDigits: q,
            matchType: "1_digit",
            tagEn: "1 Digit Miss (5 of 6 Match)",
            tagMl: "1 അക്ക വ്യത്യാസം (5 അക്കം ശരി)",
            diffExplanationEn: `Position ${idx + 1}: Drawn '${w[idx]}' instead of your '${q[idx]}'. 5 digits matched exactly!`,
            diffExplanationMl: `സ്ഥാനം ${idx + 1}: നിങ്ങളുടെ '${q[idx]}' ന് പകരം '${w[idx]}' വന്നു. 5 അക്കങ്ങൾ കൃത്യമായി ഒത്തുപോയി!`,
            diffIndices,
          });
          return;
        }

        if (isShuffled) {
          seenWinningTickets.add(winTicketStr);
          items.push({
            id: `${tier}-${winTicketStr}-shuffled`,
            prizeTier: tier,
            prizeAmount: amount,
            winningTicket: winTicketStr,
            winningDigits: w,
            searchedDigits: q,
            matchType: "shuffled",
            tagEn: "Shuffled Anagram (All Digits)",
            tagMl: "ഷഫിൾഡ് (എല്ലാ അക്കങ്ങളും ഉണ്ട്)",
            diffExplanationEn: `All 6 digits matched! The numbers appeared in a rearranged order.`,
            diffExplanationMl: `എല്ലാ 6 അക്കങ്ങളും ലോട്ടറിയിൽ ഉണ്ടായിരുന്നു! ക്രമം മാറിയാണ് വന്നത്.`,
            diffIndices: [0, 1, 2, 3, 4, 5],
          });
          return;
        }

        if (diffIndices.length === 2) {
          seenWinningTickets.add(winTicketStr);
          items.push({
            id: `${tier}-${winTicketStr}-2diff`,
            prizeTier: tier,
            prizeAmount: amount,
            winningTicket: winTicketStr,
            winningDigits: w,
            searchedDigits: q,
            matchType: "2_digits",
            tagEn: "2 Digits Miss (4 of 6 Match)",
            tagMl: "2 അക്ക വ്യത്യാസം (4 അക്കം ശരി)",
            diffExplanationEn: `Only 2 digits differed at positions ${diffIndices.map((i) => i + 1).join(" & ")}.`,
            diffExplanationMl: `${diffIndices.map((i) => i + 1).join(", ")} സ്ഥാനങ്ങളിലെ 2 അക്കങ്ങൾ മാത്രമാണ് വ്യത്യാസപ്പെട്ടത്.`,
            diffIndices,
          });
          return;
        }
      }

      // Case 2: 4-digit tier or 4-digit query suffix comparison
      const q4 = q.slice(-4);
      const w4 = w.slice(-4);

      if (q4.length === 4 && w4.length === 4) {
        const diffIndices: number[] = [];
        for (let i = 0; i < 4; i++) {
          if (q4[i] !== w4[i]) diffIndices.push(i);
        }

        const isShuffled4 = q4.split("").sort().join("") === w4.split("").sort().join("") && q4 !== w4;

        if (diffIndices.length === 1) {
          seenWinningTickets.add(winTicketStr);
          const idx = diffIndices[0];
          items.push({
            id: `${tier}-${winTicketStr}-1diff4`,
            prizeTier: tier,
            prizeAmount: amount,
            winningTicket: winTicketStr,
            winningDigits: w4,
            searchedDigits: q4,
            matchType: "1_digit",
            tagEn: "1 Digit Miss (3 of 4 Match)",
            tagMl: "1 അക്ക വ്യത്യാസം (3 അക്കം ശരി)",
            diffExplanationEn: `Last 4 digits: drawn '${w4[idx]}' instead of '${q4[idx]}'. 3 digits matched!`,
            diffExplanationMl: `അവസാന 4 അക്കങ്ങളിൽ 3 എണ്ണം ശരിയായി വന്നു. 1 അക്കം മാത്രം മാറി.`,
            diffIndices,
          });
          return;
        }

        if (isShuffled4) {
          seenWinningTickets.add(winTicketStr);
          items.push({
            id: `${tier}-${winTicketStr}-shuffled4`,
            prizeTier: tier,
            prizeAmount: amount,
            winningTicket: winTicketStr,
            winningDigits: w4,
            searchedDigits: q4,
            matchType: "shuffled",
            tagEn: "Shuffled 4-Digit Match",
            tagMl: "4 അക്കങ്ങൾ ഷഫിൾഡ് മാച്ച്",
            diffExplanationEn: `All 4 digits matched in shuffled order in ${tier}.`,
            diffExplanationMl: `${tier} സമ്മാനത്തിലെ 4 അക്കങ്ങളും മാറിമറിഞ്ഞ് ഒത്തുപോയി.`,
            diffIndices,
          });
          return;
        }

        if (diffIndices.length === 2 && items.length < 20) {
          seenWinningTickets.add(winTicketStr);
          items.push({
            id: `${tier}-${winTicketStr}-2diff4`,
            prizeTier: tier,
            prizeAmount: amount,
            winningTicket: winTicketStr,
            winningDigits: w4,
            searchedDigits: q4,
            matchType: "2_digits",
            tagEn: "2 Digits Miss (2 of 4 Match)",
            tagMl: "2 അക്ക വ്യത്യാസം",
            diffExplanationEn: `2 digits differed in ${tier} (${winTicketStr}).`,
            diffExplanationMl: `${tier} ലെ നമ്പറുമായി 2 അക്ക വ്യത്യാസം.`,
            diffIndices,
          });
          return;
        }
      }
    };

    // 1. 1st Prize
    if (draw.first?.ticket && draw.first.ticket !== "N/A") {
      checkCandidate(
        draw.first.ticket,
        t("tier_1st"),
        draw.prizes?.amounts?.["1st"] || "₹1,00,00,000"
      );
    }

    // 2. Consolation
    if (draw.prizes?.consolation && Array.isArray(draw.prizes.consolation)) {
      draw.prizes.consolation.forEach((tNum) =>
        checkCandidate(
          String(tNum),
          t("tier_consolation"),
          draw.prizes?.amounts?.consolation || "₹8,000"
        )
      );
    }

    // 3. Other Tiers
    const tierKeys = [
      { key: "2nd", label: t("tier_2nd") },
      { key: "3rd", label: t("tier_3rd") },
      { key: "4th", label: t("tier_4th") },
      { key: "5th", label: t("tier_5th") },
      { key: "6th", label: t("tier_6th") },
      { key: "7th", label: t("tier_7th") },
      { key: "8th", label: t("tier_8th") },
      { key: "9th", label: t("tier_9th") },
    ] as const;

    tierKeys.forEach(({ key, label }) => {
      const arr = draw.prizes?.[key];
      const amt = draw.prizes?.amounts?.[key];
      if (Array.isArray(arr)) {
        arr.forEach((ticketNum) => {
          checkCandidate(String(ticketNum), label, amt);
        });
      }
    });

    // Priority Sort: 1_digit / neighbor -> shuffled -> 2_digits
    const rankMap: Record<string, number> = {
      neighbor: 1,
      "1_digit": 2,
      shuffled: 3,
      "2_digits": 4,
    };

    return items.sort((a, b) => (rankMap[a.matchType] || 5) - (rankMap[b.matchType] || 5));
  }, [draw, cleanQueryDigits, isMl]);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return nearMissList;
    if (activeTab === "1_digit") {
      return nearMissList.filter((m) => m.matchType === "1_digit" || m.matchType === "neighbor");
    }
    if (activeTab === "shuffled") {
      return nearMissList.filter((m) => m.matchType === "shuffled");
    }
    if (activeTab === "2_digits") {
      return nearMissList.filter((m) => m.matchType === "2_digits");
    }
    return nearMissList;
  }, [nearMissList, activeTab]);

  const counts = useMemo(() => {
    const oneDigit = nearMissList.filter(
      (m) => m.matchType === "1_digit" || m.matchType === "neighbor"
    ).length;
    const shuffled = nearMissList.filter((m) => m.matchType === "shuffled").length;
    const twoDigits = nearMissList.filter((m) => m.matchType === "2_digits").length;
    return {
      all: nearMissList.length,
      oneDigit,
      shuffled,
      twoDigits,
    };
  }, [nearMissList]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBg}>
              <Target size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {isMl ? "🎯 ജസ്റ്റ് മിസ്സ് നമ്പറുകൾ" : "🎯 Just Miss Analysis"}
              </Text>
              <Text style={styles.headerSub}>
                {draw?.draw_name || draw?.lottery_code} • {formatDisplayDate(draw?.draw_date)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <X size={20} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        {/* Ticket Summary Banner */}
        <View style={styles.searchedTicketBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.searchedTicketLabel}>
              {isMl ? "നിങ്ങൾ പരിശോധിച്ച നമ്പർ:" : "YOUR SEARCHED TICKET:"}
            </Text>
            <Text style={styles.searchedTicketValue}>{searchedTicket}</Text>
          </View>
          <View style={styles.missedSummaryPill}>
            <Sparkles size={14} color={COLORS.primary} />
            <Text style={styles.missedSummaryText}>
              {nearMissList.length} {isMl ? "അടുത്ത നമ്പറുകൾ" : "Near Misses"}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
            onPress={() => {
              triggerLightHaptic();
              setActiveTab("all");
            }}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "all" && styles.tabBtnTextActive,
              ]}
            >
              {isMl ? "എല്ലാം" : "All"} ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "1_digit" && styles.tabBtnActive,
            ]}
            onPress={() => {
              triggerLightHaptic();
              setActiveTab("1_digit");
            }}
          >
            <Target
              size={13}
              color={activeTab === "1_digit" ? "#FFFFFF" : COLORS.primary}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "1_digit" && styles.tabBtnTextActive,
              ]}
            >
              {isMl ? "1 അക്കം" : "1 Digit"} ({counts.oneDigit})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "shuffled" && styles.tabBtnActive,
            ]}
            onPress={() => {
              triggerLightHaptic();
              setActiveTab("shuffled");
            }}
          >
            <Shuffle
              size={13}
              color={activeTab === "shuffled" ? "#FFFFFF" : "#D97706"}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "shuffled" && styles.tabBtnTextActive,
              ]}
            >
              {isMl ? "ഷഫിൾഡ്" : "Shuffled"} ({counts.shuffled})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "2_digits" && styles.tabBtnActive,
            ]}
            onPress={() => {
              triggerLightHaptic();
              setActiveTab("2_digits");
            }}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "2_digits" && styles.tabBtnTextActive,
              ]}
            >
              {isMl ? "2 അക്കം" : "2 Digits"} ({counts.twoDigits})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Results List */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isOneDigit = item.matchType === "1_digit" || item.matchType === "neighbor";
              const isShuffled = item.matchType === "shuffled";

              return (
                <View
                  key={item.id}
                  style={[
                    styles.nearMissCard,
                    isOneDigit && styles.nearMissCardOneDigit,
                    isShuffled && styles.nearMissCardShuffled,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.prizeBadge}>
                      <Trophy size={13} color="#B45309" />
                      <Text style={styles.prizeBadgeText}>
                        {item.prizeTier}
                        {item.prizeAmount ? ` • ${item.prizeAmount}` : ""}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.matchTypeTag,
                        isOneDigit && { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
                        isShuffled && { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchTypeTagText,
                          isOneDigit && { color: "#166534" },
                          isShuffled && { color: "#92400E" },
                        ]}
                      >
                        {isMl ? item.tagMl : item.tagEn}
                      </Text>
                    </View>
                  </View>

                  {/* Digit Visualizer Comparison */}
                  <View style={styles.comparisonBox}>
                    <View style={styles.comparisonRow}>
                      <Text style={styles.comparisonLabel}>
                        {isMl ? "വിജയിച്ചത്:" : "Drawn Win:"}
                      </Text>
                      <View style={styles.digitsRow}>
                        {item.winningDigits.split("").map((digit, dIdx) => {
                          const isDiff = item.diffIndices.includes(dIdx);
                          return (
                            <View
                              key={dIdx}
                              style={[
                                styles.digitBox,
                                isDiff ? styles.digitBoxDiff : styles.digitBoxMatch,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.digitBoxText,
                                  isDiff
                                    ? styles.digitBoxTextDiff
                                    : styles.digitBoxTextMatch,
                                ]}
                              >
                                {digit}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                      <Text style={styles.ticketFullText}>{item.winningTicket}</Text>
                    </View>

                    <View style={[styles.comparisonRow, { marginTop: 6 }]}>
                      <Text style={styles.comparisonLabel}>
                        {isMl ? "നിങ്ങളുടേത്:" : "Your Ticket:"}
                      </Text>
                      <View style={styles.digitsRow}>
                        {item.searchedDigits.split("").map((digit, dIdx) => {
                          const isDiff = item.diffIndices.includes(dIdx);
                          return (
                            <View
                              key={dIdx}
                              style={[
                                styles.digitBox,
                                isDiff ? styles.digitBoxYourDiff : styles.digitBoxMatch,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.digitBoxText,
                                  isDiff
                                    ? styles.digitBoxTextYourDiff
                                    : styles.digitBoxTextMatch,
                                ]}
                              >
                                {digit}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                      <Text style={styles.ticketFullText}>{cleanQueryDigits}</Text>
                    </View>
                  </View>

                  {/* Explanation Description */}
                  <Text style={styles.explanationText}>
                    {isMl ? item.diffExplanationMl : item.diffExplanationEn}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyStateContainer}>
              <AlertCircle size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyStateTitle}>
                {isMl
                  ? "ഈ ഫിൽറ്ററിൽ ജസ്റ്റ് മിസ്സ് നമ്പറുകൾ ഇല്ല"
                  : "No Near Misses in this category"}
              </Text>
              <Text style={styles.emptyStateSub}>
                {isMl
                  ? "മുഴുവൻ നറുക്കെടുപ്പ് ഫലം പരിശോധിക്കാൻ താഴെയുള്ള ബട്ടൺ ഉപയോഗിക്കുക."
                  : "Check the full published draw results breakdown below."}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.viewResultPrimaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              onViewResult();
            }}
          >
            <FileText size={18} color="#FFFFFF" />
            <Text style={styles.viewResultPrimaryBtnText}>
              {isMl ? "മുഴുവൻ ഫലം കാണുക (View Result)" : "View Full Draw Breakdown"}
            </Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchedTicketBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchedTicketLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  searchedTicketValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 2,
    letterSpacing: 1,
  },
  missedSummaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  missedSummaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  scrollArea: {
    flex: 1,
    marginTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  nearMissCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  nearMissCardOneDigit: {
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
  },
  nearMissCardShuffled: {
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  prizeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prizeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#92400E",
  },
  matchTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  matchTypeTagText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  comparisonBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  comparisonLabel: {
    width: 78,
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748B",
  },
  digitsRow: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  digitBox: {
    width: 24,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  digitBoxMatch: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  digitBoxDiff: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  digitBoxYourDiff: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  digitBoxText: {
    fontSize: 13,
    fontWeight: "900",
  },
  digitBoxTextMatch: {
    color: "#15803D",
  },
  digitBoxTextDiff: {
    color: "#DC2626",
  },
  digitBoxTextYourDiff: {
    color: "#B45309",
  },
  ticketFullText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    marginLeft: 6,
  },
  explanationText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 16,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 36,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 10,
    textAlign: "center",
  },
  emptyStateSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  viewResultPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  viewResultPrimaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
