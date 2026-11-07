import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronUp, Clock, Globe, RotateCw, Search, Share2, WifiOff } from "lucide-react-native";
import SafeScreenContainer from "../components/SafeScreenContainer";
import ScreenHeader from "../components/ScreenHeader";
import ArticleMarkdownView from "../components/ArticleMarkdownView";
import ArticleListItem from "../components/ArticleListItem";
import AutoSizedImage from "../components/AutoSizedImage";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import { triggerLightHaptic } from "../utils/haptics";
import { universalShare } from "../utils/shareHelper";
import { resolveAppLink } from "../utils/deepLinking";
import {
  Article,
  ArticleSummary,
  fetchArticle,
  fetchArticleFeed,
  formatArticleDate,
  getArticleWebUrl,
  getCategoryMeta,
  recordArticleView,
} from "../api/articlesApi";

const MORE_ARTICLES_LIMIT = 4;

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faq}>
      <TouchableOpacity
        style={styles.faqHead}
        onPress={() => {
          triggerLightHaptic();
          setOpen((v) => !v);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.faqQuestion}>{question}</Text>
        {open ? <ChevronUp size={18} color={COLORS.textMuted} /> : <ChevronDown size={18} color={COLORS.textMuted} />}
      </TouchableOpacity>
      {open ? <Text style={styles.faqAnswer}>{answer}</Text> : null}
    </View>
  );
};

