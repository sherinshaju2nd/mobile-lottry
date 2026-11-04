import React, { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Wallet } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { LimitState, getLimitStatus, loadPlayEntries, loadPlaySettings, monthOf, summarizeMonth } from "../utils/playSmart";
import { getSafeTodayISTDate } from "../utils/formatters";
import { triggerLightHaptic } from "../utils/haptics";

/**
 * Top-bar shortcut to Play Smart (spending tracker). Shows an amber dot when close to the
 * monthly limit and a red dot when it has been reached.
 */
export default function PlaySmartHeaderButton({ isMl }: { isMl: boolean }) {
  const navigation = useNavigation<any>();
  const [limitState, setLimitState] = useState<LimitState>("none");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadPlayEntries(), loadPlaySettings()])
        .then(([entries, settings]) => {
          if (!active) return;
          const month = summarizeMonth(entries, monthOf(getSafeTodayISTDate()));
          setLimitState(getLimitStatus(month.spent, settings.monthlyLimit, settings.warnAtPercent).state);
        })
        .catch((err: unknown) =>
          console.warn("[play-smart] Header status unavailable:", err instanceof Error ? err.message : String(err)),
        );
      return () => {
        active = false;
      };
    }, []),
  );

  const dotColor = limitState === "reached" ? "#DC2626" : limitState === "near" ? "#F59E0B" : null;

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => {
        triggerLightHaptic();
        navigation.navigate("PlaySmart");
      }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        isMl
          ? "പ്ലേ സ്മാർട്ട്: ചെലവ് ട്രാക്കർ"
          : `Play Smart spending tracker${limitState === "reached" ? ", monthly limit reached" : limitState === "near" ? ", close to monthly limit" : ""}`
      }
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <Wallet size={17} color={COLORS.primary} strokeWidth={2.3} />
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});
