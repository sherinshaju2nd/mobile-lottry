import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { triggerLightHaptic } from "../../../utils/haptics";
import { transcribeAudioWithGemini } from "../services/geminiAudioTranscriber";

// Safely obtain native module without triggering static requireNativeModule crash in Expo Go runtime
const ExpoSpeechRecognitionModule: any = (() => {
  try {
    return requireOptionalNativeModule("ExpoSpeechRecognition");
  } catch (err) {
    return null;
  }
})();

export interface SpeechRecognitionHookOptions {
  lang?: string; // Default: "ml-IN"
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function useSpeechRecognition({
  lang = "ml-IN",
  onResult,
  onError,
  onEnd,
}: SpeechRecognitionHookOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stable callbacks ref to prevent infinite re-render loops
  const callbacksRef = useRef({ onResult, onError, onEnd });
  callbacksRef.current = { onResult, onError, onEnd };

  // Web speech recognition fallback ref
  const webRecognitionRef = useRef<any>(null);

  // Expo Audio recorder for universal Expo Go microphone recording
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioRecorderRef = useRef(audioRecorder);
  audioRecorderRef.current = audioRecorder;

  const isRecordingWithAudioRef = useRef(false);
  const autoStopTimerRef = useRef<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationIntervalRef = useRef<any>(null);

  // Clear timers on cleanup
  const clearTimers = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setRecordingDuration(0);
  }, []);

  // Stop Speech Recognition / Process Voice Recording
  const stopListening = useCallback(async () => {
    clearTimers();

    // 1. Web speech stop
    if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.stop();
      } catch {}
      webRecognitionRef.current = null;
    }

    // 2. Native module stop
    if (ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.stop === "function") {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    }

    // 3. Audio Recorder stop and transcribe with Gemini
    if (isRecordingWithAudioRef.current) {
      isRecordingWithAudioRef.current = false;
      setIsListening(false);
      try {
        const recorder = audioRecorderRef.current;
        await recorder.stop();
        const recordedUri = recorder.uri;
        if (recordedUri) {
          triggerLightHaptic();
          // Transcribe Malayalam voice audio to text using Gemini Multimodal AI
          const recognizedText = await transcribeAudioWithGemini(
            recordedUri,
            lang.startsWith("ml") ? "ml" : "en"
          );

          if (recognizedText && recognizedText.trim()) {
            setTranscript(recognizedText);
            callbacksRef.current.onResult?.(recognizedText, true);
          } else {
            const noSpeechMsg =
              lang.startsWith("ml")
                ? "ശബ്ദം വ്യക്തമായി കേൾക്കാൻ കഴിഞ്ഞില്ല. ദയവായി മൈക്കിന് അടുത്തേക്ക് വന്ന് വീണ്ടും സംസാരിക്കൂ."
                : "Could not hear clearly. Please speak closer to the mic and try again.";
            setErrorMessage(noSpeechMsg);
            callbacksRef.current.onError?.(noSpeechMsg);
            callbacksRef.current.onEnd?.();
          }
        } else {
          callbacksRef.current.onEnd?.();
        }
      } catch (audioErr: any) {
        console.warn("Audio recording stop / transcribe error:", audioErr);
        const errMsg =
          lang.startsWith("ml")
            ? "ശബ്ദം തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. ദയവായി വ്യക്തമായി വീണ്ടും സംസാരിക്കൂ അല്ലെങ്കിൽ താഴെ ടൈപ്പ് ചെയ്യൂ."
            : "Could not transcribe voice. Please speak clearly or type your question below.";
        setErrorMessage(errMsg);
        callbacksRef.current.onError?.(errMsg);
      } finally {
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  }, [lang, clearTimers]);

  // Start Universal Mobile Microphone Recording (Tier 3 fallback)
  const startAudioRecording = useCallback(async (targetLang: string) => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        const permMsg =
          targetLang.startsWith("ml")
            ? "വോയ്‌സ് റെക്കോർഡ് ചെയ്യാൻ മൈക്രോഫോൺ അനുമതി നൽകുക."
            : "Please allow microphone permission to record voice.";
        setErrorMessage(permMsg);
        callbacksRef.current.onError?.(permMsg);
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const recorder = audioRecorderRef.current;

      // Safely ensure recorder is ready
      try {
        const currentStatus = recorder.getStatus();
        if (currentStatus?.isRecording) {
          await recorder.stop();
        }
      } catch {}

      try {
        await recorder.prepareToRecordAsync();
      } catch (prepErr) {
        console.log("prepareToRecordAsync notice:", prepErr);
      }

      recorder.record();
      isRecordingWithAudioRef.current = true;
      setIsListening(true);
      triggerLightHaptic();

      // Start duration counter for user feedback
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto-stop after 8 seconds of continuous recording
      autoStopTimerRef.current = setTimeout(() => {
        if (isRecordingWithAudioRef.current) {
          stopListening();
        }
      }, 8000);
    } catch (err: any) {
      console.warn("Failed to start audio recording:", err);
      setIsListening(false);
      isRecordingWithAudioRef.current = false;
      clearTimers();
      const errMsg =
        targetLang.startsWith("ml")
          ? "മൈക്രോഫോൺ ആരംഭിക്കാൻ സാധിച്ചില്ല. മൈക്രോഫോൺ അനുമതി നൽകിയിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക."
          : "Could not access microphone. Please check microphone permissions in settings.";
      setErrorMessage(errMsg);
      callbacksRef.current.onError?.(errMsg);
    }
  }, [clearTimers, stopListening]);

  // Native Expo speech recognition event subscriptions (only when module is available)
  useEffect(() => {
    if (!ExpoSpeechRecognitionModule || typeof ExpoSpeechRecognitionModule.addListener !== "function") {
      return;
    }

    const subStart = ExpoSpeechRecognitionModule.addListener("start", () => {
      setIsListening(true);
      setTranscript("");
      setErrorMessage(null);
      triggerLightHaptic();
    });

    const subResult = ExpoSpeechRecognitionModule.addListener("result", (event: any) => {
      const primaryResult = event?.results?.[0];
      if (primaryResult?.transcript) {
        setTranscript(primaryResult.transcript);
        callbacksRef.current.onResult?.(primaryResult.transcript, Boolean(event?.isFinal));
      }
    });

    const subError = ExpoSpeechRecognitionModule.addListener("error", (event: any) => {
      console.warn("Native speech recognition error, falling back to audio recording:", event?.error, event?.message);
      setIsListening(false);
      startAudioRecording(lang);
    });

    const subEnd = ExpoSpeechRecognitionModule.addListener("end", () => {
      setIsListening(false);
      callbacksRef.current.onEnd?.();
    });

    return () => {
      subStart?.remove?.();
      subResult?.remove?.();
      subError?.remove?.();
      subEnd?.remove?.();
    };
  }, [lang, startAudioRecording]);

  // Start Speech Recognition
  const startListening = useCallback(
    async (preferredLang?: string) => {
      const targetLang = preferredLang || lang;
      setErrorMessage(null);
      setTranscript("");

      // Tier 1: Try browser Web Speech API (if running on web platform)
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          try {
            if (webRecognitionRef.current) {
              try { webRecognitionRef.current.abort(); } catch {}
            }
            const recognition = new SpeechRecognition();
            recognition.lang = targetLang;
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
              setIsListening(true);
              triggerLightHaptic();
            };

            recognition.onresult = (event: any) => {
              const res = event.results?.[0]?.[0]?.transcript;
              if (res) {
                setTranscript(res);
                callbacksRef.current.onResult?.(res, true);
              }
              setIsListening(false);
            };

            recognition.onerror = (e: any) => {
              console.warn("Web speech error:", e);
              setIsListening(false);
              const errMsg =
                targetLang.startsWith("ml")
                  ? "വോയ്‌സ് റെക്കഗ്നിഷൻ തകരാർ. ദയവായി വീണ്ടും ശ്രമിക്കുക."
                  : "Voice recognition failed. Please try again.";
              setErrorMessage(errMsg);
              callbacksRef.current.onError?.(errMsg);
            };

            recognition.onend = () => {
              setIsListening(false);
              callbacksRef.current.onEnd?.();
            };

            webRecognitionRef.current = recognition;
            recognition.start();
            return;
          } catch (e) {
            console.warn("Web speech start error, falling back to audio recording:", e);
          }
        }
      }

      // Tier 2: Try ExpoSpeechRecognition native module if available
      if (
        ExpoSpeechRecognitionModule &&
        typeof ExpoSpeechRecognitionModule.requestPermissionsAsync === "function" &&
        typeof ExpoSpeechRecognitionModule.start === "function"
      ) {
        try {
          const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
          if (perm.granted) {
            ExpoSpeechRecognitionModule.start({
              lang: targetLang,
              interimResults: true,
              maxAlternatives: 1,
              requiresOnDeviceRecognition: false,
              addsPunctuation: true,
            });
            setIsListening(true);
            return;
          }
        } catch (nativeErr) {
          console.warn("Native speech start failed, falling back to audio recording:", nativeErr);
        }
      }

      // Tier 3: Universal Audio Recording + Gemini Multimodal Audio Transcriber
      await startAudioRecording(targetLang);
    },
    [lang, startAudioRecording]
  );

  // Abort Listening
  const abortListening = useCallback(async () => {
    clearTimers();

    if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.abort();
      } catch {}
      webRecognitionRef.current = null;
    }

    if (ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.abort === "function") {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {}
    }

    if (isRecordingWithAudioRef.current) {
      isRecordingWithAudioRef.current = false;
      try {
        await audioRecorderRef.current.stop();
      } catch {}
    }

    setIsListening(false);
  }, [clearTimers]);

  // Safe unmount cleanup: do not trigger state changes during unmount
  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (webRecognitionRef.current) {
        try { webRecognitionRef.current.abort(); } catch {}
      }
      if (ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.abort === "function") {
        try { ExpoSpeechRecognitionModule.abort(); } catch {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    errorMessage,
    recordingDuration,
    isNativeAvailable: Boolean(ExpoSpeechRecognitionModule),
    startListening,
    stopListening,
    abortListening,
    clearError: () => setErrorMessage(null),
  };
}
