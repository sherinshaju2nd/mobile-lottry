import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Radio, ChevronRight, Clock } from "lucide-react-native";
import { useLanguage } from "../context/LanguageContext";
import { triggerLightHaptic } from "../utils/haptics";

interface LiveDrawBannerProps {
  lotteryName?: string;
  onPress?: () => void;
  style?: any;
}

export default function LiveDrawBanner({
  lotteryName,
  onPress,
  style,
}: LiveDrawBannerProps) {
  const { language } = useLanguage();
  const isMl = language === "ml";
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isLiveWindow, setIsLiveWindow] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("");

  useEffect(() => {
    const checkLiveStatus = () => {
      // Current IST time
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utcTime + 3600000 * 5.5);
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const totalMinutes = hours * 60 + minutes;

      // 2:55 PM (14:55 = 895 min) to 3:45 PM (15:45 = 945 min)
      if (totalMinutes >= 895 && totalMinutes <= 945) {
        setIsLiveWindow(true);
        if (totalMinutes < 900) {
          const remMin = 900 - totalMinutes;
          setStatusText(
            isMl
              ? `നറുക്കെടുപ്പ് ${remMin} മിനിറ്റിൽ ആരംഭിക്കും`
              : `Draw starts in ${remMin} min`
          );
        } else {
          setStatusText(
            isMl
              ? "ഗോർക്കി ഭവനിൽ ലൈവ് നറുക്കെടുപ്പ് നടക്കുന്നു"
              : "Live Draw in Progress at Gorky Bhavan"
          );
        }
      } else {
        setIsLiveWindow(false);
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 15000);
    return () => clearInterval(interval);
  }, [isMl]);

  useEffect(() => {
    if (!isLiveWindow) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isLiveWindow]);

  if (!isLiveWindow) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.container, style]}
      onPress={() => {
        triggerLightHaptic();
        onPress?.();
      }}
    >
      <View style={styles.leftRow}>
        <View style={styles.liveDotWrap}>
          <Animated.View
            style={[styles.liveDot, { opacity: pulseAnim }]}
          />
          <Radio size={15} color="#FFFFFF" />
        </View>
        <View style={styles.textWrap}>
          <View style={styles.badgeRow}>
            <Text style={styles.liveTitle}>
              {isMl ? "🔴 ലൈവ് നറുക്കെടുപ്പ് 3:00 PM" : "🔴 LIVE DRAW 3:00 PM"}
            </Text>
            {lotteryName && (
              <Text style={styles.lotteryName} numberOfLines={1}>
                • {lotteryName}
              </Text>
            )}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {statusText}
          </Text>
        </View>
      </View>

      <View style={styles.rightAction}>
        <Text style={styles.watchLiveText}>
          {isMl ? "കാണുക" : "View"}
        </Text>
        <ChevronRight size={14} color="#FDE047" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  liveDotWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  liveDot: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  textWrap: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12.5,
    letterSpacing: 0.3,
  },
  lotteryName: {
    color: "#FDE047",
    fontWeight: "800",
    fontSize: 12,
    flex: 1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  rightAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  watchLiveText: {
    color: "#FDE047",
    fontWeight: "900",
    fontSize: 11.5,
  },
});
