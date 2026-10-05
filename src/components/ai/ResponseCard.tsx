import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Copy, Check, ChevronDown, ChevronUp, Award, Calendar, Clock } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { AgentMessage, AgentLanguage } from "../../types/aiAgent";
import { triggerSuccessHaptic } from "../../utils/haptics";

interface ResponseCardProps {
  message: AgentMessage;
  language?: AgentLanguage;
}

export default function ResponseCard({
  message,
  language = "ml",
}: ResponseCardProps) {
  const [copied, setCopied] = useState(false);
  const [expandedPrizes, setExpandedPrizes] = useState(false);

  const cardData = message.cardData;
  const verified = message.verifiedData;

  const handleCopy = async () => {
    const textToCopy = message.text || cardData?.title || "";
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
    triggerSuccessHaptic();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Badge & Copy Button */}
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {cardData?.badgeText || (language === "ml" ? "ഔദ്യോഗിക ഫലം" : "VERIFIED RESULT")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCopy}
          style={styles.copyBtn}
          activeOpacity={0.7}
        >
          {copied ? (
            <Check size={16} color="#34D399" />
          ) : (
            <Copy size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Card Title & Subtitle */}
      {cardData?.title ? (
        <Text style={styles.cardTitle}>{cardData.title}</Text>
      ) : null}

      {cardData?.subtitle ? (
        <Text style={styles.cardSubtitle}>{cardData.subtitle}</Text>
      ) : null}

      {/* Primary Highlight (e.g. Prize Amount or Ticket Number) */}
      {cardData?.primaryHighlight ? (
        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>{cardData.primaryHighlight}</Text>
          {cardData?.secondaryHighlight ? (
            <Text style={styles.subHighlightText}>{cardData.secondaryHighlight}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Structured Details Table */}
      {cardData?.details && cardData.details.length > 0 ? (
        <View style={styles.detailsContainer}>
          {cardData.details.map((item, idx) => (
            <View key={idx} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Natural Conversational Text Response */}
      <View style={styles.textContainer}>
        <Text style={styles.bodyText}>{message.text}</Text>
      </View>

      {/* Optional Expandable Prizes List */}
      {verified?.prizesList && verified.prizesList.length > 0 ? (
        <View style={styles.prizesAccordion}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setExpandedPrizes(!expandedPrizes)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Award size={15} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.accordionTitle}>
                {language === "ml" ? "എല്ലാ സമ്മാനങ്ങളും കാണുക" : "View all prize tiers"}
              </Text>
            </View>
            {expandedPrizes ? (
              <ChevronUp size={18} color="#94A3B8" />
            ) : (
              <ChevronDown size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {expandedPrizes && (
            <View style={styles.prizesList}>
              {verified.prizesList.map((tier, pIdx) => (
                <View key={pIdx} style={styles.prizeItem}>
                  <View style={styles.prizeHeader}>
                    <Text style={styles.prizeTier}>{tier.tier}</Text>
                    <Text style={styles.prizeAmount}>{tier.amount}</Text>
                  </View>
                  <Text style={styles.prizeNumbers}>
                    {tier.numbers.slice(0, 8).join("  •  ")}
                    {tier.numbers.length > 8 ? "  ..." : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderRadius: 20,
    padding: 18,
    marginVertical: 12,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  copyBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 2,
    marginBottom: 8,
  },
  highlightBox: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 10,
    alignItems: "center",
  },
  highlightText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#60A5FA",
    letterSpacing: 0.5,
  },
  subHighlightText: {
    fontSize: 12.5,
    color: "#CBD5E1",
    marginTop: 3,
    fontWeight: "500",
  },
  detailsContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  detailLabel: {
    fontSize: 12.5,
    color: "#94A3B8",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#F1F5F9",
    fontWeight: "700",
  },
  textContainer: {
    marginTop: 6,
  },
  bodyText: {
    fontSize: 14.5,
    color: "#E2E8F0",
    lineHeight: 22,
  },
  prizesAccordion: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 10,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  accordionTitle: {
    fontSize: 13,
    color: "#38BDF8",
    fontWeight: "600",
  },
  prizesList: {
    marginTop: 8,
    gap: 8,
  },
  prizeItem: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    padding: 10,
    borderRadius: 10,
  },
  prizeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  prizeTier: {
    fontSize: 12.5,
    color: "#F8FAFC",
    fontWeight: "700",
  },
  prizeAmount: {
    fontSize: 12.5,
    color: "#34D399",
    fontWeight: "700",
  },
  prizeNumbers: {
    fontSize: 12,
    color: "#CBD5E1",
    letterSpacing: 0.5,
  },
});
