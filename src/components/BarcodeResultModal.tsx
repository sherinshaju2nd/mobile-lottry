import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  Scan,
  X,
  Calendar,
  Sparkles,
  ChevronRight,
  Trophy,
  Camera,
  XCircle,
  FileText,
  Target,
  RefreshCw,
} from "lucide-react-native";
import { navigate } from "../utils/navigationRef";
import { COLORS } from "../constants/colors";
import { searchTicketNumber, SearchMatch, DrawResult } from "../api/lotteryApi";
import ModernDatePickerModal from "./ModernDatePickerModal";
import JustMissModal from "./JustMissModal";
import { useLanguage } from "../context/LanguageContext";
import { isIndic } from "../constants/translations";
import { triggerLightHaptic } from "../utils/haptics";

interface BarcodeResultModalProps {
  visible: boolean;
  scannedBarcode: string | null;
  availableDraws: DrawResult[];
  targetLotteryCode?: string | null;
  onClose: () => void;
  onRescan: () => void;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function BarcodeResultModal({
  visible,
  scannedBarcode,
  availableDraws,
  targetLotteryCode,
  onClose,
  onRescan,
}: BarcodeResultModalProps) {
  const { language, t } = useLanguage();
  const isMl = language === "ml";
  const indic = isIndic(language);

  const filteredDraws = targetLotteryCode
    ? availableDraws.filter(
        (d) => d.lottery_code.toUpperCase() === targetLotteryCode.toUpperCase()
      )
    : availableDraws;

  const relevantDraws = filteredDraws.length > 0 ? filteredDraws : availableDraws;
  const dateOptions = Array.from(new Set(relevantDraws.map((d) => d.draw_date)));

  const defaultDate = dateOptions.length > 0 ? dateOptions[0] : "";
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [isSearching, setIsSearching] = useState(false);
  const [allMatches, setAllMatches] = useState<SearchMatch[] | null>(null);
  const [matchedDrawDetails, setMatchedDrawDetails] = useState<DrawResult | null>(null);
  const [step, setStep] = useState<"select_date" | "result">("select_date");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isJustMissOpen, setIsJustMissOpen] = useState(false);

  useEffect(() => {
    if (visible && scannedBarcode) {
      const initialDate = dateOptions.length > 0 ? dateOptions[0] : "";
      setSelectedDate(initialDate);
      setStep("select_date");
      setAllMatches(null);
      setMatchedDrawDetails(null);
      setIsJustMissOpen(false);
    }
  }, [visible, scannedBarcode, targetLotteryCode]);

