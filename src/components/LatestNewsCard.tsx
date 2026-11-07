import React, { useEffect, useState } from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { ChevronRight, Newspaper } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import { triggerLightHaptic } from "../utils/haptics";
import ShimmerSkeleton from "./ShimmerSkeleton";
import { ArticleSummary, fetchArticleFeed, getCategoryMeta, readCachedFeed } from "../api/articlesApi";

interface LatestNewsCardProps {
  navigation: { navigate: (screen: string, params?: object) => void };
  /** Extra outer spacing for the host layout (e.g. marginBottom on the modern home). */
  style?: StyleProp<ViewStyle>;
}

type LoadState = { status: "loading" } | { status: "ready"; article: ArticleSummary } | { status: "empty" };

/** Same footprint as the real card so nothing jumps when data arrives. */
const LatestNewsSkeleton = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.card, styles.skeletonCard, style]} accessibilityLabel="Loading latest news" accessible>
    <ShimmerSkeleton width={42} height={42} borderRadius={12} />
    <View style={[styles.textCol, { gap: 6 }]}>
      <ShimmerSkeleton width="55%" height={10} borderRadius={5} />
      <ShimmerSkeleton width="85%" height={14} borderRadius={6} />
    </View>
    <ShimmerSkeleton width={64} height={30} borderRadius={999} />
  </View>
);

/**
 * Home-screen card for the newest article.
 *   loading → skeleton (skipped when a cached article can be shown instantly)
 *   ready   → real card; tapping opens that article
 *   empty   → renders nothing (no articles published, or offline with no cache)
 * Fetching here also warms the News screen's offline cache.
 */
export default function LatestNewsCard({ navigation, style }: LatestNewsCardProps) {
  const { language } = useLanguage();
  const isMl = language === "ml";
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      const [cachedFirst] = await readCachedFeed();
      if (active && cachedFirst) setState({ status: "ready", article: cachedFirst });

      const { articles, fromCache } = await fetchArticleFeed({ page: 0 });
      if (!active) return;
      const [latest] = articles;
      if (latest) setState({ status: "ready", article: latest });
      // Network answered "no articles" → hide. Offline → keep the cached card if we had one.
      else if (!fromCache || !cachedFirst) setState({ status: "empty" });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") return <LatestNewsSkeleton style={style} />;
  if (state.status === "empty") return null;

  const { article } = state;
  const category = getCategoryMeta(article.category);
  const label = `${isMl ? "പുതിയ വാർത്ത" : "Latest News"} · ${isMl ? category.ml : category.en}`;

  const openArticle = () => {
    triggerLightHaptic();
    navigation.navigate("ArticleDetail", { slug: article.slug, title: article.title });
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={openArticle}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${article.title}`}
      accessibilityHint={isMl ? "ലേഖനം തുറക്കുക" : "Opens the article"}
    >
      <View style={styles.iconBox}>
        <Newspaper size={20} color="#7C3AED" />
        <View style={styles.dot} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.headline} numberOfLines={2}>{article.title}</Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{isMl ? "വായിക്കുക" : "Read"}</Text>
        <ChevronRight size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 14,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#F5F3FF",
  },
  skeletonCard: { borderColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 11, fontWeight: "800", color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.4 },
  headline: { fontSize: 14, lineHeight: 19, fontWeight: "800", color: COLORS.textDark },
  cta: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primaryLight, borderRadius: 999, paddingLeft: 10, paddingRight: 6, paddingVertical: 6 },
  ctaText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
});
