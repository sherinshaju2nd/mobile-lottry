import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from "react-native";
import Svg, {
  Rect,
  Circle,
  Ellipse,
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
} from "react-native-svg";
import { triggerLightHaptic, triggerSuccessHaptic, triggerHeavyHaptic, triggerErrorHaptic } from "../utils/haptics";

export type CoucouVariant =
  | "greeting"
  | "working"
  | "thinking"
  | "upload"
  | "slap"
  | "dizzy"
  | "question"
  | "error"
  | "finished"
  | "dance"
  // Friendly aliases
  | "welcoming"
  | "searching"
  | "asking"
  | "scanning"
  // Lifecycle states (lowercase & uppercase)
  | "idle"
  | "listening"
  | "speaking"
  | "processing"
  | "completed"
  | "success"
  | "ready"
  | "GREETING"
  | "IDLE"
  | "READY"
  | "LISTENING"
  | "TRANSCRIBING"
  | "THINKING"
  | "SEARCHING"
  | "PROCESSING"
  | "RESPONDING"
  | "SPEAKING"
  | "COMPLETED"
  | "SUCCESS"
  | "ERROR";

export type CanonicalVariant =
  | "greeting"
  | "working"
  | "thinking"
  | "upload"
  | "slap"
  | "dizzy"
  | "question"
  | "error"
  | "finished"
  | "dance";

export interface CoucouAgentProps {
  variant?: CoucouVariant;
  state?: CoucouVariant | string; // alias for backwards compatibility with JarvisReactiveCore
  size?: number;
  onPress?: () => void;
  showSelector?: boolean;
  showCounter?: boolean;
  interactive?: boolean;
  onVariantChange?: (variant: CanonicalVariant) => void;
}

export const CANONICAL_VARIANTS: { key: CanonicalVariant; label: string; color: string; index: string }[] = [
  { key: "greeting", label: "Greeting", color: "#F59E0B", index: "01" },
  { key: "working", label: "Working", color: "#0284C7", index: "02" },
  { key: "thinking", label: "Thinking", color: "#8B5CF6", index: "03" },
  { key: "upload", label: "Upload", color: "#10B981", index: "04" },
  { key: "slap", label: "Slap", color: "#F97316", index: "05" },
  { key: "dizzy", label: "Dizzy", color: "#EC4899", index: "06" },
  { key: "question", label: "Question", color: "#06B6D4", index: "07" },
  { key: "error", label: "Error", color: "#EF4444", index: "08" },
  { key: "finished", label: "Finished", color: "#10B981", index: "09" },
  { key: "dance", label: "Dance", color: "#D946EF", index: "10" },
];

export function mapToCanonical(input?: CoucouVariant | string): CanonicalVariant {
  const norm = (input || "").toString().toLowerCase().trim();
  switch (norm) {
    case "greeting":
    case "welcoming":
    case "idle":
    case "ready":
      return "greeting";
    case "working":
    case "searching":
    case "speaking":
    case "responding":
      return "working";
    case "thinking":
    case "transcribing":
      return "thinking";
    case "upload":
    case "scanning":
    case "processing":
      return "upload";
    case "slap":
    case "poke":
      return "slap";
    case "dizzy":
      return "dizzy";
    case "question":
    case "asking":
    case "listening":
      return "question";
    case "error":
      return "error";
    case "finished":
    case "completed":
    case "success":
      return "finished";
    case "dance":
      return "dance";
    default:
      return "greeting";
  }
}

