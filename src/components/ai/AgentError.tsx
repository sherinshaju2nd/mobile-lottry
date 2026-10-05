import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { AlertCircle, RotateCcw, WifiOff, X } from "lucide-react-native";
import { AgentLanguage } from "../../types/aiAgent";
import { triggerLightHaptic } from "../../utils/haptics";

interface AgentErrorProps {
  message?: string | null;
  isOffline?: boolean;
  language?: AgentLanguage;
  onRetry: () => void;
  onDismiss: () => void;
}

export default function AgentError({
  message,
  isOffline = false,
  language = "ml",
  onRetry,
  onDismiss,
}: AgentErrorProps) {
  const isMl = language === "ml";

  const defaultMsg = isOffline
    ? isMl
      ? "ഇന്റർനെറ്റ് കണക്ഷൻ ലഭ്യമല്ല. ദയവായി കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക."
      : "No internet connection. Please check your connection and try again."
    : isMl
    ? "ക്ഷമിക്കണം, ആ വിവരങ്ങൾ ഇപ്പോൾ ലഭ്യമാക്കാൻ സാധിച്ചില്ല."
    : "Sorry, I couldn't retrieve that information.";

  const displayMessage = message || defaultMsg;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          {isOffline ? (
            <WifiOff size={22} color="#EF4444" />
          ) : (
            <AlertCircle size={22} color="#EF4444" />
          )}
        </View>

        <Text style={styles.errorTitle}>
          {isOffline
            ? isMl
              ? "ഇന്റർനെറ്റ് ലഭ്യമല്ല"
              : "No Internet Connection"
            : isMl
            ? "തടസ്സം നേരിട്ടു"
            : "Something Went Wrong"}
        </Text>

        <Text style={styles.errorMessage}>{displayMessage}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              triggerLightHaptic();
              onRetry();
            }}
            activeOpacity={0.8}
          >
            <RotateCcw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>
              {isMl ? "വീണ്ടും ശ്രമിക്കുക" : "Try again"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => {
              triggerLightHaptic();
              onDismiss();
            }}
            activeOpacity={0.7}
          >
            <X size={15} color="#94A3B8" style={{ marginRight: 4 }} />
            <Text style={styles.dismissBtnText}>
              {isMl ? "റദ്ദാക്കുക" : "Dismiss"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F87171",
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13.5,
    color: "#CBD5E1",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  retryBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dismissBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
