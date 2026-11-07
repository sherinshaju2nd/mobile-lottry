import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./lotteryApi";

/**
 * Articles / newsletter feed published from the website admin (/admin → Articles).
 * Reads use the public key: RLS only returns published posts
 * (see frontend/supabase/migrations/20261107000000_articles_newsletter.sql).
 *
 * Types mirror frontend/lib/articles.ts (separate package) — keep them in sync.
 */

export const WEBSITE_URL = "https://www.keralalotteryresultstoday.in";

export const ARTICLE_CATEGORIES = [
  { value: "news", en: "Lottery News", ml: "വാർത്തകൾ", color: "#0B3C5D", bg: "#EBF5FF" },
  { value: "newsletter", en: "Newsletter", ml: "ന്യൂസ്‌ലെറ്റർ", color: "#7C3AED", bg: "#F5F3FF" },
  { value: "guide", en: "Guides", ml: "ഗൈഡുകൾ", color: "#047857", bg: "#ECFDF5" },
  { value: "tips", en: "Tips & Safety", ml: "ടിപ്സ്", color: "#B45309", bg: "#FFFBEB" },
  { value: "announcement", en: "Announcements", ml: "അറിയിപ്പുകൾ", color: "#BE123C", bg: "#FFF1F2" },
  { value: "bumper", en: "Bumper Updates", ml: "ബമ്പർ", color: "#C2410C", bg: "#FFF7ED" },
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]["value"];

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category: ArticleCategory;
  tags: string[];
  author_name: string;
  is_featured: boolean;
  published_at: string | null;
  reading_minutes: number;
  updated_at: string;
}

export interface Article extends ArticleSummary {
  content: string;
  faqs: ArticleFaq[];
}

const SUMMARY_FIELDS =
  "id,slug,title,excerpt,cover_image_url,cover_image_alt,category,tags,author_name,is_featured,published_at,reading_minutes,updated_at";
const DETAIL_FIELDS = `${SUMMARY_FIELDS},content,faqs`;

export const ARTICLE_PAGE_SIZE = 10;
const FEED_CACHE_KEY = "articles_feed_cache_v1";
const DETAIL_CACHE_PREFIX = "article_cache_v1:";
const MAX_CACHED_DETAILS = 20;

export const getCategoryMeta = (category: string) =>
  ARTICLE_CATEGORIES.find(({ value }) => value === category) ?? ARTICLE_CATEGORIES[0];

export const getArticleWebUrl = (slug: string) => `${WEBSITE_URL}/news/${slug}`;

export const formatArticleDate = (iso: string | null | undefined, language: string = "en"): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(`${["ml", "hi"].includes(language) ? language : "en"}-IN`, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(date);
  } catch {
    // Hermes without full Intl: fall back to ISO date
    return iso.slice(0, 10);
  }
};

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err);

const normalizeFaqs = (raw: unknown): ArticleFaq[] =>
  Array.isArray(raw)
    ? raw.filter((f): f is ArticleFaq => typeof f?.question === "string" && typeof f?.answer === "string")
    : [];

export interface FeedResult {
  articles: ArticleSummary[];
  total: number;
  fromCache: boolean;
  error?: string;
}

/** Cached first page of the "All" feed (offline fallback + instant first paint). */
export const readCachedFeed = async (): Promise<ArticleSummary[]> => {
  try {
    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: unknown) {
    console.warn("[articlesApi] read feed cache failed:", errorMessage(err));
    return [];
  }
};

export const fetchArticleFeed = async ({
  category = "all",
  page = 0,
}: { category?: ArticleCategory | "all"; page?: number } = {}): Promise<FeedResult> => {
  try {
    const from = page * ARTICLE_PAGE_SIZE;
    let query = supabase
      .from("articles")
      .select(SUMMARY_FIELDS, { count: "exact" })
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .range(from, from + ARTICLE_PAGE_SIZE - 1);
    if (category !== "all") query = query.eq("category", category);

    const { data, error, count } = await query;
    if (error) throw error;
    const articles = (data ?? []) as ArticleSummary[];

    if (category === "all" && page === 0) {
      AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(articles)).catch((err: unknown) =>
        console.warn("[articlesApi] write feed cache failed:", errorMessage(err)),
      );
    }
    return { articles, total: count ?? articles.length, fromCache: false };
  } catch (err: unknown) {
    const message = errorMessage(err);
    console.warn("[articlesApi] fetchArticleFeed failed:", message);
    if (page === 0) {
      const cached = await readCachedFeed();
      const articles = category === "all" ? cached : cached.filter((a) => a.category === category);
      return { articles, total: articles.length, fromCache: true, error: message };
    }
    return { articles: [], total: 0, fromCache: false, error: message };
  }
};

const cacheArticle = async (article: Article) => {
  try {
    await AsyncStorage.setItem(`${DETAIL_CACHE_PREFIX}${article.slug}`, JSON.stringify(article));
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(DETAIL_CACHE_PREFIX));
    if (keys.length > MAX_CACHED_DETAILS) {
      await AsyncStorage.multiRemove(keys.slice(0, keys.length - MAX_CACHED_DETAILS));
    }
  } catch (err: unknown) {
    console.warn("[articlesApi] cache article failed:", errorMessage(err));
  }
};

export const fetchArticle = async (slug: string): Promise<{ article: Article | null; fromCache: boolean; error?: string }> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { article: null, fromCache: false, error: "Invalid article link" };
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(DETAIL_FIELDS)
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data) return { article: null, fromCache: false };
    const article: Article = {
      ...(data as unknown as Article),
      tags: Array.isArray(data.tags) ? data.tags : [],
      faqs: normalizeFaqs(data.faqs),
    };
    cacheArticle(article);
    return { article, fromCache: false };
  } catch (err: unknown) {
    const message = errorMessage(err);
    console.warn("[articlesApi] fetchArticle failed:", message);
    try {
      const raw = await AsyncStorage.getItem(`${DETAIL_CACHE_PREFIX}${slug}`);
      if (raw) return { article: JSON.parse(raw) as Article, fromCache: true, error: message };
    } catch (cacheErr: unknown) {
      console.warn("[articlesApi] read article cache failed:", errorMessage(cacheErr));
    }
    return { article: null, fromCache: false, error: message };
  }
};

export const recordArticleView = async (slug: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc("increment_article_view", { p_slug: slug });
    if (error) throw error;
  } catch (err: unknown) {
    console.warn("[articlesApi] view count failed:", errorMessage(err));
  }
};

export const subscribeToNewsletter = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch(`${WEBSITE_URL}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), source: "mobile" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.success) return { success: false, message: json?.error ?? "Could not subscribe right now." };
    return { success: true, message: json.message ?? "Subscribed!" };
  } catch (err: unknown) {
    console.warn("[articlesApi] subscribe failed:", errorMessage(err));
    return { success: false, message: "No internet connection. Please try again." };
  }
};
