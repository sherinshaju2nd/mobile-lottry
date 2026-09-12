import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import {
  Bell,
  X,
  Clock,
  Sparkles,
  Star,
  Ticket,
  AlertTriangle,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
} from "../utils/notificationSettingsStorage";
import {
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermission,
  syncAllDrawNotifications,
} from "../utils/notificationScheduler";
import { triggerLightHaptic } from "../utils/haptics";
import { useLanguage } from "../context/LanguageContext";
import { isIndic } from "../constants/translations";

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({
  visible,
  onClose,
}: NotificationSettingsModalProps) {
  const { language, t } = useLanguage();

  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [hasOsPermission, setHasOsPermission] = useState<boolean>(true);

  useEffect(() => {
    if (visible) {
      getNotificationSettings().then(setSettings);
      getNotificationPermissionStatus().then((perm) => {
        setHasOsPermission(perm.granted || Platform.OS === "web");
      });
    }
  }, [visible]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    triggerLightHaptic();
    const updated: NotificationSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    await saveNotificationSettings(updated);

    // If enabling master and OS permission is missing, prompt user
    if (key === "masterEnabled" && updated.masterEnabled && !hasOsPermission) {
      const granted = await requestNotificationPermission();
      setHasOsPermission(granted || Platform.OS === "web");
    }

    // Synchronize draw schedules and notifications immediately
    syncAllDrawNotifications().catch(() => {});
  };

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.headerIconBox}>
                <Bell size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text
                  style={[
                    styles.headerTitle,
                    isIndic(language) && { fontSize: 15, lineHeight: 22 },
                  ]}
                >
                  {t("notification_settings_title")}
                </Text>
                <Text
                  style={[
                    styles.headerSub,
                    isIndic(language) && { fontSize: 11, lineHeight: 16 },
                  ]}
                >
                  {t("notification_settings_sub")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close notification settings"
              activeOpacity={0.7}
            >
              <X size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* System OS Permission Banner (if denied) */}
            {!hasOsPermission && Platform.OS !== "web" && (
              <View style={styles.permWarningCard}>
                <AlertTriangle size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.permWarningTitle,
                      isIndic(language) && { fontSize: 12.5 },
                    ]}
                  >
                    {t("os_perm_disabled_title")}
                  </Text>
                  <Text
                    style={[
                      styles.permWarningDesc,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 15 },
                    ]}
                  >
                    {t("os_perm_disabled_desc")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.openSettingsBtn}
                  onPress={openNotificationSettings}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openSettingsText}>
                    {t("open_settings_btn")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Master Push Switch */}
            <View style={styles.masterCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={[
                    styles.masterTitle,
                    isIndic(language) && { fontSize: 14.5 },
                  ]}
                >
                  {t("allow_push_notifications")}
                </Text>
                <Text
                  style={[
                    styles.masterSub,
                    isIndic(language) && { fontSize: 11, lineHeight: 16 },
                  ]}
                >
                  {t("allow_push_desc")}
                </Text>
              </View>
              <Switch
                value={settings.masterEnabled}
                onValueChange={() => handleToggle("masterEnabled")}
                trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                thumbColor={settings.masterEnabled ? COLORS.primary : "#F8FAFC"}
              />
            </View>

            {/* Notification Preferences Card */}
            <View
              style={[
                styles.sectionCard,
                !settings.masterEnabled && styles.disabledSection,
              ]}
            >
              {/* 1. 3:00 PM Daily Draw Reminder */}
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIconCol, { backgroundColor: "#EFF6FF" }]}>
                  <Clock size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={[
                      styles.toggleTitle,
                      isIndic(language) && { fontSize: 13, lineHeight: 18 },
                    ]}
                  >
                    {t("daily_3pm_draw_reminder")}
                  </Text>
                  <Text
                    style={[
                      styles.toggleDesc,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 15 },
                    ]}
                  >
                    {t("daily_3pm_draw_reminder_desc")}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.dailyDraw3pmReminder}
                  onValueChange={() => handleToggle("dailyDraw3pmReminder")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.dailyDraw3pmReminder ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* 2. 2:00 PM Bumper Draw Reminder */}
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIconCol, { backgroundColor: "#FAF5FF" }]}>
                  <Sparkles size={18} color="#9333EA" />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={[
                      styles.toggleTitle,
                      isIndic(language) && { fontSize: 13, lineHeight: 18 },
                    ]}
                  >
                    {t("bumper_2pm_draw_reminder")}
                  </Text>
                  <Text
                    style={[
                      styles.toggleDesc,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 15 },
                    ]}
                  >
                    {t("bumper_2pm_draw_reminder_desc")}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.bumper2pmReminder}
                  onValueChange={() => handleToggle("bumper2pmReminder")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.bumper2pmReminder ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* 3. Saved Ticket Draw Reminders */}
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIconCol, { backgroundColor: "#F0FDFA" }]}>
                  <Ticket size={18} color="#0D9488" />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={[
                      styles.toggleTitle,
                      isIndic(language) && { fontSize: 13, lineHeight: 18 },
                    ]}
                  >
                    {t("saved_ticket_reminders")}
                  </Text>
                  <Text
                    style={[
                      styles.toggleDesc,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 15 },
                    ]}
                  >
                    {t("saved_ticket_reminders_desc")}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.ticketReminders}
                  onValueChange={() => handleToggle("ticketReminders")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.ticketReminders ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* 4. Favorite Lotteries Only Mode */}
              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.toggleIconCol, { backgroundColor: "#FEFCE8" }]}>
                  <Star size={18} color="#EAB308" fill="#EAB308" />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={[
                      styles.toggleTitle,
                      isIndic(language) && { fontSize: 13, lineHeight: 18 },
                    ]}
                  >
                    {t("favorites_only_mode")}
                  </Text>
                  <Text
                    style={[
                      styles.toggleDesc,
                      isIndic(language) && { fontSize: 10.5, lineHeight: 15 },
                    ]}
                  >
                    {t("favorites_only_mode_desc")}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.favoritesOnly}
                  onValueChange={() => handleToggle("favoritesOnly")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.favoritesOnly ? "#16A34A" : "#F8FAFC"}
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "82%",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  permWarningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderRadius: 16,
    padding: 14,
  },
  permWarningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
  },
  permWarningDesc: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "600",
    marginTop: 2,
  },
  openSettingsBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openSettingsText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  masterCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  masterSub: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 3,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  disabledSection: {
    opacity: 0.45,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  toggleIconCol: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  toggleDesc: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
});
