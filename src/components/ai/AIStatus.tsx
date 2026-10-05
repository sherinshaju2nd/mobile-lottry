import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text, Animated } from "react-native";
import { AgentState, AgentLanguage } from "../../types/aiAgent";

interface AIStatusProps {
  state: AgentState;
  language?: AgentLanguage;
  customMessage?: string | null;
  secondaryMessage?: string | null;
}

export default function AIStatus({
  state,
  language = "en",
  customMessage,
  secondaryMessage,
}: AIStatusProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0.4);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [state, customMessage, fadeAnim]);

  const isMl = language === "ml";

  const getStatusText = (): { primary: string; secondary?: string } => {
    if (customMessage) {
      return { primary: customMessage, secondary: secondaryMessage || undefined };
    }

    switch (state) {
      case "greeting":
        return {
          primary: isMl ? "നമസ്കാരം! 👋" : "Hi! 👋",
          secondary: isMl ? "എന്തുസഹായം വേണം?" : "How can I help you today?",
        };
      case "listening":
        return {
          primary: isMl ? "കേൾക്കുന്നു..." : "Listening...",
        };
      case "transcribing":
        return {
          primary: isMl ? "മനസ്സിലാക്കുന്നു..." : "Understanding...",
          secondary: isMl ? "ശബ്ദം പരിശോധിക്കുന്നു..." : "Processing audio...",
        };
      case "thinking":
        return {
          primary: isMl ? "ചിന്തിക്കുന്നു..." : "Thinking...",
          secondary: isMl ? "ചോദ്യം മനസ്സിലാക്കുന്നു..." : "Let me understand that...",
        };
      case "searching":
        return {
          primary: isMl ? "ഡാറ്റാബേസ് പരിശോധിക്കുന്നു..." : "Checking database...",
          secondary: isMl
            ? "ഏറ്റവും പുതിയ വിവരങ്ങൾ കണ്ടെത്തുന്നു..."
            : "Searching for the latest information...",
        };
      case "processing":
        return {
          primary: isMl ? "മറുപടി തയ്യാറാക്കുന്നു..." : "Preparing response...",
          secondary: isMl ? "വിവരങ്ങൾ ക്രമീകരിക്കുന്നു..." : "Structuring verified data...",
        };
      case "speaking":
        return {
          primary: isMl ? "സംസാരിക്കുന്നു..." : "Speaking...",
        };
      case "success":
        return {
          primary: isMl ? "പൂർത്തിയായി! ✨" : "Done! ✨",
          secondary: isMl ? "മറ്റെന്തെങ്കിലും സഹായം വേണമോ?" : "Anything else I can help with?",
        };
      case "error":
        return {
          primary: isMl ? "ക്ഷമിക്കണം" : "Sorry",
          secondary: isMl
            ? "ആ വിവരങ്ങൾ ഇപ്പോൾ ലഭ്യമാക്കാൻ സാധിച്ചില്ല."
            : "I couldn't retrieve that information right now.",
        };
      case "idle":
      default:
        return {
          primary: isMl ? "നമസ്കാരം! 👋" : "Hi! 👋",
          secondary: isMl ? "എന്തുസഹായം വേണം?" : "How can I help you today?",
        };
    }
  };

  const { primary, secondary } = getStatusText();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.primaryText}>{primary}</Text>
      {secondary ? <Text style={styles.secondaryText}>{secondary}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  primaryText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  secondaryText: {
    fontSize: 14.5,
    fontWeight: "500",
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 5,
  },
});
