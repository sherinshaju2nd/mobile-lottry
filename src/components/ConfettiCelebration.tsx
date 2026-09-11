import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Text,
  TouchableOpacity,
} from "react-native";
import { Sparkles, Trophy, X } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { triggerSuccessHaptic } from "../utils/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#F59E0B", // Gold
  "#10B981", // Emerald
  "#3B82F6", // Royal Blue
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#EF4444", // Ruby
  "#FCD34D", // Light Gold
];

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: "rect" | "circle";
}

interface ConfettiCelebrationProps {
  visible: boolean;
  onDismiss: () => void;
  prizeTier?: string;
  prizeAmount?: string;
  ticketNumber?: string;
  autoDismissMs?: number;
}

export default function ConfettiCelebration({
  visible,
  onDismiss,
  prizeTier = "Winning Prize",
  prizeAmount,
  ticketNumber,
  autoDismissMs = 4500,
}: ConfettiCelebrationProps) {
  const particles = useRef<Particle[]>([]);
  const scaleCard = useRef(new Animated.Value(0.3)).current;
  const opacityCard = useRef(new Animated.Value(0)).current;

  if (particles.current.length === 0) {
    particles.current = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-20),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.6 + 0.7),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 6,
      shape: i % 2 === 0 ? "rect" : "circle",
    }));
  }

  useEffect(() => {
    if (visible) {
      triggerSuccessHaptic();

      // Animate win card bounce
      scaleCard.setValue(0.3);
      opacityCard.setValue(0);
      Animated.parallel([
        Animated.spring(scaleCard, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityCard, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Launch particles
      particles.current.forEach((p, idx) => {
        const startX = Math.random() * SCREEN_WIDTH;
        const endX = startX + (Math.random() * 120 - 60);
        const endY = SCREEN_HEIGHT + 40;
        const duration = 2200 + Math.random() * 1800;
        const delay = (idx % 10) * 80;

        p.x.setValue(startX);
        p.y.setValue(-20);
        p.opacity.setValue(1);
        p.rotation.setValue(0);

        Animated.parallel([
          Animated.timing(p.y, {
            toValue: endY,
            duration,
            delay,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: endX,
            duration,
            delay,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotation, {
            toValue: Math.random() * 720 - 360,
            duration,
            delay,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration * 0.7),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });

      // Auto dismiss timer
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissMs, onDismiss]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Confetti Particles Layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.current.map((p) => {
            const rotateStr = p.rotation.interpolate({
              inputRange: [-360, 360],
              outputRange: ["-360deg", "360deg"],
            });

            return (
              <Animated.View
                key={p.id}
                style={[
                  styles.particle,
                  {
                    width: p.size,
                    height: p.shape === "rect" ? p.size * 1.6 : p.size,
                    borderRadius: p.shape === "circle" ? p.size / 2 : 2,
                    backgroundColor: p.color,
                    transform: [
                      { translateX: p.x },
                      { translateY: p.y },
                      { rotate: rotateStr },
                      { scale: p.scale },
                    ],
                    opacity: p.opacity,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Celebration Pop Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ scale: scaleCard }],
              opacity: opacityCard,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <X size={18} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.trophyGlow}>
            <Trophy size={42} color="#D97706" />
          </View>

          <View style={styles.badgeRow}>
            <Sparkles size={14} color="#D97706" />
            <Text style={styles.badgeText}>PRIZE MATCHED!</Text>
            <Sparkles size={14} color="#D97706" />
          </View>

          <Text style={styles.prizeTier}>{prizeTier}</Text>

          {prizeAmount ? (
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>WINNING AMOUNT</Text>
              <Text style={styles.amountText}>{prizeAmount}</Text>
            </View>
          ) : null}

          {ticketNumber ? (
            <Text style={styles.ticketText}>Ticket No: {ticketNumber}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDismiss}
            activeOpacity={0.88}
          >
            <Text style={styles.actionButtonText}>🎉 AWESOME!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  particle: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    borderWidth: 2,
    borderColor: "#FDE68A",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  trophyGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FCD34D",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#B45309",
    letterSpacing: 0.5,
  },
  prizeTier: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  amountBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  amountLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 0.5,
  },
  amountText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#166534",
  },
  ticketText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
