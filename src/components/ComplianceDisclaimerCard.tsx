import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertCircle, ShieldAlert } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";

interface ComplianceDisclaimerCardProps {
  style?: object;
  compact?: boolean;
}

export default function ComplianceDisclaimerCard({
  style,
  compact = false,
}: ComplianceDisclaimerCardProps) {
  const { language } = useLanguage();
  const isMl = language === "ml";

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <AlertCircle size={16} color="#B45309" style={{ marginTop: 1 }} />
        <Text style={styles.headerTitle}>
          {isMl
            ? "ഔദ്യോഗിക അറിയിപ്പും നിരാകരണവും (Disclaimer)"
            : "Official Notice & Disclaimer"}
        </Text>
      </View>

      <Text style={styles.disclaimerText}>
        {isMl
          ? "ഈ ആപ്പ് കേരള സംസ്ഥാന ഭാഗ്യക്കുറി വകുപ്പുമായോ കേരള സർക്കാരുമായോ യാതൊരു വിധത്തിലും ബന്ധപ്പെട്ടിട്ടുള്ളതല്ല. ലഭ്യമായ ഔദ്യോഗിക ഗസറ്റ് ഫലങ്ങൾ പൊതുജനങ്ങൾക്ക് സൗകര്യപ്രദമായി പരിശോധിക്കുന്നതിനുള്ള സ്വതന്ത്ര വിവര പ്ലാറ്റ്‌ഫോം മാത്രമാണിത്. സമ്മാനാർഹമായ ടിക്കറ്റുകൾ ഔദ്യോഗിക സർക്കാർ ഗസറ്റുമായി ഒത്തുനോക്കി ഉറപ്പുവരുത്തുക."
          : "This application is an independent informational utility and is NOT affiliated with, endorsed by, or connected to the Kerala State Lottery Department or the Government of Kerala. All results are sourced from official government publications. Always cross-verify results with the official Kerala Government Gazette."}
      </Text>

      {!compact && (
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <ShieldAlert size={12} color="#475569" />
            <Text style={styles.badgeText}>
              {isMl ? "ലോട്ടറി വിൽപ്പനയോ വാതുവെപ്പോ ഇല്ല" : "No Ticket Sales / Gambling"}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontWeight: "800", color: "#B45309" }]}>
              18+ {isMl ? "പ്രായം നിർബന്ധം" : "Only"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCD34D",
    padding: 12,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#92400E",
  },
  disclaimerText: {
    fontSize: 11,
    color: "#78350F",
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(180, 83, 9, 0.15)",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
});
