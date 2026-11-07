import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Clock, Newspaper } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import { ArticleSummary, formatArticleDate, getCategoryMeta } from "../api/articlesApi";

/** Article cover image with a category-coloured fallback when missing or broken. */
export const ArticleCover = ({ article, height }: { article: ArticleSummary; height: number }) => {
  const [failed, setFailed] = useState(false);
  const category = getCategoryMeta(article.category);
  if (!article.cover_image_url || failed) {
    return (
      <View style={[styles.coverFallback, { height, backgroundColor: category.color }]}>
        <Newspaper size={height > 120 ? 44 : 26} color="rgba(255,255,255,0.85)" />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: article.cover_image_url }}
      style={{ width: "100%", height, backgroundColor: "#E2E8F0" }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
      onError={() => setFailed(true)}
    />
  );
};

interface ArticleListItemProps {
  article: ArticleSummary;
  onPress: (article: ArticleSummary) => void;
}

/** Horizontal article row (thumbnail + category + title + meta) used by the News feed and "More articles". */
export default function ArticleListItem({ article, onPress }: ArticleListItemProps) {
  const { language } = useLanguage();
  const isMl = language === "ml";
  const meta = getCategoryMeta(article.category);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(article)}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      <View style={styles.thumb}>
        <ArticleCover article={article} height={92} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.category, { color: meta.color }]}>{isMl ? meta.ml : meta.en}</Text>
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatArticleDate(article.published_at, language)}</Text>
          <Clock size={12} color={COLORS.textLight} />
          <Text style={styles.metaText}>
            {article.reading_minutes} {isMl ? "മിനിറ്റ്" : "min"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  coverFallback: { width: "100%", alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden", minHeight: 110 },
  thumb: { width: 110, alignSelf: "stretch", justifyContent: "center", backgroundColor: "#E2E8F0" },
  body: { flex: 1, padding: 12, gap: 4, justifyContent: "center" },
  category: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  title: { fontSize: 15, lineHeight: 21, fontWeight: "800", color: COLORS.textDark },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
});
