import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { Bell, ChevronRight, X } from "lucide-react-native";
import { COLORS } from "../constants/colors";

interface InAppNotificationToastProps {
  visible: boolean;
  title: string;
  body: string;
  onPress: () => void;
  onDismiss: () => void;
}

export default function InAppNotificationToast({
  visible,
  title,
  body,
  onPress,
  onDismiss,
}: InAppNotificationToastProps) {
  const slideAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: Platform.OS === "android" ? 40 : 54,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 6000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.inner}
        onPress={() => {
          handleClose();
          onPress();
        }}
      >
        <View style={styles.iconCircle}>
          <Bell size={18} color={COLORS.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" style={styles.chevron} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={handleClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={14} color="#94A3B8" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 14,
    right: 14,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 6,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  body: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 16,
  },
  chevron: {
    marginLeft: 4,
    marginRight: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
