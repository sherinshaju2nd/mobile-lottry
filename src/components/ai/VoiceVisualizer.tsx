import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated } from "react-native";

interface VoiceVisualizerProps {
  mode: "idle" | "listening" | "speaking";
  audioLevel?: number; // 0 to 1
  barCount?: number;
}

export default function VoiceVisualizer({
  mode,
  audioLevel = 0,
  barCount = 15,
}: VoiceVisualizerProps) {
  const bars = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.12))
  ).current;

  useEffect(() => {
    if (mode === "idle") {
      bars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 0.08,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    const animations = bars.map((bar, index) => {
      const centerFactor =
        1 - Math.abs(index - (barCount - 1) / 2) / ((barCount - 1) / 2);
      const minH = 0.12;
      const maxH = Math.min(1, 0.3 + centerFactor * 0.7 + audioLevel * 0.35);

      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: maxH,
            duration: 130 + (index % 5) * 30,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: minH,
            duration: 130 + (index % 5) * 30,
            useNativeDriver: false,
          }),
        ])
      );
    });

    animations.forEach((a) => a.start());

    return () => {
      animations.forEach((a) => a.stop());
    };
  }, [mode, audioLevel, barCount, bars]);

  if (mode === "idle") return null;

  return (
    <View style={styles.container}>
      {bars.map((barAnim, index) => {
        const heightVal = barAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [4, 40],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: heightVal,
                backgroundColor: "#38BDF8",
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    gap: 4,
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
});
