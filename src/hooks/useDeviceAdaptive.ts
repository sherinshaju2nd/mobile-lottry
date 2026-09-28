import { useMemo } from "react";
import { useWindowDimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getDeviceMetrics,
  getSafeTopInset,
  getSafeBottomInset,
  scaleFont,
  scaleSpacing,
  DeviceType,
  DeviceMetrics,
} from "../utils/deviceHelper";

export interface DeviceAdaptiveInfo extends DeviceMetrics {
  safeTopInset: number;
  safeBottomInset: number;
  headerPaddingTop: number;
  contentPaddingHorizontal: number;
  scaleText: (size: number) => number;
  scaleSpace: (spacing: number) => number;
}

export function useDeviceAdaptive(isTabScreen: boolean = false): DeviceAdaptiveInfo {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const metrics = getDeviceMetrics(width, height, insets.top, insets.bottom);
    const safeTop = getSafeTopInset(insets.top);
    const safeBottom = getSafeBottomInset(insets.bottom, isTabScreen);

    // Dynamic header padding top that cleanly accounts for status bar & notch
    // On Android, we ensure at least safeTop plus a comfortable 4-8dp visual cushion
    const headerPaddingTop = Platform.OS === "android"
      ? safeTop + (metrics.isTall ? 6 : 4)
      : safeTop + 4;

    const contentPaddingHorizontal = metrics.isCompact ? 12 : metrics.isTablet ? 24 : 16;

    return {
      ...metrics,
      safeTopInset: safeTop,
      safeBottomInset: safeBottom,
      headerPaddingTop,
      contentPaddingHorizontal,
      scaleText: (size: number) => scaleFont(size, metrics.deviceType),
      scaleSpace: (spacing: number) => scaleSpacing(spacing, metrics.deviceType),
    };
  }, [insets.top, insets.bottom, width, height, isTabScreen]);
}
