import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITE_LOTTERIES_KEY = "@kerala_lottery_favorites_v1";

export async function getFavoriteLotteries(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_LOTTERIES_KEY);
    if (!raw) return ["ST", "FF", "KP"]; // Defaults: Sthree Sakthi, Fifty Fifty, Karunya Plus
    return JSON.parse(raw);
  } catch {
    return ["ST", "FF", "KP"];
  }
}

export async function toggleFavoriteLottery(code: string): Promise<{
  favorites: string[];
  isFavorite: boolean;
}> {
  try {
    const cleanCode = code.trim().toUpperCase();
    const current = await getFavoriteLotteries();
    let updated: string[];
    let isFavorite: boolean;

    if (current.includes(cleanCode)) {
      updated = current.filter((c) => c !== cleanCode);
      isFavorite = false;
    } else {
      updated = [...current, cleanCode];
      isFavorite = true;
    }

    await AsyncStorage.setItem(
      FAVORITE_LOTTERIES_KEY,
      JSON.stringify(updated)
    );
    return { favorites: updated, isFavorite };
  } catch {
    return { favorites: [], isFavorite: false };
  }
}

export async function isLotteryFavorite(code: string): Promise<boolean> {
  try {
    const current = await getFavoriteLotteries();
    return current.includes(code.trim().toUpperCase());
  } catch {
    return false;
  }
}
