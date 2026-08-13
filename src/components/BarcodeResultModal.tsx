import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { searchTicketNumber, SearchMatch, DrawResult } from "../api/lotteryApi";

interface BarcodeResultModalProps {
  visible: boolean;
  scannedBarcode: string | null;
  availableDraws: DrawResult[];
  targetLotteryCode?: string | null;
  onClose: () => void;
  onRescan: () => void;
}

export default function BarcodeResultModal({
  visible,
  scannedBarcode,
  availableDraws,
  targetLotteryCode,
  onClose,
  onRescan,
}: BarcodeResultModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("ALL");
  const [customDateInput, setCustomDateInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [allMatches, setAllMatches] = useState<SearchMatch[] | null>(null);
  const [matchedDrawDetails, setMatchedDrawDetails] = useState<DrawResult | null>(null);
  const [step, setStep] = useState<"select_date" | "result">("select_date");

  // Filter draws by target lottery code if specified
  const filteredDraws = targetLotteryCode
    ? availableDraws.filter((d) => d.lottery_code.toUpperCase() === targetLotteryCode.toUpperCase())
    : availableDraws;

  const relevantDraws = filteredDraws.length > 0 ? filteredDraws : availableDraws;

  // Extract unique draw dates available
  const dateOptions = Array.from(new Set(relevantDraws.map((d) => d.draw_date)));

  useEffect(() => {
    if (visible && scannedBarcode) {
      if (dateOptions.length > 0) {
        setSelectedDate(dateOptions[0]);
        setCustomDateInput(dateOptions[0]);
      } else {
        setSelectedDate("ALL");
        setCustomDateInput("");
      }
      setStep("select_date");
      setAllMatches(null);
      setMatchedDrawDetails(null);
    }
  }, [visible, scannedBarcode, targetLotteryCode]);

  const handleVerifyTicket = async (targetDate: string) => {
    if (!scannedBarcode) return;
    setIsSearching(true);
    setSelectedDate(targetDate);
    setStep("result");

    try {
      const results = await searchTicketNumber(scannedBarcode);

      let filtered = results;
      if (targetLotteryCode) {
        filtered = filtered.filter(
          (m) => m.lottery_code.toUpperCase() === targetLotteryCode.toUpperCase()
        );
      }
      if (targetDate !== "ALL") {
        filtered = filtered.filter((m) => m.draw_date === targetDate);
      }

      setAllMatches(filtered);

      // Find matched draw details if date specified
      const drawDateToFind =
        targetDate !== "ALL"
          ? targetDate
          : filtered.length > 0
          ? filtered[0].draw_date
          : dateOptions[0];
      const foundDraw =
        relevantDraws.find((d) => d.draw_date === drawDateToFind) ||
        availableDraws.find((d) => d.draw_date === drawDateToFind) ||
        null;
      setMatchedDrawDetails(foundDraw);
    } catch {
      setAllMatches([]);
      setMatchedDrawDetails(null);
    } finally {
      setIsSearching(false);
    }
  };

  if (!visible || !scannedBarcode) return null;

  const isWinner = allMatches && allMatches.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.barcodeChip}>
              <Ionicons name="barcode-outline" size={16} color={COLORS.primary} />
              <Text style={styles.barcodeChipText}>{scannedBarcode}</Text>
              {targetLotteryCode && (
                <Text style={styles.lotteryCodeBadge}>[{targetLotteryCode}]</Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {step === "select_date" ? (
              /* Step 1: Draw Date Prompt with DatePicker */
              <View style={styles.dateStepContainer}>
                <View style={styles.dateStepHeader}>
                  <View style={styles.calendarIconBg}>
                    <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.dateStepTitle}>Select Draw Date</Text>
                  <Text style={styles.dateStepSub}>
                    Select the draw date for ticket &quot;{scannedBarcode}&quot;
                    {targetLotteryCode ? ` (${targetLotteryCode})` : ""} to fetch accurate results.
                  </Text>
                </View>

                {/* Custom Date Picker Field */}
                <View style={styles.customDateContainer}>
                  <Text style={styles.chipSectionLabel}>Pick / Enter Draw Date:</Text>
                  <View style={styles.datePickerInputRow}>
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD (e.g. 2026-08-12)"
                      placeholderTextColor={COLORS.textLight}
                      value={customDateInput}
                      onChangeText={setCustomDateInput}
                      keyboardType="numbers-and-punctuation"
                    />
                    <TouchableOpacity
                      style={styles.fetchDateBtn}
                      onPress={() => {
                        if (customDateInput.trim()) {
                          handleVerifyTicket(customDateInput.trim());
                        }
                      }}
                    >
                      <Text style={styles.fetchDateBtnText}>Fetch Result</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Date Selection Chips */}
                <Text style={[styles.chipSectionLabel, { marginTop: 16 }]}>
                  Recent Published Dates:
                </Text>
                <View style={styles.chipsContainer}>
                  {dateOptions.map((dateStr, idx) => {
                    const drawForDate = relevantDraws.find((d) => d.draw_date === dateStr);
                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[
                          styles.dateChip,
                          idx === 0 && styles.dateChipLatest,
                        ]}
                        onPress={() => {
                          setCustomDateInput(dateStr);
                          handleVerifyTicket(dateStr);
                        }}
                      >
                        <Ionicons
                          name={idx === 0 ? "sparkles" : "calendar"}
                          size={14}
                          color={COLORS.primary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dateChipText}>{dateStr}</Text>
                          {drawForDate && (
                            <Text style={styles.dateChipSubText}>{drawForDate.draw_name}</Text>
                          )}
                        </View>
                        {idx === 0 && <Text style={styles.latestBadge}>LATEST</Text>}
                      </TouchableOpacity>
                    );
                  })}

                  {/* All Draws Option */}
                  <TouchableOpacity
                    style={[styles.dateChip, styles.allDrawsChip]}
                    onPress={() => handleVerifyTicket("ALL")}
                  >
                    <Ionicons name="globe-outline" size={16} color={COLORS.gold} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dateChipText, { color: COLORS.gold }]}>
                        Check All Draw History
                      </Text>
                      <Text style={styles.dateChipSubText}>
                        Search across all published draw records
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.gold} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : isSearching ? (
              /* Loading State */
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Fetching draw results for date...</Text>
                <Text style={styles.loadingSub}>
                  Ticket: {scannedBarcode} • Date: {selectedDate}
                  {targetLotteryCode ? ` • Lottery: ${targetLotteryCode}` : ""}
                </Text>
              </View>
            ) : isWinner ? (
              /* WINNING CELEBRATION RESULT */
              <View style={styles.resultContainer}>
                {/* Winner Celebration Banner */}
                <View style={styles.winBanner}>
                  <Text style={styles.celebrationEmoji}>🎉 🏆 ✨</Text>
                  <Text style={styles.winTitle}>WINNING TICKET MATCH!</Text>
                  <Text style={styles.winSubtitle}>
                    Congratulations! Your scanned ticket won a prize!
                  </Text>
                </View>

                {/* Prize Info Card */}
                {allMatches?.map((match, i) => (
                  <View key={i} style={styles.prizeCard}>
                    <View style={styles.prizeHeaderRow}>
                      <Ionicons name="trophy" size={20} color={COLORS.gold} />
                      <Text style={styles.prizeTierText}>{match.prize_tier}</Text>
                    </View>

                    <Text style={styles.prizeAmountText}>
                      {match.prize_amount || "Winning Ticket"}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ticket Matched:</Text>
                      <Text style={styles.detailValueBold}>{match.ticket_matched}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Draw Name:</Text>
                      <Text style={styles.detailValue}>
                        {match.draw_name} ({match.draw_code})
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Draw Date & Time:</Text>
                      <Text style={styles.detailValue}>
                        {match.draw_date} • 3:00 PM IST
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Draw 1st Prize Winner Extra Details if available */}
                {matchedDrawDetails?.first?.ticket && (
                  <View style={styles.drawContextCard}>
                    <Text style={styles.drawContextTitle}>
                      Full Draw Info ({matchedDrawDetails.draw_name})
                    </Text>
                    <Text style={styles.drawContextSub}>
                      1st Prize Ticket:{" "}
                      <Text style={{ fontWeight: "700", color: COLORS.primary }}>
                        {matchedDrawDetails.first.ticket}
                      </Text>
                      {matchedDrawDetails.first.location &&
                        ` (${matchedDrawDetails.first.location})`}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* NON-WINNING RESULT */
              <View style={styles.resultContainer}>
                <View style={styles.noWinBanner}>
                  <Ionicons name="sad-outline" size={44} color="#6B7280" />
                  <Text style={styles.noWinTitle}>No Prize Match Found</Text>
                  <Text style={styles.noWinSub}>
                    Scanned Ticket &quot;{scannedBarcode}&quot; did not win any prize in{" "}
                    {selectedDate === "ALL"
                      ? "any published draws"
                      : `the draw for date ${selectedDate}`}
                    .
                  </Text>
                </View>

                {matchedDrawDetails && (
                  <View style={styles.drawContextCard}>
                    <Text style={styles.drawContextTitle}>
                      Draw Summary for {matchedDrawDetails.draw_date}
                    </Text>
                    <Text style={styles.drawContextSub}>
                      Draw: {matchedDrawDetails.draw_name} ({matchedDrawDetails.draw_code})
                    </Text>
                    <Text style={styles.drawContextSub}>
                      1st Prize ({matchedDrawDetails.prizes?.amounts?.["1st"] || "₹70L"}):{" "}
                      {matchedDrawDetails.first?.ticket || "N/A"}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.changeDateBtn}
                  onPress={() => setStep("select_date")}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.changeDateBtnText}>Pick / Change Draw Date</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.rescanBtn} onPress={onRescan}>
              <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
              <Text style={styles.rescanBtnText}>Scan Another Barcode</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: "55%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  barcodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  barcodeChipText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  lotteryCodeBadge: {
    color: COLORS.gold,
    fontWeight: "800",
    fontSize: 12,
  },
  closeIconBtn: {
    padding: 6,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  dateStepContainer: {},
  dateStepHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  calendarIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  dateStepTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  dateStepSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  customDateContainer: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  datePickerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  dateInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
  },
  fetchDateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fetchDateBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },
  chipSectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  chipsContainer: {
    gap: 10,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  dateChipLatest: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0FDF4",
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  dateChipSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  latestBadge: {
    marginLeft: "auto",
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  allDrawsChip: {
    borderColor: COLORS.gold,
    backgroundColor: "#FEFCE8",
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 14,
  },
  loadingSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  resultContainer: {},
  winBanner: {
    backgroundColor: "#15803D",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  celebrationEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  winTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  winSubtitle: {
    color: "#DCFCE7",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  prizeCard: {
    backgroundColor: "#FEFCE8",
    borderColor: COLORS.gold,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  prizeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  prizeTierText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#B45309",
  },
  prizeAmountText: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#FDE68A",
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  drawContextCard: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  drawContextTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  drawContextSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  noWinBanner: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  noWinTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 10,
    marginBottom: 4,
  },
  noWinSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  changeDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeDateBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  rescanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  rescanBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  doneBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
