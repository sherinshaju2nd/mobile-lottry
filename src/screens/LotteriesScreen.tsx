import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Sparkles, Calendar, Trophy } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  WEEKLY_LOTTERIES,
  BUMPER_LOTTERIES,
  ALL_LOTTERIES,
  LotteryMeta,
} from "../constants/lotteries";
import { fetchLotteriesFromDb } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";

export default function LotteriesScreen({ navigation }: any) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"weekly" | "bumper">("weekly");
  const [weeklyData, setWeeklyData] = useState<LotteryMeta[]>(WEEKLY_LOTTERIES);
  const [bumperData, setBumperData] = useState<LotteryMeta[]>(BUMPER_LOTTERIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLotteriesFromDb()
      .then((res) => {
        if (res.weekly && res.weekly.length > 0) setWeeklyData(res.weekly);
        if (res.bumper && res.bumper.length > 0) setBumperData(res.bumper);
      })
      .catch((e) => console.warn("Failed loading lotteries from DB:", e))
      .finally(() => setIsLoading(false));
  }, []);

  const currentData = activeTab === "weekly" ? weeklyData : bumperData;

  const renderSkeleton = () => (
    <View style={{ gap: 12 }}>
      {[1, 2, 3, 4].map((k) => (
        <View
          key={k}
          style={[
            styles.card,
            { opacity: 0.6, borderColor: "#E2E8F0" },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.codeChip, { backgroundColor: "#E2E8F0", width: 45, height: 22 }]} />
            <View style={{ width: 80, height: 16, backgroundColor: "#E2E8F0", borderRadius: 4 }} />
          </View>
          <View style={{ width: 140, height: 20, backgroundColor: "#E2E8F0", borderRadius: 6, marginVertical: 6 }} />
          <View style={{ width: "70%", height: 14, backgroundColor: "#E2E8F0", borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: LotteryMeta }) => {
    const isBumper = item.isBumper;

    return (
      <TouchableOpacity
        style={[styles.card, isBumper && styles.bumperCard]}
        onPress={() => navigation.navigate("LotteryArchive", { code: item.code })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.codeChip}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
            <Text style={[styles.dayText, language === "ml" && { fontSize: 11, paddingHorizontal: 8 }]}>
              {item.day}
            </Text>
          </View>
          <ChevronRight size={18} color={COLORS.primary} />
        </View>

        <Text style={[styles.title, language === "ml" && { fontSize: 15, lineHeight: 22, fontWeight: "800" }]}>
          {language === "ml" && item.nameMl ? item.nameMl : item.name}
        </Text>

        {isBumper && item.jackpot && (
          <View style={styles.jackpotRow}>
            <Trophy size={13} color={COLORS.primary} />
            <Text style={[styles.jackpotText, language === "ml" && { fontSize: 11 }]}>
              {language === "ml" ? "ഒന്നാം സമ്മാനം:" : "1st Prize:"}{" "}
              <Text style={{ fontWeight: "900", color: COLORS.primary }}>{item.jackpot}</Text>
            </Text>
          </View>
        )}

        <Text style={[styles.subtitle, language === "ml" && { fontSize: 11, lineHeight: 16 }]}>
          {isBumper
            ? language === "ml"
              ? `നറുക്കെടുപ്പ് സമയം: ${item.drawSeason || "ഉച്ചയ്ക്ക് 2:00 മണി"}`
              : `Draw Season: ${item.drawSeason || "Annual Bumper"}`
            : language === "ml"
              ? "നറുക്കെടുപ്പ്: ഉച്ചയ്ക്ക് 3:00 മണി"
              : `Draw: ${item.drawTime}`}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.footerLink, language === "ml" && { fontSize: 11.5 }]}>
            {t("view_archive")} →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              language === "ml" && { fontSize: 16.5, lineHeight: 24 },
            ]}
          >
            {t("lotteries_title")}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              language === "ml" && { fontSize: 10.5, lineHeight: 15 },
            ]}
          >
            {t("lotteries_subtitle")}
          </Text>
        </View>

        {/* Tab Switcher: Weekly Draws vs Bumper Lotteries */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "weekly" && styles.activeTab]}
            onPress={() => setActiveTab("weekly")}
            activeOpacity={0.85}
          >
            <Calendar size={13} color={activeTab === "weekly" ? COLORS.white : COLORS.textDark} />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                activeTab === "weekly" && styles.activeTabText,
                language === "ml" && { fontSize: 11 },
              ]}
            >
              {language === "ml" ? `പ്രതിവാര ലോട്ടറി (${weeklyData.length})` : `Weekly Draws (${weeklyData.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "bumper" && styles.activeTab]}
            onPress={() => setActiveTab("bumper")}
            activeOpacity={0.85}
          >
            <Sparkles size={13} color={activeTab === "bumper" ? COLORS.white : COLORS.textDark} />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                activeTab === "bumper" && styles.activeTabText,
                language === "ml" && { fontSize: 11 },
              ]}
            >
              {language === "ml" ? `ബംപർ ലോട്ടറി (${bumperData.length})` : `Bumper Draws (${bumperData.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {renderSkeleton()}
          </View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 14 },
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
    marginBottom: 14,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  activeBumperTab: {
    backgroundColor: "#D97706",
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  activeTabText: {
    color: COLORS.white,
  },
  activeBumperTabText: {
    color: COLORS.white,
  },
  listContainer: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bumperCard: {
    borderColor: "#FCD34D",
    backgroundColor: "#FFFDF7",
    borderWidth: 2,
    shadowColor: "#D97706",
    shadowOpacity: 0.12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeChip: {
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bumperCodeChip: {
    backgroundColor: "#92400E",
  },
  codeText: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
  dayText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.primary,
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  jackpotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  jackpotText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  subtitle: { fontSize: 12.5, fontWeight: "600", color: "#64748B", marginBottom: 12 },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerLink: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
});
