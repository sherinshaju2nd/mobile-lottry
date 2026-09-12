import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  AppState,
  AppStateStatus,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  ArrowLeft,
  Search,
  XCircle,
  FileText,
  Trophy,
  Calendar,
  MapPin,
  Star,
  Copy,
  Check,
  Sparkles,
  Clock,
  Tag,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  ALL_LOTTERIES,
  BUMPER_LOTTERIES,
  getLotteryTranslatedName,
  getDayTranslated,
  getDrawTimeDisplay,
  LotteryMeta,
} from "../constants/lotteries";
import { isIndic } from "../constants/translations";
import { fetchLotteryHistory, DrawResult, supabase } from "../api/lotteryApi";
import { useLanguage } from "../context/LanguageContext";
import { isLotteryFavorite, toggleFavoriteLottery } from "../utils/favorites";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

export default function LotteryArchiveScreen({ route, navigation }: any) {
  const { t, language } = useLanguage();
  const rawCode =
    route.params?.code ||
    route.params?.lotteryCode ||
    route.params?.lottery_code ||
    "BT";
  const codeUpper = String(rawCode).trim().toUpperCase();

  const lotteryMeta: LotteryMeta =
    ALL_LOTTERIES.find((l) => l.code === codeUpper) || {
      name: `${codeUpper} Lottery`,
      nameMl: "",
      code: codeUpper,
      day: "Scheduled Draw",
      drawTime: getDrawTimeDisplay(false),
    };

  const isBumper = Boolean(
    lotteryMeta?.isBumper ||
      BUMPER_LOTTERIES.some((b) => b.code.toUpperCase() === codeUpper)
  );

  const todayISTDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [history, setHistory] = useState<DrawResult[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<DrawResult[]>([]);
  const [lotteryDbMeta, setLotteryDbMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);

  // Load favorite status
  useEffect(() => {
    isLotteryFavorite(codeUpper).then(setIsFavorite);
  }, [codeUpper]);

  const handleToggleFavorite = async () => {
    triggerLightHaptic();
    const res = await toggleFavoriteLottery(codeUpper);
    setIsFavorite(res.isFavorite);
  };

  const handleCopyTicket = (ticket: string) => {
    if (!ticket || ticket === "N/A") return;
    triggerSuccessHaptic();
    setCopiedTicket(ticket);
    setTimeout(() => {
      setCopiedTicket(null);
    }, 2000);
  };

  useEffect(() => {
    async function loadHistory(isSilent = false) {
      if (!isSilent) setIsLoading(true);
      try {
        const [results, lotRes] = await Promise.all([
          fetchLotteryHistory(codeUpper),
          supabase
            .from("lotteries")
            .select("*")
            .eq("code", codeUpper)
            .maybeSingle(),
        ]);
        setHistory(results);
        setFilteredHistory(results);
        if (lotRes.data) {
          setLotteryDbMeta(lotRes.data);
        }
      } catch {
        if (!isSilent) {
          setHistory([]);
          setFilteredHistory([]);
        }
      } finally {
        if (!isSilent) setIsLoading(false);
      }
    }
    loadHistory();

    const channelName = `realtime-archive-${codeUpper}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draw_results" },
        (payload) => {
          const newRow = payload.new as any;
          if (
            !newRow ||
            !newRow.lottery_code ||
            newRow.lottery_code.toUpperCase() === codeUpper
          ) {
            loadHistory(true);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lotteries" },
        () => {
          loadHistory(true);
        }
      )
      .subscribe();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        loadHistory(true);
      }
    };
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      channel.unsubscribe();
      appStateSub.remove();
    };
  }, [codeUpper]);

  useEffect(() => {
    if (!searchFilter.trim()) {
      setFilteredHistory(history);
    } else {
      const q = searchFilter.toLowerCase().trim();
      const filtered = history.filter(
        (d) =>
          d.draw_date.toLowerCase().includes(q) ||
          d.draw_code?.toLowerCase().includes(q) ||
          (d.first?.ticket ? d.first.ticket.toLowerCase().includes(q) : false) ||
          (d.first?.location ? d.first.location.toLowerCase().includes(q) : false)
      );
      setFilteredHistory(filtered);
    }
  }, [searchFilter, history]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const displayName = getLotteryTranslatedName(codeUpper, language) || lotteryMeta.name;
  const jackpotText =
    lotteryDbMeta?.jackpot ||
    (lotteryMeta as any)?.jackpot ||
    (isBumper ? "₹25 Crore" : "₹1 Crore");
  const drawTimeDisplay =
    lotteryDbMeta?.draw_time ||
    lotteryMeta.drawTime ||
    (isBumper ? "2:00 PM" : "3:00 PM");
  const ticketPriceText =
    lotteryDbMeta?.ticket_price ||
    (lotteryMeta as any)?.ticket_price ||
    (isBumper ? "₹500" : "₹50");

  const renderItem = ({ item }: { item: DrawResult }) => {
    const isCopied = copiedTicket === item.first?.ticket;
    const firstAmount =
      (item.prizes?.amounts as any)?.["1st"] || jackpotText;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          triggerLightHaptic();
          navigation.navigate("DrawBreakdown", {
            code: item.lottery_code,
            date: item.draw_date,
          });
        }}
      >
        {/* Card Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.datePill}>
            <Calendar size={13} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDateDisplay(item.draw_date)}</Text>
          </View>
          <View style={styles.drawCodeChip}>
            <Text style={styles.drawCodeText}>{item.draw_code}</Text>
          </View>
        </View>

        {/* Lottery Title */}
        <Text style={styles.drawCardTitle} numberOfLines={1}>
          {displayName}
        </Text>

        {/* High-Contrast 1st Prize Winner Banner */}
        <View style={styles.winnerCard}>
          <View style={styles.winnerCardHeader}>
            <View style={styles.winnerBadgePill}>
              <Trophy size={13} color="#B45309" />
              <Text style={styles.winnerBadgeText}>{t("winning_1st_ticket")}</Text>
            </View>
            {item.first?.ticket && item.first.ticket !== "N/A" && (
              <TouchableOpacity
                style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                onPress={() => handleCopyTicket(item.first!.ticket!)}
                activeOpacity={0.7}
              >
                {isCopied ? (
                  <>
                    <Check size={11} color="#065F46" />
                    <Text style={styles.copyBtnTextSuccess}>
                      {language === "ml" ? "കോപ്പി ചെയ്തു" : "Copied"}
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={11} color="#334155" />
                    <Text style={styles.copyBtnText}>
                      {language === "ml" ? "കോപ്പി" : "Copy"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* High Contrast Bold Ticket Number */}
          <Text style={styles.winnerTicketNumber} numberOfLines={1}>
            {item.first?.ticket || "Pending / N/A"}
          </Text>

          {/* Winner Metadata (Location / Amount) */}
          <View style={styles.winnerMetaRow}>
            {item.first?.location && item.first.location !== "N/A" && (
              <View style={styles.metaLocationPill}>
                <MapPin size={12} color="#0B3C5D" />
                <Text style={styles.metaLocationText} numberOfLines={1}>
                  {item.first.location}
                </Text>
              </View>
            )}
            {firstAmount ? (
              <View style={styles.metaPrizePill}>
                <Sparkles size={12} color="#047857" />
                <Text style={styles.metaPrizeText}>{firstAmount}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Footer Button */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerActionText}>
            {t("view_full_archive_item")}
          </Text>
          <View style={styles.footerArrowBox}>
            <ChevronRight size={14} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              triggerLightHaptic();
              navigation.goBack();
            }}
            activeOpacity={0.75}
          >
            <ArrowLeft size={20} color={COLORS.textDark} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text
                style={[
                  styles.headerTitle,
                  isIndic(language) && { fontSize: 16.5, lineHeight: 24 },
                ]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{codeUpper}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.headerSubtitle,
                isIndic(language) && { fontSize: 11.5 },
              ]}
              numberOfLines={1}
            >
              {t("draw_day")}: {getDayTranslated(lotteryMeta.day, language)} •{" "}
              {filteredHistory.length} {t("draws_count_suffix")}
            </Text>
          </View>

          {/* Star / Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
            onPress={handleToggleFavorite}
            activeOpacity={0.75}
          >
            <Star
              size={18}
              color={isFavorite ? "#D97706" : COLORS.textMuted}
              fill={isFavorite ? "#D97706" : "none"}
            />
          </TouchableOpacity>
        </View>

        {/* Hero Meta Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroJackpotBox}>
              <Trophy size={16} color="#D97706" />
              <Text style={styles.heroJackpotLabel}>
                {language === "ml" ? "ഒന്നാം സമ്മാനം" : "1st Prize Jackpot"}
              </Text>
              <Text style={styles.heroJackpotValue}>{jackpotText}</Text>
            </View>

            <View style={styles.heroInfoPillsColumn}>
              <View style={styles.heroInfoPill}>
                <Clock size={12} color={COLORS.primary} />
                <Text style={styles.heroInfoPillText}>{drawTimeDisplay}</Text>
              </View>
              <View style={styles.heroInfoPill}>
                <Tag size={12} color="#047857" />
                <Text style={[styles.heroInfoPillText, { color: "#047857" }]}>
                  {ticketPriceText}
                </Text>
              </View>
            </View>
          </View>

          {/* Announced Next Draw Banner */}
          {lotteryDbMeta?.draw_date && lotteryDbMeta.draw_date >= todayISTDate && (
            <TouchableOpacity
              style={styles.upcomingBanner}
              activeOpacity={0.85}
              onPress={() => {
                triggerLightHaptic();
                navigation.navigate("DrawBreakdown", {
                  code: codeUpper,
                  date: lotteryDbMeta.draw_date,
                });
              }}
            >
              <View style={styles.upcomingBadge}>
                <Sparkles size={11} color="#92400E" />
                <Text style={styles.upcomingBadgeText}>
                  {lotteryDbMeta.draw_date === todayISTDate
                    ? t("draws_today")
                    : `${t("next_draw")}: ${formatDateDisplay(lotteryDbMeta.draw_date)}`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={styles.upcomingCtaText}>
                  {language === "ml" ? "കാണുക" : "View"}
                </Text>
                <ChevronRight size={14} color="#D97706" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.filterContainer}>
          <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.filterInput}
            placeholder={t("search_draws_placeholder")}
            placeholderTextColor={COLORS.textLight}
            value={searchFilter}
            onChangeText={setSearchFilter}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchFilter !== "" && (
            <TouchableOpacity
              onPress={() => setSearchFilter("")}
              style={{ padding: 4 }}
            >
              <XCircle size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Draws List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {language === "ml"
                ? "ഫലങ്ങൾ ശേഖരിക്കുന്നു..."
                : "Loading draw results..."}
            </Text>
          </View>
        ) : filteredHistory.length > 0 ? (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item: DrawResult) => `${item.lottery_code}-${item.draw_date}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === "android"}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <FileText size={32} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {language === "ml" ? "ഫലങ്ങൾ കണ്ടെത്താനായില്ല" : "No Draws Found"}
            </Text>
            <Text style={styles.emptySubtext}>{t("no_archive_matches")}</Text>
            {searchFilter !== "" && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchFilter("")}
              >
                <Text style={styles.clearSearchBtnText}>
                  {language === "ml" ? "ഫിൽട്ടർ ഒഴിവാക്കുക" : "Clear Search"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Header Bar
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 1,
  },
  codeBadge: {
    backgroundColor: COLORS.chipBlueBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.chipBlueText,
  },
  favoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteBtnActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroJackpotBox: {
    flex: 1,
  },
  heroJackpotLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroJackpotValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  heroInfoPillsColumn: {
    gap: 6,
    alignItems: "flex-end",
  },
  heroInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  heroInfoPillText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.primary,
  },

  // Upcoming Banner inside Hero
  upcomingBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1.2,
    borderColor: "#BBF7D0",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  upcomingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },
  upcomingCtaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },

  // Filter Input Bar
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "600",
  },

  // List & Cards
  listContainer: {
    gap: 12,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  drawCodeChip: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  drawCodeText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#0369A1",
    letterSpacing: 0.4,
  },
  drawCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 10,
  },

  // High-Contrast Winner Box
  winnerCard: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 14,
    marginBottom: 11,
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
  },
  winnerCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  winnerBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  winnerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  copyBtnSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
  },
  copyBtnTextSuccess: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
  },
  winnerTicketNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1.2,
    marginVertical: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  winnerMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    marginTop: 6,
  },
  metaLocationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  metaLocationText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#334155",
  },
  metaPrizePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  metaPrizeText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#15803D",
  },

  // Action Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerActionText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: COLORS.primary,
  },
  footerArrowBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty & Loading States
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearSearchBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
});