  const handleVerifyTicket = async (targetDate: string) => {
    if (!scannedBarcode) return;
    triggerLightHaptic();
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
      if (targetDate && targetDate !== "ALL") {
        filtered = filtered.filter((m) => m.draw_date === targetDate);
      }

      setAllMatches(filtered);

      const drawDateToFind =
        targetDate && targetDate !== "ALL"
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

  const handleViewFullResult = () => {
    triggerLightHaptic();
    const targetDraw =
      matchedDrawDetails || relevantDraws[0] || availableDraws[0];
    if (targetDraw) {
      onClose();
      navigate("DrawBreakdown", {
        code: targetDraw.lottery_code,
        date: targetDraw.draw_date,
        highlight: scannedBarcode,
      });
    }
  };

  const isWinner = allMatches !== null && allMatches.length > 0;
  const digitsOnly = (scannedBarcode || "").replace(/\D/g, "");
  const is4DigitQuery = digitsOnly.length >= 4 && digitsOnly.length < 6;
  const selectedDrawForDate = relevantDraws.find((d) => d.draw_date === selectedDate);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Top Bar Header */}
          <View style={styles.header}>
            <View style={styles.barcodeChip}>
              <Scan size={15} color={COLORS.primary} />
              <Text style={styles.barcodeChipText}>{scannedBarcode}</Text>
              {targetLotteryCode && (
                <Text style={styles.lotteryCodeBadge}>[{targetLotteryCode}]</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeIconBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step === "select_date" ? (
              /* STEP 1: Date Picker with Default Last Draw Date & Quick Draw Selector */
              <View style={styles.dateStepContainer}>
                {/* Header info */}
                <View style={styles.dateStepHeader}>
                  <View style={styles.calendarIconBg}>
                    <Calendar size={26} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.dateStepTitle, indic && { fontSize: 18 }]}>
                    {t("select_draw_date")}
                  </Text>
                  <Text style={[styles.dateStepSub, indic && { fontSize: 13, lineHeight: 18 }]}>
                    {isMl
                      ? `"${scannedBarcode}" ടിക്കറ്റ് പരിശോധിക്കാൻ നറുക്കെടുപ്പ് തീയതി തിരഞ്ഞെടുക്കുക.`
                      : `Select the draw date for ticket "${scannedBarcode}" to fetch accurate results.`}
                  </Text>
                </View>

                {/* 1. Top Date Picker Row (Default selected with last available draw date) */}
                <View style={styles.customDateContainer}>
                  <Text style={styles.sectionLabel}>{t("pick_draw_date_label")}</Text>
                  <View style={styles.datePickerInputRow}>
                    <TouchableOpacity
                      style={styles.dateInputBox}
                      activeOpacity={0.8}
                      onPress={() => setIsDatePickerOpen(true)}
                    >
                      <Calendar size={18} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dateInputText}>
                          {selectedDate ? selectedDate : t("select_from_calendar")}
                        </Text>
                        {selectedDrawForDate && (
                          <Text style={styles.dateInputSubText} numberOfLines={1}>
                            {selectedDrawForDate.draw_name} ({selectedDrawForDate.lottery_code})
                          </Text>
                        )}
                      </View>
                      <ChevronRight size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.fetchDateBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (selectedDate) {
                          handleVerifyTicket(selectedDate);
                        } else {
                          setIsDatePickerOpen(true);
                        }
                      }}
                    >
                      <Text style={styles.fetchDateBtnText}>{t("fetch_result_btn")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. OR Divider */}
                <View style={styles.orDividerContainer}>
                  <View style={styles.orDividerLine} />
                  <Text style={styles.orDividerText}>{t("or_divider_text")}</Text>
                  <View style={styles.orDividerLine} />
                </View>

                {/* 3. Quick Draw Horizontal Selection Cards (Image 3 style) */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>{t("select_draw_prompt")}</Text>
                  <Text style={styles.sectionHint}>
                    {isMl ? "ടാപ്പ് ചെയ്ത് പരിശോധിക്കുക" : "Tap to check instantly"}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.drawCardsScroll}
                >
                  {relevantDraws.slice(0, 10).map((draw: DrawResult, idx: number) => {
                    const isLatest = idx === 0;
                    const isSelected = selectedDate === draw.draw_date;
                    return (
                      <TouchableOpacity
                        key={draw.draw_date + (draw.lottery_code || idx)}
                        style={[
                          styles.drawTicketCard,
                          isSelected && styles.drawTicketCardSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedDate(draw.draw_date);
                          handleVerifyTicket(draw.draw_date);
                        }}
                      >
                        {/* Top Row: Name + Inline LATEST Badge */}
                        <View style={styles.drawCardTopRow}>
                          <Text
                            style={[
                              styles.drawTicketName,
                              isSelected && styles.drawTicketNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {draw.draw_name || draw.lottery_code}
                          </Text>
                          {isLatest && (
                            <View style={styles.inlineLatestBadge}>
                              <Sparkles size={9} color="#16A34A" />
                              <Text style={styles.inlineLatestBadgeText}>
                                {isMl ? "ഏറ്റവും പുതിയത്" : "LATEST"}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Bottom Row: Date, Dotted Divider, Code Badge */}
                        <View style={styles.drawCardBottomRow}>
                          <Text
                            style={[
                              styles.drawTicketDate,
                              isSelected && styles.drawTicketDateSelected,
                            ]}
                          >
                            {formatDisplayDate(draw.draw_date)}
                          </Text>

                          <View style={styles.drawTicketDashedDivider} />

                          <Text style={styles.drawCodeTag}>
                            {draw.lottery_code || "KL"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : isSearching ? (
              /* LOADING STATE */
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>{t("fetching_results_loading")}</Text>
                <Text style={styles.loadingSub}>
                  {t("ticket_number")}: {scannedBarcode} •{" "}
                  {formatDisplayDate(selectedDate)}
                  {targetLotteryCode ? ` • ${targetLotteryCode}` : ""}
                </Text>
              </View>
            ) : isWinner ? (
              /* WINNING RESULT */
              <View style={styles.resultContainer}>
                <View style={styles.winBanner}>
                  <Text style={styles.celebrationEmoji}>🎉 🏆 ✨</Text>
                  <Text style={styles.winTitle}>
                    {isMl ? "സമ്മാനാർഹമായ ടിക്കറ്റ്!" : "WINNING TICKET MATCH!"}
                  </Text>
                  <Text style={styles.winSubtitle}>
                    {isMl
                      ? "അഭിനന്ദനങ്ങൾ! നിങ്ങൾ പരിശോധിച്ച ടിക്കറ്റിന് സമ്മാനം ലഭിച്ചിരിക്കുന്നു!"
                      : "Congratulations! Your scanned ticket won a prize!"}
                  </Text>
                </View>

                {allMatches?.map((match, i) => (
                  <View key={i} style={styles.prizeCard}>
                    <View style={styles.prizeHeaderRow}>
                      <Trophy size={20} color={COLORS.gold} />
                      <Text style={styles.prizeTierText}>{match.prize_tier}</Text>
                    </View>

                    <Text style={styles.prizeAmountText}>
                      {match.prize_amount || (isMl ? "സമ്മാനാർഹമായ ടിക്കറ്റ്" : "Winning Ticket")}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        {isMl ? "മാച്ച് ആയ ടിക്കറ്റ്:" : "Ticket Matched:"}
                      </Text>
                      <Text style={styles.detailValueBold}>{match.ticket_matched}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        {isMl ? "ലോട്ടറി പേര്:" : "Draw Name:"}
                      </Text>
                      <Text style={styles.detailValue}>
                        {match.draw_name} ({match.draw_code})
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        {isMl ? "നറുക്കെടുപ്പ് തീയതി:" : "Draw Date:"}
                      </Text>
                      <Text style={styles.detailValue}>
                        {formatDisplayDate(match.draw_date)}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Winning Result Action Buttons */}
                <View style={styles.resultActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.viewResultPrimaryBtn}
                    activeOpacity={0.8}
                    onPress={handleViewFullResult}
                  >
                    <FileText size={16} color="#FFFFFF" />
                    <Text style={styles.viewResultPrimaryBtnText}>
                      {t("view_result_btn")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.changeDateSecondaryBtn}
                    activeOpacity={0.8}
                    onPress={() => setStep("select_date")}
                  >
                    <RefreshCw size={15} color={COLORS.primary} />
                    <Text style={styles.changeDateSecondaryBtnText}>
                      {t("change_date_btn")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* NO PRIZE MATCH RESULT (Matching Image 4 Style) */
              <View style={styles.resultContainer}>
                <View style={styles.noWinCard}>
                  {/* Circle X Icon (Matching Image 4) */}
                  <View style={styles.noWinIconCircle}>
                    <XCircle size={46} color="#64748B" />
                  </View>

                  <Text style={[styles.noWinTitle, indic && { fontSize: 18 }]}>
                    {t("no_prize_found")}
                  </Text>

                  <Text style={[styles.noWinSub, indic && { fontSize: 13, lineHeight: 19 }]}>
                    {is4DigitQuery
                      ? isMl
                        ? `4 അക്ക നമ്പർ "${scannedBarcode}" 4 മുതൽ 9 വരെയുള്ള സമ്മാനങ്ങളിൽ ഇല്ല. 1, 2, 3 സമ്മാനങ്ങളും സമാശ്വാസ സമ്മാനവും പരിശോധിക്കാൻ മുഴുവൻ 6 അക്ക ടിക്കറ്റ് നമ്പർ നൽകുക.`
                        : `4-digit query "${scannedBarcode}" did not match 4th to 9th Prize tiers. Note: 1st, 2nd, 3rd, and Consolation prizes strictly require entering your full 6-digit ticket number with series.`
                      : isMl
                      ? `ടിക്കറ്റ് "${scannedBarcode}" ${formatDisplayDate(selectedDate)} തീയതിയിലെ ${matchedDrawDetails?.draw_name || "നറുക്കെടുപ്പിൽ"} സമ്മാനം നേടിയിട്ടില്ല.`
                      : `Ticket "${scannedBarcode}" did not match any winning prize in ${matchedDrawDetails?.draw_name || "the draw"} (${formatDisplayDate(selectedDate)}).`}
                  </Text>
                </View>

                {/* Compact Draw Context Snapshot if available */}
                {matchedDrawDetails && (
                  <View style={styles.drawContextCard}>
                    <View style={styles.drawContextTopRow}>
                      <Text style={styles.drawContextTitle}>
                        {matchedDrawDetails.draw_name} ({matchedDrawDetails.draw_code})
                      </Text>
                      <Text style={styles.drawContextDate}>
                        {formatDisplayDate(matchedDrawDetails.draw_date)}
                      </Text>
                    </View>
                    <View style={styles.drawContextWinnerRow}>
                      <Trophy size={14} color="#D97706" />
                      <Text style={styles.drawContextWinnerText}>
                        {t("first_prize")}:{" "}
                        <Text style={{ fontWeight: "800", color: COLORS.primary }}>
                          {matchedDrawDetails.first?.ticket || "N/A"}
                        </Text>
                        {matchedDrawDetails.first?.location
                          ? ` (${matchedDrawDetails.first.location})`
                          : ""}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Action Buttons Row: View Result & Just Miss (Image 4) */}
                <View style={styles.noMatchActionRow}>
                  <TouchableOpacity
                    style={styles.noMatchViewResultBtn}
                    activeOpacity={0.8}
                    onPress={handleViewFullResult}
                  >
                    <FileText size={16} color={COLORS.primary} />
                    <Text style={styles.noMatchViewResultText}>
                      {t("view_result_btn")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.noMatchJustMissBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerLightHaptic();
                      setIsJustMissOpen(true);
                    }}
                  >
                    <Target size={16} color="#FFFFFF" />
                    <Text style={styles.noMatchJustMissText}>
                      {t("just_miss_btn")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Secondary Option: Change Date */}
                <TouchableOpacity
                  style={styles.changeDateFullBtn}
                  activeOpacity={0.8}
                  onPress={() => setStep("select_date")}
                >
                  <RefreshCw size={14} color={COLORS.primary} />
                  <Text style={styles.changeDateFullBtnText}>
                    {t("change_date_btn")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.rescanBtn}
              activeOpacity={0.8}
              onPress={onRescan}
            >
              <Camera size={17} color={COLORS.primary} />
              <Text style={styles.rescanBtnText}>{t("rescan_btn")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.doneBtnText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Calendar Picker Modal */}
      <ModernDatePickerModal
        visible={isDatePickerOpen}
        selectedDate={selectedDate || null}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={(dateStr) => {
          setIsDatePickerOpen(false);
          if (dateStr) {
            setSelectedDate(dateStr);
            handleVerifyTicket(dateStr);
          }
        }}
      />

      {/* Just Miss Analysis Modal */}
      {isJustMissOpen && (
        <JustMissModal
          visible={isJustMissOpen}
          onClose={() => setIsJustMissOpen(false)}
          searchedTicket={scannedBarcode || ""}
          draw={matchedDrawDetails || relevantDraws[0] || availableDraws[0]}
          onViewResult={handleViewFullResult}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    minHeight: "55%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  barcodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  barcodeChipText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  lotteryCodeBadge: {
    color: "#D97706",
    fontWeight: "800",
    fontSize: 12,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* Step 1 Styles */
  dateStepContainer: {},
  dateStepHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  calendarIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  dateStepTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  dateStepSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },

  /* Top Custom Date Picker Box */
  customDateContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  datePickerInputRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginTop: 8,
  },
  dateInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 52,
    justifyContent: "center",
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  dateInputSubText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 1,
  },
  fetchDateBtn: {
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 18,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#0B3C5D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fetchDateBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* OR Divider */
  orDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orDividerText: {
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionHint: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },

  /* Horizontal Draw Cards */
  drawCardsScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  drawTicketCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    padding: 12,
    minWidth: 165,
  },
  drawTicketCardSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#16A34A",
    borderWidth: 2,
  },
  drawCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 4,
  },
  drawTicketName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  drawTicketNameSelected: {
    color: "#166534",
    fontWeight: "800",
  },
  inlineLatestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineLatestBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
  },
  drawCardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawTicketDate: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  drawTicketDateSelected: {
    color: "#15803D",
  },
  drawTicketDashedDivider: {
    width: 1,
    height: 14,
    borderWidth: 0.8,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    marginHorizontal: 8,
  },
  drawCodeTag: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  /* Loading Container */
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  loadingSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },

  /* Result Container */
  resultContainer: {
    gap: 14,
  },

  /* Winner Styles */
  winBanner: {
    backgroundColor: "#FEF9C3",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FACC15",
    padding: 16,
    alignItems: "center",
  },
  celebrationEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  winTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#854D0E",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  winSubtitle: {
    fontSize: 12,
    color: "#A16207",
    textAlign: "center",
  },
  prizeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: "#0F172A",
  },
  prizeAmountText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#16A34A",
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  detailValueBold: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  resultActionButtonsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginTop: 4,
  },
  viewResultPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    minHeight: 50,
    borderRadius: 14,
  },
  viewResultPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  changeDateSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 16,
    minHeight: 50,
    borderRadius: 14,
  },
  changeDateSecondaryBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  /* No Win Styles (Matching Image 4) */
  noWinCard: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  noWinIconCircle: {
    marginBottom: 10,
  },
  noWinTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  noWinSub: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 6,
  },

  /* Draw Context Card */
  drawContextCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  drawContextTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  drawContextTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  drawContextDate: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  drawContextWinnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  drawContextWinnerText: {
    fontSize: 12,
    color: "#334155",
  },

  /* Action Buttons (Image 4 Side by Side) */
  noMatchActionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginTop: 4,
  },
  noMatchViewResultBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    minHeight: 50,
    borderRadius: 14,
  },
  noMatchViewResultText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  noMatchJustMissBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    minHeight: 50,
    borderRadius: 14,
  },
  noMatchJustMissText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  changeDateFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 46,
    borderRadius: 12,
  },
  changeDateFullBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Bottom Footer */
  footer: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  rescanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    minHeight: 52,
    borderRadius: 14,
  },
  rescanBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  doneBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    minHeight: 52,
    borderRadius: 14,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
