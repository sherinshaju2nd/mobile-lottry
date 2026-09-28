import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  Heart,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Share2,
  Copy,
  ExternalLink,
  CheckCircle2,
  Award,
  QrCode,
  Smartphone,
  ChevronRight,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import { useDeviceAdaptive } from "../hooks/useDeviceAdaptive";
import { isIndic } from "../constants/translations";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

const UPI_ID = "sherinshaju80-2@okicici";
const SUPPORT_WEBSITE_URL = "https://www.keralalotteryresultstoday.in/support";
const PRESET_AMOUNTS = ["20", "50", "100", "200", "500"];

const UPI_QR_DATA_URI =
  "data:image/png;base64,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";

export default function SupportScreen({ navigation }: any) {
  const { safeTopInset, safeBottomInset, isCompact } = useDeviceAdaptive(false);
  const { language, t } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState<string>("50");
  const [copied, setCopied] = useState<boolean>(false);

  const getCleanAmount = (amt: string) => {
    const num = parseFloat(amt);
    if (isNaN(num) || num <= 0) return "50.00";
    return num.toFixed(2);
  };

  const handlePayViaApp = async (scheme: string = "upi", appName?: string) => {
    triggerLightHaptic();
    const cleanAmt = getCleanAmount(selectedAmount);
    const note = encodeURIComponent("Kerala Lottery App Support");
    const name = encodeURIComponent("Sherin Shaju");

    const urlsToTry: string[] = [];

    if (scheme === "tez" || scheme === "gpay") {
      urlsToTry.push(`tez://upi/pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`gpay://upi/pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`upi://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
    } else if (scheme === "phonepe") {
      urlsToTry.push(`phonepe://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`upi://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
    } else if (scheme === "paytmmp" || scheme === "paytm") {
      urlsToTry.push(`paytmmp://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`paytm://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`upi://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
    } else {
      urlsToTry.push(`upi://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`tez://upi/pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`phonepe://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
      urlsToTry.push(`paytmmp://pay?pa=${UPI_ID}&pn=${name}&am=${cleanAmt}&cu=INR&tn=${note}`);
    }

    let opened = false;
    for (const url of urlsToTry) {
      try {
        await Linking.openURL(url);
        opened = true;
        break;
      } catch {
        // Fallback to next supported URL scheme
      }
    }

    if (!opened) {
      await handleCopyUpi();
      Alert.alert(
        "UPI App Not Detected",
        `No installed UPI app could be opened directly.\n\nYour UPI ID (${UPI_ID}) has been copied to your clipboard.\n\nPlease open Google Pay, PhonePe, Super.money, or Paytm and paste the ID to pay ₹${selectedAmount || "50"}.`
      );
    }
  };

  const handleCopyUpi = async () => {
    triggerSuccessHaptic();
    await Clipboard.setStringAsync(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLink = async () => {
    triggerSuccessHaptic();
    await Clipboard.setStringAsync(
      `Support Kerala Lottery App via UPI / Google Pay (UPI ID: ${UPI_ID}) or visit: ${SUPPORT_WEBSITE_URL}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    triggerLightHaptic();
    try {
      await Share.share({
        title: "Support Kerala Lottery Results Development",
        message: `Support the development of Kerala Lottery Results App via UPI / Google Pay (UPI ID: ${UPI_ID}) or visit: ${SUPPORT_WEBSITE_URL}`,
        url: SUPPORT_WEBSITE_URL,
      });
    } catch (e) {
      console.warn("Share error:", e);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        Platform.OS === "android" && { paddingTop: safeTopInset, paddingBottom: safeBottomInset },
      ]}
      edges={Platform.OS === "ios" ? ["top", "left", "right", "bottom"] : ["left", "right"]}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, isIndic(language) && { fontSize: 17 }]}>
              {t("support_title")}
            </Text>
            <Text style={[styles.subtitle, isIndic(language) && { fontSize: 11.5 }]}>
              {language === "ml"
                ? "Google Pay / UPI വഴി വികസനത്തെ പിന്തുണയ്ക്കൂ"
                : "Support development via GPay & UPI"}
            </Text>
          </View>
          <View style={styles.headerHeartIcon}>
            <Heart size={18} color="#EF4444" fill="#EF4444" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Support Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Sparkles size={13} color="#16A34A" />
              <Text style={styles.heroBadgeText}>
                {language === "ml" ? "സപ്പോർട്ട് & സംഭാവന" : "SUPPORT DEVELOPMENT"}
              </Text>
            </View>

            <View style={styles.heroCenterIcon}>
              <View style={styles.heartHalo}>
                <View style={styles.heartCircle}>
                  <Heart size={32} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
            </View>

            <Text style={[styles.heroTitle, isIndic(language) && { fontSize: 20, lineHeight: 26 }]}>
              {language === "ml" ? "ഞങ്ങളെ പിന്തുണയ്ക്കുക" : "Support Our Development"}
            </Text>
            <Text style={[styles.heroDesc, isIndic(language) && { fontSize: 12.5, lineHeight: 18 }]}>
              {t("support_hero_desc")}
            </Text>
          </View>

          {/* Amount Selection & Direct 1-Tap UPI Send Card */}
          <View style={styles.amountCard}>
            <View style={styles.amountHeaderRow}>
              <Sparkles size={15} color="#16A34A" />
              <Text style={[styles.amountSectionTitle, isIndic(language) && { fontSize: 14 }]}>
                {language === "ml" ? "തുക തിരഞ്ഞെടുക്കുക" : "Select Contribution Amount"}
              </Text>
            </View>

            {/* Preset Amount Chips */}
            <View style={styles.presetChipsRow}>
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = selectedAmount === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.amountChip, isSelected && styles.amountChipActive]}
                    onPress={() => {
                      triggerLightHaptic();
                      setSelectedAmount(amt);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.amountChipText,
                        isSelected && styles.amountChipTextActive,
                      ]}
                    >
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Amount Input Box */}
            <View style={styles.customInputWrap}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.customAmountInput}
                value={selectedAmount}
                onChangeText={(val) => setSelectedAmount(val.replace(/[^0-9]/g, ""))}
                placeholder="Custom amount"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={6}
              />
              <Text style={styles.inrLabel}>INR</Text>
            </View>

            {/* Big Primary One-Tap Pay Button */}
            <TouchableOpacity
              style={styles.directPayCta}
              onPress={() => handlePayViaApp("upi", "UPI App")}
              activeOpacity={0.88}
            >
              <Zap size={20} color="#000000" fill="#000000" />
              <Text style={styles.directPayCtaText}>
                {language === "ml"
                  ? `₹${selectedAmount || "50"} നേരിട്ട് അയക്കുക (UPI)`
                  : `Pay ₹${selectedAmount || "50"} via UPI / GPay`}
              </Text>
              <ExternalLink size={17} color="#000000" />
            </TouchableOpacity>

            {/* Direct App Launchers Grid */}
            <Text style={styles.quickAppsLabel}>
              {language === "ml"
                ? "നേരിട്ട് തുറക്കുക (No Copy-Paste needed):"
                : "TAP TO OPEN DIRECTLY IN APP:"}
            </Text>
            <View style={styles.appButtonsGrid}>
              {/* Google Pay */}
              <TouchableOpacity
                style={styles.appGridBtn}
                onPress={() => handlePayViaApp("tez", "Google Pay")}
                activeOpacity={0.78}
              >
                <View style={[styles.appIconCircle, { backgroundColor: "#EA4335" }]}>
                  <Text style={styles.appIconLetter}>G</Text>
                </View>
                <Text style={styles.appGridBtnText} numberOfLines={1}>GPay</Text>
              </TouchableOpacity>

              {/* PhonePe */}
              <TouchableOpacity
                style={styles.appGridBtn}
                onPress={() => handlePayViaApp("phonepe", "PhonePe")}
                activeOpacity={0.78}
              >
                <View style={[styles.appIconCircle, { backgroundColor: "#5F259F" }]}>
                  <Text style={styles.appIconLetter}>Pe</Text>
                </View>
                <Text style={styles.appGridBtnText} numberOfLines={1}>PhonePe</Text>
              </TouchableOpacity>

              {/* Paytm */}
              <TouchableOpacity
                style={styles.appGridBtn}
                onPress={() => handlePayViaApp("paytmmp", "Paytm")}
                activeOpacity={0.78}
              >
                <View style={[styles.appIconCircle, { backgroundColor: "#00BAF2" }]}>
                  <Text style={styles.appIconLetter}>₹</Text>
                </View>
                <Text style={styles.appGridBtnText} numberOfLines={1}>Paytm</Text>
              </TouchableOpacity>

              {/* Super.money / Other UPI */}
              <TouchableOpacity
                style={styles.appGridBtn}
                onPress={() => handlePayViaApp("upi", "Super.money")}
                activeOpacity={0.78}
              >
                <View style={[styles.appIconCircle, { backgroundColor: "#10B981" }]}>
                  <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <Text style={styles.appGridBtnText} numberOfLines={1}>Super.money</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* UPI QR Code Scanner Card (Matching Web Version) */}
          <View style={styles.qrCard}>
            <View style={styles.qrBadge}>
              <QrCode size={13} color="#16A34A" />
              <Text style={styles.qrBadgeText}>UPI • GPAY SCAN &amp; PAY</Text>
            </View>

            <Text style={[styles.qrTitle, isIndic(language) && { fontSize: 16 }]}>
              {language === "ml" ? "UPI / Google Pay വഴി സ്കാൻ ചെയ്യുക" : "Scan to Pay via UPI / GPay"}
            </Text>
            <Text style={[styles.qrDesc, isIndic(language) && { fontSize: 12 }]}>
              {language === "ml"
                ? "Google Pay, PhonePe, Paytm, Super.money വഴി സ്കാൻ ചെയ്ത് നേരിട്ട് പിന്തുണയ്ക്കാം."
                : "Scan using Google Pay, PhonePe, Paytm, Super.money or any UPI scanner to support directly."}
            </Text>

            {/* QR Code Box */}
            <TouchableOpacity
              style={styles.qrImageBox}
              onPress={() => handlePayViaApp("upi", "UPI App")}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: UPI_QR_DATA_URI }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* UPI ID Copy Pill Bar */}
            <View style={styles.upiPillBox}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.upiPillLabel}>UPI ID (Google Pay / GPay / Super.money)</Text>
                <Text style={styles.upiPillText} numberOfLines={1}>
                  {UPI_ID}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.upiCopyBtn, copied && styles.upiCopyBtnSuccess]}
                onPress={handleCopyUpi}
                activeOpacity={0.8}
              >
                <Copy size={13} color={copied ? "#16A34A" : "#0F172A"} />
                <Text style={[styles.upiCopyBtnText, copied && { color: "#16A34A" }]}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.upiSupportSubtext}>
              Google Pay (GPay) • PhonePe • Paytm • Super.money • BHIM • All Banks
            </Text>
          </View>

          {/* Why Support Matters */}
          <View style={styles.whySection}>
            <View style={styles.sectionHeaderRow}>
              <Heart size={18} color="#DC2626" />
              <Text style={[styles.sectionHeading, isIndic(language) && { fontSize: 14 }]}>
                {t("support_why_title")}
              </Text>
            </View>

            {/* Feature 1: 3 PM Servers */}
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Zap size={20} color="#D97706" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {t("support_why_server_title")}
                </Text>
                <Text style={styles.featureDesc}>
                  {t("support_why_server_desc")}
                </Text>
              </View>
            </View>

            {/* Feature 2: AI Scanner */}
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: "#EBF5FF" }]}>
                <Cpu size={20} color="#0284C7" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {t("support_why_scanner_title")}
                </Text>
                <Text style={styles.featureDesc}>
                  {t("support_why_scanner_desc")}
                </Text>
              </View>
            </View>

            {/* Feature 3: Ad-Free */}
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: "#F0FDF4" }]}>
                <ShieldCheck size={20} color="#16A34A" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {t("support_why_adfree_title")}
                </Text>
                <Text style={styles.featureDesc}>
                  {t("support_why_adfree_desc")}
                </Text>
              </View>
            </View>

            {/* Feature 4: Roadmaps */}
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: "#FAF5FF" }]}>
                <Award size={20} color="#9333EA" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {t("support_why_features_title")}
                </Text>
                <Text style={styles.featureDesc}>
                  {t("support_why_features_desc")}
                </Text>
              </View>
            </View>
          </View>

          {/* Share & Copy Link Card */}
          <View style={styles.shareCard}>
            <View style={styles.shareCardHeader}>
              <Share2 size={20} color="#0B3C5D" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.shareCardTitle}>
                  {t("support_share_title")}
                </Text>
                <Text style={styles.shareCardDesc}>
                  {t("support_share_desc")}
                </Text>
              </View>
            </View>

            <View style={styles.shareBtnRow}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>{t("support_share_btn")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <Text style={styles.copyBtnTextSuccess}>Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#0B3C5D" />
                    <Text style={styles.copyBtnText}>{t("support_copy_link")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Heartfelt Gratitude Note */}
          <View style={styles.gratitudeNote}>
            <Heart size={20} color="#EF4444" fill="#EF4444" />
            <Text style={styles.gratitudeTitle}>
              {t("support_thank_you_title")}
            </Text>
            <Text style={styles.gratitudeDesc}>
              {t("support_thank_you_desc")}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
    fontWeight: "500",
  },
  headerHeartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: "#1E1B4B",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.4,
  },
  heroCenterIcon: {
    marginBottom: 12,
  },
  heartHalo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroDesc: {
    fontSize: 13,
    color: "#CBD5E1",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  amountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  amountHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  amountSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.1,
  },
  presetChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  amountChip: {
    flex: 1,
    minWidth: 55,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  amountChipActive: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  amountChipTextActive: {
    color: "#15803D",
  },
  customInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B3C5D",
    marginRight: 6,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    paddingVertical: 8,
  },
  inrLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  directPayCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFDD00",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: "#FFDD00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 18,
  },
  directPayCtaText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -0.2,
  },
  quickAppsLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  appButtonsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  appGridBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  appIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  appIconLetter: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  appGridBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  qrBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  qrBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.4,
  },
  qrTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  qrDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  qrImageBox: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qrImage: {
    width: 175,
    height: 175,
    borderRadius: 10,
  },
  upiPillBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 8,
  },
  upiPillLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  upiPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 1,
  },
  upiCopyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  upiCopyBtnSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  upiCopyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  upiSupportSubtext: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 0.2,
  },
  whySection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 11.5,
    color: "#64748B",
    lineHeight: 16,
  },
  shareCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  shareCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  shareCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  shareCardDesc: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  shareBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0B3C5D",
    paddingVertical: 11,
    borderRadius: 12,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  copyBtnSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  copyBtnText: {
    color: "#0B3C5D",
    fontSize: 12.5,
    fontWeight: "700",
  },
  copyBtnTextSuccess: {
    color: "#16A34A",
    fontSize: 12.5,
    fontWeight: "800",
  },
  gratitudeNote: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  gratitudeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991B1B",
    marginTop: 6,
    marginBottom: 3,
  },
  gratitudeDesc: {
    fontSize: 11.5,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 16,
  },
});
