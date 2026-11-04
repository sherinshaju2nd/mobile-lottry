import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getClaimDeadline } from "./claimCalculator";
import { createISTDateObj, ensureNotificationChannels, requestNotificationPermission } from "./notificationScheduler";

const STORAGE_KEY = "claim_reminders_v1";
/** Days before the claim deadline on which to remind (10:00 AM IST). */
export const CLAIM_REMINDER_DAYS_BEFORE = [14, 7, 2] as const;
const REMINDER_HOUR_IST = 10;

type ReminderMap = Record<string, string[]>;

export interface ClaimReminderInput {
  drawDate: string;
  /** Identifies the win, e.g. the ticket number or "2nd prize · Karunya". */
  label: string;
  /** Office line shown in the notification ("District Lottery Office", …). */
  officeName: string;
  /** Gross prize, so tapping the reminder reopens the calculator with it. */
  amount?: number;
}

export const claimReminderKey = ({ drawDate, label }: Pick<ClaimReminderInput, "drawDate" | "label">) =>
  `${drawDate}|${label}`;

const readMap = async (): Promise<ReminderMap> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as ReminderMap) : {};
  } catch (err: unknown) {
    console.warn("[claim-reminders] Could not read:", err instanceof Error ? err.message : String(err));
    return {};
  }
};

const writeMap = (map: ReminderMap) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));

/** Dates (YYYY-MM-DD) on which reminders would fire, skipping any that are already past. */
export const getClaimReminderDates = (drawDate: string, todayIST: string): string[] => {
  const deadline = getClaimDeadline(drawDate);
  if (!deadline) return [];
  return CLAIM_REMINDER_DAYS_BEFORE.map((daysBefore) => {
    const [y, m, d] = deadline.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d - daysBefore)).toISOString().slice(0, 10);
  }).filter((date) => date > todayIST);
};

export const hasClaimReminders = async (key: string): Promise<boolean> =>
  ((await readMap())[key]?.length ?? 0) > 0;

export const cancelClaimReminders = async (key: string): Promise<void> => {
  const map = await readMap();
  for (const id of map[key] ?? []) {
    await Notifications.cancelScheduledNotificationAsync(id).catch((err: unknown) =>
      console.warn("[claim-reminders] Cancel failed:", err instanceof Error ? err.message : String(err)),
    );
  }
  delete map[key];
  await writeMap(map);
};

/**
 * Schedules "claim your prize" reminders before the deadline. Replaces any reminders already
 * set for the same win. Returns how many were scheduled (0 = permission denied or too late).
 */
export const scheduleClaimReminders = async (input: ClaimReminderInput, todayIST: string): Promise<number> => {
  if (Platform.OS === "web") return 0;
  const key = claimReminderKey(input);
  await cancelClaimReminders(key);

  const dates = getClaimReminderDates(input.drawDate, todayIST);
  const deadline = getClaimDeadline(input.drawDate);
  if (dates.length === 0 || !deadline) return 0;
  if (!(await requestNotificationPermission())) return 0;
  await ensureNotificationChannels();

  const ids: string[] = [];
  for (const date of dates) {
    const daysLeft = Math.round((Date.parse(deadline) - Date.parse(date)) / 86_400_000);
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Claim your prize: ${daysLeft} days left`,
          body: `${input.label}: submit your winning ticket at the ${input.officeName} by ${deadline}. Sign the back of the ticket and keep it safe.`,
          data: { type: "claim_reminder", drawDate: input.drawDate, prizeLabel: input.label, amount: input.amount ?? null },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: createISTDateObj(date, REMINDER_HOUR_IST, 0, 0),
          channelId: "lottery-draw-alerts",
        },
      }),
    );
  }

  await writeMap({ ...(await readMap()), [key]: ids });
  return ids.length;
};
