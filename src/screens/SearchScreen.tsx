import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ticket,
  Layers,
  AlertCircle,
  Calendar,
  Database,
  Filter,
  Sparkles,
  Camera,
  RotateCw,
  Trophy,
  XCircle,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  searchTicketNumber,
  SearchMatch,
  fetchAllDraws,
  DrawResult,
  formatTicketSearchInput,
} from "../api/lotteryApi";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import BarcodeResultModal from "../components/BarcodeResultModal";
import ModernDatePickerModal from "../components/ModernDatePickerModal";
import { useLanguage } from "../context/LanguageContext";

export default function SearchScreen({ navigation }: any) {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [query, setQuery] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [singleResults, setSingleResults] = useState<SearchMatch[] | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [allDraws, setAllDraws] = useState<DrawResult[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isBarcodeResultOpen, setIsBarcodeResultOpen] = useState(false);

  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );
  const [customDateInput, setCustomDateInput] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  React.useEffect(() => {
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
    setQuery(extractedTicket);
    setIsBarcodeResultOpen(true);
  };

  const handleModeChange = (newMode: "single" | "batch") => {
    if (newMode === mode) return;
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setMode(newMode);
    handleReset();
  };

  interface BatchItem {
    ticket: string;
    matches: SearchMatch[];
  }
  const [batchResults, setBatchResults] = useState<BatchItem[] | null>(null);

  const handleSingleSearch = async () => {
    if (!query.trim()) return;
    const digits = query.replace(/\D/g, "");
    if (digits.length < 4) {
      setErrorMessage(
        language === "ml"
          ? "തിരയാൻ കുറഞ്ഞത് 4 അക്കങ്ങൾ നൽകുക (ഉദാ: 6935, BT 236935)"
          : "Please enter at least 4 digits to search (e.g. 6935, BT 236935)."
      );
      return;
    }
    setIsSearching(true);
    setErrorMessage(null);
    try {
      const matches = await searchTicketNumber(
        query.trim(),
        selectedDateFilter || undefined,
      );
      setSingleResults(matches);
    } catch (err: any) {
      setSingleResults([]);
      setErrorMessage(err.message || "Failed to search ticket.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBatchSearch = async () => {
    const rawList = batchInput
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.replace(/\D/g, "").length >= 4);

    if (rawList.length === 0) {
      setErrorMessage(
        language === "ml"
          ? "ഓരോ ടിക്കറ്റ് നമ്പറിലും കുറഞ്ഞത് 4 അക്കങ്ങൾ ഉണ്ടായിരിക്കണം"
          : "Each ticket must have at least 4 digits (e.g. 6935, BT 236935)."
      );
      return;
    }
    setIsSearching(true);
    setErrorMessage(null);
    try {
      const compiled: BatchItem[] = [];
      for (const ticket of rawList) {
        const matches = await searchTicketNumber(
          ticket,
          selectedDateFilter || undefined,
        );
        compiled.push({ ticket, matches });
      }
      setBatchResults(compiled);
    } catch (err: any) {
      setBatchResults([]);
      setErrorMessage(err.message || "Failed to search batch tickets.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setBatchInput("");
    setSingleResults(null);
    setBatchResults(null);
    setErrorMessage(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS === "android"}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              language === "ml" && { fontSize: 20, lineHeight: 28 },
            ]}
          >
            {t("checker_title")}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              language === "ml" && { fontSize: 12, lineHeight: 18 },
            ]}
          >
            {t("checker_subtitle")}
          </Text>
        </View>

        {/* Mode Selector Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, mode === "single" && styles.activeTab]}
            onPress={() => handleModeChange("single")}
          >
            <Ticket
              size={15}
              color={mode === "single" ? COLORS.white : COLORS.textDark}
            />
            <Text
              style={[
                styles.tabText,
                mode === "single" && styles.activeTabText,
                language === "ml" && { fontSize: 12 },
              ]}
              numberOfLines={1}
            >
              {t("single_search")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, mode === "batch" && styles.activeTab]}
            onPress={() => handleModeChange("batch")}
          >
            <Layers
              size={15}
              color={mode === "batch" ? COLORS.white : COLORS.textDark}
            />
            <Text
              style={[
                styles.tabText,
                mode === "batch" && styles.activeTabText,
                language === "ml" && { fontSize: 12 },
              ]}
              numberOfLines={1}
            >
              {t("batch_search")}
            </Text>
          </TouchableOpacity>
        </View>

        {errorMessage && (
          <View
            style={{
              backgroundColor: "#FEE2E2",
              borderColor: "#EF4444",
              borderWidth: 1,
              padding: 12,
              borderRadius: 10,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={20} color="#DC2626" />
            <Text
              style={{
                color: "#991B1B",
                fontWeight: "700",
                flex: 1,
                fontSize: 13,
              }}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Single Mode Input Card */}
        {mode === "single" ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t("ticket_number")}</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={language === "ml" ? "ഉദാ: MJ 136429, 136429, അല്ലെങ്കിൽ 6429" : "e.g. MJ 136429, 136429, or 6429"}
                placeholderTextColor={COLORS.textLight}
                value={query}
                onChangeText={(text) => setQuery(formatTicketSearchInput(text))}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.cameraIconBtn}
                onPress={() => setIsScannerOpen(true)}
              >
                <Camera size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Date Filter Selection */}
            <Text style={styles.label}>{t("draw_date_filter")}</Text>
            <View style={styles.customDateRow}>
              <TouchableOpacity
                style={[
                  styles.customDateInput,
                  { flexDirection: "row", alignItems: "center", gap: 8 },
                ]}
                onPress={() => setIsDatePickerOpen(true)}
              >
                <Calendar size={16} color={COLORS.primary} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: selectedDateFilter
                      ? COLORS.textDark
                      : COLORS.textMuted,
                    fontWeight: "600",
                  }}
                >
                  {selectedDateFilter ? selectedDateFilter : t("all_draws")}
                </Text>
                {selectedDateFilter && (
                  <TouchableOpacity onPress={() => setSelectedDateFilter(null)}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: COLORS.primary,
                        fontWeight: "700",
                      }}
                    >
                      {t("reset")}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!query.trim() || isSearching) && { backgroundColor: "#94A3B8" },
                ]}
                onPress={handleSingleSearch}
                disabled={!query.trim() || isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {t("check_ticket_btn")}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <RotateCw size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Batch Mode Input Card */
          <View style={styles.card}>
            <Text style={styles.label}>{t("batch_search")}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { marginBottom: 12 }]}
              placeholder={t("paste_multiple_placeholder")}
              placeholderTextColor={COLORS.textLight}
              value={batchInput}
              onChangeText={setBatchInput}
              multiline
              numberOfLines={4}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>{t("draw_date_filter")}</Text>
            <View style={styles.customDateRow}>
              <TouchableOpacity
                style={[
                  styles.customDateInput,
                  { flexDirection: "row", alignItems: "center", gap: 8 },
                ]}
                onPress={() => setIsDatePickerOpen(true)}
              >
                <Calendar size={16} color={COLORS.primary} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: selectedDateFilter
                      ? COLORS.textDark
                      : COLORS.textMuted,
                    fontWeight: "600",
                  }}
                >
                  {selectedDateFilter ? selectedDateFilter : t("all_draws")}
                </Text>
                {selectedDateFilter && (
                  <TouchableOpacity onPress={() => setSelectedDateFilter(null)}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: COLORS.primary,
                        fontWeight: "700",
                      }}
                    >
                      {t("reset")}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!batchInput.trim() || isSearching) && { backgroundColor: "#94A3B8" },
                ]}
                onPress={handleBatchSearch}
                disabled={!batchInput.trim() || isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {t("check_batch_btn")}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <RotateCw size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Single Search Results */}
        {mode === "single" && singleResults !== null && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeader}>
              {t("search_results_for")} "{query}"
            </Text>

            {singleResults.length > 0 ? (
              singleResults.map((match, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate("DrawBreakdown", {
                      code: match.lottery_code,
                      date: match.draw_date,
                      highlight: match.ticket_matched,
                    })
                  }
                  style={[styles.resultCard, styles.winnerCardBorder]}
                >
                  <View style={styles.resultBadgeRow}>
                    <View style={styles.winBadge}>
                      <Trophy size={14} color={COLORS.successText} />
                      <Text style={styles.winBadgeText}>
                        {match.prize_tier}
                      </Text>
                    </View>
                    {match.prize_amount && (
                      <Text style={styles.prizeAmount}>
                        {match.prize_amount}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.drawTitle}>
                    {match.draw_name} ({match.draw_code})
                  </Text>
                  <Text style={styles.drawMeta}>
                    {t("draw_date")}: {match.draw_date} • {t("ticket_number")}:{" "}
                    {match.ticket_matched}
                  </Text>

                  <Text style={[styles.detailsBtnText, { marginTop: 8, fontSize: 12, color: COLORS.primary }]}>
                    Tap to view full prize breakdown →
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noMatchCard}>
                <XCircle
                  size={32}
                  color={
                    selectedDateFilter &&
                    selectedDateFilter >=
                      new Date().toLocaleDateString("en-CA", {
                        timeZone: "Asia/Kolkata",
                      })
                      ? "#D97706"
                      : COLORS.textMuted
                  }
                />
                <Text style={styles.noMatchTitle}>
                  {selectedDateFilter ===
                  new Date().toLocaleDateString("en-CA", {
                    timeZone: "Asia/Kolkata",
                  })
                    ? language === "ml"
                      ? "ഇന്നത്തെ ഫലം തയ്യാറാകുന്നു"
                      : "Today's Draw in Progress"
                    : selectedDateFilter &&
                      selectedDateFilter >
                        new Date().toLocaleDateString("en-CA", {
                          timeZone: "Asia/Kolkata",
                        })
                    ? language === "ml"
                      ? "അടുത്ത നറുക്കെടുപ്പ്"
                      : "Upcoming Scheduled Draw"
                    : t("no_prize_found")}
                </Text>
                <Text style={styles.noMatchSub}>
                  {selectedDateFilter ===
                  new Date().toLocaleDateString("en-CA", {
                    timeZone: "Asia/Kolkata",
                  })
                    ? language === "ml"
                      ? "ഇന്നത്തെ ഫലം ഉച്ചയ്ക്ക് 3:10 ന് പ്രസിദ്ധീകരിക്കും. അല്പം കഴിഞ്ഞ് വീണ്ടും പരിശോധിക്കുക."
                      : "Results for today's draw publish at 3:10 PM. Please check back once the draw concludes."
                    : selectedDateFilter &&
                      selectedDateFilter >
                        new Date().toLocaleDateString("en-CA", {
                          timeZone: "Asia/Kolkata",
                        })
                    ? language === "ml"
                      ? `${selectedDateFilter} തീയതിയിലെ നറുക്കെടുപ്പ് നടന്നിട്ടില്ല.`
                      : `The draw scheduled for ${selectedDateFilter} has not taken place yet.`
                    : query.replace(/\D/g, "").length >= 4 && query.replace(/\D/g, "").length < 6
                    ? language === "ml"
                      ? `ടിക്കറ്റ് "${query}" 4 മുതൽ 9 വരെയുള്ള സമ്മാനങ്ങളിൽ ഇല്ല. 1, 2, 3 സമ്മാനങ്ങളും സമാശ്വാസ സമ്മാനവും പരിശോധിക്കാൻ മുഴുവൻ 6 അക്ക ടിക്കറ്റ് നമ്പർ നൽകുക.`
                      : `4-digit query "${query}" did not match 4th to 9th Prize tiers. Note: 1st, 2nd, 3rd, and Consolation prizes strictly require entering your full 6-digit ticket number with series.`
                    : `"${query}" ${t("no_prize_desc")}`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Batch Search Results */}
        {mode === "batch" && batchResults !== null && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeader}>
              Batch Search Results ({batchResults.length} Tickets)
            </Text>

            {batchResults.map((item, idx) => {
              const hasWin = item.matches.length > 0;
              return (
                <View
                  key={idx}
                  style={[styles.resultCard, hasWin && styles.winnerCardBorder]}
                >
                  <View style={styles.resultBadgeRow}>
                    <Text style={styles.ticketLabel}>
                      Ticket: {item.ticket}
                    </Text>
                    {hasWin ? (
                      <Text style={styles.matchFoundText}>
                        🎉 {item.matches.length} MATCH FOUND
                      </Text>
                    ) : (
                      <Text style={styles.noMatchText}>No Win</Text>
                    )}
                  </View>

                  {hasWin ? (
                    item.matches.map((m, mIdx) => (
                      <TouchableOpacity
                        key={mIdx}
                        activeOpacity={0.72}
                        onPress={() =>
                          navigation.navigate("DrawBreakdown", {
                            code: m.lottery_code,
                            date: m.draw_date,
                            highlight: m.ticket_matched,
                          })
                        }
                        style={[styles.batchMatchBox, {
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.batchMatchTier}>
                            {m.prize_tier} — {m.prize_amount || ""}
                          </Text>
                          <Text style={styles.batchMatchSub}>
                            {m.draw_name} ({m.draw_code}) on {m.draw_date}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 18, color: COLORS.primary, fontWeight: "900", marginLeft: 8 }}>›</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noMatchSub}>
                      No winning prize match found in database.
                    </Text>
                  )}
                </View>
              );
            })}
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
        availableDraws={allDraws}
        onClose={() => setIsBarcodeResultOpen(false)}
        onRescan={() => {
          setIsBarcodeResultOpen(false);
          setIsScannerOpen(true);
        }}
      />

      {/* Modern Visual Calendar Date Picker Modal */}
      <ModernDatePickerModal
        visible={isDatePickerOpen}
        selectedDate={selectedDateFilter}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={(dateStr) => setSelectedDateFilter(dateStr)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  activeTabText: { color: COLORS.white },
  dateFilterCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  dateFilterTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  dateChipsScroll: {
    marginBottom: 8,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  activeDateChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  activeDateChipText: {
    color: COLORS.white,
  },
  customDateRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  customDateInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: COLORS.background,
  },
  applyDateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  applyDateBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },
  activeFilterBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  activeFilterBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  label: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 8,
  },
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
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
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
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 10 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 13.5,
    textAlign: "center",
  },
  resetBtn: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultsSection: { marginTop: 8, gap: 12 },
  resultsHeader: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  resultCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  winnerCardBorder: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primaryLight,
  },
  resultBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  winBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  winBadgeText: { fontSize: 12, fontWeight: "800", color: COLORS.successText },
  prizeAmount: { fontSize: 14, fontWeight: "900", color: COLORS.primary },
  drawTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  drawMeta: { fontSize: 12, color: COLORS.textMuted },
  detailsBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailsBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  noMatchCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noMatchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 6,
  },
  noMatchSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  ticketLabel: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  matchFoundText: { fontSize: 12, fontWeight: "900", color: COLORS.primary },
  noMatchText: { fontSize: 12, color: COLORS.textMuted },
  batchMatchBox: {
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchMatchTier: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  batchMatchSub: { fontSize: 11, color: COLORS.textMuted },
});
