import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Globe,
  Menu,
  Check,
  ChevronDown,
  Sparkles,
  Trophy,
  Clock,
  Zap,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { triggerLightHaptic } from "../utils/haptics";
import {
  getSafeTodayISTDate,
  getSafeTodayISTDayName,
} from "../utils/formatters";
import {
  WEEKLY_LOTTERIES,
  BUMPER_LOTTERIES,
  getLotteryMalayalamName,
  getLotteryTranslatedName,
  LotteryMeta,
} from "../constants/lotteries";
import { SUPPORTED_LANGUAGES, isIndic } from "../constants/translations";
import {
  fetchAllDraws,
  getCachedDrawsQuick,
  fetchLotteries,
  fetchBumperLotteries,
  DrawResult,
  supabase,
  hasAnyDrawResult,
} from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";
import SideMenuDrawerModal from "../components/SideMenuDrawerModal";
import NotificationSettingsModal from "../components/NotificationSettingsModal";
import GeminiAiFloatingButton from "../components/GeminiAiFloatingButton";
import AiVoiceAssistantModal from "../components/AiVoiceAssistantModal";
import AiSocialDigestModal from "../components/AiSocialDigestModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2; // 2 columns with 16px outer padding and 12px gap

const PAGE_SIZE = 10;

// Format YYYY-MM-DD -> DD/MM/YYYY
function formatDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return "";
  const clean = dateStr.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Format Draw Code e.g. "BT-71"
function formatDrawCodeBadge(draw: { lottery_code?: string; draw_code?: string }): string {
  const code = (draw.lottery_code || "").toUpperCase();
  const num = (draw.draw_code || "").toUpperCase();
  if (!num) return code;
  if (num.startsWith(code)) return num;
  return `${code}-${num}`;
}

// Check if current IST time is after 12:00 PM
function getIsAfter12PMIST(): boolean {
  try {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const istTotalMinutes = (utcHours * 60 + utcMinutes + 330) % (24 * 60);
    return istTotalMinutes >= 12 * 60; // 12:00 PM IST = 720 mins
  } catch {
    return true;
  }
}

