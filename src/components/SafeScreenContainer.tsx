import React, { ReactNode } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { COLORS } from "../constants/colors";
import { useDeviceAdaptive } from "../hooks/useDeviceAdaptive";

interface SafeScreenContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  isTabScreen?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  backgroundColor?: string;
}

export default function SafeScreenContainer({
  children,
  style,
  contentStyle,
  isTabScreen = false,
  edges = ["top", "left", "right"],
  backgroundColor = COLORS.background,
}: SafeScreenContainerProps) {
  const { safeTopInset, safeBottomInset } = useDeviceAdaptive(isTabScreen);

  const applyTop = edges.includes("top");
  const applyBottom = edges.includes("bottom");

  const containerPaddingTop = applyTop ? safeTopInset : 0;
  const containerPaddingBottom = applyBottom ? safeBottomInset : 0;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor,
          paddingTop: containerPaddingTop,
          paddingBottom: containerPaddingBottom,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
