import { Platform } from "react-native";
import { isRunningInExpoGo, registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);

// Android home-screen widget. Its native module exists only in real builds, so never load it
// in Expo Go (it would throw on import) or on iOS.
if (Platform.OS === "android" && !isRunningInExpoGo()) {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./src/widget/widgetTaskHandler");
  registerWidgetTaskHandler(widgetTaskHandler);
}
