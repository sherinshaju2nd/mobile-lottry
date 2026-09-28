import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LotteryWinningStatus {
  checked: boolean;
  won: boolean;
  prizeTier?: string;
  matchedNumber?: string;
  amount?: string;
  checkedAt: string;
}

export interface LotteryReminder {
  id: string;
  ticketNumber: string;
  drawDate: string; // YYYY-MM-DD
  drawTime: string; // HH:MM (24h), e.g. "15:00" for 3 PM
  lotteryName: string;
  notificationId?: string; // expo-notifications scheduled ID
  createdAt: string;
  reminderLeadMinutes?: number; // 5, 15, 30, 60
  winningStatus?: LotteryWinningStatus;
}

const STORAGE_KEY = "lottery_reminders_v1";

export async function getAllReminders(): Promise<LotteryReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LotteryReminder[];
  } catch {
    return [];
  }
}

export async function saveReminder(reminder: LotteryReminder): Promise<void> {
  try {
    const all = await getAllReminders();
    const idx = all.findIndex((r) => r.id === reminder.id);
    if (idx >= 0) {
      all[idx] = reminder;
    } else {
      all.push(reminder);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export async function deleteReminder(id: string): Promise<void> {
  try {
    const all = await getAllReminders();
    const filtered = all.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function generateId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Parse draw date+time into a JS Date object with configurable lead minutes (default 5 min before)
export function getNotificationDate(
  drawDate: string,
  drawTime?: string,
  leadMinutes: number = 5
): Date {
  const parts = String(drawDate || "").split("-").map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] || (new Date().getMonth() + 1);
  const day = parts[2] || new Date().getDate();

  let hour = 15;
  let minute = 0;

  if (drawTime) {
    const clean = String(drawTime).trim().toUpperCase();
    const isPM = clean.includes("PM");
    const isAM = clean.includes("AM");
    const digits = clean.replace(/[^0-9:]/g, "").split(":");
    if (digits.length >= 2) {
      hour = parseInt(digits[0], 10) || 0;
      minute = parseInt(digits[1], 10) || 0;
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
    }
  }

  const drawDateObj = new Date(year, month - 1, day, hour, minute, 0);
  // Subtract configurable lead minutes
  drawDateObj.setMinutes(drawDateObj.getMinutes() - Math.max(1, leadMinutes));
  return drawDateObj;
}
