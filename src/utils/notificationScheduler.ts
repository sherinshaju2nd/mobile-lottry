import * as Notifications from "expo-notifications";
import { Platform, Linking } from "react-native";
import {
  LotteryReminder,
  getNotificationDate,
  getAllReminders,
  saveReminder,
} from "./reminderStorage";
import { getNotificationSettings } from "./notificationSettingsStorage";
import { isLotteryFavorite } from "./favorites";
import { getLotteryMalayalamName, ALL_LOTTERIES, WEEKLY_LOTTERIES, BUMPER_LOTTERIES, LotteryMeta } from "../constants/lotteries";
import { checkIsDatePostponed, fetchBumperLotteries, fetchLotteriesFromDb } from "../api/lotteryApi";

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

function getTodayIST(): { dateStr: string; dayName: string } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, "0");
  const day = String(ist.getDate()).padStart(2, "0");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    dateStr: `${year}-${month}-${day}`,
    dayName: days[ist.getDay()],
  };
}

/**
 * Schedule a user ticket reminder with configurable lead time,
 * verifying that the draw date is valid and not postponed/cancelled.
 */
export async function scheduleReminderNotification(
  reminder: LotteryReminder,
  customLeadMinutes?: number
): Promise<string | null> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.masterEnabled || !settings.ticketReminders) return null;

    // Verify the lottery draw hasn't been cancelled or postponed for this date
    try {
      const postponed = await checkIsDatePostponed(reminder.drawDate, reminder.lotteryName);
      if (postponed && (postponed.status === "postponed" || postponed.status === "holiday" || postponed.status === "cancelled")) {
        return null;
      }
    } catch {}

    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const leadMinutes =
      customLeadMinutes ||
      reminder.reminderLeadMinutes ||
      settings.reminderLeadTimeMinutes ||
      5;

    const triggerDate = getNotificationDate(
      reminder.drawDate,
      reminder.drawTime,
      leadMinutes
    );

    // Don't schedule if the trigger is in the past
    if (triggerDate.getTime() <= Date.now()) return null;

    const leadText =
      leadMinutes >= 60
        ? "1 hour"
        : `${leadMinutes} minutes`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎫 Kerala Lottery Ticket Reminder",
        body: `Ticket ${reminder.ticketNumber} — ${reminder.lotteryName} draw begins in ${leadText}. Check your ticket!`,
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

/**
 * Match a ticket against a prize string (exact 6-digit or last 4/3/2/1 digits + series matching)
 */
function checkTicketMatch(
  queryInput: string,
  prizeNumberStr: string
): { isMatch: boolean; exactSeriesMatch: boolean } {
  const rawQuery = queryInput.trim().toUpperCase();
  const rawPrize = prizeNumberStr.trim().toUpperCase();

  const queryDigits = rawQuery.replace(/\D/g, "");
  const querySeries = rawQuery.replace(/[^A-Z]/gi, "").trim();

  const prizeDigits = rawPrize.replace(/\D/g, "");
  const prizeSeries = rawPrize.replace(/[^A-Z]/gi, "").trim();

  if (!queryDigits || !prizeDigits || queryDigits.length < 4) {
    return { isMatch: false, exactSeriesMatch: false };
  }

  let digitsMatch = false;

  if (prizeDigits.length === 6) {
    if (queryDigits.length === 6 && queryDigits === prizeDigits) {
      digitsMatch = true;
    } else {
      return { isMatch: false, exactSeriesMatch: false };
    }
  } else {
    if (queryDigits === prizeDigits) {
      digitsMatch = true;
    } else if (queryDigits.length >= prizeDigits.length) {
      digitsMatch = queryDigits.endsWith(prizeDigits);
    } else {
      return { isMatch: false, exactSeriesMatch: false };
    }
  }

  if (!digitsMatch) {
    return { isMatch: false, exactSeriesMatch: false };
  }

  if (prizeSeries) {
    if (querySeries) {
      if (querySeries === prizeSeries) {
        return { isMatch: true, exactSeriesMatch: true };
      } else {
        return { isMatch: false, exactSeriesMatch: false };
      }
    } else {
      return { isMatch: true, exactSeriesMatch: false };
    }
  }

  return { isMatch: true, exactSeriesMatch: true };
}

/**
 * Automatically check all saved tickets against a draw result and send celebration win alerts
 */
