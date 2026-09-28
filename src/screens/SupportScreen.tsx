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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  Coffee,
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
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import { useDeviceAdaptive } from "../hooks/useDeviceAdaptive";
import { isIndic } from "../constants/translations";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/sherin80";

export default function SupportScreen({ navigation }: any) {
  const { safeTopInset, safeBottomInset, isCompact } = useDeviceAdaptive(false);
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState<boolean>(false);

  const handleOpenBMC = async () => {
    triggerLightHaptic();
    try {
      await Linking.openURL(BUY_ME_A_COFFEE_URL);
    } catch {
      Alert.alert(
        "Could not open browser",
        `Please visit: ${BUY_ME_A_COFFEE_URL}`
      );
    }
  };

  const handleCopyLink = async () => {
    triggerSuccessHaptic();
    await Clipboard.setStringAsync(BUY_ME_A_COFFEE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    triggerLightHaptic();
    try {
      await Share.share({
        title: "Support Kerala Lottery Results Development",
        message: `Support the development of the Kerala Lottery Results App & keep it lightning fast: ${BUY_ME_A_COFFEE_URL}`,
        url: BUY_ME_A_COFFEE_URL,
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
              {t("support_subtitle")}
            </Text>
          </View>
          <View style={styles.headerCoffeeIcon}>
            <Coffee size={20} color="#D97706" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Coffee Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Sparkles size={13} color="#B45309" />
              <Text style={styles.heroBadgeText}>
                {t("support_hero_badge")}
              </Text>
            </View>

            <View style={styles.heroCenterIcon}>
              <View style={styles.coffeeCupHalo}>
                <View style={styles.coffeeCupCircle}>
                  <Coffee size={36} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <Text style={[styles.heroTitle, isIndic(language) && { fontSize: 20, lineHeight: 26 }]}>
              {t("support_hero_title")}
            </Text>
            <Text style={[styles.heroDesc, isIndic(language) && { fontSize: 12.5, lineHeight: 18 }]}>
              {t("support_hero_desc")}
            </Text>

            {/* Quick Action Pill */}
            <TouchableOpacity
              style={styles.heroBmcBtn}
              onPress={handleOpenBMC}
              activeOpacity={0.88}
            >
              <Coffee size={20} color="#000000" />
              <Text style={styles.heroBmcBtnText}>
                {t("support_btn_text")}
              </Text>
              <ExternalLink size={16} color="#000000" />
            </TouchableOpacity>
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
  headerCoffeeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
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
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.4,
  },
  heroCenterIcon: {
    marginBottom: 12,
  },
  coffeeCupHalo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 221, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  coffeeCupCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
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
  heroBmcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFDD00",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    width: "100%",
    shadowColor: "#FFDD00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  heroBmcBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -0.2,
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