export default function HomeScreen2({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const isMl = language === "ml";

  // Data states
  const [allDraws, setAllDraws] = useState<DrawResult[]>([]);
  const [lotteriesList, setLotteriesList] = useState<LotteryMeta[]>(WEEKLY_LOTTERIES);
  const [bumperLotteries, setBumperLotteries] = useState<LotteryMeta[]>(BUMPER_LOTTERIES);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination / Lazy Loading state
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal states
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAiDigestOpen, setIsAiDigestOpen] = useState(false);

  // Time & Today Draw State
  const [isAfter12PM, setIsAfter12PM] = useState<boolean>(getIsAfter12PMIST());
  const todayISTDate = getSafeTodayISTDate();
  const todayDayName = getSafeTodayISTDayName();

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const cached = await getCachedDrawsQuick();
      if (cached && cached.length > 0 && allDraws.length === 0) {
        setAllDraws(cached);
        setIsLoading(false);
      }

      const [draws, lotteries, bumpers] = await Promise.all([
        fetchAllDraws(),
        fetchLotteries(),
        fetchBumperLotteries(),
      ]);

      if (draws && draws.length > 0) {
        setAllDraws(draws);
      }
      if (lotteries && lotteries.length > 0) {
        setLotteriesList(lotteries);
      }
      if (bumpers && bumpers.length > 0) {
        setBumperLotteries(bumpers);
      }
    } catch (e) {
      console.warn("Error loading draws in HomeScreen2:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [allDraws.length]);

  useEffect(() => {
    loadData();

    // Check 12 PM shift periodically
    const interval = setInterval(() => {
      setIsAfter12PM(getIsAfter12PMIST());
    }, 60000);

    // Supabase realtime subscription for instant 3 PM live draw updates
    const channel = supabase
      .channel("realtime-draws-homescreen2")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draw_results" },
        (payload: any) => {
          if (payload.new && payload.new.draw_date) {
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleRefresh = () => {
    triggerLightHaptic();
    setIsRefreshing(true);
    setVisibleCount(PAGE_SIZE);
    loadData();
  };

  // Find today's draw or build current featured top card
  const todayWeeklyMeta = useMemo(() => {
    return lotteriesList.find((l) => l.day.toLowerCase() === todayDayName.toLowerCase()) || WEEKLY_LOTTERIES[0];
  }, [lotteriesList, todayDayName]);

  const todayDbDraw = useMemo(() => {
    return allDraws.find((d) => d.draw_date === todayISTDate);
  }, [allDraws, todayISTDate]);

  // Top Card Item Data
  const topFeaturedDraw = useMemo(() => {
    if (isAfter12PM) {
      // After 12 PM: Featured card is Today's draw
      if (todayDbDraw) return todayDbDraw;
      return {
        draw_date: todayISTDate,
        draw_name: todayWeeklyMeta.name,
        draw_code: todayWeeklyMeta.code,
        lottery_code: todayWeeklyMeta.code,
        first: undefined,
        prizes: undefined,
      } as DrawResult;
    } else {
      // Before 12 PM: Featured card is Yesterday's latest completed draw
      return allDraws[0] || {
        draw_date: todayISTDate,
        draw_name: todayWeeklyMeta.name,
        draw_code: todayWeeklyMeta.code,
        lottery_code: todayWeeklyMeta.code,
      };
    }
  }, [isAfter12PM, todayDbDraw, todayISTDate, todayWeeklyMeta, allDraws]);

  // List of other past draws (excluding the top featured card to avoid duplicate)
  const remainingDraws = useMemo(() => {
    if (allDraws.length === 0) return [];
    if (topFeaturedDraw?.draw_date) {
      return allDraws.filter((d) => d.draw_date !== topFeaturedDraw.draw_date);
    }
    return allDraws.slice(1);
  }, [allDraws, topFeaturedDraw]);

  // Lazy-loaded slice
  const paginatedDraws = useMemo(() => {
    return remainingDraws.slice(0, visibleCount);
  }, [remainingDraws, visibleCount]);

  const isFetchingMoreRef = useRef(false);

  // Handle load more on scroll (10 items at a time)
  const handleLoadMore = useCallback(() => {
    if (isFetchingMoreRef.current || isLoadingMore) return;
    if (visibleCount >= remainingDraws.length) return;

    isFetchingMoreRef.current = true;
    setIsLoadingMore(true);

    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, remainingDraws.length));
      setIsLoadingMore(false);
      isFetchingMoreRef.current = false;
    }, 200);
  }, [visibleCount, remainingDraws.length, isLoadingMore]);

  // Navigate to breakdown
  const handleCardPress = (draw: DrawResult) => {
    triggerLightHaptic();
    const code = draw.lottery_code || "BT";
    const date = draw.draw_date || todayISTDate;
    navigation.navigate("DrawBreakdown", { code, date });
  };

  // Render 50% / 50% Grid Item
  const renderGridItem = ({ item, index }: { item: DrawResult; index: number }) => {
    const displayName =
      language === "ml"
        ? getLotteryMalayalamName(item.lottery_code) || item.draw_name
        : getLotteryTranslatedName(item.lottery_code, language) || item.draw_name;

    const formattedDate = formatDDMMYYYY(item.draw_date);
    const badgeCode = formatDrawCodeBadge(item);
    // Show NEW ribbon on the most recent completed draw in the grid if top card is not published
    const isLatestGridDraw = index === 0 && !hasAnyDrawResult(topFeaturedDraw);

    return (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.88}
        onPress={() => handleCardPress(item)}
      >
        {/* Top Blue Header Section (50%) */}
        <View style={styles.cardTopBlue}>
          {/* Diagonal NEW Ribbon for latest draw */}
          {isLatestGridDraw && (
            <View style={styles.gridCornerRibbonContainer}>
              <View style={styles.gridCornerRibbon}>
                <Text style={styles.gridCornerRibbonText}>NEW</Text>
              </View>
            </View>
          )}

          {/* Badge top right */}
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{badgeCode}</Text>
          </View>

          {/* Lottery Name */}
          <Text
            numberOfLines={2}
            style={[
              styles.cardLotteryName,
              isIndic(language) && { fontSize: 13.5, lineHeight: 18 },
            ]}
          >
            {displayName.toUpperCase()}
          </Text>
        </View>

        {/* Bottom White Date Section (50%) */}
        <View style={styles.cardBottomWhite}>
          <Text style={styles.cardDateText}>{formattedDate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Top Full-Width Featured Card
  const renderTopFeaturedCard = () => {
    if (!topFeaturedDraw) return null;

    const displayName =
      language === "ml"
        ? getLotteryMalayalamName(topFeaturedDraw.lottery_code) || topFeaturedDraw.draw_name
        : getLotteryTranslatedName(topFeaturedDraw.lottery_code, language) || topFeaturedDraw.draw_name;

    const formattedDate = formatDDMMYYYY(topFeaturedDraw.draw_date);
    const badgeCode = formatDrawCodeBadge(topFeaturedDraw);
    const isPublished = hasAnyDrawResult(topFeaturedDraw);

    return (
      <View style={styles.topSectionContainer}>
        <TouchableOpacity
          style={styles.topFullCard}
          activeOpacity={0.88}
          onPress={() => handleCardPress(topFeaturedDraw)}
        >
          {/* Top Blue Header */}
          <View style={styles.topCardBlue}>
            {/* Diagonal Red Ribbon in Top-Left Corner */}
            <View style={styles.topCornerRibbonContainer}>
              <View
                style={[
                  styles.topCornerRibbon,
                  isPublished ? styles.ribbonPublished : styles.ribbonPending,
                ]}
              >
                <Text style={styles.topCornerRibbonText}>
                  {isPublished ? "NEW" : isAfter12PM ? "TODAY" : "NEW"}
                </Text>
              </View>
            </View>

            {/* Code Badge in Top-Right */}
            <View style={[styles.codeBadge, styles.topCodeBadge]}>
              <Text style={styles.topCodeBadgeText}>{badgeCode}</Text>
            </View>

            {/* Centered Large Lottery Name */}
            <Text
              numberOfLines={2}
              style={[
                styles.topCardLotteryName,
                isIndic(language) && { fontSize: 18, lineHeight: 23 },
              ]}
            >
              {displayName.toUpperCase()}
            </Text>
          </View>

          {/* Bottom White Date Section */}
          <View style={styles.topCardBottomWhite}>
            <Text style={styles.topCardDateText}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>

        {/* Section Header for Past Draws */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>
            {language === "ml" ? "മുൻകാല നറുക്കെടുപ്പുകൾ" : "RECENT DRAWS"}
          </Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              {allDraws.length} {language === "ml" ? "ഫലങ്ങൾ" : "Draws"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Top Navbar Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          {/* Logo & App Title */}
          <View style={styles.brandCol}>
            <View style={styles.logoBadge}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={[
                  styles.appName,
                  isIndic(language) && { fontSize: 13, lineHeight: 18, fontWeight: "800" },
                ]}
              >
                {t("app_header_title")}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.appSubtitle,
                  isIndic(language) && { fontSize: 9.5, lineHeight: 13 },
                ]}
              >
                {t("app_header_subtitle")}
              </Text>
            </View>
          </View>

          {/* Right Header Actions: Language Switcher first, 3-line Menu last */}
          <View style={styles.headerActions}>
            {/* Language Selector */}
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => {
                triggerLightHaptic();
                setShowLangDropdown((prev) => !prev);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Select Language"
            >
              <Globe size={13} color={COLORS.primary} />
              <Text style={styles.langBtnText}>{language.toUpperCase()}</Text>
              <ChevronDown size={11} color={COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* 3-Bar Menu Button (Borderless & Bigger) */}
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => {
                triggerLightHaptic();
                setIsSideMenuOpen(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Open Menu"
            >
              <Menu size={24} color={COLORS.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content: 2-Column Grid with Top Full-Width Card */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {language === "ml" ? "ഫലങ്ങൾ ലഭ്യമാക്കുന്നു..." : "Loading draws..."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={paginatedDraws}
          keyExtractor={(item, index) => `${item.lottery_code}-${item.draw_date}-${index}`}
          renderItem={renderGridItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderTopFeaturedCard}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.footerLoaderText}>
                  {language === "ml" ? "കൂടുതൽ ഫലങ്ങൾ ലോഡ് ചെയ്യുന്നു..." : "Loading more draws..."}
                </Text>
              </View>
            ) : (
              <View style={{ height: 40 }} />
            )
          }
        />
      )}

      {/* Floating Gemini AI Button */}
      <GeminiAiFloatingButton onPress={() => setIsAiAssistantOpen(true)} />

      {/* AI Voice Assistant Modal */}
      <AiVoiceAssistantModal
        visible={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />

      {/* AI Social Digest Modal */}
      <AiSocialDigestModal
        visible={isAiDigestOpen}
        onClose={() => setIsAiDigestOpen(false)}
        drawData={allDraws[0] || {}}
      />

      {/* Language Selection Dropdown Modal */}
      <Modal
        visible={showLangDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLangDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setShowLangDropdown(false)}
        >
          <View style={[styles.dropdownBox, { marginTop: insets.top + 48 }]}>
            <View style={styles.dropdownHeader}>
              <Globe size={13} color={COLORS.textLight} />
              <Text style={styles.dropdownHeaderText}>{t("change_language")}</Text>
            </View>

            {SUPPORTED_LANGUAGES.map((item) => {
              const isActive = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.langItem, isActive && styles.langItemActive]}
                  onPress={() => {
                    triggerLightHaptic();
                    setLanguage(item.code);
                    setShowLangDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 16 }}>{item.flag}</Text>
                    <View>
                      <Text
                        style={[
                          styles.langItemTitle,
                          isActive && { color: COLORS.primary, fontWeight: "700" },
                        ]}
                      >
                        {item.nativeName}
                      </Text>
                      <Text style={styles.langItemSub}>
                        {item.name} ({item.shortCode})
                      </Text>
                    </View>
                  </View>
                  {isActive && (
                    <Check size={16} color={COLORS.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Side Menu Drawer Modal */}
      <SideMenuDrawerModal
        visible={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        navigation={navigation}
      />

      {/* Direct Notification Settings Modal */}
      <NotificationSettingsModal
        visible={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  appName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 22,
  },
  appSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    lineHeight: 15,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langBtn: {
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  menuBtn: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 60,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  topSectionContainer: {
    marginBottom: 14,
  },

  // Top Full Width Card
  topFullCard: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  topCardBlue: {
    backgroundColor: "#0B539C",
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 90,
  },
  // Top Card Diagonal Corner Ribbon
  topCornerRibbonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 62,
    height: 62,
    overflow: "hidden",
    zIndex: 10,
    borderTopLeftRadius: 12,
  },
  topCornerRibbon: {
    position: "absolute",
    top: 10,
    left: -22,
    width: 82,
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  ribbonPublished: {
    backgroundColor: "#DC2626",
  },
  ribbonPending: {
    backgroundColor: "#DC2626",
  },
  topCornerRibbonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  // Grid Card Diagonal Corner Ribbon
  gridCornerRibbonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    overflow: "hidden",
    zIndex: 10,
    borderTopLeftRadius: 12,
  },
  gridCornerRibbon: {
    position: "absolute",
    top: 7,
    left: -19,
    width: 64,
    backgroundColor: "#DC2626",
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 2,
    elevation: 3,
  },
  gridCornerRibbonText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  topCodeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  topCodeBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  topCardLotteryName: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.7,
    marginTop: 4,
  },
  topCardBottomWhite: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topCardDateText: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.4,
  },

  // 2-Column Grid Cards (50% / 50%)
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2.5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardTopBlue: {
    backgroundColor: "#0B539C",
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 78,
  },
  codeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  codeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  cardLotteryName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  cardBottomWhite: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDateText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  // Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  totalBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  totalBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },

  // Loading & Footer
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerLoaderText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },

  // Dropdown Modal
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  dropdownBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 6,
    width: 195,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownHeader: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dropdownHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 2,
  },
  langItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  langItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  langItemSub: {
    fontSize: 10,
    color: COLORS.textLight,
  },
});