export async function checkSavedTicketsAndSendWinAlert(
  drawResult: any
): Promise<{ wonCount: number }> {
  try {
    if (!drawResult || !drawResult.draw_date) return { wonCount: 0 };
    const settings = await getNotificationSettings();
    if (!settings.masterEnabled || !settings.autoWinAlerts) return { wonCount: 0 };

    const reminders = await getAllReminders();
    if (!reminders || reminders.length === 0) return { wonCount: 0 };

    const targetDate = drawResult.draw_date;
    const targetLottery = (drawResult.lottery_code || drawResult.draw_name || "").toLowerCase();

    // Find saved tickets for this draw date
    const relevantReminders = reminders.filter((r) => {
      const matchesDate = r.drawDate === targetDate;
      const matchesLottery =
        !r.lotteryName ||
        targetLottery.includes(r.lotteryName.toLowerCase()) ||
        r.lotteryName.toLowerCase().includes(targetLottery);
      return matchesDate || matchesLottery;
    });

    if (relevantReminders.length === 0) return { wonCount: 0 };

    let wonCount = 0;

    for (const reminder of relevantReminders) {
      let matchedPrize: {
        won: boolean;
        prizeTier?: string;
        amount?: string;
        matchedNumber?: string;
      } = { won: false };

      // 1. Check 1st Prize
      if (drawResult.first?.ticket && drawResult.first.ticket !== "N/A") {
        const match = checkTicketMatch(reminder.ticketNumber, drawResult.first.ticket);
        if (match.isMatch) {
          matchedPrize = {
            won: true,
            prizeTier: "1st Prize",
            amount: drawResult.prizes?.amounts?.["1st"] || "1st Prize Jackpot",
            matchedNumber: drawResult.first.ticket,
          };
        }
      }

      // 2. Check Other Tiers (Consolation, 2nd through 9th)
      if (!matchedPrize.won && drawResult.prizes) {
        const tiers = [
          "consolation",
          "2nd",
          "3rd",
          "4th",
          "5th",
          "6th",
          "7th",
          "8th",
          "9th",
        ] as const;

        for (const tier of tiers) {
          const numbers = drawResult.prizes[tier] as string[] | undefined;
          const tierAmount = drawResult.prizes.amounts?.[tier] || "";
          const tierLabel =
            tier === "consolation" ? "Consolation Prize" : `${tier} Prize`;

          if (numbers && Array.isArray(numbers)) {
            for (const num of numbers) {
              const match = checkTicketMatch(reminder.ticketNumber, num);
              if (match.isMatch) {
                matchedPrize = {
                  won: true,
                  prizeTier: tierLabel,
                  amount: tierAmount,
                  matchedNumber: num,
                };
                break;
              }
            }
          }
          if (matchedPrize.won) break;
        }
      }

      const previouslyWon = reminder.winningStatus?.won;

      // Update reminder winning status in storage
      const updatedReminder: LotteryReminder = {
        ...reminder,
        winningStatus: {
          checked: true,
          won: matchedPrize.won,
          prizeTier: matchedPrize.prizeTier,
          amount: matchedPrize.amount,
          matchedNumber: matchedPrize.matchedNumber,
          checkedAt: new Date().toISOString(),
        },
      };
      await saveReminder(updatedReminder);

      // If ticket won and hasn't notified yet for this win
      if (matchedPrize.won && !previouslyWon) {
        wonCount++;
        const granted = await requestNotificationPermission();
        if (granted) {
          const prizeAmtStr = matchedPrize.amount ? ` (${matchedPrize.amount})` : "";
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🎉 CONGRATULATIONS! YOU WON!`,
              body: `Your saved ticket ${reminder.ticketNumber} matched ${matchedPrize.prizeTier}${prizeAmtStr} in ${reminder.lotteryName}! Tap to view details.`,
              sound: settings.soundEnabled,
              vibrate: settings.vibrateEnabled ? [0, 500, 200, 500, 200, 500] : undefined,
              data: {
                ticketNumber: reminder.ticketNumber,
                code: drawResult.lottery_code,
                date: drawResult.draw_date,
                type: "ticket_win",
              },
            },
            trigger: null, // Send immediately
          });
        }
      }
    }

    return { wonCount };
  } catch (err) {
    console.warn("Failed to check saved tickets for win:", err);
    return { wonCount: 0 };
  }
}

/**
 * Send a notification if the 1st prize was won in the user's selected home district
 */
export async function sendDistrictWinnerNotification(
  drawCode: string,
  drawName: string,
  drawDate: string,
  location?: string,
  firstPrizeTicket?: string,
  amount?: string
): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.masterEnabled || !settings.districtAlertsEnabled || !settings.userDistrict) {
      return;
    }

    if (!location || location === "N/A") return;

    const userDist = settings.userDistrict.trim().toLowerCase();
    const locLower = location.toLowerCase();

    if (locLower.includes(userDist)) {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      const amtText = amount ? ` • ${amount}` : "";
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📍 1st Prize Sold in ${settings.userDistrict}!`,
          body: `${drawName} 1st Prize${amtText} winning ticket ${firstPrizeTicket || ""} was sold at ${location}!`,
          sound: settings.soundEnabled,
          vibrate: settings.vibrateEnabled ? [0, 400, 200, 400] : undefined,
          data: {
            code: drawCode,
            date: drawDate,
            type: "district_winner",
          },
        },
        trigger: null,
      });
    }
  } catch (err) {
    console.warn("Failed to send district winner notification:", err);
  }
}

