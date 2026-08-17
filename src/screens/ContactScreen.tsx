import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  Clock,
  User,
  ShieldAlert,
  ExternalLink,
  HelpCircle,
  FileText,
  Copy,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import ComplianceDisclaimerCard from "../components/ComplianceDisclaimerCard";

const SUPPORT_EMAIL = "keralalotteryresultstoday@gmail.com";
const WHATSAPP_PHONE = "+919778570477";
const WHATSAPP_CLEAN = "919778570477";
const PHONE_1 = "+91 97785 70477";
const PHONE_1_DIAL = "+919778570477";
const PHONE_2 = "+91 82818 07752";
const PHONE_2_DIAL = "+918281807752";
const CONTACT_PERSON = "Ajo Mon John";
const WEBSITE_URL = "https://www.keralalotteryresultstoday.in";

export default function ContactScreen({ navigation }: any) {
  const { language } = useLanguage();
  const isMl = language === "ml";

  const handleEmail = () => {
    const subject = encodeURIComponent(
      isMl
        ? "കേരള ലോട്ടറി ആപ്പ് സപ്പോർട്ട് അന്വേഷണം"
        : "Kerala Lottery Results App - Support Inquiry"
    );
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        isMl ? "ഇമെയിൽ തുറക്കാൻ കഴിഞ്ഞില്ല" : "Could not open mail app",
        `${isMl ? "ദയവായി ഈ ഇമെയിലിലേക്ക് അയക്കുക:" : "Please write to:"} ${SUPPORT_EMAIL}`
      );
    });
  };

  const handleWhatsApp = async () => {
    const msg = encodeURIComponent(
      isMl
        ? "നമസ്കാരം, കേരള ലോട്ടറി റിസൾട്ട്സ് ആപ്പുമായി ബന്ധപ്പെട്ടാണ് ഞാൻ ബന്ധപ്പെടുന്നത്."
        : "Hello, I am contacting you regarding the Kerala Lottery Results Today app."
    );
    const waScheme = `whatsapp://send?phone=${WHATSAPP_CLEAN}&text=${msg}`;
    const waWeb = `https://wa.me/${WHATSAPP_CLEAN}?text=${msg}`;

    try {
      const supported = await Linking.canOpenURL(waScheme);
      if (supported) {
        await Linking.openURL(waScheme);
      } else {
        await Linking.openURL(waWeb);
      }
    } catch {
      Linking.openURL(waWeb).catch(() => {
        Alert.alert(
          isMl ? "WhatsApp തുറക്കാൻ കഴിഞ്ഞില്ല" : "Could not open WhatsApp",
          `${isMl ? "WhatsApp നമ്പർ:" : "WhatsApp number:"} ${PHONE_1}`
        );
      });
    }
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
    const url = `tel:${cleanNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        isMl ? "കോൾ ചെയ്യാൻ കഴിഞ്ഞില്ല" : "Could not initiate call",
        `${isMl ? "ഫോൺ നമ്പർ:" : "Phone number:"} ${phoneNumber}`
      );
    });
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open web link:", err)
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>
              {isMl ? "ബന്ധപ്പെടുക (Contact Us)" : "Contact Us"}
            </Text>
            <Text style={styles.subtitle}>
              {isMl ? "സഹായവും അന്വേഷണങ്ങളും" : "Helpdesk, Feedback & Inquiries"}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Card */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {isMl ? "സഹായ കേന്ദ്രം" : "HELPDESK & SUPPORT"}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {isMl
                ? "നിങ്ങളുടെ സംശയങ്ങൾക്കും നിർദ്ദേശങ്ങൾക്കും സ്വാഗതം"
                : "We're Here to Help You"}
            </Text>
            <Text style={styles.heroDesc}>
              {isMl
                ? "ആപ്പുമായി ബന്ധപ്പെട്ട സാങ്കേതിക സഹായങ്ങൾക്കോ ഫീഡ്‌ബാക്കിനോ താഴെ നൽകിയിരിക്കുന്ന മാധ്യമങ്ങൾ വഴി ഞങ്ങളെ നേരിട്ട് ബന്ധപ്പെടാം."
                : "Have a question about lottery results, barcode scanning, or app feedback? Reach out to our team directly."}
            </Text>
          </View>

          {/* Direct Channels Section */}
          <Text style={styles.sectionHeading}>
            {isMl ? "നേരിട്ട് ബന്ധപ്പെടാനുള്ള വഴികൾ:" : "Direct Contact Channels"}
          </Text>

          {/* WhatsApp Card */}
          <TouchableOpacity
            style={[styles.contactCard, styles.waCard]}
            onPress={handleWhatsApp}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIconBox, { backgroundColor: "#DCFCE7" }]}>
              <MessageCircle size={24} color="#16A34A" />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>WhatsApp Support</Text>
                <View style={styles.quickBadge}>
                  <Text style={styles.quickBadgeText}>
                    {isMl ? "തത്സമയം" : "Fastest"}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardValue}>{PHONE_1}</Text>
              <Text style={styles.cardSub}>
                {isMl
                  ? `ബന്ധപ്പെടേണ്ട വ്യക്തി: ${CONTACT_PERSON} (ചാറ്റ് ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക)`
                  : `Contact Person: ${CONTACT_PERSON} (Tap to chat)`}
              </Text>
            </View>
            <ExternalLink size={16} color="#16A34A" />
          </TouchableOpacity>

          {/* Email Card */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleEmail}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIconBox, { backgroundColor: "#EBF5FF" }]}>
              <Mail size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>
                {isMl ? "ഔദ്യോഗിക ഇമെയിൽ" : "Official Support Email"}
              </Text>
              <Text style={styles.cardValue}>{SUPPORT_EMAIL}</Text>
              <Text style={styles.cardSub}>
                {isMl
                  ? "ഇമെയിൽ അയക്കാൻ ക്ലിക്ക് ചെയ്യുക"
                  : "Tap to send an email inquiry"}
              </Text>
            </View>
            <ExternalLink size={16} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Phone Numbers Card */}
          <View style={styles.phoneGroupCard}>
            <View style={styles.phoneGroupHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Phone size={22} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {isMl ? "ഫോൺ ഹെൽപ്പ്‌ലൈൻ" : "Phone Helpline"}
                </Text>
                <Text style={styles.cardSub}>
                  {isMl
                    ? "വിളിക്കാൻ നമ്പറിൽ ടാപ്പ് ചെയ്യുക"
                    : "Tap a number below to call directly"}
                </Text>
              </View>
            </View>

            <View style={styles.phoneDivider} />

            {/* Phone 1 */}
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => handleCall(PHONE_1_DIAL)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.phoneRowNumber}>{PHONE_1}</Text>
                <Text style={styles.phoneRowLabel}>
                  {CONTACT_PERSON} ({isMl ? "പ്രൈമറി" : "Primary"})
                </Text>
              </View>
              <View style={styles.callPill}>
                <Phone size={12} color="#FFFFFF" />
                <Text style={styles.callPillText}>{isMl ? "വിളിക്കുക" : "Call"}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.phoneDivider} />

            {/* Phone 2 */}
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => handleCall(PHONE_2_DIAL)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.phoneRowNumber}>{PHONE_2}</Text>
                <Text style={styles.phoneRowLabel}>
                  {isMl ? "സെക്കൻഡറി ഹെൽപ്പ്‌ലൈൻ" : "Secondary Helpline"}
                </Text>
              </View>
              <View style={styles.callPill}>
                <Phone size={12} color="#FFFFFF" />
                <Text style={styles.callPillText}>{isMl ? "വിളിക്കുക" : "Call"}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Operating Hours & Website Info */}
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Clock size={16} color={COLORS.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>
                  {isMl ? "പ്രവർത്തന സമയം" : "Support Hours"}
                </Text>
                <Text style={styles.metaValue}>
                  {isMl
                    ? "തിങ്കൾ – ശനി: രാവിലെ 9:00 AM മുതൽ വൈകുന്നേരം 7:00 PM വരെ"
                    : "Monday – Saturday: 9:00 AM – 7:00 PM IST"}
                </Text>
              </View>
            </View>

            <View style={styles.phoneDivider} />

            <TouchableOpacity
              style={styles.metaRow}
              onPress={() => handleOpenUrl(WEBSITE_URL)}
              activeOpacity={0.7}
            >
              <Globe size={16} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>
                  {isMl ? "ഔദ്യോഗിക വെബ്സൈറ്റ്" : "Official Website"}
                </Text>
                <Text style={[styles.metaValue, { color: COLORS.primary, fontWeight: "700" }]}>
                  {WEBSITE_URL}
                </Text>
              </View>
              <ExternalLink size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Quick Help Links */}
          <Text style={styles.sectionHeading}>
            {isMl ? "മറ്റു വിവരങ്ങൾ & സഹായ ഗൈഡുകൾ:" : "Helpful Resources"}
          </Text>

          <View style={styles.quickLinksGrid}>
            <TouchableOpacity
              style={styles.quickLinkBtn}
              onPress={() => handleOpenUrl("https://www.keralalotteryresultstoday.in/claim")}
              activeOpacity={0.75}
            >
              <FileText size={18} color={COLORS.primary} />
              <Text style={styles.quickLinkText}>
                {isMl ? "സമ്മാനം ക്ലെയിം ചെയ്യുന്ന വിധം" : "Prize Claim Guide"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkBtn}
              onPress={() => handleOpenUrl("https://www.keralalotteryresultstoday.in/faq")}
              activeOpacity={0.75}
            >
              <HelpCircle size={18} color={COLORS.primary} />
              <Text style={styles.quickLinkText}>
                {isMl ? "പതിവ് ചോദ്യങ്ങൾ (FAQ)" : "Frequently Asked (FAQ)"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Compliance Notice */}
          <ComplianceDisclaimerCard style={{ marginTop: 16, marginBottom: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: { flex: 1 },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  subtitle: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  heroBanner: {
    backgroundColor: "#0B3C5D",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0B3C5D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FDE68A",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
    lineHeight: 24,
  },
  heroDesc: {
    fontSize: 12.5,
    color: "#E2E8F0",
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 10,
    marginTop: 4,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    gap: 12,
  },
  waCard: {
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  quickBadge: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  quickBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardValue: {
    fontSize: 14.5,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 2,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  phoneGroupCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  phoneGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  phoneDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  phoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  phoneRowNumber: {
    fontSize: 14.5,
    fontWeight: "900",
    color: COLORS.textDark,
  },
  phoneRowLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  callPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callPillText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  metaBox: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 1,
  },
  quickLinksGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  quickLinkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  quickLinkText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.textDark,
    flex: 1,
  },
});
