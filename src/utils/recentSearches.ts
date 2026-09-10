import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_SEARCHES_KEY = "@kerala_lottery_recent_searches_v1";
const MAX_RECENT_SEARCHES = 10;

export interface RecentSearchItem {
  id: string;
  query: string;
  timestamp: number;
  matchCount?: number;
}

export async function getRecentSearches(): Promise<RecentSearchItem[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const items: RecentSearchItem[] = JSON.parse(raw);
    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export async function saveRecentSearch(
  query: string,
  matchCount?: number
): Promise<RecentSearchItem[]> {
  try {
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery || cleanQuery.length < 3) {
      return await getRecentSearches();
    }

    const current = await getRecentSearches();
    // Filter out existing occurrence of same query
    const filtered = current.filter(
      (item) => item.query.toUpperCase() !== cleanQuery
    );

    const newItem: RecentSearchItem = {
      id: `${Date.now()}_${cleanQuery}`,
      query: cleanQuery,
      timestamp: Date.now(),
      matchCount: matchCount ?? 0,
    };

    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function removeRecentSearch(
  queryToRemove: string
): Promise<RecentSearchItem[]> {
  try {
    const current = await getRecentSearches();
    const updated = current.filter(
      (item) => item.query.toUpperCase() !== queryToRemove.toUpperCase()
    );
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function clearAllRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore error
  }
}
