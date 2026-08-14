import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LotteryReminder {
  id: string;
  ticketNumber: string;
  drawDate: string; // YYYY-MM-DD
  drawTime: string; // HH:MM (24h), e.g. "15:00" for 3 PM
  lotteryName: string;
  notificationId?: string; // expo-notifications scheduled ID
  createdAt: string;
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
  const all = await getAllReminders();
  const idx = all.findIndex((r) => r.id === reminder.id);
  if (idx >= 0) {
    all[idx] = reminder;
  } else {
    all.push(reminder);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export async function deleteReminder(id: string): Promise<void> {
  const all = await getAllReminders();
  const filtered = all.filter((r) => r.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Parse draw date+time into a JS Date object (5 min before)
export function getNotificationDate(drawDate: string, drawTime: string): Date {
  const [year, month, day] = drawDate.split("-").map(Number);
  const [hour, minute] = drawTime.split(":").map(Number);
  const drawDateObj = new Date(year, month - 1, day, hour, minute, 0);
  // 5 minutes before
  drawDateObj.setMinutes(drawDateObj.getMinutes() - 5);
  return drawDateObj;
}
