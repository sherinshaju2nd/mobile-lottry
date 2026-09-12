import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Sparkles, Calendar, Trophy } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  WEEKLY_LOTTERIES,
  BUMPER_LOTTERIES,
  ALL_LOTTERIES,
  LotteryMeta,
  getDayTranslated,
  getLotteryTranslatedName,
} from "../constants/lotteries";
import { isIndic } from "../constants/translations";
import { fetchLotteriesFromDb } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";

export default function LotteriesScreen({ navigation }: any) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"weekly" | "bumper">("weekly");
  const [weeklyData, setWeeklyData] = useState<LotteryMeta[]>(WEEKLY_LOTTERIES);
  const [bumperData, setBumperData] = useState<LotteryMeta[]>(BUMPER_LOTTERIES);
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = (tab: "weekly" | "bumper") => {
    if (tab === activeTab) return;
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setActiveTab(tab);
  };

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
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.card,
            { backgroundColor: COLORS.cardBg, borderColor: COLORS.border, minHeight: 110 },
          ]}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <View style={{ width: 60, height: 22, backgroundColor: "#E2E8F0", borderRadius: 6 }} />
            <View style={{ width: 70, height: 20, backgroundColor: "#E2E8F0", borderRadius: 6 }} />
          </View>
          <View style={{ width: 140, height: 18, backgroundColor: "#E2E8F0", borderRadius: 6, marginBottom: 8 }} />
          <View style={{ width: 90, height: 14, backgroundColor: "#E2E8F0", borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: LotteryMeta }) => {
    const isBumper = item.isBumper || activeTab === "bumper";
    const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const isDrawToday = item.draw_date ? item.draw_date === todayIST : false;
    const isAnnouncedUpcoming = isBumper && item.draw_date && !isDrawToday;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isDrawToday && styles.cardToday,
          isAnnouncedUpcoming && {
            borderColor: "#F59E0B",
            borderWidth: 1.5,
            backgroundColor: "#FFFDF0",
          },
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("LotteryArchive", { lotteryCode: item.code })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={[
                styles.codeBadge,
                isAnnouncedUpcoming && { backgroundColor: "#FEF3C7" },
              ]}
            >
              <Text
                style={[
                  styles.codeText,
                  isAnnouncedUpcoming && { color: "#92400E" },
                ]}
              >
                {item.code}
              </Text>
            </View>

            {isAnnouncedUpcoming ? (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#FCD34D",
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: "800",
                    color: "#92400E",
                  }}
                >
                  {isDrawToday ? t("draws_today") : `${t("draw_date")}: ${item.draw_date}`}
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.dayText,
                  isIndic(language) && { fontSize: 11, paddingHorizontal: 8 },
                ]}
              >
                {getDayTranslated(item.day, language)}
              </Text>
            )}
          </View>
          <ChevronRight size={18} color={isAnnouncedUpcoming ? "#D97706" : COLORS.primary} />
        </View>

        <Text
          style={[
            styles.title,
            isAnnouncedUpcoming && { color: "#78350F" },
            isIndic(language) && { fontSize: 15, lineHeight: 22, fontWeight: "800" },
          ]}
        >
          {getLotteryTranslatedName(item.code, language) || item.name}
        </Text>

        {isBumper && item.jackpot && (
          <View
            style={[
              styles.jackpotRow,
              isAnnouncedUpcoming && {
                backgroundColor: "#FEF3C7",
                borderColor: "#FCD34D",
              },
            ]}
          >
            <Trophy size={13} color={isAnnouncedUpcoming ? "#D97706" : COLORS.primary} />
            <Text
              style={[
                styles.jackpotText,
                isAnnouncedUpcoming && { color: "#92400E" },
                isIndic(language) && { fontSize: 11 },
              ]}
            >
              {t("first_prize")}:{" "}
              <Text
                style={{
                  fontWeight: "900",
                  color: isAnnouncedUpcoming ? "#78350F" : COLORS.primary,
                }}
              >
                {item.jackpot}
              </Text>
            </Text>
          </View>
        )}

        {isAnnouncedUpcoming ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 8,
              padding: 10,
              borderWidth: 1,
              borderColor: "#F59E0B",
              marginTop: 4,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "900",
                color: "#B45309",
                marginBottom: 2,
                textTransform: "uppercase",
              }}
            >
              {t("announced_draw_date")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "900",
                color: "#78350F",
              }}
            >
              {item.draw_date} • {item.drawTime || "2:00 PM"}
            </Text>
            {item.ticket_price && (
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: "700",
                  color: "#92400E",
                  marginTop: 2,
                }}
              >
                {t("ticket_price")}: {item.ticket_price}
              </Text>
            )}
          </View>
        ) : (
          <Text style={[styles.subtitle, isIndic(language) && { fontSize: 11, lineHeight: 16 }]}>
            {isBumper
              ? `${t("draw_season")}: ${item.drawSeason || "2:00 PM"}`
              : `${t("draw_time")}: ${item.drawTime || "3:00 PM"}`}
          </Text>
        )}

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerLink,
              isAnnouncedUpcoming && { color: "#D97706" },
              isIndic(language) && { fontSize: 11.5 },
            ]}
          >
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
              isIndic(language) && { fontSize: 16.5, lineHeight: 24 },
            ]}
          >
            {t("lotteries_title")}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              isIndic(language) && { fontSize: 10.5, lineHeight: 15 },
            ]}
          >
            {t("lotteries_subtitle")}
          </Text>
        </View>

        {/* Tab Switcher: Weekly Draws vs Bumper Lotteries */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "weekly" && styles.activeTab]}
            onPress={() => handleTabChange("weekly")}
            activeOpacity={0.85}
          >
            <Calendar size={13} color={activeTab === "weekly" ? COLORS.white : COLORS.textDark} />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                activeTab === "weekly" && styles.activeTabText,
                isIndic(language) && { fontSize: 11 },
              ]}
            >
              {t("weekly_tab")} ({weeklyData.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "bumper" && styles.activeTab]}
            onPress={() => handleTabChange("bumper")}
            activeOpacity={0.85}
          >
            <Sparkles size={13} color={activeTab === "bumper" ? COLORS.white : COLORS.textDark} />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                activeTab === "bumper" && styles.activeTabText,
                isIndic(language) && { fontSize: 11 },
              ]}
            >
              {t("bumper_tab")} ({bumperData.length})
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
            removeClippedSubviews={Platform.OS === "android"}
            scrollEventThrottle={16}
            overScrollMode="never"
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
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
  cardToday: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: "#F0FDF4",
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
  codeBadge: {
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
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
