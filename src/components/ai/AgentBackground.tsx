import React from "react";
import { StyleSheet, View, Image, Dimensions } from "react-native";
import { BACKGROUND_ASSETS } from "../../constants/aiAssets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AgentBackgroundProps {
  children?: React.ReactNode;
}

export default function AgentBackground({ children }: AgentBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* 1. Kerala Twilight Starry Night Background with Palm Tree Silhouettes */}
      <Image
        source={BACKGROUND_ASSETS.kerala_night}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* 2. Soft Dark Vignette Overlay for Premium Contrast */}
      <View style={styles.vignetteOverlay} />

      {/* 3. Foreground Interactive Content */}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060B18",
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  vignetteOverlay: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
    backgroundColor: "rgba(6, 11, 24, 0.42)",
    pointerEvents: "none",
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
});
