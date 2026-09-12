import AsyncStorage from "@react-native-async-storage/async-storage";

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
];

export interface NotificationSettings {
  masterEnabled: boolean; // Master toggle for all notifications
  dailyDraw3pmReminder: boolean; // 3:00 PM daily draw reminder before draw
  bumper2pmReminder: boolean; // 2:00 PM bumper draw reminder before draw
  ticketReminders: boolean; // Saved ticket draw reminders
  favoritesOnly: boolean; // Only notify for favorite lotteries
  // Compatibility fields
  drawStartAlert?: boolean;
  firstPrizeAlert?: boolean;
  fullResultAlert?: boolean;
  bumperAlerts?: boolean;
  preDrawAlert?: boolean;
  autoWinAlerts?: boolean;
  reminderLeadTimeMinutes?: number;
  morningPurchaseReminder?: boolean;
  districtAlertsEnabled?: boolean;
  userDistrict?: string;
  claimExpiryAlerts?: boolean;
  soundEnabled?: boolean;
  vibrateEnabled?: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  masterEnabled: true,
  dailyDraw3pmReminder: true,
  bumper2pmReminder: true,
  ticketReminders: true,
  favoritesOnly: false,
  // Compatibility defaults
  drawStartAlert: true,
  firstPrizeAlert: true,
  fullResultAlert: true,
  bumperAlerts: true,
  preDrawAlert: true,
  soundEnabled: true,
  vibrateEnabled: true,
};

const STORAGE_KEY = "@kerala_lottery_notification_settings_v2";

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
