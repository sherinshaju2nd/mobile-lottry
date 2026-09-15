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
import {
  getLotteryMalayalamName,
  ALL_LOTTERIES,
  WEEKLY_LOTTERIES,
  BUMPER_LOTTERIES,
  LotteryMeta,
} from "../constants/lotteries";
import {
  checkIsDatePostponed,
  fetchBumperLotteries,
  fetchLotteriesFromDb,
  fetchPostponedDraws,
  PostponedDraw,
} from "../api/lotteryApi";

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

    await ensureNotificationChannels();

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
        channelId: "lottery-draw-alerts",
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

    await ensureNotificationChannels();

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

    await ensureNotificationChannels();

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
          await ensureNotificationChannels();
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

      await ensureNotificationChannels();

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

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("lottery-draw-alerts", {
        name: "Kerala Lottery Draw Alerts",
        description: "Notifications for 3:00 PM weekly draws and 2:00 PM bumper draws",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0B3C5D",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      await Notifications.setNotificationChannelAsync("default", {
        name: "General Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0B3C5D",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    } catch (e) {
      console.warn("Error setting up notification channels:", e);
    }
  }
}

/**
 * Send an immediate test notification so user can verify permissions, audio, and vibration
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    await ensureNotificationChannels();
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
export const WEEKLY_3PM_PREFIX = "kerala_weekly_3pm_";
export const BUMPER_2PM_PREFIX = "kerala_bumper_2pm_";

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
 * Creates an exact JS Date object corresponding to (year, month, day, hour24, minute, second) in IST.
 * IST is UTC+05:30.
 */
export function createISTDateObj(
  dateStr: string,
  hour24: number = 15,
  minute: number = 0,
  second: number = 0
): Date {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  // Calculate UTC timestamp for IST time (UTC = IST - 5 hours 30 mins)
  const utcMs = Date.UTC(year, month - 1, day, hour24, minute, second, 0) - 5.5 * 3600 * 1000;
  return new Date(utcMs);
}

/**
 * Returns upcoming days list in IST starting from today (offset 0) up to numDays.
 */
export function getUpcomingISTDays(numDays: number = 30): Array<{
  dateStr: string;
  dayName: string;
  year: number;
  month: number;
  day: number;
}> {
  const days: Array<{
    dateStr: string;
    dayName: string;
    year: number;
    month: number;
    day: number;
  }> = [];

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const istNow = new Date(utcNow + 5.5 * 3600000);

  for (let i = 0; i < numDays; i++) {
    const d = new Date(istNow);
    d.setDate(d.getDate() + i);

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayName = dayNames[d.getDay()];

    days.push({ dateStr, dayName, year, month, day });
  }

  return days;
}

/**
 * Helper to check if a lottery draw is postponed, cancelled, or marked holiday
 */
export function isDrawPostponedOrCancelled(
  postponedList: PostponedDraw[],
  dateStr: string,
  lotteryCode: string
): boolean {
  if (!postponedList || postponedList.length === 0) return false;
  const targetCode = lotteryCode.trim().toUpperCase();
  return postponedList.some((p) => {
    if (p.draw_date !== dateStr) return false;
    const pCode = (p.lottery_code || "").trim().toUpperCase();
    const isCodeMatch = pCode === targetCode || pCode === "ALL";
    const status = (p.status || "").trim().toLowerCase();
    const isInactive =
      status === "postponed" ||
      status === "cancelled" ||
      status === "no_draw" ||
      status === "holiday";
    return isCodeMatch && isInactive;
  });
}

/**
 * Synchronize and schedule 3:00 PM Sharp Weekly Draw Notifications:
 * - Pre-schedules upcoming 30 days of weekly draws at 3:00 PM sharp (15:00:00 IST)
 * - Fires at 3:00 PM SHARP whether app is opened or closed
 * - Uses exact lottery name for each day (Monday..Sunday)
 * - Verifies the draw is NOT postponed/cancelled in DB
 * - If today/upcoming date is an admin-scheduled BUMPER DRAW date, suppresses weekly lottery
 * - Honors favoritesOnly setting
 */
