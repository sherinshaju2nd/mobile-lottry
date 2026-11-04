import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { TodayResultWidget } from "./TodayResultWidget";
import { loadTodayWidgetState } from "./loadWidgetState";
import { TODAY_WIDGET_NAME } from "./widgetState";

/** Headless task Android runs when the widget is added, resized or due for its periodic update. */
export const widgetTaskHandler = async ({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) => {
  if (widgetInfo.widgetName !== TODAY_WIDGET_NAME) return;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const state = await loadTodayWidgetState();
      renderWidget(<TodayResultWidget state={state} />);
      break;
    }
    default:
      // WIDGET_DELETED: nothing to clean up. WIDGET_CLICK: OPEN_APP is handled natively.
      break;
  }
};
