import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Square,
  CheckSquare,
  Globe,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";

interface PrivacyConsentModalProps {
  onAccept: () => void;
}

export default function PrivacyConsentModal({ onAccept }: PrivacyConsentModalProps) {
  const { language, setLanguage } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

  const isMl = language === "ml";

  const openWebLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open web link:", err)
    );
  };

  const handleAccept = () => {
    if (isAgeConfirmed) {
      onAccept();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={visible}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Language Switcher Bar */}
        <View style={styles.langBar}>
          <View style={styles.langBarLeft}>
            <Globe size={16} color={COLORS.primary} />
            <Text style={styles.langBarLabel}>Language / ഭാഷ:</Text>
          </View>
          <View style={styles.langToggleGroup}>
            <TouchableOpacity
              style={[styles.langBtn, !isMl && styles.langBtnActive]}
              onPress={() => setLanguage("en")}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, !isMl && styles.langBtnTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, isMl && styles.langBtnActive]}
              onPress={() => setLanguage("ml")}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, isMl && styles.langBtnTextActive]}>
                മലയാളം
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.iconWrapper}>
              <ShieldCheck size={56} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>
              {isMl ? "കേരള ലോട്ടറി റിസൾട്ട്സിലേക്ക് സ്വാഗതം" : "Welcome to Kerala Lottery Results"}
            </Text>
            <Text style={styles.subtitle}>
              {isMl
                ? "ലൈവ് ഫലങ്ങൾ, ടിക്കറ്റ് പരിശോധന എന്നിവ ലഭ്യമാകുന്നതിന് മുൻപായി ഞങ്ങളുടെ സേവന നിബന്ധനകളും സ്വകാര്യതാ നയവും വായിച്ചു സമ്മതിക്കുക."
                : "Before accessing our live draw results, ticket checker, and analytics, please review and agree to our service terms and privacy policy."}
            </Text>

            <View style={styles.bulletSection}>
              {/* Bullet 1 */}
              <View style={styles.bulletRow}>
                <AlertTriangle size={20} color="#D97706" style={styles.bulletIcon} />
                <View style={styles.bulletTextWrapper}>
                  <Text style={styles.bulletTitle}>
                    {isMl ? "സ്വതന്ത്രവും അനൗദ്യോഗികവുമായ പ്ലാറ്റ്‌ഫോം" : "Independent & Unofficial"}
                  </Text>
                  <Text style={styles.bulletDesc}>
                    {isMl
                      ? "ഈ ആപ്പ് കേരള സംസ്ഥാന ഭാഗ്യക്കുറി വകുപ്പുമായോ സർക്കാരുമായോ ബന്ധപ്പെട്ടതല്ല. വിജയിച്ച ടിക്കറ്റുകൾ ഔദ്യോഗിക സർക്കാർ ഗസറ്റുമായി ഒത്തുനോക്കി ഉറപ്പുവരുത്തുക."
                      : "This app is an independent informational utility and is NOT affiliated with, endorsed by, or connected to the Kerala State Lottery Department or Government of Kerala. Always verify winning numbers with the official Government Gazette."}
                  </Text>
                </View>
              </View>

              {/* Bullet 2 */}
              <View style={styles.bulletRow}>
                <ShieldCheck size={20} color={COLORS.primary} style={styles.bulletIcon} />
                <View style={styles.bulletTextWrapper}>
                  <Text style={styles.bulletTitle}>
                    {isMl ? "ലോട്ടറി വിൽപ്പനയോ വാതുവെപ്പോ ഇല്ല" : "No Ticket Sales or Betting"}
                  </Text>
                  <Text style={styles.bulletDesc}>
                    {isMl
                      ? "ഈ ആപ്പിലൂടെ ടിക്കറ്റ് വിൽപ്പനയോ വാതുവെപ്പോ നടത്തുന്നില്ല. ലഭ്യമായ ഫലങ്ങൾ പരിശോധിക്കുന്നതിനുള്ള സ്വതന്ത്ര പ്ലാറ്റ്‌ഫോം മാത്രമാണിത്."
                      : "This application does not sell lottery tickets, accept bets, or facilitate gambling of any kind. It is strictly for viewing publicly published draw results."}
                  </Text>
                </View>
              </View>

              {/* Bullet 3 */}
              <View style={styles.bulletRow}>
                <CheckCircle2 size={20} color="#059669" style={styles.bulletIcon} />
                <View style={styles.bulletTextWrapper}>
                  <Text style={styles.bulletTitle}>
                    {isMl ? "പ്രായപരിധി (18+ വയസ്സ്)" : "Age Requirements (18+)"}
                  </Text>
                  <Text style={styles.bulletDesc}>
                    {isMl
                      ? "ഈ സേവനം 18 വയസ്സോ അതിൽ കൂടുതലോ പ്രായമുള്ളവർക്ക് മാത്രമുള്ളതാണ്."
                      : "This service is strictly for users aged 18 and older. By using the app, you confirm you meet the legal minimum age requirements."}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeading}>
              {isMl ? "വിശദമായ രേഖകൾ താഴെ വായിക്കാം:" : "Please read the documents below:"}
            </Text>

            <View style={styles.docList}>
              <TouchableOpacity
                style={styles.docRow}
                activeOpacity={0.7}
                onPress={() => openWebLink("https://www.keralalotteryresultstoday.in/terms-conditions")}
              >
                <View style={styles.docRowLeft}>
                  <Text style={styles.docRowTitle}>
                    {isMl ? "സേവന നിബന്ധനകൾ (Terms & Conditions)" : "Terms & Conditions"}
                  </Text>
                  <Text style={styles.docRowSubtitle}>
                    {isMl
                      ? "നിയമങ്ങളും നിരാകരണങ്ങളും വായിക്കുക (വെബ്സൈറ്റ് തുറക്കുന്നു)"
                      : "Read rules, liability, and disclaimers (opens browser)"}
                  </Text>
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
                  <Text style={styles.docRowTitle}>
                    {isMl ? "സ്വകാര്യതാ നയം (Privacy Policy)" : "Privacy Policy"}
                  </Text>
                  <Text style={styles.docRowSubtitle}>
                    {isMl
                      ? "വിവര സുരക്ഷാ നയം വായിക്കുക (വെബ്സൈറ്റ് തുറക്കുന്നു)"
                      : "Read how we handle usage data (opens browser)"}
                  </Text>
                </View>
                <ExternalLink size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Explicit 18+ Age Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              activeOpacity={0.8}
              onPress={() => setIsAgeConfirmed((prev) => !prev)}
            >
              {isAgeConfirmed ? (
                <CheckSquare size={22} color={COLORS.primary} />
              ) : (
                <Square size={22} color="#9CA3AF" />
              )}
              <Text style={styles.checkboxText}>
                {isMl
                  ? "എനിക്ക് 18 വയസ്സോ അതിൽ കൂടുതലോ പ്രായമുണ്ടെന്ന് ഞാൻ സ്ഥിരീകരിക്കുന്നു."
                  : "I confirm that I am 18 years of age or older."}
              </Text>
            </TouchableOpacity>

            <Text style={styles.acceptFootnote}>
              {isMl
                ? "തുടരുന്നതിലൂടെ നിങ്ങൾ സേവന നിബന്ധനകളും സ്വകാര്യതാ നയവും അംഗീകരിക്കുന്നു."
                : "By tapping \"Accept & Agree\" below, you acknowledge that you accept the Terms & Conditions and Privacy Policy."}
            </Text>
          </ScrollView>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                !isAgeConfirmed && { backgroundColor: "#CBD5E1", shadowColor: "transparent", elevation: 0 },
              ]}
              activeOpacity={0.9}
              onPress={handleAccept}
              disabled={!isAgeConfirmed}
            >
              <Text style={styles.acceptButtonText}>
                {isMl ? "സമ്മതിക്കുന്നു & തുടരുക (Accept & Agree)" : "Accept & Agree"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  langBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  langBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  langBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  langToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  langBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { padding: 20, paddingBottom: 30, alignItems: "center" },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  bulletSection: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
    gap: 14,
  },
  bulletRow: { flexDirection: "row", gap: 10 },
  bulletIcon: { marginTop: 2 },
  bulletTextWrapper: { flex: 1 },
  bulletTitle: { fontSize: 13.5, fontWeight: "800", color: "#1F2937" },
  bulletDesc: { fontSize: 11.5, color: "#4B5563", lineHeight: 16.5, marginTop: 3 },
  sectionHeading: {
    width: "100%",
    fontSize: 13,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 10,
    textAlign: "left",
  },
  docList: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  docRowLeft: { flex: 1 },
  docRowTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  docRowSubtitle: { fontSize: 11, color: "#6B7280", marginTop: 2, marginRight: 8 },
  divider: { height: 1, backgroundColor: "#E5E7EB" },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    lineHeight: 18,
  },
  acceptFootnote: {
    fontSize: 10.5,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 15,
    marginTop: 4,
  },
  actionContainer: {
    padding: 16,
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
