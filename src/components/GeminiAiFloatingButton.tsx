import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  Platform,
} from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

interface GeminiAiFloatingButtonProps {
  onPress: () => void;
  style?: object;
}

export default function GeminiAiFloatingButton({
  onPress,
  style,
}: GeminiAiFloatingButtonProps) {
  // Pulse & glow animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, glowAnim]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        style,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Soft atmospheric blue/purple glow ring */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            opacity: glowAnim,
          },
        ]}
      />

      {/* Circular Round Button */}
      <TouchableOpacity
        style={styles.roundButton}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Official Google Gemini 4-Point Star SVG */}
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="googleGeminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#1A73E8" />
              <Stop offset="35%" stopColor="#7C3AED" />
              <Stop offset="70%" stopColor="#DB2777" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
            <LinearGradient id="geminiSparkleSmall" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#A855F7" />
            </LinearGradient>
          </Defs>
          {/* Primary curved 4-point star */}
          <Path
            d="M10.5 0C10.5 5.799 5.799 10.5 0 10.5C5.799 10.5 10.5 15.201 10.5 21C10.5 15.201 15.201 10.5 21 10.5C15.201 10.5 10.5 5.799 10.5 0Z"
            fill="url(#googleGeminiGrad)"
          />
          {/* Secondary companion sparkle */}
          <Path
            d="M18.5 1.5C18.5 3.433 16.933 5 15 5C16.933 5 18.5 6.567 18.5 8.5C18.5 6.567 20.067 5 22 5C20.067 5 18.5 3.433 18.5 1.5Z"
            fill="url(#geminiSparkleSmall)"
          />
          {/* Tertiary accent dot */}
          <Path
            d="M19 19C19 20.105 18.105 21 17 21C18.105 21 19 21.895 19 23C19 21.895 19.895 21 21 21C19.895 21 19 20.105 19 19Z"
            fill="#F59E0B"
          />
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 22,
    right: 18,
    zIndex: 999,
  },
  ambientGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 30,
    backgroundColor: "rgba(124, 58, 237, 0.25)",
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    ...Platform.select({
      ios: {
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