/**
 * Send an immediate test notification so user can verify permissions, audio, and vibration
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    const settings = await getNotificationSettings();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Kerala Lottery Alert Working!",
        body: "All push notifications, sounds, and vibration alerts are enabled and ready.",
        sound: settings.soundEnabled,
        vibrate: settings.vibrateEnabled ? [0, 300, 150, 300] : undefined,
        data: {
          type: "test_notification",
          timestamp: Date.now(),
        },
      },
      trigger: null,
    });
    return true;
  } catch (err) {
    console.warn("Failed to trigger test notification:", err);
    return false;
  }
}

export const DAILY_3PM_NOTIF_ID = "kerala_lottery_daily_3pm_reminder";
export const BUMPER_2PM_NOTIF_ID = "kerala_lottery_bumper_2pm_reminder";

export function convertTo24h(timeStr?: string, defaultTime: string = "15:00"): string {
  if (!timeStr) return defaultTime;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes("PM");
  const isAM = clean.includes("AM");
  const digits = clean.replace(/[^0-9:]/g, "").split(":");
  if (digits.length < 2) return defaultTime;
  let h = parseInt(digits[0], 10) || 0;
  const m = parseInt(digits[1], 10) || 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Synchronize and schedule the Daily Draw Reminder:
 * - Reads exact draw_time configured by admin in Supabase DB
 * - Only schedules if dailyDraw3pmReminder is enabled
 * - Checks if today has a valid regular draw
 * - Verifies the draw is NOT cancelled, postponed, or marked holiday in DB
 * - Verifies favoritesOnly setting
 * - Triggers 10 minutes before the database draw time
 */
