import * as Notifications from "expo-notifications";
import { Platform, Linking } from "react-native";
import { LotteryReminder, getNotificationDate } from "./reminderStorage";

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

export async function scheduleReminderNotification(
  reminder: LotteryReminder
): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const triggerDate = getNotificationDate(reminder.drawDate, reminder.drawTime);

    // Don't schedule if the trigger is in the past
    if (triggerDate.getTime() <= Date.now()) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎰 Kerala Lottery Draw in 5 Minutes!",
        body: `Ticket ${reminder.ticketNumber} — ${reminder.lotteryName} draw is starting soon. Open the app to check your results!`,
        sound: true,
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

export async function cancelReminderNotification(
  notificationId: string
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Silently ignore if already cancelled
  }
}

