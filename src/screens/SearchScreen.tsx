import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { searchTicketNumber, SearchMatch } from "../api/lotteryApi";

export default function SearchScreen({ navigation }: any) {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [query, setQuery] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [singleResults, setSingleResults] = useState<SearchMatch[] | null>(null);

  interface BatchItem {
    ticket: string;
    matches: SearchMatch[];
  }
  const [batchResults, setBatchResults] = useState<BatchItem[] | null>(null);

  const handleSingleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const matches = await searchTicketNumber(query.trim());
      setSingleResults(matches);
    } catch {
      setSingleResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBatchSearch = async () => {
    const rawList = batchInput
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    if (rawList.length === 0) return;
    setIsSearching(true);
    try {
      const compiled: BatchItem[] = [];
      for (const ticket of rawList) {
        const matches = await searchTicketNumber(ticket);
        compiled.push({ ticket, matches });
      }
      setBatchResults(compiled);
    } catch {
      setBatchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setBatchInput("");
    setSingleResults(null);
    setBatchResults(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ticket Result Checker</Text>
          <Text style={styles.headerSubtitle}>
            Verify single tickets or batch bundles against official Kerala state lottery results.
          </Text>
        </View>

        {/* Mode Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, mode === "single" && styles.activeTab]}
            onPress={() => setMode("single")}
          >
            <Ionicons name="search" size={16} color={mode === "single" ? COLORS.white : COLORS.textDark} />
            <Text style={[styles.tabText, mode === "single" && styles.activeTabText]}>Single Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, mode === "batch" && styles.activeTab]}
            onPress={() => setMode("batch")}
          >
            <Ionicons name="layers-outline" size={16} color={mode === "batch" ? COLORS.white : COLORS.textDark} />
            <Text style={[styles.tabText, mode === "batch" && styles.activeTabText]}>Bundle (Batch)</Text>
          </TouchableOpacity>
        </View>

        {/* Single Mode Input */}
        {mode === "single" ? (
          <View style={styles.card}>
            <Text style={styles.label}>Ticket Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BT 263322 or 3322"
              placeholderTextColor={COLORS.textLight}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="characters"
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSingleSearch} disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Check Winning Ticket</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Ionicons name="refresh" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Batch Mode Input */
          <View style={styles.card}>
            <Text style={styles.label}>Paste Multiple Ticket Numbers</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter tickets separated by newlines e.g.:&#10;BT 263322&#10;SS 192842&#10;3322"
              placeholderTextColor={COLORS.textLight}
              value={batchInput}
              onChangeText={setBatchInput}
              multiline
              numberOfLines={4}
              autoCapitalize="characters"
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleBatchSearch} disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Check All Bundle Tickets</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Ionicons name="refresh" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Single Search Results */}
        {mode === "single" && singleResults !== null && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeader}>Results for &quot;{query}&quot;</Text>

            {singleResults.length > 0 ? (
              singleResults.map((match, idx) => (
                <View key={idx} style={styles.resultCard}>
                  <View style={styles.resultBadgeRow}>
                    <View style={styles.winBadge}>
                      <Ionicons name="trophy" size={14} color={COLORS.successText} />
                      <Text style={styles.winBadgeText}>{match.prize_tier}</Text>
                    </View>
                    {match.prize_amount && <Text style={styles.prizeAmount}>{match.prize_amount}</Text>}
                  </View>

                  <Text style={styles.drawTitle}>{match.draw_name} ({match.draw_code})</Text>
                  <Text style={styles.drawMeta}>Draw Date: {match.draw_date}</Text>
                  <Text style={styles.drawMeta}>Winning Number Matched: {match.ticket_matched}</Text>

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => navigation.navigate("DrawBreakdown", { code: match.lottery_code, date: match.draw_date })}
                  >
                    <Text style={styles.detailsBtnText}>View Breakdown →</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noMatchCard}>
                <Ionicons name="alert-circle-outline" size={24} color={COLORS.textMuted} />
                <Text style={styles.noMatchTitle}>No Prize Match</Text>
                <Text style={styles.noMatchSub}>Ticket &quot;{query}&quot; did not match any prize tier in published results.</Text>
              </View>
            )}
          </View>
        )}

        {/* Batch Search Results */}
        {mode === "batch" && batchResults !== null && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeader}>Bundle Search Results ({batchResults.length} Tickets)</Text>

            {batchResults.map((item, index) => {
              const hasMatch = item.matches.length > 0;
              return (
                <View key={index} style={[styles.resultCard, hasMatch && styles.winnerCardBorder]}>
                  <View style={styles.resultBadgeRow}>
                    <Text style={styles.ticketLabel}>Ticket: {item.ticket}</Text>
                    <Text style={hasMatch ? styles.matchFoundText : styles.noMatchText}>
                      {hasMatch ? `🎉 ${item.matches.length} WIN MATCH!` : "No Match"}
                    </Text>
                  </View>

                  {hasMatch ? (
                    item.matches.map((m, idx) => (
                      <View key={idx} style={styles.batchMatchBox}>
                        <Text style={styles.batchMatchTier}>{m.prize_tier} — {m.prize_amount || ""}</Text>
                        <Text style={styles.batchMatchSub}>{m.draw_name} ({m.draw_code}) on {m.draw_date}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noMatchSub}>No winning prize match found in database.</Text>
                  )}
                </View>
              );
            })}
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
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted },
  tabBar: { flexDirection: "row", backgroundColor: COLORS.border, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, gap: 6 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  activeTabText: { color: COLORS.white },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textDark, marginBottom: 8 },
  input: { height: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: COLORS.textDark, backgroundColor: COLORS.background },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 10 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: { flex: 1, height: 46, backgroundColor: COLORS.primary, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  resetBtn: { width: 46, height: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  resultsSection: { marginTop: 8, gap: 12 },
  resultsHeader: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  resultCard: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  winnerCardBorder: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: COLORS.primaryLight },
  resultBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  winBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  winBadgeText: { fontSize: 12, fontWeight: "800", color: COLORS.successText },
  prizeAmount: { fontSize: 14, fontWeight: "900", color: COLORS.primary },
  drawTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark, marginBottom: 2 },
  drawMeta: { fontSize: 12, color: COLORS.textMuted },
  detailsBtn: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  detailsBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  noMatchCard: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  noMatchTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark, marginTop: 6 },
  noMatchSub: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 2 },
  ticketLabel: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  matchFoundText: { fontSize: 12, fontWeight: "900", color: COLORS.primary },
  noMatchText: { fontSize: 12, color: COLORS.textMuted },
  batchMatchBox: { backgroundColor: COLORS.white, padding: 8, borderRadius: 6, marginTop: 6, borderWidth: 1, borderColor: COLORS.border },
  batchMatchTier: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  batchMatchSub: { fontSize: 11, color: COLORS.textMuted },
});