export default function CoucouAgent({
  variant,
  state,
  size = 200,
  onPress,
  showSelector = false,
  showCounter = false,
  interactive = true,
  onVariantChange,
}: CoucouAgentProps) {
  // Active canonical variant directly derived from prop (no redundant useEffect/setState)
  const activeInput = variant || state || "greeting";
  const canonicalFromProp = mapToCanonical(activeInput);
  const [overrideVariant, setOverrideVariant] = useState<CanonicalVariant | null>(null);

  const currentVariant = overrideVariant || canonicalFromProp;
  const currentMeta = CANONICAL_VARIANTS.find((v) => v.key === currentVariant) || CANONICAL_VARIANTS[0];

  // Core Animation Controllers
  const floatAnim = useRef(new Animated.Value(0)).current; // -1 to 1 floating bob
  const breatheAnim = useRef(new Animated.Value(1)).current; // Scale breathing
  const bodySquashX = useRef(new Animated.Value(1)).current; // Squash X
  const bodySquashY = useRef(new Animated.Value(1)).current; // Squash Y
  const bodyTilt = useRef(new Animated.Value(0)).current; // Rotation in degrees
  const bodyShakeX = useRef(new Animated.Value(0)).current; // Shake translation X
  const glowOpacity = useRef(new Animated.Value(0.5)).current; // Glow opacity

  // Sub-feature animation controllers
  const orbitAngle = useRef(new Animated.Value(0)).current; // Orbiting satellite (0-360)
  const eyeBlink = useRef(new Animated.Value(1)).current; // Eye blink (1 -> 0.1 -> 1)
  const eyeScanX = useRef(new Animated.Value(0)).current; // Working/Searching eye scan (-3 -> +3)
  const chatDot1 = useRef(new Animated.Value(0)).current; // Speech bubble dot 1
  const chatDot2 = useRef(new Animated.Value(0)).current; // Speech bubble dot 2
  const chatDot3 = useRef(new Animated.Value(0)).current; // Speech bubble dot 3
  const uploadCardY = useRef(new Animated.Value(-40)).current; // Upload card drop
  const uploadCardOpacity = useRef(new Animated.Value(0)).current;
  const uploadSlotOpen = useRef(new Animated.Value(0)).current; // 0: closed, 1: open
  const dizzySpin = useRef(new Animated.Value(0)).current; // Dizzy eye spin
  const questionPop = useRef(new Animated.Value(0)).current; // Question bubble scale
  const alertPulse = useRef(new Animated.Value(0)).current; // Error beacon pulse
  const sparkle1 = useRef(new Animated.Value(0)).current; // Finished star sparkle 1
  const sparkle2 = useRef(new Animated.Value(0)).current; // Finished star sparkle 2
  const sparkle3 = useRef(new Animated.Value(0)).current; // Finished star sparkle 3
  const danceBounce = useRef(new Animated.Value(0)).current; // Dance groove hop

  // 1. Natural Floating & Ambient Breathing (Continuous)
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: currentVariant === "dance" ? 420 : currentVariant === "thinking" ? 2200 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -1,
          duration: currentVariant === "dance" ? 420 : currentVariant === "thinking" ? 2200 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breatheAnim, {
            toValue: currentVariant === "thinking" ? 1.05 : 1.025,
            duration: currentVariant === "thinking" ? 1800 : 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.85,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breatheAnim, {
            toValue: 0.98,
            duration: currentVariant === "thinking" ? 1800 : 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.45,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    floatLoop.start();
    breatheLoop.start();

    return () => {
      floatLoop.stop();
      breatheLoop.stop();
    };
  }, [floatAnim, breatheAnim, glowOpacity, currentVariant]);

  // 2. Natural Blinking (Active in Greeting, Working, Question)
  useEffect(() => {
    let blinkTimer: any;
    const triggerBlink = () => {
      Animated.sequence([
        Animated.timing(eyeBlink, {
          toValue: 0.1,
          duration: 90,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(eyeBlink, {
          toValue: 1,
          duration: 120,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        const nextBlinkDelay = 2600 + Math.random() * 3200;
        blinkTimer = setTimeout(triggerBlink, nextBlinkDelay);
      });
    };

    blinkTimer = setTimeout(triggerBlink, 2000);
    return () => clearTimeout(blinkTimer);
  }, [eyeBlink]);

  // 3. Variant-Specific Dedicated Animations
  useEffect(() => {
    // Reset specific anims
    bodyTilt.setValue(0);
    bodyShakeX.setValue(0);
    bodySquashX.setValue(1);
    bodySquashY.setValue(1);

    // GREETING: Orbiting Pearl Satellite
    if (currentVariant === "greeting") {
      const orbitLoop = Animated.loop(
        Animated.timing(orbitAngle, {
          toValue: 1,
          duration: 4200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      orbitLoop.start();
      return () => orbitLoop.stop();
    }

    // WORKING / SEARCHING: Eyes scan + Speech dots wave
    if (currentVariant === "working") {
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(eyeScanX, { toValue: 4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(300),
          Animated.timing(eyeScanX, { toValue: -4, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(300),
          Animated.timing(eyeScanX, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

      const makeWave = (val: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0, duration: 280, useNativeDriver: true }),
            Animated.delay(Math.max(0, 560 - delay)),
          ])
        );

      const dot1Loop = makeWave(chatDot1, 0);
      const dot2Loop = makeWave(chatDot2, 180);
      const dot3Loop = makeWave(chatDot3, 360);

      scanLoop.start();
      dot1Loop.start();
      dot2Loop.start();
      dot3Loop.start();

      return () => {
        scanLoop.stop();
        dot1Loop.stop();
        dot2Loop.stop();
        dot3Loop.stop();
        eyeScanX.setValue(0);
      };
    }

    // THINKING: Purple thought bubble dots + slow drift
    if (currentVariant === "thinking") {
      const makeThoughtWave = (val: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0.2, duration: 450, useNativeDriver: true }),
            Animated.delay(Math.max(0, 900 - delay)),
          ])
        );

      const dot1 = makeThoughtWave(chatDot1, 0);
      const dot2 = makeThoughtWave(chatDot2, 280);
      const dot3 = makeThoughtWave(chatDot3, 560);
      dot1.start();
      dot2.start();
      dot3.start();

      return () => {
        dot1.stop();
        dot2.stop();
        dot3.stop();
      };
    }

    // UPLOAD / SCANNING: Head slot opens, document card descends into mouth, swallows!
    if (currentVariant === "upload") {
      const runUploadSequence = () => {
        uploadCardY.setValue(-36);
        uploadCardOpacity.setValue(1);
        uploadSlotOpen.setValue(0);

        Animated.sequence([
          // 1. Slot opens
          Animated.timing(uploadSlotOpen, { toValue: 1, duration: 320, useNativeDriver: true }),
          // 2. Card drops down into slot
          Animated.timing(uploadCardY, { toValue: 26, duration: 850, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(uploadCardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(uploadSlotOpen, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]),
          // 3. Swallow bounce
          Animated.sequence([
            Animated.parallel([
              Animated.timing(bodySquashX, { toValue: 1.1, duration: 140, useNativeDriver: true }),
              Animated.timing(bodySquashY, { toValue: 0.9, duration: 140, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(bodySquashX, { toValue: 1, friction: 4, useNativeDriver: true }),
              Animated.spring(bodySquashY, { toValue: 1, friction: 4, useNativeDriver: true }),
            ]),
          ]),
          Animated.delay(1200),
        ]).start(({ finished }) => {
          if (finished && currentVariant === "upload") {
            runUploadSequence();
          }
        });
      };

      runUploadSequence();
      return () => {
        uploadCardY.stopAnimation();
        uploadSlotOpen.setValue(0);
      };
    }

    // SLAP: Quick squash & stretch recoil, sideways shake, angry eyes
    if (currentVariant === "slap") {
      triggerHeavyHaptic();
      Animated.sequence([
        // Impact squash
        Animated.parallel([
          Animated.timing(bodySquashX, { toValue: 1.28, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bodySquashY, { toValue: 0.68, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bodyShakeX, { toValue: -10, duration: 60, useNativeDriver: true }),
        ]),
        // Rapid oscillation
        Animated.timing(bodyShakeX, { toValue: 10, duration: 70, useNativeDriver: true }),
        Animated.timing(bodyShakeX, { toValue: -7, duration: 60, useNativeDriver: true }),
        Animated.timing(bodyShakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(bodyShakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
        // Elastic rebound
        Animated.parallel([
          Animated.spring(bodySquashX, { toValue: 1, friction: 3.5, tension: 120, useNativeDriver: true }),
          Animated.spring(bodySquashY, { toValue: 1, friction: 3.5, tension: 120, useNativeDriver: true }),
        ]),
      ]).start();
    }

    // DIZZY: Swirling eyes + circular drunken sway
    if (currentVariant === "dizzy") {
      const dizzyLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(dizzySpin, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(bodyTilt, { toValue: 14, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(bodyTilt, { toValue: -14, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bodyShakeX, { toValue: 8, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(bodyShakeX, { toValue: -8, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        ])
      );
      dizzyLoop.start();
      return () => {
        dizzyLoop.stop();
        bodyTilt.setValue(0);
        bodyShakeX.setValue(0);
      };
    }

    // QUESTION / ASKING: Inquisitive head tilt + pop question bubble
    if (currentVariant === "question") {
      Animated.parallel([
        Animated.spring(bodyTilt, { toValue: -8, friction: 4.5, tension: 90, useNativeDriver: true }),
        Animated.spring(questionPop, { toValue: 1, friction: 3.5, tension: 140, useNativeDriver: true }),
      ]).start();

      return () => {
        Animated.timing(bodyTilt, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        questionPop.setValue(0);
      };
    }

    // ERROR: Sad face + red alert beacon pulse
    if (currentVariant === "error") {
      triggerErrorHaptic();
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(alertPulse, { toValue: 1, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(alertPulse, { toValue: 0, duration: 450, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
      return () => {
        pulseLoop.stop();
        alertPulse.setValue(0);
      };
    }

    // FINISHED / SUCCESS: Joyful eyes + shooting star sparkles
    if (currentVariant === "finished") {
      triggerSuccessHaptic();
      const runSparkles = () => {
        sparkle1.setValue(0);
        sparkle2.setValue(0);
        sparkle3.setValue(0);

        Animated.stagger(220, [
          Animated.timing(sparkle1, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(sparkle2, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(sparkle3, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start(({ finished }) => {
          if (finished && currentVariant === "finished") {
            setTimeout(runSparkles, 400);
          }
        });
      };
      runSparkles();
      return () => {
        sparkle1.stopAnimation();
        sparkle2.stopAnimation();
        sparkle3.stopAnimation();
      };
    }

    // DANCE: Rhythmic bounce and groove
    if (currentVariant === "dance") {
      triggerLightHaptic();
      const danceLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(bodyTilt, { toValue: 12, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(danceBounce, { toValue: -14, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bodySquashX, { toValue: 0.94, duration: 260, useNativeDriver: true }),
            Animated.timing(bodySquashY, { toValue: 1.06, duration: 260, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(bodyTilt, { toValue: -12, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(danceBounce, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(bodySquashX, { toValue: 1.08, duration: 260, useNativeDriver: true }),
            Animated.timing(bodySquashY, { toValue: 0.92, duration: 260, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(bodyTilt, { toValue: -12, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(danceBounce, { toValue: -14, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bodySquashX, { toValue: 0.94, duration: 260, useNativeDriver: true }),
            Animated.timing(bodySquashY, { toValue: 1.06, duration: 260, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(bodyTilt, { toValue: 12, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(danceBounce, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(bodySquashX, { toValue: 1.08, duration: 260, useNativeDriver: true }),
            Animated.timing(bodySquashY, { toValue: 0.92, duration: 260, useNativeDriver: true }),
          ]),
        ])
      );
      danceLoop.start();
      return () => {
        danceLoop.stop();
        bodyTilt.setValue(0);
        danceBounce.setValue(0);
        bodySquashX.setValue(1);
        bodySquashY.setValue(1);
      };
    }
  }, [currentVariant]);

  // Handle Character Tap (Interactive Poke / Slap)
  const handleCharacterTap = () => {
    if (!interactive) {
      if (onPress) onPress();
      return;
    }

    triggerLightHaptic();

    // Temporarily trigger slap reaction
    setOverrideVariant("slap");
    if (onVariantChange) onVariantChange("slap");

    setTimeout(() => {
      // Revert to normal variant after slap reaction
      setOverrideVariant(null);
      if (onVariantChange) onVariantChange(canonicalFromProp);
      if (onPress) onPress();
    }, 900);
  };

  const handleSelectVariant = (target: CanonicalVariant) => {
    triggerLightHaptic();
    setOverrideVariant(target);
    if (onVariantChange) onVariantChange(target);
  };

  // Interpolations
  const floatY = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });

  const shadowScale = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [1.12, 0.88],
  });

  const shadowOpacity = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [0.65, 0.35],
  });

  const tiltDeg = bodyTilt.interpolate({
    inputRange: [-30, 30],
    outputRange: ["-30deg", "30deg"],
  });

  const orbitTranslateX = orbitAngle.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-65, 0, 65, 0, -65],
  });

  const orbitTranslateY = orbitAngle.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 18, 0, -18, 0],
  });

  const orbitScale = orbitAngle.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.75, 1.25, 0.75, 0.6, 0.75],
  });

  const orbitZ = orbitAngle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [10, -1, 10],
  });

  const dizzyRotate = dizzySpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Aspect ratio calculations
  const svgWidth = size;
  const svgHeight = size * 0.85;

  return (
    <View style={[styles.rootContainer, { width: "100%", alignItems: "center" }]}>
      {/* Optional Variant Tabs Header (Matches Video Exact 2-Row UI) */}
      {showSelector && (
        <View style={styles.selectorWrapper}>
          <View style={styles.selectorRow}>
            {CANONICAL_VARIANTS.slice(0, 5).map((item) => {
              const isActive = item.key === currentVariant;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleSelectVariant(item.key)}
                  activeOpacity={0.8}
                  style={[
                    styles.selectorPill,
                    isActive && { backgroundColor: item.color, borderColor: item.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      isActive && styles.selectorPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.selectorRow, { marginTop: 6 }]}>
            {CANONICAL_VARIANTS.slice(5).map((item) => {
              const isActive = item.key === currentVariant;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleSelectVariant(item.key)}
                  activeOpacity={0.8}
                  style={[
                    styles.selectorPill,
                    isActive && { backgroundColor: item.color, borderColor: item.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      isActive && styles.selectorPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Main Character Stage */}
      <View style={[styles.characterStage, { width: svgWidth, height: svgHeight + 30 }]}>
        {/* State Ambient Colored Backlight / Aura */}
        <Animated.View
          style={[
            styles.ambientAura,
            {
              width: svgWidth * 0.72,
              height: svgHeight * 0.72,
              borderRadius: (svgWidth * 0.72) / 2,
              backgroundColor: currentMeta.color,
              opacity: glowOpacity,
              transform: [{ scale: breatheAnim }],
            },
          ]}
        />

        {/* Dynamic Floor Shadow */}
        <Animated.View
          style={[
            styles.floorShadowWrapper,
            {
              bottom: 12,
              transform: [
                { scaleX: shadowScale },
                { scaleY: shadowScale },
                { scaleX: bodySquashX },
              ],
              opacity: shadowOpacity,
            },
          ]}
        >
          <Svg width={svgWidth * 0.65} height={20} viewBox="0 0 130 20">
            <Defs>
              <RadialGradient id="floorGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
                <Stop offset="50%" stopColor="#000000" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="65" cy="10" rx="60" ry="8" fill="url(#floorGrad)" />
          </Svg>
        </Animated.View>

        {/* Orbiting Satellite Pearl (Greeting / Welcoming State) */}
        {currentVariant === "greeting" && (
          <Animated.View
            style={[
              styles.orbitContainer,
              {
                transform: [
                  { translateX: orbitTranslateX },
                  { translateY: orbitTranslateY },
                  { scale: orbitScale },
                ],
              },
            ]}
          >
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Defs>
                <RadialGradient id="pearlGrad" cx="35%" cy="35%" rx="65%" ry="65%">
                  <Stop offset="0%" stopColor="#FFFFFF" />
                  <Stop offset="70%" stopColor="#E2E8F0" />
                  <Stop offset="100%" stopColor="#94A3B8" />
                </RadialGradient>
              </Defs>
              <Circle cx="9" cy="9" r="8" fill="url(#pearlGrad)" />
              <Circle cx="6.5" cy="6.5" r="2.5" fill="#FFFFFF" fillOpacity="0.9" />
            </Svg>
          </Animated.View>
        )}

        {/* Interactive Bouncing Marshmallow Character Body */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleCharacterTap}
          style={styles.touchArea}
        >
          <Animated.View
            style={[
              styles.characterTransformWrap,
              {
                transform: [
                  { translateY: Animated.add(floatY, danceBounce) },
                  { translateX: bodyShakeX },
                  { rotate: tiltDeg },
                  { scaleX: Animated.multiply(breatheAnim, bodySquashX) },
                  { scaleY: Animated.multiply(breatheAnim, bodySquashY) },
                ],
              },
            ]}
          >
            <Svg width={svgWidth} height={svgHeight} viewBox="0 0 200 160">
              <Defs>
                {/* 3D Porcelain Marshmallow Body Shading */}
                <LinearGradient id="marshmallowBody" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" />
                  <Stop offset="25%" stopColor="#F8FAFC" />
                  <Stop offset="80%" stopColor="#E2E8F0" />
                  <Stop offset="100%" stopColor="#CBD5E1" />
                </LinearGradient>

                {/* Soft Cheeks Gradient */}
                <RadialGradient id="cheekBlush" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop
                    offset="0%"
                    stopColor={currentVariant === "slap" ? "#F43F5E" : "#FB7185"}
                    stopOpacity={currentVariant === "slap" ? "0.9" : "0.65"}
                  />
                  <Stop
                    offset="100%"
                    stopColor={currentVariant === "slap" ? "#F43F5E" : "#FB7185"}
                    stopOpacity="0"
                  />
                </RadialGradient>

                {/* Speech Bubble Gradient */}
                <LinearGradient id="chatBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#0284C7" />
                  <Stop offset="100%" stopColor="#0369A1" />
                </LinearGradient>

                {/* Thought Bubble Gradient */}
                <LinearGradient id="thoughtBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#8B5CF6" />
                  <Stop offset="100%" stopColor="#6D28D9" />
                </LinearGradient>

                {/* Question Bubble Gradient */}
                <LinearGradient id="questionBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#06B6D4" />
                  <Stop offset="100%" stopColor="#0891B2" />
                </LinearGradient>

                {/* Glowing Beacon Bead Radial */}
                <RadialGradient id="redBeaconGrad" cx="35%" cy="35%" rx="65%" ry="65%">
                  <Stop offset="0%" stopColor="#FCA5A5" />
                  <Stop offset="45%" stopColor="#EF4444" />
                  <Stop offset="100%" stopColor="#991B1B" />
                </RadialGradient>

                <RadialGradient id="greenBeaconGrad" cx="35%" cy="35%" rx="65%" ry="65%">
                  <Stop offset="0%" stopColor="#86EFAC" />
                  <Stop offset="45%" stopColor="#10B981" />
                  <Stop offset="100%" stopColor="#065F46" />
                </RadialGradient>
              </Defs>

              {/* Character Main Squircle Marshmallow Body */}
              <Rect
                x="36"
                y="34"
                width="128"
                height="92"
                rx="46"
                ry="44"
                fill="url(#marshmallowBody)"
                stroke="#F1F5F9"
                strokeWidth="1.2"
              />

              {/* Top Specular 3D Gloss Sheen */}
              <Ellipse
                cx="100"
                cy="44"
                rx="44"
                ry="10"
                fill="#FFFFFF"
                fillOpacity="0.85"
              />

              {/* Bottom Subtle Ambient Occlusion Rim */}
              <Path
                d="M 52 112 Q 100 126 148 112"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.7"
                fill="none"
              />

              {/* Cheeks Blush (Active in most friendly states) */}
              {currentVariant !== "error" && (
                <>
                  <Ellipse
                    cx="56"
                    cy="86"
                    rx={currentVariant === "dizzy" ? "12" : "9"}
                    ry="6"
                    fill="url(#cheekBlush)"
                  />
                  <Ellipse
                    cx="144"
                    cy="86"
                    rx={currentVariant === "dizzy" ? "12" : "9"}
                    ry="6"
                    fill="url(#cheekBlush)"
                  />
                </>
              )}

              {/* FACIAL EXPRESSIONS */}

              {/* 1. Greeting / Finished / Dance: Joyful smiling arcs ^  ^ */}
              {(currentVariant === "greeting" ||
                currentVariant === "finished" ||
                currentVariant === "dance") && (
                <G>
                  <Path
                    d="M 64 76 Q 74 61 84 76"
                    stroke="#0F172A"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Path
                    d="M 116 76 Q 126 61 136 76"
                    stroke="#0F172A"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </G>
              )}

              {/* 2. Working / Searching / Upload: Focused eyes with scanning animation */}
              {(currentVariant === "working" || currentVariant === "upload") && (
                <G>
                  {/* Left Eye */}
                  <Ellipse
                    cx="74"
                    cy="72"
                    rx="5"
                    ry="7.5"
                    fill="#0F172A"
                  />
                  {/* Right Eye */}
                  <Ellipse
                    cx="126"
                    cy="72"
                    rx="5"
                    ry="7.5"
                    fill="#0F172A"
                  />
                </G>
              )}

              {/* 3. Thinking / Error: Closed resting dashes -  - */}
              {(currentVariant === "thinking" || currentVariant === "error") && (
                <G>
                  <Path
                    d="M 66 74 L 82 74"
                    stroke="#0F172A"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M 118 74 L 134 74"
                    stroke="#0F172A"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </G>
              )}

              {/* 4. Slap: Angered squinted recoil lines \  / */}
              {currentVariant === "slap" && (
                <G>
                  <Path
                    d="M 65 67 L 82 77"
                    stroke="#0F172A"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M 135 67 L 118 77"
                    stroke="#0F172A"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                  />
                </G>
              )}

              {/* 5. Dizzy: Spiraling dizzy eyes @  @ */}
              {currentVariant === "dizzy" && (
                <G>
                  {/* Left Eye Spiral */}
                  <Path
                    d="M 74 72 A 3 3 0 1 0 77 72 A 6 6 0 1 0 71 72 A 9 9 0 0 0 80 72"
                    stroke="#0F172A"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Right Eye Spiral */}
                  <Path
                    d="M 126 72 A 3 3 0 1 0 129 72 A 6 6 0 1 0 123 72 A 9 9 0 0 0 132 72"
                    stroke="#0F172A"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </G>
              )}

              {/* 6. Question: Inquisitive glance •  • with one eye tilted */}
              {currentVariant === "question" && (
                <G>
                  {/* Left Eye: Slightly wide curious circle */}
                  <Circle cx="73" cy="72" r="6.5" fill="#0F172A" />
                  {/* Right Eye: Raised inquisitive oval */}
                  <Ellipse cx="127" cy="69" rx="6" ry="7.5" fill="#0F172A" />
                </G>
              )}

              {/* ACCESSORIES & STATE BADGES */}

              {/* Upload Slot Lid on Head */}
              {currentVariant === "upload" && (
                <G>
                  <Rect
                    x="72"
                    y="31"
                    width="56"
                    height="9"
                    rx="4.5"
                    fill="#1E293B"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />
                </G>
              )}

              {/* Error Red Pulsing Alert Bead */}
              {currentVariant === "error" && (
                <G>
                  <Circle cx="48" cy="40" r="11" fill="#EF4444" fillOpacity="0.3" />
                  <Circle cx="48" cy="40" r="7.5" fill="url(#redBeaconGrad)" />
                  <Circle cx="46" cy="38" r="2" fill="#FFFFFF" fillOpacity="0.9" />
                </G>
              )}

              {/* Finished Green Success Bead */}
              {currentVariant === "finished" && (
                <G>
                  <Circle cx="48" cy="40" r="11" fill="#10B981" fillOpacity="0.35" />
                  <Circle cx="48" cy="40" r="7.5" fill="url(#greenBeaconGrad)" />
                  <Circle cx="46" cy="38" r="2" fill="#FFFFFF" fillOpacity="0.9" />
                </G>
              )}

              {/* Working Speech Bubble (Top Left) */}
              {currentVariant === "working" && (
                <G transform="translate(24, 14)">
                  <Rect
                    x="0"
                    y="0"
                    width="44"
                    height="24"
                    rx="12"
                    fill="url(#chatBubbleGrad)"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                  />
                  {/* Animated Wave Dots */}
                  <Circle cx="14" cy="12" r="2.8" fill="#FFFFFF" />
                  <Circle cx="22" cy="12" r="2.8" fill="#FFFFFF" />
                  <Circle cx="30" cy="12" r="2.8" fill="#FFFFFF" />
                </G>
              )}

              {/* Thinking Thought Bubble (Top Left) */}
              {currentVariant === "thinking" && (
                <G transform="translate(24, 14)">
                  <Rect
                    x="0"
                    y="0"
                    width="44"
                    height="24"
                    rx="12"
                    fill="url(#thoughtBubbleGrad)"
                    stroke="#C084FC"
                    strokeWidth="1.2"
                  />
                  <Circle cx="14" cy="12" r="2.6" fill="#EDE9FE" />
                  <Circle cx="22" cy="12" r="2.6" fill="#EDE9FE" />
                  <Circle cx="30" cy="12" r="2.6" fill="#EDE9FE" />
                </G>
              )}

              {/* Question Cyan Bubble (Top Left) */}
              {currentVariant === "question" && (
                <G transform="translate(30, 10)">
                  <Circle
                    cx="14"
                    cy="14"
                    r="14"
                    fill="url(#questionBubbleGrad)"
                    stroke="#67E8F9"
                    strokeWidth="1.5"
                  />
                  {/* Question Mark Path */}
                  <Path
                    d="M 11 10 C 11 7.5 17 7.5 17 11 C 17 13 14 13.5 14 16"
                    stroke="#FFFFFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Circle cx="14" cy="19.5" r="1.5" fill="#FFFFFF" />
                </G>
              )}
            </Svg>

            {/* Dropping Document / Ticket Card for Upload variant */}
            {currentVariant === "upload" && (
              <Animated.View
                style={[
                  styles.uploadCardContainer,
                  {
                    transform: [{ translateY: uploadCardY }],
                    opacity: uploadCardOpacity,
                  },
                ]}
              >
                <Svg width={24} height={30} viewBox="0 0 24 30">
                  <Rect
                    x="1"
                    y="1"
                    width="22"
                    height="28"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                  {/* Ticket Header & Mini Barcode Lines */}
                  <Rect x="4" y="5" width="16" height="4" rx="1.5" fill="#EF4444" />
                  <Rect x="4" y="12" width="16" height="1.8" rx="0.9" fill="#94A3B8" />
                  <Rect x="4" y="16" width="12" height="1.8" rx="0.9" fill="#94A3B8" />
                  <Rect x="4" y="20" width="8" height="1.8" rx="0.9" fill="#94A3B8" />
                  <Circle cx="18" cy="21" r="2" fill="#10B981" />
                </Svg>
              </Animated.View>
            )}

            {/* Shooting Star Sparkles for Finished State */}
            {currentVariant === "finished" && (
              <>
                <Animated.View
                  style={[
                    styles.sparkleWrap,
                    {
                      left: 78,
                      top: 10,
                      opacity: sparkle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
                      transform: [
                        { translateY: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [15, -35] }) },
                        { scale: sparkle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.2, 0.8] }) },
                      ],
                    },
                  ]}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Path
                      d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
                      fill="#FBBF24"
                    />
                  </Svg>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.sparkleWrap,
                    {
                      left: 106,
                      top: 18,
                      opacity: sparkle2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
                      transform: [
                        { translateY: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [15, -42] }) },
                        { scale: sparkle2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.6] }) },
                      ],
                    },
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path
                      d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
                      fill="#38BDF8"
                    />
                  </Svg>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.sparkleWrap,
                    {
                      left: 54,
                      top: 22,
                      opacity: sparkle3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
                      transform: [
                        { translateY: sparkle3.interpolate({ inputRange: [0, 1], outputRange: [10, -28] }) },
                        { scale: sparkle3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.1, 0.7] }) },
                      ],
                    },
                  ]}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24">
                    <Path
                      d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </Animated.View>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Video-Accurate Bottom Animation Counter (Optional) */}
      {showCounter && (
        <View style={styles.counterSection}>
          <Text style={styles.counterTitle}>Animation</Text>
          <View style={styles.counterBox}>
            <Text style={styles.counterDigits}>{currentMeta.index}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  selectorWrapper: {
    width: "100%",
    maxWidth: 380,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  selectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    flexWrap: "nowrap",
  },
  selectorPill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectorPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
  },
  selectorPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  characterStage: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientAura: {
    position: "absolute",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 36,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  floorShadowWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  touchArea: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  characterTransformWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  orbitContainer: {
    position: "absolute",
    top: "38%",
    left: "50%",
    marginLeft: -9,
    marginTop: -9,
    zIndex: 15,
  },
  uploadCardContainer: {
    position: "absolute",
    top: 24,
    left: "50%",
    marginLeft: -12,
    zIndex: 8,
  },
  sparkleWrap: {
    position: "absolute",
    zIndex: 20,
  },
  counterSection: {
    alignItems: "center",
    marginTop: 12,
  },
  counterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  counterBox: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  counterDigits: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 28,
    fontWeight: "800",
    color: "#4ADE80",
    letterSpacing: 3,
  },
});