export default function ArticleDetailScreen({ navigation, route }: any) {
  const slug: string = route?.params?.slug ?? "";
  const titleHint: string | undefined = route?.params?.title;
  const { language } = useLanguage();
  const isMl = language === "ml";

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const onCoverFailed = useCallback(() => setCoverFailed(true), []);
  const [moreArticles, setMoreArticles] = useState<ArticleSummary[]>([]);

  const load = useCallback(async () => {
    const result = await fetchArticle(slug);
    setArticle(result.article);
    setFromCache(result.fromCache);
    setNotFound(!result.article && !result.error);
    setError(!result.article ? result.error ?? null : null);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [slug]);

  useEffect(() => {
    load();
    if (slug) recordArticleView(slug);
  }, [load, slug]);

  // Other articles for the bottom of the page (falls back to the offline cache inside fetchArticleFeed).
  useEffect(() => {
    let active = true;
    (async () => {
      const { articles } = await fetchArticleFeed({ page: 0 });
      if (active) setMoreArticles(articles.filter((a) => a.slug !== slug).slice(0, MORE_ARTICLES_LIMIT));
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const openOtherArticle = (other: ArticleSummary) => {
    triggerLightHaptic();
    navigation.push("ArticleDetail", { slug: other.slug, title: other.title });
  };

  const share = async () => {
    if (!article) return;
    triggerLightHaptic();
    await universalShare({
      title: article.title,
      message: `${article.title}\n\n${article.excerpt ? `${article.excerpt}\n\n` : ""}${getArticleWebUrl(article.slug)}`,
      url: getArticleWebUrl(article.slug),
    });
  };

  const openOnWeb = async () => {
    try {
      await Linking.openURL(getArticleWebUrl(slug));
    } catch (err: unknown) {
      console.warn("[ArticleDetail] open web failed:", err instanceof Error ? err.message : String(err));
    }
  };

  /** Site-relative links inside articles (e.g. /search, /karunya/2026-11-04) open in-app. */
  const handleInternalLink = (path: string) => {
    const routeTarget = resolveAppLink(path);
    if (routeTarget.name === "ArticleDetail") {
      navigation.push("ArticleDetail", routeTarget.params);
      return;
    }
    navigation.navigate(routeTarget.name, routeTarget.params);
  };

  const category = article ? getCategoryMeta(article.category) : null;

  const shareButton = article ? (
    <TouchableOpacity style={styles.headerBtn} onPress={share} accessibilityRole="button" accessibilityLabel={isMl ? "പങ്കിടുക" : "Share article"}>
      <Share2 size={18} color={COLORS.textDark} />
    </TouchableOpacity>
  ) : undefined;

  return (
    <SafeScreenContainer>
      <ScreenHeader title={isMl ? "വാർത്ത" : "Article"} subtitle={article?.title ?? titleHint} onBack={() => navigation.goBack()} right={shareButton} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !article ? (
        <View style={styles.center}>
          <WifiOff size={44} color="#CBD5E1" />
          <Text style={styles.stateTitle}>
            {notFound ? (isMl ? "ലേഖനം ലഭ്യമല്ല" : "Article not available") : isMl ? "ലോഡ് ചെയ്യാനായില്ല" : "Couldn't load this article"}
          </Text>
          <Text style={styles.stateText}>
            {notFound
              ? isMl ? "ഈ ലേഖനം നീക്കം ചെയ്തിരിക്കാം." : "It may have been removed or unpublished."
              : isMl ? "ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക." : "Check your internet connection and try again."}
          </Text>
          {!notFound ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { setIsLoading(true); load(); }} accessibilityRole="button">
              <RotateCw size={16} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>{isMl ? "വീണ്ടും ശ്രമിക്കുക" : "Try again"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("News")} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>{isMl ? "എല്ലാ വാർത്തകളും" : "All news"}</Text>
            </TouchableOpacity>
          )}
          {error && !notFound ? <Text style={[styles.metaText, { marginTop: 4 }]}>{error}</Text> : null}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        >
          {fromCache ? (
            <View style={styles.offlineBanner}>
              <WifiOff size={14} color="#B45309" />
              <Text style={styles.offlineText}>{isMl ? "ഓഫ്‌ലൈൻ പതിപ്പ്" : "Offline copy — pull down to refresh"}</Text>
            </View>
          ) : null}

          {category ? (
            <Text style={[styles.category, { color: category.color, backgroundColor: category.bg }]}>{isMl ? category.ml : category.en}</Text>
          ) : null}
          <Text style={styles.title} accessibilityRole="header">{article.title}</Text>
          {article.excerpt ? <Text style={styles.excerpt}>{article.excerpt}</Text> : null}

          <View style={styles.metaRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{article.author_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.author}>{article.author_name}</Text>
              <View style={styles.metaInline}>
                <Text style={styles.metaText}>{formatArticleDate(article.published_at, language)}</Text>
                <Clock size={12} color={COLORS.textLight} />
                <Text style={styles.metaText}>{article.reading_minutes} {isMl ? "മിനിറ്റ് വായന" : "min read"}</Text>
              </View>
            </View>
          </View>

          {article.cover_image_url && !coverFailed ? (
            <AutoSizedImage
              uri={article.cover_image_url}
              alt={article.cover_image_alt ?? article.title}
              minRatio={0.8}
              style={styles.cover}
              onFailed={onCoverFailed}
            />
          ) : null}

          <ArticleMarkdownView markdown={article.content} onInternalLink={handleInternalLink} />

          {article.faqs.length > 0 ? (
            <View style={styles.faqSection}>
              <Text style={styles.sectionTitle}>{isMl ? "പതിവ് ചോദ്യങ്ങൾ" : "Frequently asked questions"}</Text>
              {article.faqs.map((faq, idx) => (
                <FaqItem key={`${idx}-${faq.question}`} question={faq.question} answer={faq.answer} />
              ))}
            </View>
          ) : null}

          {article.tags.length > 0 ? (
            <View style={styles.tags}>
              {article.tags.map((tag) => (
                <Text key={tag} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={share} accessibilityRole="button">
              <Share2 size={16} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>{isMl ? "പങ്കിടുക" : "Share"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("MainTabs", { screen: "SearchTab" })} accessibilityRole="button">
              <Search size={16} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>{isMl ? "ടിക്കറ്റ് പരിശോധിക്കുക" : "Check ticket"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={openOnWeb} accessibilityRole="link">
              <Globe size={16} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>{isMl ? "വെബ്സൈറ്റിൽ" : "Open on web"}</Text>
            </TouchableOpacity>
          </View>

          {moreArticles.length > 0 ? (
            <View style={styles.moreSection}>
              <View style={styles.moreHeader}>
                <Text style={styles.sectionTitle}>{isMl ? "കൂടുതൽ വാർത്തകൾ" : "More articles"}</Text>
                <TouchableOpacity onPress={() => navigation.navigate("News")} accessibilityRole="link" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.moreLink}>{isMl ? "എല്ലാം കാണുക" : "View all"}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ gap: 12 }}>
                {moreArticles.map((other) => (
                  <ArticleListItem key={other.id} article={other} onPress={openOtherArticle} />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  stateTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textDark, textAlign: "center" },
  stateText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
  headerBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  content: { padding: 18, paddingBottom: 56, backgroundColor: COLORS.white },
  offlineBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.goldLight, borderColor: COLORS.goldBorder, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
  offlineText: { fontSize: 12, fontWeight: "700", color: "#B45309" },
  category: { alignSelf: "flex-start", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden", marginBottom: 10 },
  title: { fontSize: 25, lineHeight: 33, fontWeight: "900", color: COLORS.textDark },
  excerpt: { fontSize: 16, lineHeight: 25, color: "#475569", marginTop: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.white, fontWeight: "900" },
  author: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  metaInline: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  cover: { borderRadius: 14, marginBottom: 18 },
  faqSection: { marginTop: 18 },
  sectionTitle: { fontSize: 19, fontWeight: "900", color: COLORS.textDark, marginBottom: 10 },
  faq: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
  faqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, gap: 10 },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  faqAnswer: { paddingHorizontal: 14, paddingBottom: 14, fontSize: 14, lineHeight: 22, color: "#475569" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  tag: { fontSize: 12, fontWeight: "700", color: "#475569", backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: "hidden" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 },
  moreSection: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: COLORS.border },
  moreHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  moreLink: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  primaryBtnText: { color: COLORS.white, fontWeight: "800" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "800" },
});
