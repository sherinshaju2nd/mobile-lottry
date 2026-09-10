import * as Notifications from "expo-notifications";
import { Platform, Linking } from "react-native";
import { LotteryReminder, getNotificationDate } from "./reminderStorage";
import { getNotificationSettings } from "./notificationSettingsStorage";
import { isLotteryFavorite } from "./favorites";
import { getLotteryMalayalamName, ALL_LOTTERIES } from "../constants/lotteries";

export type NotificationPermissionState = {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
};

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") {
    return {
      granted: false,
      canAskAgain: false,
      status: Notifications.PermissionStatus.DENIED,
    };
  }
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === Notifications.PermissionStatus.GRANTED,
    canAskAgain,
    status,
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
  if (existingStatus === Notifications.PermissionStatus.GRANTED) return true;

  if (canAskAgain) {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === Notifications.PermissionStatus.GRANTED;
  }

  return false;
}

export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === "ios") {
    await Linking.openURL("app-settings:");
  } else {
    await Linking.openSettings();
  }
}

/**
 * Schedule a manual user ticket reminder
 */
export async function scheduleReminderNotification(
  reminder: LotteryReminder
): Promise<string | null> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.masterEnabled || !settings.ticketReminders) return null;

    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const triggerDate = getNotificationDate(reminder.drawDate, reminder.drawTime);

    // Don't schedule if the trigger is in the past
    if (triggerDate.getTime() <= Date.now()) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎫 Kerala Lottery Ticket Reminder",
        body: `Ticket ${reminder.ticketNumber} — ${reminder.lotteryName} draw begins in 5 minutes. Check your ticket!`,
        sound: settings.soundEnabled,
        vibrate: settings.vibrateEnabled ? [0, 250, 250, 250] : undefined,
        data: {
          ticketNumber: reminder.ticketNumber,
          drawDate: reminder.drawDate,
          reminderId: reminder.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return notificationId;
  } catch (e) {
    console.warn("Failed to schedule notification:", e);
    return null;
  }
}

/**
 * Cancel a specific scheduled notification
 */
export async function cancelReminderNotification(
  notificationId: string
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Silently ignore if already cancelled
  }
}

/**
 * Send an instant 1st prize winner announcement notification
 */
export async function sendInstantWinnerNotification(
  drawCode: string,
  drawName: string,
  drawDate: string,
  firstPrizeTicket: string,
  location?: string,
  amount?: string
): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.masterEnabled || !settings.firstPrizeAlert) return;

    if (settings.favoritesOnly) {
      const isFav = await isLotteryFavorite(drawCode);
      if (!isFav) return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const mlName = getLotteryMalayalamName(drawCode) || drawName;
    const locText = location && location !== "N/A" ? ` (${location})` : "";
    const prizeText = amount ? ` • ${amount}` : "";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏆 1st Prize: ${drawName} (${drawCode})`,
        body: `Winner: ${firstPrizeTicket}${locText}${prizeText}! Tap to check all prize numbers.`,
        sound: settings.soundEnabled,
        vibrate: settings.vibrateEnabled ? [0, 500, 200, 500] : undefined,
        data: {
          code: drawCode,
          date: drawDate,
          type: "first_prize",
        },
      },
      trigger: null, // Send immediately
    });
  } catch (err) {
    console.warn("Failed to send 1st prize notification:", err);
  }
}

/**
 * Send a notification when full 1st-9th official results are published
 */
export async function sendFullResultPublishedNotification(
  drawCode: string,
  drawName: string,
  drawDate: string
): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.masterEnabled || !settings.fullResultAlert) return;

    if (settings.favoritesOnly) {
      const isFav = await isLotteryFavorite(drawCode);
      if (!isFav) return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `✅ Official Results Ready: ${drawName}`,
        body: `Full 1st to 9th prize breakdown for ${drawCode} (${drawDate}) is published. Verify your tickets now!`,
        sound: settings.soundEnabled,
        vibrate: settings.vibrateEnabled ? [0, 300, 150, 300] : undefined,
        data: {
          code: drawCode,
          date: drawDate,
          type: "full_results",
        },
      },
      trigger: null, // Immediate
    });
  } catch (err) {
    console.warn("Failed to send full results notification:", err);
  }
}
