import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, DimensionValue } from "react-native";

interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function ShimmerSkeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: ShimmerSkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function DrawCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.rowBetween}>
        <ShimmerSkeleton width={130} height={18} borderRadius={6} />
        <ShimmerSkeleton width={70} height={22} borderRadius={11} />
      </View>
      <View style={{ height: 10 }} />
      <ShimmerSkeleton width={180} height={12} borderRadius={4} />
      <View style={{ height: 14 }} />
      <ShimmerSkeleton width="100%" height={56} borderRadius={14} />
      <View style={{ height: 12 }} />
      <View style={styles.rowBetween}>
        <ShimmerSkeleton width={90} height={12} borderRadius={4} />
        <ShimmerSkeleton width={80} height={28} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E2E8F0",
  },
  cardSkeleton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
