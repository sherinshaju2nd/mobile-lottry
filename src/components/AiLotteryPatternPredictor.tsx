import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Sparkles,
  Flame,
  Copy,
  CheckCircle2,
  Brain,
  Filter,
  ChevronDown,
  ChevronUp,
  Share2,
  Zap,
  Star,
  Trophy,
  Table,
  Scale,
  Repeat,
  RotateCw,
  Info,
} from "lucide-react-native";

import {
  DrawResult,
  LotteryAiPatternAnalysis,
  fetchAiPatternPredictionMobile,
  getCachedAiPatternPrediction,
} from "../api/lotteryApi";
import { WEEKLY_LOTTERIES, LotteryMeta } from "../constants/lotteries";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  allDraws: DrawResult[];
  lang?: string;
}

export default function AiLotteryPatternPredictor({ allDraws, lang = "en" }: Props) {
  const isMl = lang === "ml";

  const [selectedLotteryCode, setSelectedLotteryCode] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LotteryAiPatternAnalysis | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cacheWarning, setCacheWarning] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [rawDatasetOpen, setRawDatasetOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // All lottery options (Weekly lotteries only)
  const lotteryOptions = useMemo(() => {
    return [
      {
        code: "ALL",
        name: isMl ? "എല്ലാ ആഴ്ച നറുക്കെടുപ്പുകളും" : "All Weekly Lotteries (Collective)",
        day: isMl ? "മൾട്ടി-വീക്ക് സ്റ്റഡി" : "Multi-Week Cross-Analysis",
        isBumper: false,
      },
      ...WEEKLY_LOTTERIES.map((l: LotteryMeta) => ({
        code: l.code,
        name: isMl ? `${l.nameMl} (${l.name})` : l.name,
        day: isMl ? `${l.day}` : `${l.day}s`,
        isBumper: false,
      })),
    ];
  }, [isMl]);

  const currentLottery = useMemo(() => {
    return (
      lotteryOptions.find((o) => o.code === selectedLotteryCode) ||
      lotteryOptions[0]
    );
  }, [lotteryOptions, selectedLotteryCode]);

  // Filter draws available in memory for selected lottery
  const availableDraws = useMemo(() => {
    if (selectedLotteryCode === "ALL") {
      return allDraws;
    }
    return allDraws.filter(
      (d) =>
        d.lottery_code?.toUpperCase() === selectedLotteryCode.toUpperCase() ||
        d.draw_code?.toUpperCase().startsWith(selectedLotteryCode.toUpperCase())
    );
  }, [allDraws, selectedLotteryCode]);

  // Auto-check DB cache on lottery selection
  useEffect(() => {
    let isMounted = true;
    async function checkDbCache() {
      if (availableDraws.length === 0) return;
      try {
        const cached = await getCachedAiPatternPrediction(selectedLotteryCode);
        if (isMounted) {
          if (cached && cached.analysis) {
            setAnalysis(cached.analysis);
            setIsCached(true);
            setCacheWarning(null);
          } else {
            setAnalysis(null);
            setIsCached(false);
            setCacheWarning(null);
          }
        }
      } catch (e) {
        console.warn("Mobile auto cache check error:", e);
      }
    }

    checkDbCache();
    return () => {
      isMounted = false;
    };
  }, [selectedLotteryCode, availableDraws.length]);

  // Trigger Gemini AI Pattern Analysis
  const handleAnalyze = useCallback(
    async (forceRefresh = false) => {
      triggerLightHaptic();
      setLoading(true);
      setError(null);
      setCacheWarning(null);

      try {
        const result = await fetchAiPatternPredictionMobile(
          currentLottery.name,
          selectedLotteryCode,
          availableDraws,
          lang,
          forceRefresh
        );

        if (!result.success || !result.analysis) {
          throw new Error("Failed to generate AI analysis.");
        }

        setAnalysis(result.analysis);
        setIsCached(Boolean(result.cached));
        setCacheWarning(result.warning || null);
        triggerSuccessHaptic();
      } catch (err: any) {
        console.error("AI Pattern analysis error on mobile:", err);
        setError(
          err?.message ||
            (isMl
              ? "വിശകലനം നടത്താൻ സാധിച്ചില്ല. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക."
              : "Could not generate analysis. Please try again in a moment.")
        );
      } finally {
        setLoading(false);
      }
    },
    [currentLottery, selectedLotteryCode, availableDraws, lang, isMl]
  );

  // Handle Copy Number to Clipboard with Haptics
  const handleCopy = async (text: string) => {
    triggerLightHaptic();
    await Clipboard.setStringAsync(text);
    setCopiedNumber(text);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // WhatsApp Share Builder
  const handleWhatsAppShare = () => {
    if (!analysis) return;
    triggerLightHaptic();

    const hotList = (analysis.hot_digits?.overall || [])
      .slice(0, 5)
      .map((h, i) => `#${i + 1} Digit ${h.digit} (${h.frequency_pct}%)`)
      .join(", ");

    const predictedList = (analysis.top_predicted_numbers || [])
      .slice(0, 4)
      .map((p) => `🎯 ${p.number} (${p.category})`)
      .join("\n");

    const shareText = isMl
      ? `🤖 *കേരള ലോട്ടറി AI പാറ്റേൺ & ഡിജിറ്റ് പ്രവചനങ്ങൾ*\n📌 *ലോട്ടറി:* ${currentLottery.name}\n\n🔥 *ഹോട്ട് ഡിജിറ്റുകൾ:* ${hotList}\n\n🎯 *ശുപാർശ ചെയ്യുന്ന നമ്പർ പാറ്റേണുകൾ:*\n${predictedList}\n\n📊 *സംഗ്രഹം:* ${analysis.summary_ml || analysis.summary}\n\nകൂടുതൽ വിവരങ്ങൾക്ക്: https://www.keralalotteryresultstoday.in/analytics`
      : `🤖 *Kerala Lottery Gemini AI Pattern Predictions*\n📌 *Lottery:* ${currentLottery.name}\n\n🔥 *Hot Digits:* ${hotList}\n\n🎯 *Predicted Number Patterns:*\n${predictedList}\n\n📊 *Summary:* ${analysis.summary}\n\nCheck full analytics: https://www.keralalotteryresultstoday.in/analytics`;

    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`);
      });
  };

  // Filter predicted numbers by category tab
  const filteredPredictions = useMemo(() => {
    if (!analysis?.top_predicted_numbers) return [];
    if (selectedCategory === "all") return analysis.top_predicted_numbers;
    return analysis.top_predicted_numbers.filter((p) => {
      if (selectedCategory === "doubles") return p.category === "Double Pattern";
      if (selectedCategory === "2nd_6th") return p.category === "2nd/6th Target";
      if (selectedCategory === "hot") return p.category === "Hot 4-Digit";
      if (selectedCategory === "sum") return p.category === "Balanced Sum";
      return true;
    });
  }, [analysis, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Top Banner & Lottery Selector Card */}
      <View style={styles.cardContainer}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeftCol}>
            <View style={styles.brainIconBox}>
              <Brain size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text style={styles.mainTitle}>
                  {isMl ? "AI പാറ്റേൺ & ഡിജിറ്റ് പ്രവചനങ്ങൾ" : "Gemini AI Pattern & Digit Predictor"}
                </Text>
                <View style={styles.aiBadge}>
                  <Sparkles size={11} color="#7C3AED" />
                  <Text style={styles.aiBadgeText}>Gemini 3.7 AI</Text>
                </View>
              </View>
              <Text style={styles.subTitle}>
                {isMl
                  ? "ലോട്ടറി ഫലങ്ങളുടെ ചരിത്രം പഠിച്ച് 2-ാം, 6-ാം സമ്മാന പാറ്റേണുകൾ, ഹോട്ട് ഡിജിറ്റുകൾ, ഡബിൾ നമ്പറുകൾ കണ്ടെത്തുക."
                  : "Cross-draw statistical frequency analysis, hot digit vectors, double repeating patterns, and 2nd & 6th prize strategies."}
              </Text>
            </View>
          </View>
        </View>

        {/* Historical Draws Count Chip */}
        <View style={styles.drawsCountRow}>
          <View
            style={[
              styles.drawCountChip,
              availableDraws.length > 0 ? styles.drawCountChipGreen : styles.drawCountChipRed,
            ]}
          >
            <Table size={13} color={availableDraws.length > 0 ? "#16A34A" : "#DC2626"} />
            <Text
              style={[
                styles.drawCountText,
                { color: availableDraws.length > 0 ? "#15803D" : "#DC2626" },
              ]}
            >
              {availableDraws.length} {isMl ? "ഫലങ്ങൾ റെക്കോർഡിൽ" : "Historical Draws Loaded"}
            </Text>
          </View>
        </View>

        {/* Lottery Selector Horizontal Carousel */}
        <View style={styles.lotterySelectorSection}>
          <Text style={styles.selectorLabel}>
            {isMl ? "1. വിശകലനം ചെയ്യേണ്ട ലോട്ടറി തിരഞ്ഞെടുക്കുക:" : "1. Select Weekly Lottery to Analyze:"}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lotteryScrollContent}
          >
            {lotteryOptions.map((opt) => {
              const isSelected = selectedLotteryCode === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[
                    styles.lotteryChip,
                    isSelected ? styles.lotteryChipActive : styles.lotteryChipInactive,
                  ]}
                  onPress={() => {
                    triggerLightHaptic();
                    setSelectedLotteryCode(opt.code);
                    if (opt.code !== selectedLotteryCode) {
                      setAnalysis(null);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.lotteryChipName,
                      isSelected ? styles.lotteryChipNameActive : styles.lotteryChipNameInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {opt.name}
                  </Text>
                  <Text
                    style={[
                      styles.lotteryChipDay,
                      isSelected ? styles.lotteryChipDayActive : styles.lotteryChipDayInactive,
                    ]}
                  >
                    {opt.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Action Button Row */}
        <View style={styles.actionRow}>
          <View style={styles.targetInfoRow}>
            <Filter size={15} color="#64748B" />
            <Text style={styles.targetInfoText} numberOfLines={1}>
              {isMl
                ? `${currentLottery.name} (${availableDraws.length} നറുക്കെടുപ്പുകൾ)`
                : `${currentLottery.name} (${availableDraws.length} draws)`}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeBtn,
              (loading || availableDraws.length === 0) && styles.analyzeBtnDisabled,
            ]}
            onPress={() => handleAnalyze(false)}
            disabled={loading || availableDraws.length === 0}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
            ) : (
              <Sparkles size={16} color="#FDE047" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.analyzeBtnText}>
              {loading
                ? isMl
                  ? "AI വിശകലനം ചെയ്യുന്നു..."
                  : "Analyzing Patterns..."
                : isMl
                ? "Gemini AI വിശകലനം ആരംഭിക്കുക"
                : "Analyze with Gemini AI"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Alert */}
      {error && (
        <View style={styles.errorAlert}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => handleAnalyze(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>{isMl ? "വീണ്ടും ശ്രമിക്കുക" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Skeleton Indicator */}
      {loading && (
        <View style={styles.loadingCard}>
          <View style={styles.loadingSpinnerCircle}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
          <Text style={styles.loadingTitle}>
            {isMl
              ? "Gemini AI ലോട്ടറി ഡാറ്റ വിശകലനം ചെയ്യുന്നു..."
              : "Gemini AI is Processing Multi-Week Records..."}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {isMl
              ? "ഹോട്ട് ഡിജിറ്റുകൾ, 2-ാം/6-ാം സമ്മാന പാറ്റേണുകൾ, ഡബിൾ നമ്പറുകൾ എന്നിവ ഗണിതശാസ്ത്രപരമായി കണക്കാക്കുന്നു."
              : "Calculating digit frequency distributions, positional vectors, high-value sum bands, and double repetition patterns."}
          </Text>
        </View>
      )}

      {/* Analysis Results View */}
      {analysis && !loading && (
        <View style={styles.resultsWrapper}>
          {/* Executive AI Summary Card */}
          <View style={styles.summaryDarkCard}>
            <View style={styles.summaryHeaderRow}>
              <View style={styles.summaryBadgeGroup}>
                <View style={styles.goldSummaryChip}>
                  <Zap size={13} color="#FACC15" />
                  <Text style={styles.goldSummaryChipText}>
                    {isMl ? "AI സംഗ്രഹം & ട്രെൻഡുകൾ" : "EXECUTIVE PATTERN SUMMARY"}
                  </Text>
                </View>

                {isCached ? (
                  <View style={styles.cachedChip}>
                    <CheckCircle2 size={12} color="#4ADE80" />
                    <Text style={styles.cachedChipText}>
                      {isMl ? "ഡാറ്റാബേസ് കാഷെ (Instant)" : "DB Cached Analysis"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.freshAiChip}>
                    <Sparkles size={12} color="#C4B5FD" />
                    <Text style={styles.freshAiChipText}>
                      {isMl ? "പുതിയ AI വിശകലനം" : "Fresh AI Analysis"}
                    </Text>
                  </View>
                )}

                <Text style={styles.drawsEvaluatedText}>
                  {analysis.sample_draws_count} {isMl ? "നറുക്കെടുപ്പുകൾ" : "Draws Evaluated"}
                </Text>
              </View>

              <View style={styles.summaryActionBtns}>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handleWhatsAppShare}
                  activeOpacity={0.8}
                >
                  <Share2 size={13} color="#25D366" />
                  <Text style={styles.shareBtnText}>{isMl ? "പങ്കുവെക്കുക" : "Share"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refreshIconBtn}
                  onPress={() => handleAnalyze(true)}
                  activeOpacity={0.8}
                >
                  <RotateCw size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {cacheWarning && (
              <View style={styles.warningBanner}>
                <Info size={13} color="#7DD3FC" />
                <Text style={styles.warningBannerText}>{cacheWarning}</Text>
              </View>
            )}

            <Text style={styles.summaryBodyText}>
              {isMl && analysis.summary_ml ? analysis.summary_ml : analysis.summary}
            </Text>
          </View>

          {/* Section: Top AI Recommended Candidate Numbers */}
          <View style={styles.cardContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconBoxGreen}>
                <Sparkles size={20} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {isMl ? "AI ശുപാർശ ചെയ്യുന്ന മുൻനിര നമ്പറുകൾ" : "Top AI Recommended Candidate Numbers"}
                </Text>
                <Text style={styles.sectionSub}>
                  {isMl
                    ? "ഹോട്ട് ഡിജിറ്റുകളും ഡബിൾ പാറ്റേണുകളും സംയോജിപ്പിച്ചുള്ള നമ്പറുകൾ"
                    : "Ranked combination formulas by mathematical probability score."}
                </Text>
              </View>
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {[
                { key: "all", label: isMl ? "എല്ലാം" : "All" },
                { key: "doubles", label: isMl ? "ഡബിൾസ്" : "Doubles" },
                { key: "2nd_6th", label: isMl ? "2nd/6th" : "2nd/6th Target" },
                { key: "hot", label: isMl ? "ഹോട്ട് 4" : "Hot 4-Digit" },
                { key: "sum", label: isMl ? "ബാലൻസ്ഡ്" : "Balanced Sum" },
              ].map((c) => {
                const isActive = selectedCategory === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                    onPress={() => {
                      triggerLightHaptic();
                      setSelectedCategory(c.key);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isActive && styles.categoryChipTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* List of Number Ticket Cards */}
            <View style={styles.predictionsList}>
              {filteredPredictions.map((pred, i) => {
                const isCopied = copiedNumber === pred.number;
                return (
                  <View key={i} style={styles.predictionCard}>
                    <View style={styles.predCardHeader}>
                      <View style={styles.predCategoryPill}>
                        <Text style={styles.predCategoryText}>{pred.category}</Text>
                      </View>
                      <View style={styles.predConfPill}>
                        <Text style={styles.predConfText}>
                          {pred.confidence_score || 85}% Conf.
                        </Text>
                      </View>
                    </View>

                    {/* Big Ticket Display */}
                    <View style={styles.ticketBox}>
                      <Text style={styles.ticketDigitsText}>{pred.number}</Text>

                      <TouchableOpacity
                        style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                        onPress={() => handleCopy(pred.number)}
                        activeOpacity={0.7}
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 size={14} color="#16A34A" />
                            <Text style={styles.copiedBadgeText}>{isMl ? "കോപ്പി ചെയ്തു!" : "Copied!"}</Text>
                          </>
                        ) : (
                          <>
                            <Copy size={14} color="#334155" />
                            <Text style={styles.copyBtnLabel}>{isMl ? "കോപ്പി" : "Copy"}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.predRationaleText}>{pred.rationale}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section: Hot Digits & Positional Matrix */}
          <View style={styles.cardContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconBoxRed}>
                <Flame size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {isMl ? "ഹോട്ട് ഡിജിറ്റുകൾ (Hot Digits 0-9)" : "Hot Digits & Frequency Ranking"}
                </Text>
                <Text style={styles.sectionSub}>
                  {isMl ? "കൂടുതൽ തവണ ആവർത്തിച്ചു വന്ന അക്കങ്ങൾ" : "Top recurring digits across all drawn prize tiers"}
                </Text>
              </View>
            </View>

            {/* Hot Digits Pills */}
            <View style={styles.hotDigitsGrid}>
              {(analysis.hot_digits?.overall || []).map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.hotDigitPill,
                    i === 0
                      ? styles.hotDigitPillRank1
                      : i <= 2
                      ? styles.hotDigitPillRankTop3
                      : styles.hotDigitPillNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.hotDigitNumber,
                      { color: i === 0 ? "#DC2626" : i <= 2 ? "#D97706" : "#334155" },
                    ]}
                  >
                    {h.digit}
                  </Text>
                  <View>
                    <Text
                      style={[
                        styles.hotDigitLabel,
                        { color: i === 0 ? "#B91C1C" : "#64748B" },
                      ]}
                    >
                      {h.label || "Hot"}
                    </Text>
                    <Text style={styles.hotDigitFreq}>{h.frequency_pct}% freq</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Positional Recommendations Matrix */}
            {analysis.hot_digits?.positional && (
              <View style={styles.positionalSection}>
                <Text style={styles.positionalTitle}>
                  {isMl ? "സ്ഥാനം അനുസരിച്ചുള്ള സാധ്യതകൾ (Positional Matrix):" : "Positional Digit Predictions:"}
                </Text>

                <View style={styles.positionalGrid}>
                  {[
                    {
                      pos: isMl ? "1-ാം അക്കം" : "1st Digit",
                      nums: analysis.hot_digits.positional.first_pos || [],
                    },
                    {
                      pos: isMl ? "2-ാം അക്കം" : "2nd Digit",
                      nums: analysis.hot_digits.positional.second_pos || [],
                    },
                    {
                      pos: isMl ? "3-ാം അക്കം" : "3rd Digit",
                      nums: analysis.hot_digits.positional.third_pos || [],
                    },
                    {
                      pos: isMl ? "അവസാന അക്കം" : "Last Digit",
                      nums: analysis.hot_digits.positional.last_pos || [],
                    },
                  ].map((p, idx) => (
                    <View key={idx} style={styles.positionalBox}>
                      <Text style={styles.positionalBoxLabel}>{p.pos}</Text>
                      <Text style={styles.positionalBoxNums}>
                        {p.nums.join(", ") || "-"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Section: Double Number Patterns & Symmetrical Structure */}
          <View style={styles.cardContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconBoxIndigo}>
                <Repeat size={20} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {isMl ? "ഡബിൾ & റിപ്പീറ്റിംഗ് പാറ്റേണുകൾ" : "Double & Repeating Patterns"}
                </Text>
                <Text style={styles.sectionSub}>
                  {isMl ? "തുടർച്ചയായ ജോഡികളും മിറർ പ്രതിഫലനങ്ങളും" : "Consecutive pairs (AA), mirror reflections (ABBA), & repeats"}
                </Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {(analysis.double_patterns || []).map((d, i) => (
                <View key={i} style={styles.doublePatternCard}>
                  <View style={styles.doublePatternHeader}>
                    <Text style={styles.doublePatternTitle}>{d.pattern}</Text>
                    <View style={styles.doubleFreqPill}>
                      <Text style={styles.doubleFreqText}>{d.historical_frequency || "Active"}</Text>
                    </View>
                  </View>
                  <Text style={styles.doublePatternDesc}>{d.description}</Text>

                  {/* Sample copyable numbers */}
                  {d.recommended_examples && d.recommended_examples.length > 0 && (
                    <View style={styles.picksRow}>
                      <Text style={styles.picksLabel}>{isMl ? "ഉദാഹരണങ്ങൾ:" : "Picks:"}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {d.recommended_examples.map((num, idx) => {
                          const isCopied = copiedNumber === num;
                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[styles.pickChip, isCopied && styles.pickChipCopied]}
                              onPress={() => handleCopy(num)}
                              activeOpacity={0.7}
                            >
                              {isCopied ? (
                                <CheckCircle2 size={12} color="#16A34A" />
                              ) : (
                                <Copy size={11} color="#64748B" />
                              )}
                              <Text style={styles.pickChipText}>{num}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Section: 4-5 Target Strategy Patterns (2nd & 6th Prize Focus) */}
          <View style={styles.cardContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconBoxAmber}>
                <Trophy size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {isMl
                    ? "2-ാം, 6-ാം സമ്മാനങ്ങൾ ലക്ഷ്യമിട്ടുള്ള സ്ട്രാറ്റജികൾ"
                    : "Target Strategy Patterns (Focus: 2nd & 6th Prize)"}
                </Text>
                <Text style={styles.sectionSub}>
                  {isMl
                    ? "മുൻകാല ഗസറ്റ് ഫലങ്ങളിലെ അവസാന 4-അക്കങ്ങളുടെയും 2-ാം സമ്മാനങ്ങളുടെയും ഘടനാപരമായ വിശകലനം."
                    : "High probability mathematical formulas for 4-digit last numbers based on repeating historical distributions."}
                </Text>
              </View>
            </View>

            <View style={{ gap: 14 }}>
              {(analysis.prize_focus_patterns?.key_patterns || []).map((pattern, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.strategyCard,
                    idx === 0 && styles.strategyCardFeatured,
                  ]}
                >
                  <View style={styles.strategyHeader}>
                    <Text style={styles.strategyTitle}>{pattern.title}</Text>
                    <View style={styles.rankPill}>
                      <Star size={12} color="#D97706" />
                      <Text style={styles.rankPillText}>
                        Rank #{pattern.probability_rank || idx + 1}
                      </Text>
                    </View>
                  </View>

                  {/* Formula / Structure */}
                  <View style={styles.formulaBox}>
                    <Text style={styles.formulaLabel}>
                      {isMl ? "പാറ്റേൺ ഫോർമുല:" : "Pattern Structure:"}
                    </Text>
                    <Text style={styles.formulaText}>{pattern.pattern_structure}</Text>
                  </View>

                  <Text style={styles.strategyReasoning}>{pattern.reasoning}</Text>

                  {/* Target Numbers */}
                  <View style={styles.targetNumbersSection}>
                    <Text style={styles.targetNumbersLabel}>
                      {isMl ? "ലക്ഷ്യമിടുന്ന നമ്പറുകൾ (Target Picks):" : "Recommended Numbers:"}
                    </Text>
                    <View style={styles.targetNumbersRow}>
                      {(pattern.predicted_numbers || []).map((num, nIdx) => {
                        const isCopied = copiedNumber === num;
                        return (
                          <TouchableOpacity
                            key={nIdx}
                            style={[
                              styles.targetNumberChip,
                              isCopied && styles.targetNumberChipCopied,
                            ]}
                            onPress={() => handleCopy(num)}
                            activeOpacity={0.7}
                          >
                            {isCopied ? (
                              <CheckCircle2 size={14} color="#16A34A" />
                            ) : (
                              <Copy size={13} color="#2563EB" />
                            )}
                            <Text style={styles.targetNumberDigits}>{num}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Section: High-Value Sum Range & Parity Balance */}
          {analysis.high_value_analysis && (
            <View style={styles.cardContainerGray}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconBoxGreen}>
                  <Scale size={20} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    {isMl ? "ഹൈ-വാല്യൂ തുക & ഓഡ്-ഈവൻ അനുപാതം" : "High-Value Sum Range & Parity Balance"}
                  </Text>
                  <Text style={styles.sectionSub}>
                    {analysis.high_value_analysis.insight ||
                      "Mathematical balance between high (5-9) vs low (0-4) numbers and even/odd parity."}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardLabel}>
                    {isMl ? "ആകെത്തുക (Sum):" : "Sum Range:"}
                  </Text>
                  <Text style={[styles.metricCardValue, { color: "#16A34A" }]}>
                    {analysis.high_value_analysis.recommended_sum_range}
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricCardLabel}>
                    {isMl ? "ഈവൻ / ഓഡ്:" : "Even / Odd:"}
                  </Text>
                  <Text style={[styles.metricCardValue, { color: "#2563EB" }]}>
                    {analysis.high_value_analysis.even_odd_ratio}
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricCardLabel}>
                    {isMl ? "ഹൈ vs ലോ:" : "High vs Low:"}
                  </Text>
                  <Text style={[styles.metricCardValue, { color: "#9333EA" }]}>
                    {analysis.high_value_analysis.high_low_ratio}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Section: Historical Data Transparency Accordion */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => {
                triggerLightHaptic();
                setRawDatasetOpen(!rawDatasetOpen);
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Table size={18} color="#0B3C5D" />
                <Text style={styles.accordionTitle}>
                  {isMl
                    ? `വിശകലനം ചെയ്ത മുൻകാല ഫലങ്ങൾ (${availableDraws.length})`
                    : `View Underlying Historical Draws Feed (${availableDraws.length})`}
                </Text>
              </View>
              {rawDatasetOpen ? (
                <ChevronUp size={20} color="#64748B" />
              ) : (
                <ChevronDown size={20} color="#64748B" />
              )}
            </TouchableOpacity>

            {rawDatasetOpen && (
              <View style={styles.accordionContent}>
                <Text style={styles.accordionDesc}>
                  {isMl
                    ? "ഔദ്യോഗിക കേരള ഗസറ്റ് ഫലങ്ങളിൽ നിന്നുള്ള 1 മുതൽ 9 വരെയുള്ള എല്ലാ സമ്മാന നമ്പറുകളും (കൺസൊലേഷൻ ഒഴികെ) ജെമിനി AI മോഡൽ സമഗ്രമായി വിശകലനം ചെയ്തു."
                    : "Transparent raw dataset compiled from official Kerala Gazette draws containing all 1st through 9th prize tiers evaluated by Gemini AI."}
                </Text>

                <View style={{ gap: 8 }}>
                  {availableDraws.slice(0, 15).map((d, i) => {
                    const p = d.prizes || {};
                    const p345 = [
                      ...(p["3rd"] || []),
                      ...(p["4th"] || []),
                      ...(p["5th"] || []),
                    ];

                    return (
                      <View key={i} style={styles.rawDrawRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rawDrawName}>{d.draw_name || d.draw_code}</Text>
                          <Text style={styles.rawDrawDate}>{d.draw_date}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.raw1stPrize}>
                            1st: {d.first?.ticket || "N/A"}
                          </Text>
                          {p["2nd"] && p["2nd"].length > 0 && (
                            <Text style={styles.raw2ndPrize}>
                              2nd: {p["2nd"].slice(0, 2).join(", ")}
                            </Text>
                          )}
                          {p345.length > 0 && (
                            <Text style={styles.rawOtherPrizes}>
                              3rd-5th: {p345.slice(0, 3).join(", ")}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  cardContainerGray: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeftCol: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  brainIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7C3AED",
  },
  subTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 16,
  },
  drawsCountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  drawCountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  drawCountChipGreen: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1,
  },
  drawCountChipRed: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
  },
  drawCountText: {
    fontSize: 11,
    fontWeight: "800",
  },
  lotterySelectorSection: {
    marginBottom: 14,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  lotteryScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  lotteryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  lotteryChipActive: {
    backgroundColor: "#0B3C5D",
    borderColor: "#0B3C5D",
  },
  lotteryChipInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  lotteryChipName: {
    fontSize: 13,
    fontWeight: "800",
  },
  lotteryChipNameActive: {
    color: "#FFFFFF",
  },
  lotteryChipNameInactive: {
    color: "#334155",
  },
  lotteryChipDay: {
    fontSize: 10,
    marginTop: 2,
  },
  lotteryChipDayActive: {
    color: "#93C5FD",
  },
  lotteryChipDayInactive: {
    color: "#64748B",
  },
  actionRow: {
    flexDirection: "column",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  targetInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  targetInfoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    flex: 1,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B3C5D",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: "#0B3C5D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  errorAlert: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  retryBtn: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
  },
  loadingSpinnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },
  resultsWrapper: {
    gap: 16,
  },
  summaryDarkCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  summaryBadgeGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  goldSummaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderColor: "rgba(250, 204, 21, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  goldSummaryChipText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FACC15",
  },
  cachedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    borderColor: "rgba(74, 222, 128, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cachedChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4ADE80",
  },
  freshAiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderColor: "rgba(167, 139, 250, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  freshAiChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C4B5FD",
  },
  drawsEvaluatedText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  summaryActionBtns: {
    flexDirection: "row",
    gap: 6,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  refreshIconBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  warningBannerText: {
    color: "#7DD3FC",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  summaryBodyText: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconBoxGreen: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxRed: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxIndigo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxAmber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  categoryScroll: {
    gap: 6,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  categoryChipActive: {
    backgroundColor: "#0B3C5D",
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  predictionsList: {
    gap: 10,
  },
  predictionCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  predCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  predCategoryPill: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  predCategoryText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
  },
  predConfPill: {
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  predConfText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
  },
  ticketBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  ticketDigitsText: {
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "monospace",
    color: "#0F172A",
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyBtnSuccess: {
    backgroundColor: "#DCFCE7",
  },
  copyBtnLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  copiedBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16A34A",
  },
  predRationaleText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },
  hotDigitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  hotDigitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
  },
  hotDigitPillRank1: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  hotDigitPillRankTop3: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  hotDigitPillNormal: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  hotDigitNumber: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  hotDigitLabel: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  hotDigitFreq: {
    fontSize: 9,
    color: "#94A3B8",
    lineHeight: 11,
  },
  positionalSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  positionalTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  positionalGrid: {
    flexDirection: "row",
    gap: 6,
  },
  positionalBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
    alignItems: "center",
  },
  positionalBoxLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  positionalBoxNums: {
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "monospace",
    color: "#0F172A",
    marginTop: 2,
  },
  doublePatternCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  doublePatternHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  doublePatternTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  doubleFreqPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  doubleFreqText: {
    color: "#4338CA",
    fontSize: 10,
    fontWeight: "700",
  },
  doublePatternDesc: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 8,
  },
  picksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  picksLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  pickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickChipCopied: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  pickChipText: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
    color: "#0F172A",
  },
  strategyCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  strategyCardFeatured: {
    backgroundColor: "#FFFDF5",
    borderColor: "#FDE68A",
  },
  strategyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  strategyTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
    flex: 1,
  },
  rankPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400E",
  },
  formulaBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    padding: 8,
    marginBottom: 8,
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  formulaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
    fontFamily: "monospace",
    marginTop: 2,
  },
  strategyReasoning: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 15,
    marginBottom: 10,
  },
  targetNumbersSection: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
  },
  targetNumbersLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 6,
  },
  targetNumbersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  targetNumberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  targetNumberChipCopied: {
    borderColor: "#16A34A",
    backgroundColor: "#DCFCE7",
  },
  targetNumberDigits: {
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
    color: "#0F172A",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
  },
  metricCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  metricCardValue: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  accordionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  accordionContent: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  accordionDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
    marginBottom: 12,
  },
  rawDrawRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rawDrawName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  rawDrawDate: {
    fontSize: 10,
    color: "#64748B",
    fontFamily: "monospace",
  },
  raw1stPrize: {
    fontSize: 11,
    fontWeight: "900",
    color: "#16A34A",
    fontFamily: "monospace",
  },
  raw2ndPrize: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "700",
    fontFamily: "monospace",
  },
  rawOtherPrizes: {
    fontSize: 9,
    color: "#64748B",
    fontFamily: "monospace",
  },
});
