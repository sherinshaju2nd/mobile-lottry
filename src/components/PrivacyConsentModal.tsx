import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
} from "react-native";
import { ShieldCheck, AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react-native";
import { COLORS } from "../constants/colors";

interface PrivacyConsentModalProps {
  onAccept: () => void;
}

export default function PrivacyConsentModal({ onAccept }: PrivacyConsentModalProps) {
  const [visible, setVisible] = useState(true);

  const openWebLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open web link:", err)
    );
  };

  const handleAccept = () => {
    onAccept();
  };

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={visible}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.mainContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconWrapper}>
              <ShieldCheck size={64} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>Welcome to Kerala Lottery Results</Text>
            <Text style={styles.subtitle}>
              Before accessing our live draw results, ticket checker, and analytics, please review and agree to our service terms and privacy policy on our website.
            </Text>

            <View style={styles.bulletSection}>
              <View style={styles.bulletRow}>
                <AlertTriangle size={20} color="#D97706" style={styles.bulletIcon} />
                <View style={styles.bulletTextWrapper}>
                  <Text style={styles.bulletTitle}>Unofficial Disclaimer</Text>
                  <Text style={styles.bulletDesc}>
                    We are an unofficial result platform. Draw results are subject to sync delays. Always cross-check numbers against the official Government Gazette.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletRow}>
                <CheckCircle2 size={20} color={COLORS.primary} style={styles.bulletIcon} />
                <View style={styles.bulletTextWrapper}>
                  <Text style={styles.bulletTitle}>Age Requirements (18+)</Text>
                  <Text style={styles.bulletDesc}>
                    This Service is strictly for users aged 18 and older. By using the app, you confirm you meet the legal minimum age requirements.
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeading}>Please read the documents below:</Text>

            <View style={styles.docList}>
              <TouchableOpacity
                style={styles.docRow}
                activeOpacity={0.7}
                onPress={() => openWebLink("https://www.keralalotteryresultstoday.in/terms-conditions")}
              >
                <View style={styles.docRowLeft}>
                  <Text style={styles.docRowTitle}>Terms &amp; Conditions</Text>
                  <Text style={styles.docRowSubtitle}>Read rules, liability, and disclaimers (opens browser)</Text>
                </View>
                <ExternalLink size={18} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.docRow}
                activeOpacity={0.7}
                onPress={() => openWebLink("https://www.keralalotteryresultstoday.in/privacy-policy")}
              >
                <View style={styles.docRowLeft}>
                  <Text style={styles.docRowTitle}>Privacy Policy</Text>
                  <Text style={styles.docRowSubtitle}>Read how we handle usage analytics (opens browser)</Text>
                </View>
                <ExternalLink size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.acceptFootnote}>
              By tapping &quot;Accept &amp; Agree&quot; below, you acknowledge that you are 18+ and accept the Terms &amp; Conditions and Privacy Policy.
            </Text>
          </ScrollView>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              activeOpacity={0.9}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>Accept &amp; Agree</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { padding: 24, paddingBottom: 40, alignItems: "center" },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  bulletSection: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
    gap: 16,
  },
  bulletRow: { flexDirection: "row", gap: 12 },
  bulletIcon: { marginTop: 2 },
  bulletTextWrapper: { flex: 1 },
  bulletTitle: { fontSize: 14, fontWeight: "800", color: "#1F2937" },
  bulletDesc: { fontSize: 12, color: "#4B5563", lineHeight: 17, marginTop: 4 },
  sectionHeading: {
    width: "100%",
    fontSize: 14,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 12,
    textAlign: "left",
  },
  docList: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  docRowLeft: { flex: 1 },
  docRowTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  docRowSubtitle: { fontSize: 11, color: "#6B7280", marginTop: 2, marginRight: 8 },
  divider: { height: 1, backgroundColor: "#E5E7EB" },
  acceptFootnote: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
  actionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
