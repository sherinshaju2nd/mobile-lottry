import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Image,
  Share,
  Linking,
} from "react-native";
import {
  X,
  Settings,
  Trophy,
  BookOpen,
  HelpCircle,
  FileText,
  ShieldCheck,
  PhoneCall,
  Share2,
  ChevronRight,
  LayoutGrid,
  Layers,
  Check,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { triggerLightHaptic } from "../utils/haptics";
import { useLanguage } from "../context/LanguageContext";
import { useHomeUi } from "../context/HomeUiContext";
import { isIndic } from "../constants/translations";
import { shareKeralaLotteryApp } from "../utils/shareHelper";
import packageJson from "../../package.json";

const APP_VERSION = packageJson.version || "1.0.0";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 330);

interface SideMenuDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenNotificationSettings: () => void;
  navigation: any;
}

export default function SideMenuDrawerModal({
  visible,
  onClose,
  onOpenNotificationSettings,
  navigation,
}: SideMenuDrawerModalProps) {
  const { language, t } = useLanguage();
  const { uiMode, setUiMode } = useHomeUi();
  const isMl = language === "ml";
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 16,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    triggerLightHaptic();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleOpenLink = (url: string) => {
    triggerLightHaptic();
    Linking.openURL(url).catch(() => {});
  };

  const handleShareApp = async () => {
    triggerLightHaptic();
    await shareKeralaLotteryApp(language);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.55],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sidebar Drawer */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.drawerTitle,
                    isIndic(language) && { fontSize: 14, lineHeight: 19 },
                  ]}
                >
                  {t("app_header_title")}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.drawerSubtitle,
                    isIndic(language) && { fontSize: 10, lineHeight: 14 },
                  ]}
                >
                  {t("app_header_subtitle")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityLabel="Close Menu"
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* UI Theme Selection (Normal vs Modern) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                {isMl ? "ഹോം സ്ക്രീൻ ലേഔട്ട്" : "HOME SCREEN UI THEME"}
              </Text>

              <View style={styles.uiModeRow}>
                {/* Normal UI (HomeScreen2) */}
                <TouchableOpacity
                  style={[
                    styles.uiModeCard,
                    uiMode === "normal" && styles.uiModeCardActive,
                  ]}
                  onPress={() => {
                    triggerLightHaptic();
                    setUiMode("normal");
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.uiModeHeaderRow}>
                    <View
                      style={[
                        styles.uiModeIconBox,
                        uiMode === "normal" && styles.uiModeIconBoxActive,
                      ]}
                    >
                      <LayoutGrid
                        size={15}
                        color={uiMode === "normal" ? COLORS.primary : "#64748B"}
                      />
                    </View>
                    {uiMode === "normal" && (
                      <View style={styles.uiModeCheckDot}>
                        <Check size={11} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.uiModeTitle,
                      uiMode === "normal" && styles.uiModeTitleActive,
                    ]}
                  >
                    {isMl ? "നോർമൽ UI" : "Normal UI"}
                  </Text>
                  <Text style={styles.uiModeSub}>
                    {isMl ? "2-കോളം ഗ്രിഡ്" : "2-Column Grid"}
                  </Text>
                </TouchableOpacity>

                {/* Modern UI (HomeScreen - Old Dashboard) */}
                <TouchableOpacity
                  style={[
                    styles.uiModeCard,
                    uiMode === "modern" && styles.uiModeCardActive,
                  ]}
                  onPress={() => {
                    triggerLightHaptic();
                    setUiMode("modern");
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.uiModeHeaderRow}>
                    <View
                      style={[
                        styles.uiModeIconBox,
                        uiMode === "modern" && styles.uiModeIconBoxActive,
                      ]}
                    >
                      <Layers
                        size={15}
                        color={uiMode === "modern" ? COLORS.primary : "#64748B"}
                      />
                    </View>
                    {uiMode === "modern" && (
                      <View style={styles.uiModeCheckDot}>
                        <Check size={11} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.uiModeTitle,
                      uiMode === "modern" && styles.uiModeTitleActive,
                    ]}
                  >
                    {isMl ? "മോഡേൺ UI" : "Modern UI"}
                  </Text>
                  <Text style={styles.uiModeSub}>
                    {isMl ? "ഡാഷ്‌ബോർഡ്" : "Full Dashboard"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preferences & Settings */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                {isMl ? "ക്രമീകരണങ്ങൾ" : "PREFERENCES & ALERTS"}
              </Text>

              {/* Notification Settings */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  triggerLightHaptic();
                  handleClose();
                  setTimeout(() => {
                    onOpenNotificationSettings();
                  }, 200);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
                  ]}
                >
                  <Settings size={18} color={COLORS.primary} />
                </View>
                <View style={styles.menuTextCol}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.menuTitle}>
                      {t("notification_settings_title")}
                    </Text>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>
                        {isMl ? "ക്രമീകരണം" : "SETTING"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.menuSub}>
                    {isMl
                      ? "തത്സമയ അലേർട്ടുകളും അറിയിപ്പുകളും"
                      : "Live draw alerts, results & reminders"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Guides & Resources Section (Moved from Footer) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                {isMl ? "വിവരങ്ങളും ഗൈഡും" : "GUIDES & RESOURCES"}
              </Text>

              {/* Prize Claim Guide */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleOpenLink("https://www.keralalotteryresultstoday.in/claim")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" },
                  ]}
                >
                  <Trophy size={18} color="#D97706" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>
                    {isMl ? "സമ്മാന ക്ലെയിം ഗൈഡ്" : "Prize Claim"}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isMl
                      ? "സമ്മാനം കൈപ്പറ്റാനുള്ള നടപടികൾ"
                      : "Claim procedure & required documents"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Guide */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleOpenLink("https://www.keralalotteryresultstoday.in/guide")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" },
                  ]}
                >
                  <BookOpen size={18} color="#9333EA" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>
                    {isMl ? "ലോട്ടറി ഗൈഡ്" : "Lottery Guide"}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isMl
                      ? "നിയമങ്ങളും നറുക്കെടുപ്പ് വിവരങ്ങളും"
                      : "Draw rules, timings & ticket verification"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* FAQ */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleOpenLink("https://www.keralalotteryresultstoday.in/faq")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
                  ]}
                >
                  <HelpCircle size={18} color="#2563EB" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>
                    {isMl ? "പതിവ് ചോദ്യങ്ങൾ (FAQ)" : "FAQ"}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isMl
                      ? "സാധാരണ ചോദ്യങ്ങൾക്ക് ഉത്തരം"
                      : "Frequently asked questions & answers"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Legal, Support & Share */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                {isMl ? "സഹായവും നയങ്ങളും" : "SUPPORT & LEGAL"}
              </Text>

              {/* Contact & Helplines */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  triggerLightHaptic();
                  handleClose();
                  navigation?.navigate("Contact");
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#ECFEFF", borderColor: "#A5F3FC" },
                  ]}
                >
                  <PhoneCall size={18} color="#0891B2" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>
                    {isMl ? "ബന്ധപ്പെടുക" : "Contact"}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isMl
                      ? "ഔദ്യോഗിക ഹെൽപ്പ്‌ലൈൻ നമ്പറുകൾ"
                      : "Official Directorate contacts"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Terms of Service */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleOpenLink("https://www.keralalotteryresultstoday.in/terms-conditions")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" },
                  ]}
                >
                  <FileText size={18} color="#475569" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>
                    {isMl ? "നിബന്ധനകൾ" : "Terms"}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isMl ? "ഉപയോഗ നിബന്ധനകൾ" : "Terms & conditions of use"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Privacy Policy */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleOpenLink("https://www.keralalotteryresultstoday.in/privacy-policy")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
                  ]}
                >
                  <ShieldCheck size={18} color="#16A34A" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>
                    {isMl ? "സ്വകാര്യതാ നയം" : "Privacy"}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isMl ? "സ്വകാര്യതയും സുരക്ഷയും" : "Privacy policy & disclosure"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Share App */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleShareApp}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
                  ]}
                >
                  <Share2 size={18} color="#DC2626" />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>
                    {isMl ? "ആപ്പ് പങ്കിടുക" : "Share App"}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isMl
                      ? "സുഹൃത്തുക്കൾക്ക് ഷെയർ ചെയ്യുക"
                      : "Share with friends & family"}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Disclaimer & Footer */}
            <View style={styles.footerBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <ShieldCheck size={14} color="#64748B" />
                <Text style={styles.footerVersion}>Kerala Lottery v{APP_VERSION}</Text>
              </View>
              <Text style={styles.footerDisclaimer}>
                {isMl
                  ? "ഔദ്യോഗിക നറുക്കെടുപ്പ് രേഖകളിൽ നിന്നുള്ള വിവരങ്ങൾ. സർക്കാർ വകുപ്പുമായി നേരിട്ട് ബന്ധമില്ല."
                  : "Data computed purely from official past draw records. 100% independent."}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 100,
  },
  drawerHeader: {
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  drawerTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  drawerSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  uiModeRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  uiModeCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
  },
  uiModeCardActive: {
    backgroundColor: "#EFF6FF",
    borderColor: COLORS.primary,
  },
  uiModeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  uiModeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  uiModeIconBoxActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  uiModeCheckDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  uiModeTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#334155",
  },
  uiModeTitleActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  uiModeSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  menuSub: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1.5,
  },
  badgePill: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  langBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A",
  },
  footerBox: {
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  footerDisclaimer: {
    fontSize: 9.5,
    color: "#94A3B8",
    lineHeight: 14,
  },
});
