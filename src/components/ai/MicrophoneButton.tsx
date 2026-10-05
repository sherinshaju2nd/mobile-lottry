import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Animated,
  Platform,
} from "react-native";
import { Mic, Square, Loader2 } from "lucide-react-native";
import { AgentState, AgentLanguage } from "../../types/aiAgent";
import { triggerLightHaptic } from "../../utils/haptics";

interface MicrophoneButtonProps {
  state: AgentState;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  language?: AgentLanguage;
}

export default function MicrophoneButton({
  state,
  onPress,
  disabled = false,
  size = 72,
  language = "en",
}: MicrophoneButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const isLocked = [
    "transcribing",
    "thinking",
    "searching",
    "processing",
  ].includes(state);

  const isListening = state === "listening";
  const isSpeaking = state === "speaking";

  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.9,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.4,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.35);
    }
  }, [isListening, pulseAnim, glowAnim]);

  const handlePress = () => {
    if (isLocked || disabled) return;
    triggerLightHaptic();
    onPress();
  };

  const isMl = language === "ml";

  const getSubtext = () => {
    if (isListening) return isMl ? "സംസാരിക്കൂ" : "Speak now";
    if (isSpeaking) return isMl ? "നിർത്താൻ അമർത്തുക" : "Tap to stop";
    if (isLocked) return isMl ? "കാത്തിരിക്കൂ..." : "Please wait...";
    return isMl ? "സംസാരിക്കാൻ അമർത്തുക" : "Tap or speak";
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size + 24, height: size + 24 }]}>
        {/* Glow Halo */}
        {!isLocked && !disabled && (
          <Animated.View
            style={[
              styles.glowHalo,
              {
                width: size + 20,
                height: size + 20,
                borderRadius: (size + 20) / 2,
                backgroundColor: isListening
                  ? "rgba(239, 68, 68, 0.45)"
                  : "rgba(37, 99, 235, 0.45)",
                opacity: glowAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}

        {/* Circular Button Body */}
        <Animated.View
          style={{
            transform: [{ scale: isListening ? pulseAnim : 1 }],
            opacity: isLocked || disabled ? 0.45 : 1,
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: isListening
                  ? "#DC2626"
                  : isSpeaking
                  ? "#2563EB"
                  : isLocked
                  ? "#1E293B"
                  : "#1D4ED8",
              },
            ]}
            onPress={handlePress}
            activeOpacity={0.82}
            disabled={isLocked || disabled}
          >
            {isListening ? (
              <Square size={24} color="#FFFFFF" fill="#FFFFFF" />
            ) : isSpeaking ? (
              <Square size={22} color="#FFFFFF" fill="#FFFFFF" />
            ) : isLocked ? (
              <Loader2 size={26} color="#94A3B8" />
            ) : (
              <Mic size={28} color="#FFFFFF" strokeWidth={2.4} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Subtext beneath button per Image 2 */}
      <Text style={styles.subtext}>{getSubtext()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowHalo: {
    position: "absolute",
    pointerEvents: "none",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    ...Platform.select({
      ios: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  subtext: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 6,
    textAlign: "center",
  },
});
