import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { DrawResult } from "../api/lotteryApi";
import { Language } from "../constants/translations";
import { PrizeTier } from "../utils/prizeAmounts";
import {
  ReadAloudLanguage,
  buildResultSpeechChunks,
  hasMalayalamVoice,
  playResultSpeech,
  stopResultSpeech,
} from "../utils/resultSpeech";

/**
 * "Read results aloud" for a draw. Malayalam UI reads in Malayalam (falls back to English,
 * with a hint, if the phone has no Malayalam voice); every other UI language reads in English.
 * Reading stops automatically when the screen loses focus, unmounts, or the draw changes.
 */
export const useResultReadAloud = (draw: DrawResult | null, uiLanguage: Language) => {
  const [isReading, setIsReading] = useState(false);
  const [currentTier, setCurrentTier] = useState<PrizeTier | null>(null);
  // Each start gets an id; anything that cancels bumps it so late async work is ignored.
  const sessionRef = useRef(0);
  const activeRef = useRef(false);

  const stop = useCallback(async () => {
    sessionRef.current++;
    // Nothing playing: don't touch (and lazily start) the system TTS engine.
    if (!activeRef.current) return;
    activeRef.current = false;
    setIsReading(false);
    setCurrentTier(null);
    await stopResultSpeech();
  }, []);

  const start = useCallback(async () => {
    if (!draw || activeRef.current) return;
    const sessionId = ++sessionRef.current;
    const isCurrent = () => sessionId === sessionRef.current;
    activeRef.current = true;
    setIsReading(true);
    setCurrentTier(null);

    try {
      let language: ReadAloudLanguage = uiLanguage === "ml" ? "ml" : "en";
      if (language === "ml" && !(await hasMalayalamVoice())) {
        language = "en";
        Alert.alert(
          "മലയാളം ശബ്ദം ലഭ്യമല്ല",
          "ഈ ഫോണിൽ മലയാളം വോയ്സ് ഇൻസ്റ്റാൾ ചെയ്തിട്ടില്ല, അതിനാൽ ഇംഗ്ലീഷിൽ വായിക്കുന്നു. Settings → Text-to-speech → Google → Install voice data → Malayalam.",
        );
      }
      // The user may have pressed Stop or left the screen during the voice check.
      if (!isCurrent()) return;

      await playResultSpeech(buildResultSpeechChunks(draw, language), language, {
        onTierChange: (tier) => {
          if (isCurrent()) setCurrentTier(tier);
        },
        onFinish: () => {
          if (!isCurrent()) return;
          activeRef.current = false;
          setIsReading(false);
          setCurrentTier(null);
        },
      });
    } catch (err: unknown) {
      console.warn("[read-aloud] Could not start:", err instanceof Error ? err.message : String(err));
      if (!isCurrent()) return;
      activeRef.current = false;
      setIsReading(false);
      setCurrentTier(null);
      Alert.alert(
        uiLanguage === "ml" ? "വായിക്കാൻ കഴിഞ്ഞില്ല" : "Couldn't read aloud",
        uiLanguage === "ml"
          ? "ഫോണിലെ ടെക്സ്റ്റ്-ടു-സ്പീച്ച് ലഭ്യമല്ല. വീണ്ടും ശ്രമിക്കുക."
          : "Text-to-speech isn't available on this phone right now. Please try again.",
      );
    }
  }, [draw, uiLanguage]);

  const toggle = useCallback((): void => {
    if (activeRef.current) {
      void stop();
    } else {
      void start();
    }
  }, [start, stop]);

  // Never keep talking after the user leaves the result screen.
  useFocusEffect(
    useCallback(() => () => {
      void stop();
    }, [stop]),
  );

  // A different draw (navigation to another date / lottery) invalidates what is being read.
  // Live updates of the same draw keep the same date + code, so they don't interrupt reading.
  useEffect(() => {
    void stop();
  }, [draw?.draw_date, draw?.lottery_code, stop]);

  return { isReading, currentTier, start, stop, toggle };
};
