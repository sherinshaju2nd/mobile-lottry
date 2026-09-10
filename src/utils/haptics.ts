import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";

export const triggerLightHaptic = async () => {
  try {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    Vibration.vibrate(10);
  }
};

export const triggerMediumHaptic = async () => {
  try {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {
    Vibration.vibrate(20);
  }
};

export const triggerSuccessHaptic = async () => {
  try {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {
    Vibration.vibrate([0, 50, 50, 100]);
  }
};

export const triggerErrorHaptic = async () => {
  try {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch {
    Vibration.vibrate(50);
  }
};

export const triggerLiveChimeHaptic = async () => {
  try {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch {
    Vibration.vibrate(30);
  }
};
