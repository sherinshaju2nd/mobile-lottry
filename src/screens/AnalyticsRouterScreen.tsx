import React from "react";
import { useHomeUi } from "../context/HomeUiContext";
import AnalyticsScreenModern from "./AnalyticsScreen";
import AnalyticsScreenNormal from "./AnalyticsScreen2";

export default function AnalyticsRouterScreen(props: any) {
  const { uiMode } = useHomeUi();

  if (uiMode === "modern") {
    return <AnalyticsScreenModern {...props} />;
  }

  return <AnalyticsScreenNormal {...props} />;
}
