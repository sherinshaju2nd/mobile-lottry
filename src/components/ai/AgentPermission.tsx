import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { Mic, ShieldCheck } from "lucide-react-native";
import { AgentLanguage } from "../../types/aiAgent";
import { triggerLightHaptic } from "../../utils/haptics";

interface AgentPermissionProps {
  language?: AgentLanguage;
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export default function AgentPermission({
  language = "ml",
  onRequestPermission,
  onDismiss,
}: AgentPermissionProps) {
  const isMl = language === "ml";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Mic size={24} color="#38BDF8" />
        </View>

        <Text style={styles.title}>
          {isMl
            ? "മൈക്രോഫോൺ അനുമതി ആവശ്യമാണ്"
            : "Microphone permission required"}
        </Text>

        <Text style={styles.body}>
          {isMl
            ? "AI അസിസ്റ്റന്റുമായി സംസാരിക്കുന്നതിനായി ദയവായി മൈക്രോഫോൺ അനുമതി നൽകുക."
            : "To talk with your AI assistant,\nplease allow microphone access."}
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              triggerLightHaptic();
              onRequestPermission();
            }}
            activeOpacity={0.82}
          >
            <ShieldCheck size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>
              {isMl ? "അനുമതി നൽകുക" : "Allow microphone"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              triggerLightHaptic();
              onDismiss();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>
              {isMl ? "ഇപ്പോൾ വേണ്ട" : "Not now"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    marginVertical: 12,
  },
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#38BDF8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 16.5,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },
  body: {
    fontSize: 13.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
