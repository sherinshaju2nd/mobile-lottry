import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  Bell,
  Plus,
  Trash2,
  Pencil,
  Ticket,
  CalendarDays,
  Clock3,
  ChevronLeft,
  BellOff,
  Trophy,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  LotteryReminder,
  getAllReminders,
  deleteReminder,
} from "../utils/reminderStorage";
import {
  cancelReminderNotification,
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermission,
} from "../utils/notificationScheduler";
import AddReminderModal from "../components/AddReminderModal";
import NotificationSettingsModal from "../components/NotificationSettingsModal";
import { AlertCircle, Settings } from "lucide-react-native";

import { useLanguage } from "../context/LanguageContext";
import { getDayTranslated } from "../constants/lotteries";

// Safe cross-platform date+time parser (avoids "T" string parsing bugs on Android and handles 12h/24h)
function parseDrawDateTime(drawDate: string, drawTime?: string): number {
  if (!drawDate) return 0;
  const [y, mo, d] = drawDate.split("-").map(Number);
  let hours = 15;
  let minutes = 0;

  if (drawTime) {
    const clean = drawTime.trim().toUpperCase();
    const isPM = clean.includes("PM");
    const isAM = clean.includes("AM");
    const digits = clean.replace(/[^0-9:]/g, "").split(":");
    if (digits.length >= 2) {
      hours = parseInt(digits[0], 10) || 0;
      minutes = parseInt(digits[1], 10) || 0;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
  }

  return new Date(y, mo - 1, d, hours, minutes, 0).getTime();
}

export default function RemindersScreen({ navigation }: any) {
  const { language, t } = useLanguage();
  const isMl = language === "ml";
  const [reminders, setReminders] = useState<LotteryReminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editItem, setEditItem] = useState<LotteryReminder | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  const loadReminders = useCallback(async () => {
    const all = await getAllReminders();
    // Sort: upcoming first, then past (most recent at bottom)
    all.sort((a, b) => {
      return parseDrawDateTime(a.drawDate, a.drawTime) - parseDrawDateTime(b.drawDate, b.drawTime);
    });
    setReminders(all);

    const perm = await getNotificationPermissionStatus();
    setHasPermission(perm.granted || Platform.OS === "web");
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const handleDelete = (item: LotteryReminder) => {
    Alert.alert(
      t("delete_reminder_title"),
      `${t("delete_reminder_confirm")} ${item.ticketNumber}?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            if (item.notificationId) {
              await cancelReminderNotification(item.notificationId);
            }
            await deleteReminder(item.id);
            loadReminders();
          },
        },
      ]
    );
  };

  const handleEdit = (item: LotteryReminder) => {
    setEditItem(item);
    setShowAdd(true);
  };

  const isUpcoming = (item: LotteryReminder) => {
    return parseDrawDateTime(item.drawDate, item.drawTime) > Date.now();
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isMl) {
      const monthNamesMl = [
        "ജനുവരി", "ഫെബ്രുവരി", "മാർച്ച്", "ഏപ്രിൽ", "മേയ്", "ജൂൺ",
        "ജൂലൈ", "ഓഗസ്റ്റ്", "സെപ്റ്റംബർ", "ഒക്ടോബർ", "നവംബർ", "ഡിസംബർ"
      ];
      return `${d} ${monthNamesMl[m - 1]} ${y}`;
    }
    return dateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [h, min] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? (isMl ? "PM" : "PM") : (isMl ? "AM" : "AM");
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${String(min).padStart(2, "0")} ${ampm}`;
  };

  const renderItem = ({ item }: { item: LotteryReminder }) => {
    const upcoming = isUpcoming(item);
    const hasWon = item.winningStatus?.won;
    const isChecked = item.winningStatus?.checked;

    return (
      <View
        style={[
          styles.card,
          !upcoming && styles.cardPast,
          hasWon && styles.cardWon,
        ]}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconCircle,
              !upcoming && styles.iconCirclePast,
              hasWon && styles.iconCircleWon,
            ]}
          >
            {hasWon ? (
              <Trophy size={18} color="#D97706" />
            ) : upcoming ? (
              <Bell size={18} color={COLORS.primary} />
            ) : (
              <BellOff size={18} color="#9CA3AF" />
            )}
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.lotteryName} numberOfLines={1}>
              {item.lotteryName}
            </Text>
            {hasWon ? (
              <View style={styles.badgeWon}>
                <Text style={styles.badgeWonText}>🎉 {item.winningStatus?.prizeTier || "WINNER"}</Text>
              </View>
            ) : upcoming ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t("status_upcoming")}</Text>
              </View>
            ) : isChecked ? (
              <View style={styles.badgeChecked}>
                <Text style={styles.badgeCheckedText}>{t("verified")}</Text>
              </View>
            ) : (
              <View style={styles.badgePast}>
                <Text style={styles.badgePastText}>{t("status_past")}</Text>
              </View>
            )}
          </View>

          {hasWon && item.winningStatus?.amount && (
            <View style={styles.winAmountBox}>
              <Text style={styles.winAmountText}>
                {t("first_prize")}: {item.winningStatus.amount}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Ticket size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.ticketNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <CalendarDays size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{formatDate(item.drawDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Clock3 size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>
              {t("draw_time")}: {formatTime(item.drawTime)}
              {item.reminderLeadMinutes ? ` (${item.reminderLeadMinutes}m)` : ""}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.verifyTicketBtn}
            onPress={() => {
              navigation.navigate("DrawBreakdown", {
                lotteryCode: item.lotteryName,
                highlightTicket: item.ticketNumber,
                query: item.ticketNumber,
              });
            }}
          >
            <Ticket size={12} color={COLORS.primary} />
            <Text style={styles.verifyTicketBtnText}>
              {t("verify_ticket_title")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleEdit(item)}
          >
            <Pencil size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Bell size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>{t("reminders_title")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={styles.settingsHeaderBtn}
            onPress={() => setShowSettings(true)}
            accessibilityLabel="Notification Preferences"
          >
            <Settings size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => {
              setEditItem(null);
              setShowAdd(true);
            }}
          >
            <Plus size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleBar}>
        <Text style={styles.subtitleText}>
          {t("reminders_subtitle")}
        </Text>
      </View>

      {/* Permission Warning Banner if notifications are disabled */}
      {!hasPermission && (
        <View style={styles.permBanner}>
          <View style={styles.permBannerLeft}>
            <AlertCircle size={20} color="#D97706" />
            <View style={styles.permBannerTextCol}>
              <Text style={styles.permBannerTitle}>{t("notifications_disabled")}</Text>
              <Text style={styles.permBannerDesc}>
                {t("notifications_disabled_desc")}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.permSettingsBtn}
            onPress={() => openNotificationSettings()}
          >
            <Settings size={14} color={COLORS.white} />
            <Text style={styles.permSettingsBtnText}>{t("enable")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Bell size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>{t("no_reminders_yet")}</Text>
          <Text style={styles.emptyDesc}>
            {t("no_reminders_desc")}
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => {
              setEditItem(null);
              setShowAdd(true);
            }}
          >
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.emptyAddBtnText}>{t("add_first_reminder")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item, index) => item?.id || `reminder-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        />
      )}

      <AddReminderModal
        visible={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditItem(null);
        }}
        onSaved={() => {
          loadReminders();
        }}
        editReminder={editItem}
      />

      <NotificationSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  settingsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitleBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F0F9FF",
    borderBottomWidth: 1,
    borderColor: "#E0F2FE",
  },
  subtitleText: {
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 14,
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 2,
  },
  cardPast: {
    opacity: 0.6,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },
  cardLeft: {
    alignItems: "center",
    paddingTop: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCirclePast: {
    backgroundColor: "#F3F4F6",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  lotteryName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#166534",
  },
  badgePast: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgePastText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  cardWon: {
    borderColor: "#F59E0B",
    borderWidth: 1.5,
    backgroundColor: "#FFFDF5",
  },
  iconCircleWon: {
    backgroundColor: "#FEF3C7",
  },
  badgeWon: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeWonText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#B45309",
  },
  badgeChecked: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeCheckedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  winAmountBox: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginVertical: 2,
    alignSelf: "flex-start",
  },
  winAmountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#92400E",
  },
  verifyTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  verifyTicketBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  cardActions: {
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: "#FEF2F2",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyAddBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
  },
  permBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  permBannerTextCol: {
    flex: 1,
  },
  permBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 2,
  },
  permBannerDesc: {
    fontSize: 11.5,
    color: "#B45309",
    lineHeight: 16,
  },
  permSettingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#D97706",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permSettingsBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
});
