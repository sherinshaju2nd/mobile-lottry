import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  Sparkles,
  Calendar,
  Trophy,
  Ticket,
  Clock,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  WEEKLY_LOTTERIES,
  BUMPER_LOTTERIES,
  LotteryMeta,
  getDayTranslated,
  getLotteryTranslatedName,
} from "../constants/lotteries";
import { isIndic } from "../constants/translations";
import { fetchLotteriesFromDb } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";
import {
  formatPrizeAmountSafe,
  getSafeTodayISTDate,
  getSafeTodayISTDayName,
} from "../utils/formatters";

export const formatPrizeAmount = formatPrizeAmountSafe;

const LOTTERY_PRIZE_DEFAULTS: Record<string, { prize: string; price: string }> = {
  BT: { prize: "₹1 Crore", price: "₹50" },
  SS: { prize: "₹75 Lakhs", price: "₹50" },
  DL: { prize: "₹1 Crore", price: "₹50" },
  KN: { prize: "₹80 Lakhs", price: "₹50" },
  SK: { prize: "₹70 Lakhs", price: "₹50" },
  KR: { prize: "₹80 Lakhs", price: "₹50" },
  SM: { prize: "₹70 Lakhs", price: "₹50" },
  XN: { prize: "₹20 Crore", price: "₹400" },
  SB: { prize: "₹10 Crore", price: "₹250" },
  VB: { prize: "₹12 Crore", price: "₹300" },
  MB: { prize: "₹10 Crore", price: "₹250" },
  TH: { prize: "₹25 Crore", price: "₹500" },
  PB: { prize: "₹12 Crore", price: "₹300" },
};

