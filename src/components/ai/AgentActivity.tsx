import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { AgentState, AgentLanguage } from "../../types/aiAgent";

interface AgentActivityProps {
  state: AgentState;
  language?: AgentLanguage;
}

export default function AgentActivity({
  state,
  language = "en",
}: AgentActivityProps) {
  const isExecuting = [
    "transcribing",
    "thinking",
    "searching",
    "processing",
  ].includes(state);

  if (!isExecuting) return null;

  const isMl = language === "ml";

  // Dynamic step statuses based on active real state
  // State: thinking -> Step 1 done, Step 2 active
  // State: searching -> Step 1 done, Step 2 done, Step 3 active
  // State: processing -> Step 1, 2, 3 done, Step 4 active
  const steps = [
    {
      id: "1",
      label: isMl ? "ചോദ്യം മനസ്സിലാക്കുന്നു" : "Understanding",
      status: "completed",
    },
    {
      id: "2",
      label:
        state === "thinking"
          ? isMl
            ? "തിരയാൻ തയ്യാറെടുക്കുന്നു"
            : "Preparing to search"
          : isMl
          ? "ഡാറ്റാബേസ് പരിശോധിക്കുന്നു"
          : "Searching database",
      status: state === "thinking" ? "active" : "completed",
    },
    {
      id: "3",
      label:
        state === "processing"
          ? isMl
            ? "വിവരങ്ങൾ ക്രമീകരിക്കുന്നു"
            : "Processing results"
          : isMl
          ? "ഡാറ്റ പരിശോധന"
          : "Checking database",
      status:
        state === "searching"
          ? "active"
          : state === "processing"
          ? "completed"
          : "pending",
    },
    {
      id: "4",
      label: isMl ? "മറുപടി തയ്യാറാക്കുന്നു" : "Preparing response",
      status: state === "processing" ? "active" : "pending",
    },
  ];

  return (
    <View style={styles.card}>
      {steps.map((step) => {
        const isDone = step.status === "completed";
        const isActive = step.status === "active";

        return (
          <View key={step.id} style={styles.stepRow}>
            {isDone ? (
              <CheckCircle2 size={18} color="#34D399" />
            ) : isActive ? (
              <View style={styles.activeDotContainer}>
                <View style={styles.activeDot} />
              </View>
            ) : (
              <Circle size={16} color="#475569" strokeWidth={1.8} />
            )}

            <Text
              style={[
                styles.stepText,
                isDone && styles.stepTextDone,
                isActive && styles.stepTextActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(14, 22, 44, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.16)",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginHorizontal: 24,
    marginVertical: 14,
    gap: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeDotContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#38BDF8",
  },
  stepText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  stepTextDone: {
    color: "#E2E8F0",
    fontWeight: "600",
  },
  stepTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
