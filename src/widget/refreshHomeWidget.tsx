import React from "react";
import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import { TODAY_WIDGET_NAME } from "./widgetState";

/** The widget's native module only exists in real Android builds (never in Expo Go / iOS). */
export const isHomeWidgetSupported = (): boolean =>
  Platform.OS === "android" && !isRunningInExpoGo();

const REFRESH_DEBOUNCE_MS = 4000;
let pendingRefresh: ReturnType<typeof setTimeout> | null = null;

/**
 * Re-renders the home-screen widget with fresh data. Android only refreshes widgets on its
 * own every 30+ minutes, so the app calls this whenever it sees new results (debounced,
 * because live draws update the same row many times).
 */
export const refreshHomeWidget = (): void => {
  if (!isHomeWidgetSupported()) return;
  if (pendingRefresh) clearTimeout(pendingRefresh);
  pendingRefresh = setTimeout(async () => {
    pendingRefresh = null;
    try {
      // Lazy-required so the native module is never touched where it does not exist.
      const { requestWidgetUpdate } = require("react-native-android-widget") as typeof import("react-native-android-widget");
      const { TodayResultWidget } = require("./TodayResultWidget") as typeof import("./TodayResultWidget");
      const { loadTodayWidgetState } = require("./loadWidgetState") as typeof import("./loadWidgetState");
      await requestWidgetUpdate({
        widgetName: TODAY_WIDGET_NAME,
        renderWidget: async () => <TodayResultWidget state={await loadTodayWidgetState()} />,
      });
    } catch (err: unknown) {
      console.warn("[widget] Refresh request failed:", err instanceof Error ? err.message : String(err));
    }
  }, REFRESH_DEBOUNCE_MS);
};
