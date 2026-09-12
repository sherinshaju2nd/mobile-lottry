import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Language, translations, isIndic, TranslationKey } from "../constants/translations";

const LANGUAGE_KEY = "@app_language_preference";
const VALID_LANGUAGES: Language[] = ["en", "ml", "hi", "ta", "kn", "te"];

interface LanguageContextType {
  language: Language;
  isIndicLang: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
  showLanguageModal: boolean;
  setShowLanguageModal: (show: boolean) => void;
  isLanguageSelected: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);

  useEffect(() => {
    // Load saved language preference from local storage
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((savedLang) => {
        if (savedLang && VALID_LANGUAGES.includes(savedLang as Language)) {
          setLanguageState(savedLang as Language);
          setIsLanguageSelected(true);
          setShowLanguageModal(false);
        } else {
          // No language preference saved yet (First time user!)
          setIsLanguageSelected(false);
          setShowLanguageModal(true);
        }
      })
      .catch(() => {
        setIsLanguageSelected(false);
        setShowLanguageModal(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const setLanguage = async (newLang: Language) => {
    try {
      setLanguageState(newLang);
      setIsLanguageSelected(true);
      setShowLanguageModal(false);
      await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
    } catch (err) {
      console.error("Failed to save language preference:", err);
    }
  };

  const t = (key: TranslationKey): any => {
    const dict = (translations as any)[language] || translations.en;
    return dict[key] ?? (translations.en as any)[key] ?? String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isIndicLang: isIndic(language),
        setLanguage,
        t,
        isLoading,
        showLanguageModal,
        setShowLanguageModal,
        isLanguageSelected,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
