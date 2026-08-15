import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  ArrowLeft,
  Search,
  XCircle,
  FileText,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { WEEKLY_LOTTERIES, getLotteryMalayalamName } from "../constants/lotteries";
import { fetchLotteryHistory, DrawResult, supabase } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";

export default function LotteryArchiveScreen({ route, navigation }: any) {
  const { t, language } = useLanguage();
  const { code } = route.params || { code: "BT" };
  const codeUpper = code.toUpperCase();

  const lotteryMeta = WEEKLY_LOTTERIES.find((l) => l.code === codeUpper) || {
    name: `${codeUpper} Lottery`,
    nameMl: "",
    code: codeUpper,
    day: "Scheduled Draw",
    drawTime: "3:00 PM",
  };

  const [history, setHistory] = useState<DrawResult[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<DrawResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const results = await fetchLotteryHistory(codeUpper);
        setHistory(results);
        setFilteredHistory(results);
      } catch {
        setHistory([]);
        setFilteredHistory([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();

    const channelName = `realtime-archive-${codeUpper}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draw_results" },
        () => {
          loadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [codeUpper]);

  useEffect(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter((d) => {
        const dateMatch = d.draw_date.toLowerCase().includes(q);
        const nameMatch = d.draw_name.toLowerCase().includes(q);
        const ticketMatch = (d.first?.ticket || "").toLowerCase().includes(q);
        return dateMatch || nameMatch || ticketMatch;
      });
      setFilteredHistory(filtered);
    }
  }, [searchFilter, history]);

  const renderItem = ({ item }: { item: DrawResult }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("DrawBreakdown", { code: codeUpper, date: item.draw_date })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.dateText}>{item.draw_date}</Text>
        <View style={styles.codeChip}>
          <Text style={styles.codeText}>{item.draw_code}</Text>
        </View>
      </View>

      <Text style={styles.drawName}>
        {item.draw_name} {getLotteryMalayalamName(codeUpper) ? `(${getLotteryMalayalamName(codeUpper)})` : ""}
      </Text>

      <View style={styles.winnerBox}>
        <Text style={styles.winnerLabel}>
          {language === "ml" ? "1-ാം സമ്മാന വിജയിച്ച ടിക്കറ്റ്" : "1ST PRIZE WINNING TICKET"}
        </Text>
        <Text style={styles.winnerTicket}>{item.first?.ticket || "N/A"}</Text>
        {item.first?.location && (
          <Text style={styles.winnerMeta}>
            {t("location")}: {item.first.location}
          </Text>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          {language === "ml" ? "സമ്പൂർണ്ണ ഫലങ്ങൾ കാണുക" : "View Full Results & Breakdown"}
        </Text>
        <ChevronRight size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.title,
                language === "ml" && { fontSize: 16.5, lineHeight: 24 },
              ]}
            >
              {language === "ml" && lotteryMeta.nameMl ? lotteryMeta.nameMl : lotteryMeta.name} ({codeUpper})
            </Text>
            <Text
              style={[
                styles.subtitle,
                language === "ml" && { fontSize: 11.5 },
              ]}
            >
              {language === "ml" ? "നറുക്കെടുപ്പ് ദിനം:" : "Draw Day:"} {lotteryMeta.day} • {filteredHistory.length} {language === "ml" ? "ഫലങ്ങൾ" : "Draws"}
            </Text>
          </View>
        </View>

        {/* Filter Input */}
        <View style={styles.filterContainer}>
          <Search size={16} color={COLORS.textLight} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.filterInput}
            placeholder={language === "ml" ? "തീയതിയോ ടിക്കറ്റോ നൽകി തിരയുക..." : "Filter by date (e.g. 2026-08-10) or ticket..."}
            placeholderTextColor={COLORS.textLight}
            value={searchFilter}
            onChangeText={setSearchFilter}
          />
          {searchFilter !== "" && (
            <TouchableOpacity onPress={() => setSearchFilter("")}>
              <XCircle size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* History List */}
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : filteredHistory.length > 0 ? (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item: DrawResult) => item.draw_date}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FileText size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No historical draws matched your filter.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  subtitle: { fontSize: 12, color: COLORS.textMuted },
  filterContainer: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 14 },
  filterInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  listContainer: { gap: 12, paddingBottom: 24 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  dateText: { fontSize: 13, fontWeight: "800", color: COLORS.textDark },
  codeChip: { backgroundColor: COLORS.chipBlueBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  codeText: { fontSize: 11, fontWeight: "900", color: COLORS.chipBlueText },
  drawName: { fontSize: 16, fontWeight: "800", color: COLORS.primary, marginBottom: 8 },
  winnerBox: { backgroundColor: COLORS.goldLight, padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: COLORS.goldBorder },
  winnerLabel: { fontSize: 10, fontWeight: "800", color: COLORS.gold, marginBottom: 2 },
  winnerTicket: { fontSize: 18, fontWeight: "900", color: COLORS.gold },
  winnerMeta: { fontSize: 11, color: COLORS.textDark, marginTop: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.background },
  footerText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { marginTop: 8, fontSize: 13, color: COLORS.textMuted },
});
