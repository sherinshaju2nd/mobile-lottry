import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  checkIsDatePostponed,
  fetchBumperLotteries,
  parseDrawResultRow,
  supabase,
} from "../api/lotteryApi";
import { WEEKLY_LOTTERIES } from "../constants/lotteries";
import { getSafeTodayISTDate, getSafeTodayISTDayName } from "../utils/formatters";
import {
  ScheduledLottery,
  TodayWidgetState,
  buildTodayWidgetState,
  getNowMinutesIST,
} from "./widgetState";

const WIDGET_CACHE_KEY = "home_widget_state_v1";
const RECENT_DRAWS_LIMIT = 4;

const fetchRecentDraws = async () => {
  const { data, error } = await supabase
    .from("draw_results")
    .select("*")
    .order("draw_date", { ascending: false })
    .limit(RECENT_DRAWS_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []).map(parseDrawResultRow);
};

const getScheduledLottery = async (todayIST: string): Promise<ScheduledLottery | null> => {
  const bumpers = await fetchBumperLotteries();
  const bumperToday = bumpers.find((b) => b.draw_date === todayIST);
  if (bumperToday) return { code: bumperToday.code, name: bumperToday.name, isBumper: true };

  const dayName = getSafeTodayISTDayName();
  const weekly = WEEKLY_LOTTERIES.find((l) => l.day === dayName);
  return weekly ? { code: weekly.code, name: weekly.name, isBumper: false } : null;
};

/** A cached state from an earlier day must not say "Today" or show a stale countdown / live badge. */
export const reviveCachedState = (cached: TodayWidgetState, todayIST: string): TodayWidgetState => {
  const isToday = cached.drawDate === todayIST;
  if (isToday) return cached;
  if (cached.kind === "result") return { ...cached, isToday: false };
  return { ...cached, kind: "offline", isToday: false, countdownLabel: undefined };
};

/**
 * Loads fresh data for the home-screen widget. Runs in the widget's headless JS task
 * (app may be closed). On network failure it returns the last good state so the widget
 * never goes blank.
 */
export const loadTodayWidgetState = async (): Promise<TodayWidgetState> => {
  const todayIST = getSafeTodayISTDate();
  try {
    const [recentDraws, scheduled] = await Promise.all([fetchRecentDraws(), getScheduledLottery(todayIST)]);
    const isPostponed = scheduled ? Boolean(await checkIsDatePostponed(todayIST, scheduled.code)) : false;

    const state = buildTodayWidgetState({
      todayIST,
      nowMinutesIST: getNowMinutesIST(),
      scheduled,
      isPostponed,
      recentDraws,
    });
    await AsyncStorage.setItem(WIDGET_CACHE_KEY, JSON.stringify(state));
    return state;
  } catch (err: unknown) {
    console.warn("[widget] Refresh failed, using cached state:", err instanceof Error ? err.message : String(err));
    try {
      const cached = await AsyncStorage.getItem(WIDGET_CACHE_KEY);
      if (cached) return reviveCachedState(JSON.parse(cached) as TodayWidgetState, todayIST);
    } catch (cacheErr: unknown) {
      console.warn("[widget] Cached state unreadable:", cacheErr instanceof Error ? cacheErr.message : String(cacheErr));
    }
    return buildTodayWidgetState({
      todayIST,
      nowMinutesIST: getNowMinutesIST(),
      scheduled: null,
      isPostponed: false,
      recentDraws: [],
    });
  }
};