export default function LotteriesScreen({ navigation }: any) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"weekly" | "bumper">("weekly");
  const [weeklyData, setWeeklyData] = useState<LotteryMeta[]>(WEEKLY_LOTTERIES);
  const [bumperData, setBumperData] = useState<LotteryMeta[]>(BUMPER_LOTTERIES);
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = (tab: "weekly" | "bumper") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  useEffect(() => {
    let isMounted = true;
    fetchLotteriesFromDb()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.weekly && res.weekly.length > 0) setWeeklyData(res.weekly);
        if (res && res.bumper && res.bumper.length > 0) setBumperData(res.bumper);
      })
      .catch((e) => console.warn("Failed loading lotteries from DB:", e))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentData = activeTab === "weekly" ? weeklyData : bumperData;

  // Calculate today's day of week & date in Indian Standard Time (IST) safely
  const todayISTDate = getSafeTodayISTDate();
  const todayDayName = getSafeTodayISTDayName();

  const renderSkeleton = () => (
    <View style={{ gap: 14 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ width: 80, height: 26, backgroundColor: "#E2E8F0", borderRadius: 8 }} />
            <View style={{ width: 90, height: 24, backgroundColor: "#E2E8F0", borderRadius: 8 }} />
          </View>
          <View style={{ width: 170, height: 22, backgroundColor: "#E2E8F0", borderRadius: 6, marginBottom: 10 }} />
          <View style={{ width: 120, height: 16, backgroundColor: "#E2E8F0", borderRadius: 4, marginBottom: 14 }} />
          <View style={{ height: 1, backgroundColor: "#F1F5F9", marginBottom: 12 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ width: 100, height: 16, backgroundColor: "#E2E8F0", borderRadius: 4 }} />
            <View style={{ width: 80, height: 16, backgroundColor: "#E2E8F0", borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: LotteryMeta }) => {
    if (!item) return null;
    const isBumper = Boolean(item.isBumper || activeTab === "bumper");
    
    // Draw status checks
    const isWeeklyToday = !isBumper && item.day ? item.day.toLowerCase() === todayDayName.toLowerCase() : false;
    const isBumperToday = isBumper && item.draw_date ? item.draw_date === todayISTDate : false;
    const isDrawToday = isWeeklyToday || isBumperToday;
    const isAnnouncedUpcomingBumper = isBumper && Boolean(item.draw_date) && !isBumperToday;

    // Fallback prize & ticket price
    const defaultMeta = LOTTERY_PRIZE_DEFAULTS[item.code] || { prize: "₹80 Lakhs", price: "₹50" };
    const jackpotPrize = formatPrizeAmount(item.jackpot || defaultMeta.prize);
    const ticketPrice = item.ticket_price || defaultMeta.price;

    const translatedName = getLotteryTranslatedName(item.code, language) || item.name;
    const secondaryName = language === "en" ? item.nameMl : item.name;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isDrawToday && styles.cardToday,
          isAnnouncedUpcomingBumper && styles.announcedCard,
        ]}
        activeOpacity={0.75}
        onPress={() =>
          navigation.navigate("LotteryArchive", {
            code: item.code,
            lotteryCode: item.code,
          })
        }
      >
        {/* Top Badges Row */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeGroup}>
            {/* Code Badge */}
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>

            {/* Schedule Day / Season Tag */}
            {isBumper ? (
              <View style={styles.tagPill}>
                <Sparkles size={12} color="#0B3C5D" />
                <Text
                  style={[
                    styles.tagPillText,
                    isIndic(language) && { fontSize: 11 },
                  ]}
                >
                  {item.drawSeason || item.day || "State Bumper"}
                </Text>
              </View>
            ) : (
              <View style={[styles.tagPill, isDrawToday && styles.tagPillToday]}>
                <Calendar size={12} color={isDrawToday ? "#059669" : "#0B3C5D"} />
                <Text
                  style={[
                    styles.tagPillText,
                    isDrawToday && styles.tagPillTextToday,
                    isIndic(language) && { fontSize: 11 },
                  ]}
                >
                  {getDayTranslated(item.day, language)}
                </Text>
              </View>
            )}
          </View>

          {/* Right Status Pill */}
          {isDrawToday ? (
            <View style={styles.drawsTodayBadge}>
              <View style={styles.pulseGreenDot} />
              <Text style={styles.drawsTodayText}>
                {t("draws_today")}
              </Text>
            </View>
          ) : isAnnouncedUpcomingBumper ? (
            <View style={styles.announcedDateBadge}>
              <Text style={styles.announcedDateText}>
                {item.draw_date}
              </Text>
            </View>
          ) : (
            <View style={styles.timePill}>
              <Clock size={11} color="#64748B" />
              <Text style={styles.timePillText}>
                {item.drawTime || (isBumper ? "2:00 PM" : "3:00 PM")}
              </Text>
            </View>
          )}
        </View>

        {/* Main Content: Title & Native Translation */}
        <View style={styles.titleSection}>
          <Text
            style={[
              styles.lotteryTitle,
              isIndic(language) && { fontSize: 18, lineHeight: 26 },
            ]}
          >
            {translatedName}
          </Text>
          {secondaryName && secondaryName !== translatedName && (
            <Text style={styles.lotterySubName}>
              {secondaryName}
            </Text>
          )}
        </View>

        {/* Prize & Price Stats Chips */}
        <View style={styles.statsRow}>
          {/* 1st Prize Badge */}
          <View style={styles.prizeChip}>
            <Trophy size={13} color="#0B3C5D" />
            <Text style={styles.prizeChipLabel}>
              1st Prize:{" "}
              <Text style={styles.prizeChipValue}>
                {jackpotPrize}
              </Text>
            </Text>
          </View>

          {/* Ticket Price Chip */}
          <View style={styles.priceChip}>
            <Ticket size={12} color="#475569" />
            <Text style={styles.priceChipText}>
              {ticketPrice}
            </Text>
          </View>
        </View>

        {/* Announced Date Highlight Card (if upcoming) */}
        {isAnnouncedUpcomingBumper && (
          <View style={styles.announcedDateCard}>
            <Text style={styles.announcedDateCardLabel}>
              {t("announced_draw_date")}
            </Text>
            <Text style={styles.announcedDateCardValue}>
              {item.draw_date} • {item.drawTime || "2:00 PM"}
            </Text>
          </View>
        )}

        {/* Bottom Footer Action */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerScheduleNote}>
            {isBumper
              ? `Annual Bumper • ${item.drawTime || "2:00 PM"}`
              : `Weekly Draw • ${item.drawTime || "3:00 PM"}`}
          </Text>

          <View style={styles.actionBtn}>
            <Text
              style={[
                styles.actionBtnText,
                isIndic(language) && { fontSize: 12 },
              ]}
            >
              {t("view_archive")}
            </Text>
            <View style={styles.actionArrowCircle}>
              <ChevronRight size={14} color="#0B3C5D" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              🏛️ KERALA STATE LOTTERIES
            </Text>
          </View>
          <Text
            style={[
              styles.headerTitle,
              isIndic(language) && { fontSize: 20, lineHeight: 28 },
            ]}
          >
            {t("lotteries_title")}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              isIndic(language) && { fontSize: 12, lineHeight: 18 },
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
            <Calendar
              size={14}
              color={activeTab === "weekly" ? "#FFFFFF" : "#475569"}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                activeTab === "weekly" && styles.activeTabText,
                isIndic(language) && { fontSize: 12 },
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
            <Sparkles
              size={14}
              color={activeTab === "bumper" ? "#FFFFFF" : "#475569"}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                activeTab === "bumper" && styles.activeTabText,
                isIndic(language) && { fontSize: 12 },
              ]}
            >
              {t("bumper_tab")} ({bumperData.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {isLoading ? (
          <View style={{ paddingTop: 6 }}>{renderSkeleton()}</View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item, index) => item?.code || `lottery-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            overScrollMode="never"
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: { marginBottom: 14 },
  headerBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#475569",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3.5,
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
    backgroundColor: "#0B3C5D",
    shadowColor: "#0B3C5D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#475569",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  listContainer: {
    gap: 12,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardToday: {
    borderColor: "#10B981",
    borderWidth: 1.5,
    backgroundColor: "#F0FDF4",
  },
  announcedCard: {
    borderColor: "#CBD5E1",
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeBadge: {
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  tagPillToday: {
    backgroundColor: "#D1FAE5",
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B3C5D",
  },
  tagPillTextToday: {
    color: "#065F46",
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  drawsTodayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  pulseGreenDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: "#16A34A",
  },
  drawsTodayText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#15803D",
    letterSpacing: 0.3,
  },
  announcedDateBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  announcedDateText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  titleSection: {
    marginBottom: 10,
  },
  lotteryTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  lotterySubName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  prizeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  prizeChipLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0B3C5D",
  },
  prizeChipValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0B3C5D",
  },
  priceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceChipText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#334155",
  },
  announcedDateCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  announcedDateCardLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  announcedDateCardValue: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerScheduleNote: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0B3C5D",
  },
  actionArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EBF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
