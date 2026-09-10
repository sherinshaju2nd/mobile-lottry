import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NotificationSettings {
  masterEnabled: boolean;
  preDrawAlert: boolean; // 5-minute pre-draw heads up (default: false per user preference)
  drawStartAlert: boolean; // 3:00 PM draw start
  firstPrizeAlert: boolean; // Instant 1st prize winner alert
  fullResultAlert: boolean; // Complete official breakdown published
  bumperAlerts: boolean; // Bumper lottery mega jackpot alerts
  favoritesOnly: boolean; // Only send alerts for starred favorite lotteries
  ticketReminders: boolean; // Saved ticket check reminders
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  masterEnabled: true,
  preDrawAlert: false, // Initially OFF by default
  drawStartAlert: true,
  firstPrizeAlert: true,
  fullResultAlert: true,
  bumperAlerts: true,
  favoritesOnly: false,
  ticketReminders: true,
  soundEnabled: true,
  vibrateEnabled: true,
};

const STORAGE_KEY = "@kerala_lottery_notification_settings_v1";

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to save notification settings:", err);
  }
}

export async function updateNotificationSetting<K extends keyof NotificationSettings>(
  key: K,
  value: NotificationSettings[K]
): Promise<NotificationSettings> {
  try {
    const current = await getNotificationSettings();
    const updated: NotificationSettings = {
      ...current,
      [key]: value,
    };
    await saveNotificationSettings(updated);
    return updated;
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, [key]: value };
  }
}
