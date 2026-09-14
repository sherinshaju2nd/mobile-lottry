import React from "react";
import { useHomeUi } from "../context/HomeUiContext";
import HomeScreenModern from "./HomeScreen";
import HomeScreenNormal from "./HomeScreen2";

export default function HomeRouterScreen(props: any) {
  const { uiMode } = useHomeUi();

  if (uiMode === "modern") {
    return <HomeScreenModern {...props} />;
  }

  return <HomeScreenNormal {...props} />;
}