export async function syncDaily3pmDrawNotification(
  prefetchedPostponed?: PostponedDraw[],
  prefetchedBumperDates?: Set<string>
): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    const settings = await getNotificationSettings();

    // Cancel legacy single ID if present
    await Notifications.cancelScheduledNotificationAsync(DAILY_3PM_NOTIF_ID).catch(() => {});

    // If disabled, cancel all weekly 3pm notifications
    if (!settings.masterEnabled || !settings.dailyDraw3pmReminder) {
      try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
          if (
            notif.identifier &&
            (notif.identifier.startsWith(WEEKLY_3PM_PREFIX) ||
              notif.identifier === DAILY_3PM_NOTIF_ID)
          ) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {});
          }
        }
      } catch {}
      return;
    }

    const { granted } = await getNotificationPermissionStatus();
    if (!granted) return;

    await ensureNotificationChannels();

    // Fetch dynamic weekly lotteries if available
    let weeklyLotteries = WEEKLY_LOTTERIES;
    try {
      const { weekly } = await fetchLotteriesFromDb();
      if (weekly && weekly.length > 0) {
        weeklyLotteries = weekly;
      }
    } catch {}

    // Fetch admin-added bumper dates if not provided
    let adminBumperDates = prefetchedBumperDates;
    if (!adminBumperDates) {
      try {
        const bumpers = await fetchBumperLotteries();
        adminBumperDates = new Set(
          (bumpers || [])
            .filter((b) => typeof b.draw_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.draw_date.trim()))
            .map((b) => b.draw_date!.trim())
        );
      } catch {
        adminBumperDates = new Set();
      }
    }

    // Fetch postponed draws from DB if not provided
    let postponedList = prefetchedPostponed;
    if (!postponedList) {
      try {
        postponedList = await fetchPostponedDraws();
      } catch {
        postponedList = [];
      }
    }

    // Get list of existing scheduled notifications to avoid redundant rescheduling
    const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
    const existingIds = new Set(scheduled.map((s) => s.identifier));

    // Cancel expired past weekly notifications
    const todayIST = getTodayIST().dateStr;
    for (const notif of scheduled) {
      if (notif.identifier && notif.identifier.startsWith(WEEKLY_3PM_PREFIX)) {
        const datePart = notif.identifier.replace(WEEKLY_3PM_PREFIX, "");
        if (datePart < todayIST) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {});
        }
      }
    }

    // Schedule next 30 days of 3:00 PM sharp draws
    const upcomingDays = getUpcomingISTDays(30);

    for (const dayInfo of upcomingDays) {
      const { dateStr, dayName } = dayInfo;
      const notifId = `${WEEKLY_3PM_PREFIX}${dateStr}`;

      // RULE 1: If date is an admin-announced BUMPER DRAW date, NO weekly lottery takes place!
      if (adminBumperDates.has(dateStr)) {
        if (existingIds.has(notifId)) {
          await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
        }
        continue;
      }

      const lottery = weeklyLotteries.find(
        (l) => l.day.toLowerCase() === dayName.toLowerCase()
      ) || WEEKLY_LOTTERIES.find(
        (l) => l.day.toLowerCase() === dayName.toLowerCase()
      );

      if (!lottery) continue;

      // 3:00 PM Sharp (15:00:00 IST)
      const triggerDate = createISTDateObj(dateStr, 15, 0, 0);

      // Skip if already passed
      if (triggerDate.getTime() <= Date.now()) {
        continue;
      }

      // RULE 2: Check if draw is postponed, cancelled, or marked holiday in DB
      if (isDrawPostponedOrCancelled(postponedList, dateStr, lottery.code)) {
        if (existingIds.has(notifId)) {
          await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
        }
        continue;
      }

      // RULE 3: Check Favorites Only mode
      if (settings.favoritesOnly) {
        const isFav = await isLotteryFavorite(lottery.code);
        if (!isFav) {
          if (existingIds.has(notifId)) {
            await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
          }
          continue;
        }
      }

      // Schedule exact 3:00 PM sharp notification with high importance
      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: {
          title: `🕒 3:00 PM Draw: ${lottery.name} (${lottery.code})`,
          body: `Today's ${lottery.name} (${lottery.code}) live draw begins now at 3:00 PM. Check live results!`,
          sound: settings.soundEnabled,
          vibrate: settings.vibrateEnabled ? [0, 250, 250, 250] : undefined,
          data: {
            type: "daily_3pm_draw",
            code: lottery.code,
            date: dateStr,
            drawTime: "3:00 PM",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: "lottery-draw-alerts",
        },
      });
    }
  } catch (err) {
    console.warn("syncDaily3pmDrawNotification error:", err);
  }
}

/**
 * Synchronize and schedule 2:00 PM Sharp Bumper Draw Notifications:
 * - ONLY schedules for Bumper draws with a valid draw_date explicitly added by admin
 * - Pre-schedules upcoming bumper draws at 2:00 PM sharp (14:00:00 IST)
 * - Fires at 2:00 PM SHARP whether app is opened or closed
 * - Verifies the bumper draw is NOT cancelled, postponed, or marked holiday in DB
 * - Honors favoritesOnly setting
 */
