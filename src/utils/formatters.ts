/**
 * Ultra-safe date and number formatters for React Native Hermes Engine on Android & iOS.
 * Avoids Hermes Intl/locale crashes by computing IST offsets and Indian number formatting directly.
 */

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Returns today's date in Indian Standard Time (IST) as "YYYY-MM-DD".
 * Guaranteed never to throw or crash Hermes.
 */
export function getSafeTodayISTDate(): string {
  try {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    const y = ist.getFullYear();
    const m = String(ist.getMonth() + 1).padStart(2, "0");
    const d = String(ist.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Returns today's weekday name in Indian Standard Time (IST) (e.g. "Monday").
 * Guaranteed never to throw or crash Hermes.
 */
export function getSafeTodayISTDayName(): string {
  try {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    return DAYS_OF_WEEK[ist.getDay()] || "Monday";
  } catch {
    return DAYS_OF_WEEK[new Date().getDay()] || "Monday";
  }
}

/**
 * Formats "YYYY-MM-DD" into "Tue, 12 Sep 2026" safely without Intl dependencies.
 */
export function formatSafeDateDisplay(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  try {
    const parts = String(dateStr).trim().split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const dateObj = new Date(y, m, d);
        const dayName = DAYS_SHORT[dateObj.getDay()] || "";
        const monthName = MONTHS_SHORT[m] || "";
        const dayStr = String(d).padStart(2, "0");
        return `${dayName ? dayName + ", " : ""}${dayStr} ${monthName} ${y}`.trim();
      }
    }
    return dateStr;
  } catch {
    return dateStr || "";
  }
}

/**
 * Formats numbers into the standard Indian numbering system (e.g. 1,00,000 or 75,00,000)
 * without using Number.prototype.toLocaleString("en-IN") which can crash Hermes.
 */
export function formatIndianNumber(num: number | string): string {
  try {
    const clean = String(num).replace(/[^\d.]/g, "");
    if (!clean) return "0";
    const parts = clean.split(".");
    let intPart = parts[0];
    const decPart = parts.length > 1 ? "." + parts[1] : "";

    if (intPart.length <= 3) {
      return intPart + decPart;
    }

    const lastThree = intPart.slice(-3);
    const otherNumbers = intPart.slice(0, -3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return `${formattedOther},${lastThree}${decPart}`;
  } catch {
    return String(num);
  }
}

/**
 * Format prize amounts safely (e.g. "₹1 Crore", "₹75 Lakhs", "₹8,000")
 */
export function formatPrizeAmountSafe(amount: string | undefined | null): string {
  try {
    if (!amount) return "₹75 Lakhs";
    const str = String(amount).trim();
    if (str.toLowerCase().includes("crore") || str.toLowerCase().includes("lakh")) {
      return str.startsWith("₹") ? str : `₹${str}`;
    }
    const clean = str.replace(/[^\d]/g, "");
    const num = parseInt(clean, 10);
    if (!isNaN(num)) {
      if (num >= 10000000) {
        const cr = num / 10000000;
        return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Crore`;
      }
      if (num >= 100000) {
        const lk = num / 100000;
        return `₹${lk % 1 === 0 ? lk : lk.toFixed(2)} Lakhs`;
      }
      return `₹${formatIndianNumber(num)}`;
    }
    return str.startsWith("₹") ? str : `₹${str}`;
  } catch {
    return amount ? String(amount) : "₹75 Lakhs";
  }
}
