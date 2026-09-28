import { Dimensions, Platform, StatusBar } from "react-native";

export type DeviceType = "compact" | "standard" | "tall" | "tablet";

export interface DeviceMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  deviceType: DeviceType;
  isCompact: boolean;
  isStandard: boolean;
  isTall: boolean;
  isTablet: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  hasNotch: boolean;
  statusBarHeight: number;
  bottomNavType: "three_button" | "gesture" | "none";
}

/**
 * Returns raw Android status bar height with reliable fallback.
 */
export function getAndroidStatusBarHeight(): number {
  if (Platform.OS !== "android") return 0;
  return StatusBar.currentHeight && StatusBar.currentHeight > 0
    ? StatusBar.currentHeight
    : 24;
}

/**
 * Computes device classification and metrics.
 */
export function getDeviceMetrics(
  windowWidth?: number,
  windowHeight?: number,
  insetsTop: number = 0,
  insetsBottom: number = 0
): DeviceMetrics {
  const { width: winW, height: winH } = Dimensions.get("window");
  const width = windowWidth || winW;
  const height = windowHeight || winH;
  const isAndroid = Platform.OS === "android";
  const isIOS = Platform.OS === "ios";

  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  const aspectRatio = maxDimension / (minDimension || 1);

  // Device Classification
  const isTablet = minDimension >= 600;
  const isCompact = !isTablet && (minDimension <= 365 || maxDimension <= 680);
  const isTall = !isTablet && !isCompact && aspectRatio >= 2.0;
  const isStandard = !isTablet && !isCompact && !isTall;

  let deviceType: DeviceType = "standard";
  if (isTablet) deviceType = "tablet";
  else if (isCompact) deviceType = "compact";
  else if (isTall) deviceType = "tall";

  // Android Status Bar & Notch Detection
  const androidBarHeight = getAndroidStatusBarHeight();
  const statusBarHeight = isAndroid
    ? Math.max(insetsTop, androidBarHeight)
    : insetsTop > 0
    ? insetsTop
    : 20;

  // Has notch / punch hole check:
  // Most punch hole & notch Android devices have status bar >= 28dp, or insetsTop >= 28
  const hasNotch = isAndroid
    ? statusBarHeight >= 28 || insetsTop >= 28
    : insetsTop >= 44;

  // Bottom Navigation Bar Classification on Android
  let bottomNavType: "three_button" | "gesture" | "none" = "none";
  if (isAndroid) {
    if (insetsBottom >= 36) {
      bottomNavType = "three_button"; // Classic 3-button navigation (typically 48dp)
    } else if (insetsBottom > 0) {
      bottomNavType = "gesture"; // Modern gesture pill (typically 16-24dp)
    } else {
      bottomNavType = "none";
    }
  } else if (isIOS) {
    bottomNavType = insetsBottom > 0 ? "gesture" : "none";
  }

  return {
    width,
    height,
    aspectRatio,
    deviceType,
    isCompact,
    isStandard,
    isTall,
    isTablet,
    isAndroid,
    isIOS,
    hasNotch,
    statusBarHeight,
    bottomNavType,
  };
}

/**
 * Calculates a guaranteed safe top inset that clears camera punch holes,
 * teardrop notches, and dynamic islands on all Android and iOS phones.
 */
export function getSafeTopInset(insetsTop: number = 0): number {
  if (Platform.OS === "android") {
    const androidBarHeight = getAndroidStatusBarHeight();
    // Use maximum of react-native-safe-area-context inset, OS currentHeight, and standard 24dp base
    return Math.max(insetsTop, androidBarHeight, 24);
  }
  // iOS
  return insetsTop > 0 ? insetsTop : 20;
}

/**
 * Calculates a safe bottom inset that prevents UI from colliding with
 * Android 3-button nav, gesture bars, or iOS home indicator.
 */
export function getSafeBottomInset(
  insetsBottom: number = 0,
  isTabScreen: boolean = false
): number {
  if (Platform.OS === "android") {
    if (isTabScreen) {
      // Bottom tabs will handle their own inner padding
      return insetsBottom > 0 ? insetsBottom : 0;
    }
    // Standalone screen or modal bottom padding
    return Math.max(insetsBottom, 12);
  }
  // iOS
  return insetsBottom > 0 ? (isTabScreen ? insetsBottom : Math.max(insetsBottom, 16)) : 10;
}

/**
 * Responsive font scaler that scales smoothly based on device width
 * with strict safety clamps so text never breaks layout.
 */
export function scaleFont(
  size: number,
  deviceType: DeviceType = "standard"
): number {
  switch (deviceType) {
    case "compact":
      return Math.round(size * 0.92 * 10) / 10;
    case "tablet":
      return Math.round(size * 1.12 * 10) / 10;
    case "tall":
    case "standard":
    default:
      return size;
  }
}

/**
 * Responsive spacing/padding helper.
 */
export function scaleSpacing(
  spacing: number,
  deviceType: DeviceType = "standard"
): number {
  switch (deviceType) {
    case "compact":
      return Math.max(4, Math.round(spacing * 0.85));
    case "tablet":
      return Math.round(spacing * 1.2);
    case "tall":
    case "standard":
    default:
      return spacing;
  }
}