export async function syncBumper2pmDrawNotification(
  prefetchedPostponed?: PostponedDraw[],
  prefetchedBumpers?: LotteryMeta[]
): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    const settings = await getNotificationSettings();

    // Cancel legacy single ID if present
    await Notifications.cancelScheduledNotificationAsync(BUMPER_2PM_NOTIF_ID).catch(() => {});

    // If disabled, cancel all bumper 2pm notifications
    if (!settings.masterEnabled || !settings.bumper2pmReminder) {
      try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
          if (
            notif.identifier &&
            (notif.identifier.startsWith(BUMPER_2PM_PREFIX) ||
              notif.identifier === BUMPER_2PM_NOTIF_ID)
          ) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {});
          }
        }
      } catch {}
      return;
    }

    const { granted } = await getNotificationPermissionStatus();
    if (!granted) return;

    await ensureNotificationChannels();

    // Fetch dynamic bumper lotteries from database
    let allBumpers = prefetchedBumpers || [];
    if (!prefetchedBumpers) {
      try {
        const dynamicBumpers = await fetchBumperLotteries();
        if (dynamicBumpers && dynamicBumpers.length > 0) {
          allBumpers = dynamicBumpers;
        }
      } catch {
        allBumpers = [];
      }
    }

    // Filter to ONLY bumpers that have an admin-announced valid draw_date
    const adminActiveBumpers = allBumpers.filter(
      (b) =>
        typeof b.draw_date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(b.draw_date.trim())
    );

    // Active bumper notif IDs set
    const activeBumperNotifIds = new Set(
      adminActiveBumpers.map((b) => `${BUMPER_2PM_PREFIX}${b.code}_${b.draw_date!.trim()}`)
    );

    // Fetch postponed draws from DB if not provided
    let postponedList = prefetchedPostponed;
    if (!postponedList) {
      try {
        postponedList = await fetchPostponedDraws();
      } catch {
        postponedList = [];
      }
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
    const existingIds = new Set(scheduled.map((s) => s.identifier));

    // Cancel expired past bumper notifications OR bumpers whose dates were removed by admin
    const todayIST = getTodayIST().dateStr;
    for (const notif of scheduled) {
      if (notif.identifier && notif.identifier.startsWith(BUMPER_2PM_PREFIX)) {
        const parts = notif.identifier.split("_");
        const datePart = parts[parts.length - 1];
        if (datePart < todayIST || !activeBumperNotifIds.has(notif.identifier)) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {});
        }
      }
    }

    // Schedule only for active admin-announced bumper draw dates
    for (const bumper of adminActiveBumpers) {
      const dateStr = bumper.draw_date!.trim();
      const notifId = `${BUMPER_2PM_PREFIX}${bumper.code}_${dateStr}`;

      // 2:00 PM Sharp (14:00:00 IST)
      const triggerDate = createISTDateObj(dateStr, 14, 0, 0);

      // Skip if already passed
      if (triggerDate.getTime() <= Date.now()) {
        continue;
      }

      // Check if the bumper draw is postponed, cancelled, or holiday in DB
      if (isDrawPostponedOrCancelled(postponedList, dateStr, bumper.code)) {
        if (existingIds.has(notifId)) {
          await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
        }
        continue;
      }

      // Check Favorites Only mode
      if (settings.favoritesOnly) {
        const isFav = await isLotteryFavorite(bumper.code);
        if (!isFav) {
          if (existingIds.has(notifId)) {
            await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
          }
          continue;
        }
      }

      // Schedule exact 2:00 PM sharp bumper draw notification
      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: {
          title: `👑 2:00 PM BUMPER DRAW: ${bumper.name}`,
          body: `Special ${bumper.name} (${bumper.code}) live bumper draw starts now at 2:00 PM! Check live results.`,
          sound: settings.soundEnabled,
          vibrate: settings.vibrateEnabled ? [0, 500, 200, 500] : undefined,
          data: {
            type: "bumper_2pm_draw",
            code: bumper.code,
            date: dateStr,
            drawTime: "2:00 PM",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: "lottery-draw-alerts",
        },
      });
    }
  } catch (err) {
    console.warn("syncBumper2pmDrawNotification error:", err);
  }
}

/**
 * Master notification synchronizer:
 * Validates upcoming draw schedules, admin-announced bumper calendar, and cancellations,
 * scheduling multi-day alarms in advance so notifications fire at 3:00 PM sharp (weekly)
 * and 2:00 PM sharp (bumper) even when the app is completely closed.
 * Handles the Kerala rule: on days with an active Bumper Draw, the weekly 3:00 PM draw is skipped.
 */
export async function syncAllDrawNotifications(): Promise<void> {
  try {
    await ensureNotificationChannels();

    // Fetch postponement and bumper database state concurrently for consistency
    const [postponedList, bumpersList] = await Promise.all([
      fetchPostponedDraws().catch(() => []),
      fetchBumperLotteries().catch(() => []),
    ]);

    const adminBumperDates = new Set(
      (bumpersList || [])
        .filter((b) => typeof b.draw_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.draw_date.trim()))
        .map((b) => b.draw_date!.trim())
    );

    await Promise.all([
      syncDaily3pmDrawNotification(postponedList, adminBumperDates),
      syncBumper2pmDrawNotification(postponedList, bumpersList),
    ]);
  } catch (err) {
    console.warn("syncAllDrawNotifications error:", err);
  }
}

