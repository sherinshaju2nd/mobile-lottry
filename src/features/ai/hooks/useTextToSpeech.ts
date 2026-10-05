import { useState, useCallback, useRef, useEffect } from "react";
import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { Language } from "../../../constants/translations";
import { isMalayalamVoiceAvailable, getBestSoftLadyVoice, convertMalayalamToCleanSpeech } from "../../../utils/softVoiceHelper";

export interface TextToSpeechOptions {
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (err: any) => void;
}

export function useTextToSpeech(options?: TextToSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentTextRef = useRef<string>("");
  const currentLangRef = useRef<Language>("ml");
  
  // Stable ref to options to avoid recreating callbacks on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
    } catch {}
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
    setIsPaused(false);
    optionsRef.current?.onStopped?.();
  }, []);

  const pause = useCallback(async () => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } catch {}
    } else {
      // Native expo-speech doesn't have pause/resume on all platforms, so stop
      await stop();
    }
  }, [stop]);

  const resume = useCallback(async () => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsSpeaking(true);
      } catch {}
    } else if (currentTextRef.current) {
      speak(currentTextRef.current, currentLangRef.current);
    }
  }, []);

  const speak = useCallback(
    async (text: string, language: Language = "ml") => {
      const cleanText = text
        .replace(/[*#_`>]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[₹]/g, "രൂപ ")
        .replace(/\.{2,}/g, " ")
        .replace(/\./g, " , ")
        .replace(/[!?]/g, " , ")
        .replace(/\b(full\s*stop|period)\b/gi, "")
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s{2,}/g, " ")
        .replace(/[,.\s]+$/, "")
        .trim();

      if (!cleanText) {
        optionsRef.current?.onDone?.();
        return;
      }

      await stop();

      currentTextRef.current = cleanText;
      currentLangRef.current = language;
      setIsSpeaking(true);
      setIsPaused(false);
      optionsRef.current?.onStart?.();

      let targetLocale = "en-IN";
      let textToSpeak = cleanText;

      if (language === "ml") {
        const hasMl = await isMalayalamVoiceAvailable();
        if (hasMl) {
          targetLocale = "ml-IN";
          textToSpeak = cleanText;
        } else {
          // Device has no Malayalam voice: convert to phonetic clean speech
          targetLocale = "en-IN";
          textToSpeak = convertMalayalamToCleanSpeech(cleanText);
        }
      } else {
        targetLocale = language === "hi" ? "hi-IN" : "en-IN";
      }

      const voiceId = await getBestSoftLadyVoice(targetLocale);

      try {
        Speech.speak(textToSpeak, {
          language: targetLocale,
          rate: 0.90, // Conversational pacing
          pitch: 1.08, // Gentle friendly pitch
          voice: voiceId,
          onDone: () => {
            setIsSpeaking(false);
            setIsPaused(false);
            optionsRef.current?.onDone?.();
          },
          onError: (e) => {
            console.warn("Speech error:", e);
            setIsSpeaking(false);
            setIsPaused(false);
            optionsRef.current?.onError?.(e);
          },
          onStopped: () => {
            setIsSpeaking(false);
            setIsPaused(false);
            optionsRef.current?.onStopped?.();
          },
        });
      } catch (e) {
        console.warn("Speech.speak failed:", e);
        // Fallback for Web browser speech synthesis
        if (
          Platform.OS === "web" &&
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          try {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = targetLocale;
            utterance.rate = 0.90;
            utterance.pitch = 1.08;
            utterance.onend = () => {
              setIsSpeaking(false);
              optionsRef.current?.onDone?.();
            };
            utterance.onerror = (err) => {
              setIsSpeaking(false);
              optionsRef.current?.onError?.(err);
            };
            window.speechSynthesis.speak(utterance);
          } catch {
            setIsSpeaking(false);
          }
        } else {
          setIsSpeaking(false);
        }
      }
    },
    [stop]
  );

  // Pure cleanup on unmount: stop audio without triggering state updates or loop
  useEffect(() => {
    return () => {
      try {
        Speech.stop();
      } catch {}
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  return {
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
  };
}
