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
import { AlertCircle, Settings } from "lucide-react-native";

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
  const [reminders, setReminders] = useState<LotteryReminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
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
      "Delete Reminder",
      `Remove reminder for ticket ${item.ticketNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [h, min] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${String(min).padStart(2, "0")} ${ampm}`;
  };

  const renderItem = ({ item }: { item: LotteryReminder }) => {
    const upcoming = isUpcoming(item);
    return (
      <View style={[styles.card, !upcoming && styles.cardPast]}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconCircle, !upcoming && styles.iconCirclePast]}>
            {upcoming ? (
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
            {upcoming ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Upcoming</Text>
              </View>
            ) : (
              <View style={styles.badgePast}>
                <Text style={styles.badgePastText}>Past</Text>
              </View>
            )}
          </View>

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
            <Text style={styles.metaText}>Draw at {formatTime(item.drawTime)}</Text>
          </View>
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
          <Text style={styles.headerTitle}>Ticket Reminders</Text>
        </View>
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

      {/* Subtitle */}
      <View style={styles.subtitleBar}>
        <Text style={styles.subtitleText}>
          Get notified 5 mins before your ticket's draw time
        </Text>
      </View>

      {/* Permission Warning Banner if notifications are disabled */}
      {!hasPermission && (
        <View style={styles.permBanner}>
          <View style={styles.permBannerLeft}>
            <AlertCircle size={20} color="#D97706" />
            <View style={styles.permBannerTextCol}>
              <Text style={styles.permBannerTitle}>Notifications Disabled</Text>
              <Text style={styles.permBannerDesc}>
                Turn on notifications to receive 3:00 PM draw alerts.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.permSettingsBtn}
            onPress={() => openNotificationSettings()}
          >
            <Settings size={14} color={COLORS.white} />
            <Text style={styles.permSettingsBtnText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Bell size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No Reminders Yet</Text>
          <Text style={styles.emptyDesc}>
            Tap the + button to add your lottery ticket and get notified before the draw.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => {
              setEditItem(null);
              setShowAdd(true);
            }}
          >
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.emptyAddBtnText}>Add First Reminder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
