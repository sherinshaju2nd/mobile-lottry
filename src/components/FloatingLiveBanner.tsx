import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { Radio, ChevronRight, Trophy, X } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { triggerLightHaptic } from "../utils/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloatingLiveBannerProps {
  visible: boolean;
  lotteryName: string;
  lotteryCode?: string;
  drawDate?: string;
  firstPrizeTicket?: string;
  onPress: () => void;
  onDismiss?: () => void;
}

export default function FloatingLiveBanner({
  visible,
  lotteryName,
  lotteryCode,
  drawDate,
  firstPrizeTicket,
  onPress,
  onDismiss,
}: FloatingLiveBannerProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Pulsing live dot
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    } else {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, pulseAnim]);

  if (!visible) return null;

  const topOffset = Math.max(insets.top, Platform.OS === "android" ? 10 : 12);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topOffset,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        activeOpacity={0.9}
        onPress={() => {
          triggerLightHaptic();
          onPress();
        }}
      >
        <View style={styles.liveIndicator}>
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={styles.liveDot} />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text style={styles.liveTag}>LIVE DRAW</Text>
            <Text style={styles.lotteryTitle} numberOfLines={1}>
              {lotteryName || "Kerala Lottery"}
            </Text>
          </View>
          <Text style={styles.subText} numberOfLines={1}>
            {firstPrizeTicket && firstPrizeTicket !== "N/A"
              ? `🏆 1st Prize Winner: ${firstPrizeTicket}`
              : "Results streaming live from Gorky Bhavan..."}
          </Text>
        </View>

        <View style={styles.actionCol}>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>VIEW</Text>
            <ChevronRight size={12} color="#FFFFFF" />
          </View>
        </View>

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 9999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  liveIndicator: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  pulseRing: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(239, 68, 68, 0.4)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  contentCol: {
    flex: 1,
    paddingRight: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveTag: {
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  lotteryTitle: {
    color: "#F8FAFC",
    fontSize: 12.5,
    fontWeight: "800",
    flex: 1,
  },
  subText: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 1,
  },
  actionCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
