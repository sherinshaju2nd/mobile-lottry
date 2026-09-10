/**
 * Centralized Single-Source-of-Truth Lottery & Timing Configuration for Mobile App
 * 
 * Changing values here automatically updates the entire Mobile Application:
 * - Countdown timers
 * - Hero tab default view & switch thresholds
 * - Polling start/stop windows
 * - Display badges and draw timings
 */

export interface TimingSetting {
  drawTimeDisplay: string;
  drawHour: number;
  drawMinute: number;
  switchThresholdHour: number;
  switchThresholdMinute: number;
  pollingStartHour: number;
  pollingStartMinute: number;
  pollingEndHour: number;
  pollingEndMinute: number;
}

export const LOTTERY_TIMING_CONFIG: {
  regular: TimingSetting;
  bumper: TimingSetting;
} = {
  regular: {
    drawTimeDisplay: "3:00 PM",
    drawHour: 15,
    drawMinute: 0,
    switchThresholdHour: 14,
    switchThresholdMinute: 45, // 2:45 PM IST
    pollingStartHour: 14,
    pollingStartMinute: 50, // 2:50 PM IST
    pollingEndHour: 18,
    pollingEndMinute: 0, // 6:00 PM IST
  },
  bumper: {
    drawTimeDisplay: "2:00 PM",
    drawHour: 14,
    drawMinute: 0,
    switchThresholdHour: 13,
    switchThresholdMinute: 30, // 1:30 PM IST
    pollingStartHour: 13,
    pollingStartMinute: 50, // 1:50 PM IST
    pollingEndHour: 18,
    pollingEndMinute: 0, // 6:00 PM IST
  },
};

/** Get the timing configuration based on bumper status */
export function getLotteryTiming(isBumper: boolean): TimingSetting {
  return isBumper ? LOTTERY_TIMING_CONFIG.bumper : LOTTERY_TIMING_CONFIG.regular;
}

/** Get IST current time components */
export function getISTTime(date: Date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  totalSeconds: number;
} {
  try {
    const timeStr = date.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });
    const [hStr, mStr, sStr] = timeStr.split(":");
    const hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);
    const seconds = parseInt(sStr || "0", 10);
    return {
      hours,
      minutes,
      seconds,
      totalMinutes: hours * 60 + minutes,
      totalSeconds: hours * 3600 + minutes * 60 + seconds,
    };
  } catch {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return {
      hours,
      minutes,
      seconds,
      totalMinutes: hours * 60 + minutes,
      totalSeconds: hours * 3600 + minutes * 60 + seconds,
    };
  }
}

/** Check if current time is before the hero tab switch threshold */
export function getIsBeforeSwitchTime(isBumper: boolean, date: Date = new Date()): boolean {
  const timing = getLotteryTiming(isBumper);
  const { totalMinutes } = getISTTime(date);
  const thresholdMinutes = timing.switchThresholdHour * 60 + timing.switchThresholdMinute;
  return totalMinutes < thresholdMinutes;
}

/** Check if current time is after or at the official draw commencement time */
export function getIsAfterDrawTime(isBumper: boolean, date: Date = new Date()): boolean {
  const timing = getLotteryTiming(isBumper);
  const { totalMinutes } = getISTTime(date);
  const drawMinutes = timing.drawHour * 60 + timing.drawMinute;
  return totalMinutes >= drawMinutes;
}

/** Check if current time is within the active live draw & polling window */
export function getIsPollingWindow(isBumper: boolean, date: Date = new Date()): boolean {
  const timing = getLotteryTiming(isBumper);
  const { totalMinutes } = getISTTime(date);
  const startMins = timing.pollingStartHour * 60 + timing.pollingStartMinute;
  const endMins = timing.pollingEndHour * 60 + timing.pollingEndMinute;
  return totalMinutes >= startMins && totalMinutes < endMins;
}

/** Calculate high-precision countdown to the draw */
export function calculateDrawCountdown(
  isBumper: boolean,
  date: Date = new Date()
): {
  hours: number;
  minutes: number;
  seconds: number;
  isDrawPassed: boolean;
} {
  const timing = getLotteryTiming(isBumper);
  const { totalSeconds } = getISTTime(date);
  const targetTotalSeconds = timing.drawHour * 3600 + timing.drawMinute * 60;
  const diffSeconds = targetTotalSeconds - totalSeconds;

  if (diffSeconds <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isDrawPassed: true };
  }

  return {
    hours: Math.floor(diffSeconds / 3600),
    minutes: Math.floor((diffSeconds % 3600) / 60),
    seconds: diffSeconds % 60,
    isDrawPassed: false,
  };
}

/** Get draw time display string with fallback */
export function getDrawTimeDisplay(isBumper: boolean, customTime?: string): string {
  if (customTime && customTime.trim()) return customTime.trim();
  return getLotteryTiming(isBumper).drawTimeDisplay;
}
