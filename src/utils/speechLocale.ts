import { Platform } from "react-native";

/**
 * expo-speech on Android builds the voice locale with `Locale.Builder().setLanguage(...)`,
 * which only accepts a bare language code ("ml"). A full tag like "ml-IN" throws inside the
 * library and silently falls back to the phone's default (usually English) voice.
 * iOS expects the full BCP-47 tag.
 */
export const toSpeechLanguage = (languageTag: string): string =>
  Platform.OS === "android" ? languageTag.split("-")[0] : languageTag;
