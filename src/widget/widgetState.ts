import { DrawResult } from "../api/lotteryApi";
import { LOTTERY_TIMING_CONFIG } from "../constants/lotteryConfig";

export const TODAY_WIDGET_NAME = "TodayResult";

export type WidgetKind = "result" | "upcoming" | "live" | "postponed" | "offline";

/** Everything the home-screen widget shows; computed in JS, rendered by TodayResultWidget. */
export interface TodayWidgetState {
  kind: WidgetKind;
  lotteryName: string;
  drawDate: string;
  isToday: boolean;
  drawTimeLabel: string;
  firstTicket?: string;
  firstLocation?: string;
  firstAmount?: string;
  countdownLabel?: string;
  updatedAtLabel: string;
}

export interface ScheduledLottery {
  code: string;
  name: string;
  isBumper: boolean;
}

export interface WidgetInputs {
  todayIST: string;
  /** Minutes since midnight, IST. */
  nowMinutesIST: number;
  scheduled: ScheduledLottery | null;
  isPostponed: boolean;
  /** Most recent draws, newest first. */
  recentDraws: DrawResult[];
}

const hasFirstPrize = (draw: DrawResult | undefined): draw is DrawResult => {
  const ticket = draw?.first?.ticket?.trim().toLowerCase() ?? "";
  return ticket.length > 0 && ticket !== "n/a" && ticket !== "pending";
};

/** Minutes since midnight in IST for a Date (device timezone independent). */
export const getNowMinutesIST = (now: Date = new Date()): number =>
  (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;

export const formatClockLabel = (minutesSinceMidnight: number): string => {
  const hours24 = Math.floor(minutesSinceMidnight / 60) % 24;
  const minutes = minutesSinceMidnight % 60;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${hours24 < 12 ? "AM" : "PM"}`;
};

export const formatCountdown = (minutesLeft: number): string => {
  if (minutesLeft < 60) return `in ${Math.max(1, minutesLeft)} min`;
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  return minutes ? `in ${hours} h ${minutes} min` : `in ${hours} h`;
};

/**
 * Decides what the widget shows:
 *  - today's 1st prize as soon as it is published,
 *  - before the draw: today's lottery, draw time and a countdown (as of the last refresh),
 *  - after draw time without a result yet: "live",
 *  - postponed draws, or the latest known result when nothing is scheduled.
 */
export const buildTodayWidgetState = ({
  todayIST,
  nowMinutesIST,
  scheduled,
  isPostponed,
  recentDraws,
}: WidgetInputs): TodayWidgetState => {
  const updatedAtLabel = `Updated ${formatClockLabel(nowMinutesIST)}`;
  const timing = scheduled?.isBumper ? LOTTERY_TIMING_CONFIG.bumper : LOTTERY_TIMING_CONFIG.regular;
  const drawMinutes = timing.drawHour * 60 + timing.drawMinute;

  const todaysResult = recentDraws.find(
    (d) => d.draw_date === todayIST && hasFirstPrize(d) && (!scheduled || d.lottery_code === scheduled.code),
  ) ?? recentDraws.find((d) => d.draw_date === todayIST && hasFirstPrize(d));

  const resultState = (draw: DrawResult): TodayWidgetState => ({
    kind: "result",
    lotteryName: draw.draw_name,
    drawDate: draw.draw_date,
    isToday: draw.draw_date === todayIST,
    drawTimeLabel: timing.drawTimeDisplay,
    firstTicket: draw.first?.ticket?.trim(),
    firstLocation: draw.first?.location?.trim(),
    firstAmount: draw.prizes?.amounts?.["1st"],
    updatedAtLabel,
  });

  if (todaysResult) return resultState(todaysResult);

  if (scheduled) {
    const base = {
      lotteryName: scheduled.name,
      drawDate: todayIST,
      isToday: true,
      drawTimeLabel: timing.drawTimeDisplay,
      updatedAtLabel,
    };
    if (isPostponed) return { ...base, kind: "postponed" };
    if (nowMinutesIST < drawMinutes) {
      return { ...base, kind: "upcoming", countdownLabel: formatCountdown(drawMinutes - nowMinutesIST) };
    }
    return { ...base, kind: "live" };
  }

  const latest = recentDraws.find(hasFirstPrize);
  if (latest) return resultState(latest);

  return {
    kind: "offline",
    lotteryName: "Kerala Lottery",
    drawDate: todayIST,
    isToday: true,
    drawTimeLabel: timing.drawTimeDisplay,
    updatedAtLabel,
  };
};