export async function syncDaily3pmDrawNotification(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    const settings = await getNotificationSettings();

    if (!settings.masterEnabled || !settings.dailyDraw3pmReminder) {
      await Notifications.cancelScheduledNotificationAsync(DAILY_3PM_NOTIF_ID).catch(() => {});
      return;
    }

    const { granted } = await getNotificationPermissionStatus();
    if (!granted) return;

    const { dateStr, dayName } = getTodayIST();

    // Query database lotteries to get admin-scheduled draw_time
    let todayLottery: LotteryMeta | undefined;
    try {
      const { weekly } = await fetchLotteriesFromDb();
      todayLottery = weekly.find((l) => l.day.toLowerCase() === dayName.toLowerCase());
    } catch {}

    if (!todayLottery) {
      todayLottery = WEEKLY_LOTTERIES.find(
        (l) => l.day.toLowerCase() === dayName.toLowerCase()
      );
    }
    if (!todayLottery) return;

    // Check if today's draw is postponed, cancelled, or holiday in DB
    try {
      const postponed = await checkIsDatePostponed(dateStr, todayLottery.code);
      if (
        postponed &&
        (postponed.status === "postponed" ||
          postponed.status === "holiday" ||
          postponed.status === "cancelled")
      ) {
        await Notifications.cancelScheduledNotificationAsync(DAILY_3PM_NOTIF_ID).catch(() => {});
        return;
      }
    } catch {}

    // Check Favorites Only mode
    if (settings.favoritesOnly) {
      const isFav = await isLotteryFavorite(todayLottery.code);
      if (!isFav) {
        await Notifications.cancelScheduledNotificationAsync(DAILY_3PM_NOTIF_ID).catch(() => {});
        return;
      }
    }

    // Use admin-configured draw_time from DB
    const drawTimeFormatted = todayLottery.drawTime || "3:00 PM";
    const drawTime24 = convertTo24h(drawTimeFormatted, "15:00");

    // 10 minutes before the database draw time
    const triggerDate = getNotificationDate(dateStr, drawTime24, 10);
    if (triggerDate.getTime() <= Date.now()) {
      return; // Already past today's draw reminder trigger
    }

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_3PM_NOTIF_ID,
      content: {
        title: `🕒 ${drawTimeFormatted} Draw: ${todayLottery.name}`,
        body: `Today's ${todayLottery.name} (${todayLottery.code}) draw begins at ${drawTimeFormatted}. Live results will be published shortly!`,
        sound: settings.soundEnabled,
        vibrate: settings.vibrateEnabled ? [0, 250, 250, 250] : undefined,
        data: {
          type: "daily_3pm_draw",
          code: todayLottery.code,
          date: dateStr,
          drawTime: drawTimeFormatted,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (err) {
    console.warn("syncDaily3pmDrawNotification error:", err);
  }
}

/**
 * Synchronize and schedule the Bumper Draw Reminder:
 * - Bumper draws only happen on rare dates scheduled by admin
 * - ONLY schedules if TODAY is an active announced Bumper draw date in DB
 * - Reads exact draw_time configured by admin in Supabase DB
 * - Verifies the bumper draw is NOT cancelled, postponed, or marked holiday in DB
 * - Verifies favoritesOnly setting
 * - Triggers 15 minutes before the database bumper draw time
 */
export async function syncBumper2pmDrawNotification(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    const settings = await getNotificationSettings();

    if (!settings.masterEnabled || !settings.bumper2pmReminder) {
      await Notifications.cancelScheduledNotificationAsync(BUMPER_2PM_NOTIF_ID).catch(() => {});
      return;
    }

    const { granted } = await getNotificationPermissionStatus();
    if (!granted) return;

    const { dateStr } = getTodayIST();

    // Fetch bumper lotteries from database
    let allBumpers = BUMPER_LOTTERIES;
    try {
      const dynamicBumpers = await fetchBumperLotteries();
      if (dynamicBumpers && dynamicBumpers.length > 0) {
        allBumpers = dynamicBumpers;
      }
    } catch {}

    const todayBumper = allBumpers.find((b: any) => b.draw_date === dateStr);

    // If today is NOT a bumper draw date in DB, cancel any scheduled reminder and exit
    if (!todayBumper) {
      await Notifications.cancelScheduledNotificationAsync(BUMPER_2PM_NOTIF_ID).catch(() => {});
      return;
    }

    // Check if the bumper draw is postponed, cancelled, or holiday in DB
    try {
      const postponed = await checkIsDatePostponed(dateStr, todayBumper.code);
      if (
        postponed &&
        (postponed.status === "postponed" ||
          postponed.status === "holiday" ||
          postponed.status === "cancelled")
      ) {
        await Notifications.cancelScheduledNotificationAsync(BUMPER_2PM_NOTIF_ID).catch(() => {});
        return;
      }
    } catch {}

    // Check Favorites Only mode
    if (settings.favoritesOnly) {
      const isFav = await isLotteryFavorite(todayBumper.code);
      if (!isFav) {
        await Notifications.cancelScheduledNotificationAsync(BUMPER_2PM_NOTIF_ID).catch(() => {});
        return;
      }
    }

    // Use admin-configured draw_time from DB
    const bumperDrawTimeFormatted = todayBumper.drawTime || "2:00 PM";
    const bumperDrawTime24 = convertTo24h(bumperDrawTimeFormatted, "14:00");

    // 15 minutes before the database bumper draw time
    const triggerDate = getNotificationDate(dateStr, bumperDrawTime24, 15);
    if (triggerDate.getTime() <= Date.now()) {
      return; // Already past reminder trigger for today
    }

    await Notifications.scheduleNotificationAsync({
      identifier: BUMPER_2PM_NOTIF_ID,
      content: {
        title: `👑 ${bumperDrawTimeFormatted} BUMPER DRAW: ${todayBumper.name}`,
        body: `Special ${todayBumper.name} (${todayBumper.code}) live bumper draw starts at ${bumperDrawTimeFormatted} today!`,
        sound: settings.soundEnabled,
        vibrate: settings.vibrateEnabled ? [0, 500, 200, 500] : undefined,
        data: {
          type: "bumper_2pm_draw",
          code: todayBumper.code,
          date: dateStr,
          drawTime: bumperDrawTimeFormatted,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (err) {
    console.warn("syncBumper2pmDrawNotification error:", err);
  }
}

/**
 * Master notification synchronizer:
 * Validates today's draw schedules, bumper calendar, and cancellations,
 * ensuring reminders fire ONLY when an actual draw takes place.
 */
export async function syncAllDrawNotifications(): Promise<void> {
  try {
    await Promise.all([
      syncDaily3pmDrawNotification(),
      syncBumper2pmDrawNotification(),
    ]);
  } catch (err) {
    console.warn("syncAllDrawNotifications error:", err);
  }
}

