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
  Trophy,
  FileCheck2,
  Sparkles,
  Star,
  Ticket,
  Volume2,
  Vibrate,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
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
} from "../utils/notificationScheduler";
import { triggerLightHaptic } from "../utils/haptics";
import { useLanguage } from "../context/LanguageContext";

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({
  visible,
  onClose,
}: NotificationSettingsModalProps) {
  const { language } = useLanguage();
  const isMl = language === "ml";

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
  };

  const handleReset = async () => {
    triggerLightHaptic();
    setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    await saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.headerIconBox}>
                <Bell size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isMl ? "നോട്ടിഫിക്കേഷൻ ക്രമീകരണങ്ങൾ" : "Notification Settings"}
                </Text>
                <Text style={styles.headerSub}>
                  {isMl
                    ? "നറുക്കെടുപ്പ് അലേർട്ടുകൾ കസ്റ്റമൈസ് ചെയ്യുക"
                    : "Customize your live draw alerts"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close notification settings"
            >
              <X size={18} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* System OS Permission Banner (if denied) */}
            {!hasOsPermission && Platform.OS !== "web" && (
              <View style={styles.permWarningCard}>
                <AlertTriangle size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.permWarningTitle}>
                    {isMl ? "സിസ്റ്റം പെർമിഷൻ ഓഫാണ്" : "OS Notifications Disabled"}
                  </Text>
                  <Text style={styles.permWarningDesc}>
                    {isMl
                      ? "അലേർട്ടുകൾ ലഭിക്കുന്നതിന് ഫോൺ ക്രമീകരണങ്ങളിൽ പെർമിഷൻ നൽകുക."
                      : "Enable notifications in system settings to receive draw alerts."}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.openSettingsBtn}
                  onPress={openNotificationSettings}
                >
                  <Text style={styles.openSettingsText}>
                    {isMl ? "ഓൺ ചെയ്യുക" : "Open"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Master Push Switch */}
            <View style={styles.masterCard}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.masterTitle}>
                  {isMl ? "എല്ലാ നോട്ടിഫിക്കേഷനുകളും" : "Allow Push Notifications"}
                </Text>
                <Text style={styles.masterSub}>
                  {isMl
                    ? "തത്സമയ അലേർട്ടുകളും ഫലങ്ങളും തൽക്ഷണം നേടുക"
                    : "Receive instant updates for live draws and results"}
                </Text>
              </View>
              <Switch
                value={settings.masterEnabled}
                onValueChange={() => handleToggle("masterEnabled")}
                trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                thumbColor={settings.masterEnabled ? COLORS.primary : "#F8FAFC"}
              />
            </View>

            {/* Section 1: Draw Phase Alerts */}
            <View
              style={[
                styles.sectionCard,
                !settings.masterEnabled && styles.disabledSection,
              ]}
            >
              <Text style={styles.sectionHeader}>
                {isMl ? "⏰ നറുക്കെടുപ്പ് ഘട്ടങ്ങൾ" : "⏰ LIVE DRAW PHASES"}
              </Text>

              {/* 1. Pre-Draw 5 Min Alert (Default OFF) */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleIconCol}>
                  <Clock size={16} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "5 മിനിറ്റ് മുൻപുള്ള അലേർട്ട് (2:55 PM)" : "5-Min Pre-Draw Alert (2:55 PM)"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl
                      ? "നറുക്കെടുപ്പ് തുടങ്ങുന്നതിന് 5 മിനിറ്റ് മുൻപ് ഓർമ്മപ്പെടുത്തൽ"
                      : "Heads-up reminder before live draw begins"}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.preDrawAlert}
                  onValueChange={() => handleToggle("preDrawAlert")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.preDrawAlert ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* 2. Draw Commenced Alert */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleIconCol}>
                  <View style={styles.livePulseDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "നറുക്കെടുപ്പ് ആരംഭിച്ചു (3:00 PM)" : "Draw Commenced (3:00 PM)"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl
                      ? "ഗോർക്കി ഭവനിൽ നറുക്കെടുപ്പ് ആരംഭിക്കുമ്പോൾ അലേർട്ട്"
                      : "Notification when live drawing begins in Gorky Bhavan"}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.drawStartAlert}
                  onValueChange={() => handleToggle("drawStartAlert")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.drawStartAlert ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* 3. 1st Prize Winner Announced */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleIconCol}>
                  <Trophy size={16} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "1-ാം സമ്മാനം പ്രഖ്യാപിക്കുമ്പോൾ" : "1st Prize Winner Instant Alert"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl
                      ? "ഒന്നാം സമ്മാന ടിക്കറ്റ് നമ്പറും ജില്ലയും ഉടനടി അറിയുക"
                      : "Instant alert with winning ticket and location (~3:10 PM)"}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.firstPrizeAlert}
                  onValueChange={() => handleToggle("firstPrizeAlert")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.firstPrizeAlert ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* 4. Full Gazette Result Published */}
              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={styles.toggleIconCol}>
                  <FileCheck2 size={16} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "പൂർണ്ണ ഫലം പ്രസിദ്ധീകരിച്ചു" : "Full Official Results Published"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl
                      ? "1 മുതൽ 9 വരെയുള്ള എല്ലാ സമ്മാനങ്ങളും തയ്യാറാകുമ്പോൾ"
                      : "Alert when full 1st–9th prize sheet is finalized (~3:45 PM)"}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.fullResultAlert}
                  onValueChange={() => handleToggle("fullResultAlert")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.fullResultAlert ? "#16A34A" : "#F8FAFC"}
                />
              </View>
            </View>

            {/* Section 2: Special & Saved Alerts */}
            <View
              style={[
                styles.sectionCard,
                !settings.masterEnabled && styles.disabledSection,
              ]}
            >
              <Text style={styles.sectionHeader}>
                {isMl ? "👑 പ്രത്യേക അലേർട്ടുകൾ" : "👑 SPECIAL & SAVED ALERTS"}
              </Text>

              {/* Bumper Jackpot Announcements */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleIconCol}>
                  <Sparkles size={16} color="#9333EA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "ബംപർ ലോട്ടറി ജാക്ക്പോട്ട് അലേർട്ടുകൾ" : "Bumper Mega Jackpot Alerts"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl
                      ? "വിഷു, ഓണം, പൂജ തുടങ്ങിയ ബംപർ നറുക്കെടുപ്പ് അറിയിപ്പുകൾ"
                      : "Special alerts for Vishu, Onam, Pooja & Summer bumper draws"}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.bumperAlerts}
                  onValueChange={() => handleToggle("bumperAlerts")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.bumperAlerts ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* Favorite Lotteries Only Mode */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleIconCol}>
                  <Star size={16} color="#EAB308" fill="#EAB308" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "പ്രിയപ്പെട്ട ലോട്ടറികൾക്ക് മാത്രം" : "Favorite Lotteries Only Mode"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl
                      ? "സ്റ്റാർ ചെയ്ത ലോട്ടറികൾക്ക് മാത്രം അലേർട്ടുകൾ അയക്കുക"
                      : "Only notify for weekly lotteries marked with a star (⭐)"}
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

              {/* My Saved Ticket Reminders */}
              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={styles.toggleIconCol}>
                  <Ticket size={16} color="#0D9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "സേവ് ചെയ്ത ടിക്കറ്റ് ഓർമ്മപ്പെടുത്തൽ" : "Saved Ticket Draw Reminders"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl
                      ? "നിങ്ങൾ ആപ്പിൽ ചേർത്ത ടിക്കറ്റ് നമ്പറുകളുടെ ഓർമ്മപ്പെടുത്തൽ"
                      : "Alerts for tickets added to your personal reminder list"}
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
            </View>

            {/* Section 3: Audio & Haptics */}
            <View
              style={[
                styles.sectionCard,
                !settings.masterEnabled && styles.disabledSection,
              ]}
            >
              <Text style={styles.sectionHeader}>
                {isMl ? "🔊 ശബ്ദവും വൈബ്രേഷനും" : "🔊 AUDIO & VIBRATION"}
              </Text>

              {/* Sound */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleIconCol}>
                  <Volume2 size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "ശബ്ദ അലേർട്ട്" : "Notification Sound"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl ? "അലേർട്ടിനൊപ്പം ശബ്ദം പ്ലേ ചെയ്യുക" : "Play alert chime on receipt"}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.soundEnabled}
                  onValueChange={() => handleToggle("soundEnabled")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.soundEnabled ? "#16A34A" : "#F8FAFC"}
                />
              </View>

              {/* Vibration */}
              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={styles.toggleIconCol}>
                  <Vibrate size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isMl ? "ഹാപ്റ്റിക് വൈബ്രേഷൻ" : "Haptic Vibration"}
                  </Text>
                  <Text style={styles.toggleDesc}>
                    {isMl ? "വിജയി പ്രഖ്യാപിക്കുമ്പോൾ വൈബ്രേറ്റ് ചെയ്യുക" : "Pulse on winning updates"}
                  </Text>
                </View>
                <Switch
                  disabled={!settings.masterEnabled}
                  value={settings.vibrateEnabled}
                  onValueChange={() => handleToggle("vibrateEnabled")}
                  trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                  thumbColor={settings.vibrateEnabled ? "#16A34A" : "#F8FAFC"}
                />
              </View>
            </View>

            {/* Reset Defaults Action Button */}
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <RotateCcw size={14} color={COLORS.textMuted} />
              <Text style={styles.resetButtonText}>
                {isMl ? "ഡിഫോൾട്ട് ക്രമീകരണങ്ങളിലേക്ക് പുനഃസ്ഥാപിക്കുക" : "Reset to Default Preferences"}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
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
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  permWarningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  permWarningTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#92400E",
  },
  permWarningDesc: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B45309",
    marginTop: 1,
  },
  openSettingsBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openSettingsText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  masterCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  masterTitle: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#0F172A",
  },
  masterSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  disabledSection: {
    opacity: 0.45,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  toggleIconCol: {
    width: 28,
    alignItems: "center",
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  toggleDesc: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
});
