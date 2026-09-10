import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONFETTI_COUNT = 36;
const CONFETTI_COLORS = [
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
  "#EF4444",
  "#FBBF24",
];

interface Particle {
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
}

export default function ConfettiEffect({ active = true }: { active?: boolean }) {
  const particles = useRef<Particle[]>(
    Array.from({ length: CONFETTI_COUNT }).map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      y: new Animated.Value(-20 - Math.random() * 50),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(Math.random() * 0.6 + 0.4),
      rotate: new Animated.Value(0),
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.floor(Math.random() * 8) + 6,
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    const animations = particles.map((p) => {
      p.y.setValue(-20 - Math.random() * 50);
      p.opacity.setValue(1);
      p.rotate.setValue(0);

      const duration = 2000 + Math.random() * 1200;

      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: SCREEN_HEIGHT * 0.75 + Math.random() * 100,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: (Math.random() > 0.5 ? 1 : -1) * 360 * (1 + Math.random()),
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(25, animations).start();
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, index) => {
        const spin = p.rotate.interpolate({
          inputRange: [-360, 360],
          outputRange: ["-360deg", "360deg"],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: p.x,
                width: p.size,
                height: p.size * 1.4,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateY: p.y },
                  { rotate: spin },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    top: 0,
    borderRadius: 2,
    zIndex: 9999,
  },
});
