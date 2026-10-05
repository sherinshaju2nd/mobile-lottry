import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { AgentLanguage, AgentState } from "../../types/aiAgent";
import { QUICK_ACTIONS } from "../../constants/aiAssets";
import { triggerLightHaptic } from "../../utils/haptics";

interface QuickActionsProps {
  state: AgentState;
  language: AgentLanguage;
  onSelectAction: (query: string) => void;
}

export default function QuickActions({
  state,
  language,
  onSelectAction,
}: QuickActionsProps) {
  // Input lock guard
  const isLocked = [
    "transcribing",
    "thinking",
    "searching",
    "processing",
    "speaking",
  ].includes(state);

  const handlePress = (item: (typeof QUICK_ACTIONS)[0]) => {
    if (isLocked) return;
    triggerLightHaptic();
    const query = language === "ml" ? item.queryMl : item.queryEn;
    onSelectAction(query);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((item) => {
          const label = language === "ml" ? item.labelMl : item.labelEn;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, isLocked && styles.chipDisabled]}
              onPress={() => handlePress(item)}
              activeOpacity={0.78}
              disabled={isLocked}
            >
              <Text style={[styles.chipText, isLocked && styles.chipTextDisabled]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginVertical: 14,
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  chip: {
    width: "48%",
    backgroundColor: "rgba(20, 32, 58, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.22)",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chipDisabled: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    borderColor: "rgba(71, 85, 105, 0.18)",
    opacity: 0.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E2E8F0",
    textAlign: "center",
  },
  chipTextDisabled: {
    color: "#64748B",
  },
});
