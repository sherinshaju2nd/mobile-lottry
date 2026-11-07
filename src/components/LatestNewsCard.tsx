import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronRight, Newspaper } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import { triggerLightHaptic } from "../utils/haptics";
import { ArticleSummary, fetchArticleFeed, getCategoryMeta, readCachedFeed } from "../api/articlesApi";

interface LatestNewsCardProps {
  navigation: { navigate: (screen: string, params?: object) => void };
}

/**
 * Home-screen entry point to the News feed. Shows the newest article's headline when one
 * exists (cached first for instant paint, then refreshed), otherwise a generic prompt.
 * Fetching here also warms the News screen's offline cache.
 */
export default function LatestNewsCard({ navigation }: LatestNewsCardProps) {
  const { language } = useLanguage();
  const isMl = language === "ml";
  const [latest, setLatest] = useState<ArticleSummary | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await readCachedFeed();
      if (active && cached[0]) setLatest(cached[0]);
      const { articles, fromCache } = await fetchArticleFeed({ page: 0 });
      if (active && !fromCache) setLatest(articles[0] ?? null);
    })();
    return () => {
      active = false;
    };
  }, []);

  const openNews = () => {
    triggerLightHaptic();
    navigation.navigate("News");
  };

  const category = latest ? getCategoryMeta(latest.category) : null;
  const label = latest
    ? `${isMl ? "പുതിയ വാർത്ത" : "Latest News"}${category ? ` · ${isMl ? category.ml : category.en}` : ""}`
    : isMl ? "വാർത്തകൾ & ന്യൂസ്‌ലെറ്റർ" : "News & Newsletter";
  const headline = latest?.title ?? (isMl ? "ലോട്ടറി വാർത്തകൾ, ഗൈഡുകൾ, ടിപ്പുകൾ" : "Lottery news, claim guides & tips");

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={openNews}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${headline}`}
      accessibilityHint={isMl ? "വാർത്തകൾ തുറക്കുക" : "Opens the news feed"}
    >
      <View style={styles.iconBox}>
        <Newspaper size={20} color="#7C3AED" />
        {latest ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.headline} numberOfLines={2}>{headline}</Text>
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
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 11, fontWeight: "800", color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.4 },
  headline: { fontSize: 14, lineHeight: 19, fontWeight: "800", color: COLORS.textDark },
  cta: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primaryLight, borderRadius: 999, paddingLeft: 10, paddingRight: 6, paddingVertical: 6 },
  ctaText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
});
