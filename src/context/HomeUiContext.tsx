import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type HomeUiMode = "normal" | "modern";

const HOME_UI_KEY = "@app_home_ui_mode";

interface HomeUiContextType {
  uiMode: HomeUiMode;
  setUiMode: (mode: HomeUiMode) => Promise<void>;
  isNormalUi: boolean;
  isModernUi: boolean;
  isLoading: boolean;
}

const HomeUiContext = createContext<HomeUiContextType | undefined>(undefined);

export const HomeUiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiMode, setUiModeState] = useState<HomeUiMode>("normal");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(HOME_UI_KEY)
      .then((savedMode) => {
        if (savedMode === "normal" || savedMode === "modern") {
          setUiModeState(savedMode as HomeUiMode);
        } else {
          // Default to "normal" (HomeScreen2)
          setUiModeState("normal");
        }
      })
      .catch(() => {
        setUiModeState("normal");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const setUiMode = async (mode: HomeUiMode) => {
    try {
      setUiModeState(mode);
      await AsyncStorage.setItem(HOME_UI_KEY, mode);
    } catch (err) {
      console.error("Failed to save Home UI mode:", err);
    }
  };

  return (
    <HomeUiContext.Provider
      value={{
        uiMode,
        setUiMode,
        isNormalUi: uiMode === "normal",
        isModernUi: uiMode === "modern",
        isLoading,
      }}
    >
      {children}
    </HomeUiContext.Provider>
  );
};

export const useHomeUi = (): HomeUiContextType => {
  const context = useContext(HomeUiContext);
  if (!context) {
    throw new Error("useHomeUi must be used within a HomeUiProvider");
  }
  return context;
};
