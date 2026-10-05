import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Image, Animated, Easing, Platform } from "react-native";
import { AgentState } from "../../types/aiAgent";
import { CHARACTER_ASSETS } from "../../constants/aiAssets";

interface AICharacterProps {
  state: AgentState;
  size?: number;
  audioLevel?: number;
}

export default function AICharacter({
  state,
  size = 230,
  audioLevel = 0,
}: AICharacterProps) {
  // Motion values
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  // Active animation loop reference
  const currentAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (currentAnimRef.current) {
      currentAnimRef.current.stop();
      currentAnimRef.current = null;
    }

    translateY.setValue(0);
    scale.setValue(1);
    glowOpacity.setValue(0.4);

    if (state === "listening") {
      // Energetic audio pulse when listening
      const listeningLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.06,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.85,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.0,
              duration: 400,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.35,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      currentAnimRef.current = listeningLoop;
      listeningLoop.start();
    } else {
      // Gentle 3D floating and breathing motion
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -9,
              duration: 1800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.02,
              duration: 1800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.65,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 4,
              duration: 1800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.99,
              duration: 1800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.3,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      currentAnimRef.current = floatLoop;
      floatLoop.start();
    }

    return () => {
      if (currentAnimRef.current) {
        currentAnimRef.current.stop();
      }
    };
  }, [state, translateY, scale, glowOpacity]);

  // Audio level reactive scale modifier
  const audioReactive =
    state === "listening" || state === "speaking" ? 1 + audioLevel * 0.05 : 1;

  const characterImage = CHARACTER_ASSETS[state] || CHARACTER_ASSETS.idle;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 1. Soft Ambient Atmosphere Behind 3D Model */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            opacity: glowOpacity,
            transform: [{ scale: Animated.multiply(scale, audioReactive) }],
          },
        ]}
      />

      {/* 2. Free-floating 3D Model with Full Alpha Transparency (No circular crop, no border) */}
      <Animated.View
        style={[
          styles.modelWrapper,
          {
            width: size,
            height: size,
            transform: [
              { translateY },
              { scale: Animated.multiply(scale, audioReactive) },
            ],
          },
        ]}
      >
        <Image
          source={characterImage}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    backgroundColor: "rgba(56, 189, 248, 0.28)",
    ...Platform.select({
      ios: {
        shadowColor: "#38BDF8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 28,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modelWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
