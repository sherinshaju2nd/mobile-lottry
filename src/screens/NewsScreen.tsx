import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Clock, Newspaper, RotateCw, WifiOff } from "lucide-react-native";
import SafeScreenContainer from "../components/SafeScreenContainer";
import ScreenHeader from "../components/ScreenHeader";
import ShimmerSkeleton from "../components/ShimmerSkeleton";
import ArticleListItem, { ArticleCover } from "../components/ArticleListItem";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import { triggerLightHaptic } from "../utils/haptics";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_PAGE_SIZE,
  ArticleCategory,
  ArticleSummary,
  fetchArticleFeed,
  formatArticleDate,
  getCategoryMeta,
  readCachedFeed,
} from "../api/articlesApi";

type Filter = ArticleCategory | "all";

export default function NewsScreen({ navigation }: any) {
  const { language } = useLanguage();
  const isMl = language === "ml";

  const [category, setCategory] = useState<Filter>("all");
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (nextCategory: Filter, nextPage: number) => {
    const id = ++requestId.current;
    const result = await fetchArticleFeed({ category: nextCategory, page: nextPage });
    if (id !== requestId.current) return;
    setIsOffline(result.fromCache);
    setError(result.error && !result.articles.length ? result.error : null);
    setArticles((prev) => (nextPage === 0 ? result.articles : [...prev, ...result.articles.filter((a) => !prev.some((p) => p.id === a.id))]));
    setTotal(result.total);
    setPage(nextPage);
    setIsLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
  }, []);

  // Instant paint from cache, then network
  useEffect(() => {
    let active = true;
    readCachedFeed().then((cached) => {
      if (active && cached.length) {
        setArticles((prev) => (prev.length ? prev : cached));
        setIsLoading(false);
      }
    });
    load("all", 0);
    return () => {
      active = false;
    };
  }, [load]);

  const selectCategory = (value: Filter) => {
    if (value === category) return;
    triggerLightHaptic();
    setCategory(value);
    setIsLoading(true);
    load(value, 0);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    load(category, 0);
  };

  const onEndReached = () => {
    if (isLoadingMore || isLoading || isOffline || articles.length >= total) return;
    setIsLoadingMore(true);
    load(category, page + 1);
  };

  const openArticle = (article: ArticleSummary) => {
    triggerLightHaptic();
    navigation.navigate("ArticleDetail", { slug: article.slug, title: article.title });
  };

  const [hero, ...rest] = articles;
  const showHero = Boolean(hero) && category === "all" && !isLoading;
  const listData = showHero ? rest : articles;

  const renderCard = ({ item }: { item: ArticleSummary }) => <ArticleListItem article={item} onPress={openArticle} />;

  const header = (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[{ value: "all" as const, en: "All", ml: "എല്ലാം" }, ...ARTICLE_CATEGORIES].map(({ value, en, ml }) => {
          const selected = category === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => selectCategory(value)}
              style={[styles.chip, selected && styles.chipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{isMl ? ml : en}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isOffline && articles.length > 0 ? (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#B45309" />
          <Text style={styles.offlineText}>{isMl ? "ഓഫ്‌ലൈൻ — സേവ് ചെയ്ത ലേഖനങ്ങൾ കാണിക്കുന്നു" : "Offline — showing saved articles"}</Text>
        </View>
      ) : null}

      {showHero && hero ? (
        <TouchableOpacity style={styles.hero} activeOpacity={0.88} onPress={() => openArticle(hero)} accessibilityRole="button" accessibilityLabel={hero.title}>
          <ArticleCover article={hero} height={190} />
          <View style={styles.heroBody}>
            <View style={styles.heroBadges}>
              <Text style={styles.featuredBadge}>{isMl ? "പ്രധാനം" : "Featured"}</Text>
              <Text style={[styles.categoryText, { color: getCategoryMeta(hero.category).color }]}>
                {isMl ? getCategoryMeta(hero.category).ml : getCategoryMeta(hero.category).en}
              </Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>{hero.title}</Text>
            {hero.excerpt ? <Text style={styles.heroExcerpt} numberOfLines={3}>{hero.excerpt}</Text> : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatArticleDate(hero.published_at, language)}</Text>
              <Clock size={12} color={COLORS.textLight} />
              <Text style={styles.metaText}>{hero.reading_minutes} {isMl ? "മിനിറ്റ് വായന" : "min read"}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const empty = isLoading ? (
    <View style={{ gap: 12 }}>
      {Array.from({ length: 4 }, (_, i) => (
        <ShimmerSkeleton key={i} width="100%" height={110} borderRadius={16} />
      ))}
    </View>
  ) : (
    <View style={styles.empty}>
      {error ? <WifiOff size={44} color="#CBD5E1" /> : <Newspaper size={44} color="#CBD5E1" />}
      <Text style={styles.emptyTitle}>
        {error ? (isMl ? "ലോഡ് ചെയ്യാനായില്ല" : "Couldn't load articles") : isMl ? "ലേഖനങ്ങളൊന്നുമില്ല" : "No articles yet"}
      </Text>
      <Text style={styles.emptyText}>
        {error ? (isMl ? "ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക." : "Check your internet connection and try again.") : isMl ? "പുതിയ വാർത്തകൾ ഉടൻ വരും." : "New Kerala lottery news is coming soon."}
      </Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => { setIsLoading(true); load(category, 0); }} accessibilityRole="button">
        <RotateCw size={16} color={COLORS.white} />
        <Text style={styles.retryText}>{isMl ? "വീണ്ടും ശ്രമിക്കുക" : "Try again"}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeScreenContainer>
      <ScreenHeader
        title={isMl ? "വാർത്തകൾ & ഗൈഡുകൾ" : "News & Guides"}
        subtitle={isMl ? "ലോട്ടറി വാർത്തകൾ, ഗൈഡുകൾ, ടിപ്പുകൾ" : "Lottery news, guides & tips"}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={isLoading ? [] : listData}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListHeaderComponent={header}
        ListEmptyComponent={showHero ? undefined : empty}
        ListFooterComponent={
          <View style={{ paddingTop: 8 }}>
            {isLoadingMore ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        initialNumToRender={ARTICLE_PAGE_SIZE}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 48 },
  chips: { gap: 8, paddingBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: "#334155" },
  chipTextActive: { color: COLORS.white },
  offlineBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.goldLight, borderColor: COLORS.goldBorder, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
  offlineText: { fontSize: 12, fontWeight: "700", color: "#B45309" },
  hero: { backgroundColor: COLORS.white, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  heroBody: { padding: 16, gap: 8 },
  heroBadges: { flexDirection: "row", alignItems: "center", gap: 10 },
  featuredBadge: { backgroundColor: COLORS.goldLight, color: "#B45309", fontSize: 11, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  heroTitle: { fontSize: 20, lineHeight: 27, fontWeight: "900", color: COLORS.textDark },
  heroExcerpt: { fontSize: 14, lineHeight: 21, color: "#475569" },
  categoryText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textDark, textAlign: "center" },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 10 },
  retryText: { color: COLORS.white, fontWeight: "800" },
});
