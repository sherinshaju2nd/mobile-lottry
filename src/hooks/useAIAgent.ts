import { useState, useCallback, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  AgentState,
  AgentLanguage,
  AgentMessage,
  ChatHistorySession,
  PermissionStatus,
  AIAgentContextState,
} from "../types/aiAgent";
import {
  ActivityStep,
  ConversationContext,
  StructuredIntent,
} from "../features/ai/types/aiTypes";
import { useSpeechRecognition } from "../features/ai/hooks/useSpeechRecognition";
import { useTextToSpeech } from "../features/ai/hooks/useTextToSpeech";
import { detectIntentWithGemini } from "../features/ai/services/intentDetector";
import { queryVerifiedLotteryData } from "../features/ai/services/verifiedLotteryService";
import { generateNaturalMalayalamResponse } from "../features/ai/services/malayalamResponseGenerator";
import {
  triggerLightHaptic,
  triggerSuccessHaptic,
  triggerErrorHaptic,
} from "../utils/haptics";
import { requestRecordingPermissionsAsync } from "expo-audio";

const HISTORY_STORAGE_KEY = "@kerala_lottery_ai_history_v2";

const DEFAULT_ACTIVITY_STEPS: ActivityStep[] = [
  { id: "understand", label: "Understanding question", labelMl: "ചോദ്യം മനസ്സിലാക്കുന്നു", status: "pending" },
  { id: "search", label: "Checking the database...", labelMl: "ഡാറ്റാബേസിൽ തിരയുന്നു...", status: "pending" },
  { id: "verify", label: "Preparing your answer...", labelMl: "മറുപടി തയ്യാറാക്കുന്നു...", status: "pending" },
  { id: "speak", label: "Speaking response", labelMl: "മറുപടി നൽകുന്നു", status: "pending" },
];

export interface UseAIAgentOptions {
  initialLanguage?: AgentLanguage;
  autoGreeting?: boolean;
}

export function useAIAgent(options: UseAIAgentOptions = {}): AIAgentContextState {
  const { initialLanguage = "ml", autoGreeting = true } = options;

  const [state, setState] = useState<AgentState>("greeting");
  const [transcript, setTranscript] = useState<string>("");
  const [response, setResponse] = useState<AgentMessage | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [language, setLanguageState] = useState<AgentLanguage>(initialLanguage);
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>(DEFAULT_ACTIVITY_STEPS);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("undetermined");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [history, setHistory] = useState<ChatHistorySession[]>([]);

  // Concurrency & race protection token
  const activeRequestIdRef = useRef<number>(0);
  const isInputLockedRef = useRef<boolean>(false);
  const lastQueryRef = useRef<string>("");
  const audioIntervalRef = useRef<any>(null);

  // Conversational Memory
  const contextRef = useRef<ConversationContext>({
    lastLottery: null,
    lastLotteryCode: null,
    lastDate: null,
    lastTicketNumber: null,
    history: [],
  });

  // Load history from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setHistory(parsed.slice(0, 30));
          }
        }
      } catch (err) {
        console.warn("Failed to load AI history:", err);
      }
    })();
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      const online = Boolean(netState.isConnected && netState.isInternetReachable !== false);
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  // Sync isInputLockedRef with current state
  useEffect(() => {
    const lockedStates: AgentState[] = [
      "transcribing",
      "thinking",
      "searching",
      "processing",
      "speaking",
    ];
    isInputLockedRef.current = lockedStates.includes(state);
  }, [state]);

  // Audio level simulator / reactive amplitude pulse
  const startAudioWaveAnimation = useCallback((isHighActivity: boolean) => {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = setInterval(() => {
      const base = isHighActivity ? 0.45 : 0.2;
      const variation = Math.random() * (isHighActivity ? 0.55 : 0.3);
      setAudioLevel(parseFloat((base + variation).toFixed(2)));
    }, 100);
  }, []);

  const stopAudioWaveAnimation = useCallback(() => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Step Status Helper
  const setStep = useCallback(
    (stepId: string, status: "completed" | "in_progress" | "pending") => {
      setActivitySteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status } : s))
      );
    },
    []
  );

  const resetSteps = useCallback(() => {
    setActivitySteps(DEFAULT_ACTIVITY_STEPS.map((s) => ({ ...s, status: "pending" })));
  }, []);

  // Text To Speech Hook
  const { isSpeaking, speak, stop: stopSpeech } = useTextToSpeech({
    onStart: () => {
      setState("speaking");
      setStep("speak", "in_progress");
      startAudioWaveAnimation(true);
    },
    onDone: () => {
      stopAudioWaveAnimation();
      setStep("speak", "completed");
      setState("success");
      // Lifecycle: SUCCESS -> short delay -> IDLE
      setTimeout(() => {
        setState((current) => (current === "success" ? "idle" : current));
      }, 1500);
    },
    onStopped: () => {
      stopAudioWaveAnimation();
      setState("idle");
    },
    onError: () => {
      stopAudioWaveAnimation();
      setState("idle");
    },
  });

  // Request Permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      const status: PermissionStatus = perm.granted ? "granted" : "denied";
      setPermissionStatus(status);
      return perm.granted;
    } catch {
      setPermissionStatus("denied");
      return false;
    }
  }, []);

  // Save session to history
  const saveSessionToHistory = useCallback(
    async (queryText: string, replyText: string) => {
      try {
        const newSession: ChatHistorySession = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          query: queryText,
          responsePreview: replyText.replace(/[*#_`]/g, "").slice(0, 100),
          timestamp: Date.now(),
          language,
        };
        setHistory((prev) => {
          const updated = [newSession, ...prev.filter((p) => p.query !== queryText)].slice(0, 30);
          AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      } catch (e) {
        console.warn("Error saving history:", e);
      }
    },
    [language]
  );

  // Core Query Execution Pipeline:
  // THINKING -> SEARCHING (Real DB) -> PROCESSING -> SPEAKING -> SUCCESS -> IDLE
  const executeQuery = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) return;

      // Double-action / concurrency lock
      if (isInputLockedRef.current) {
        console.warn("AIAgent: Input locked, ignoring concurrent submission:", query);
        return;
      }

      // Check network status
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || netState.isInternetReachable === false) {
        triggerErrorHaptic();
        setState("error");
        setErrorMessage(
          language === "ml"
            ? "ഇന്റർനെറ്റ് കണക്ഷൻ ലഭ്യമല്ല. ദയവായി കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക."
            : "No internet connection. Please check your connection and try again."
        );
        return;
      }

      const currentReqId = ++activeRequestIdRef.current;
      lastQueryRef.current = query;
      triggerLightHaptic();
      await stopSpeech();

      // Reset steps
      resetSteps();
      setErrorMessage(null);

      // Add user message
      const userMsg: AgentMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: query,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // 1. THINKING state (Intent recognition)
        setState("thinking");
        setStep("understand", "in_progress");

        const intentResult: StructuredIntent = await detectIntentWithGemini(
          query,
          contextRef.current
        );

        if (activeRequestIdRef.current !== currentReqId) return; // Stale request
        setStep("understand", "completed");

        // 2. SEARCHING state (Database Query)
        // Animation continues ONLY while the real API/DB query is running!
        setState("searching");
        setStep("search", "in_progress");

        const verifiedData = await queryVerifiedLotteryData(intentResult);

        if (activeRequestIdRef.current !== currentReqId) return; // Stale request
        setStep("search", "completed");

        // 3. PROCESSING state (Transform DB result into natural response)
        setState("processing");
        setStep("verify", "in_progress");

        const generatedResponse = generateNaturalMalayalamResponse(
          intentResult,
          verifiedData,
          language
        );

        if (activeRequestIdRef.current !== currentReqId) return; // Stale request
        setStep("verify", "completed");

        // Update multi-turn memory
        contextRef.current = {
          lastLottery: intentResult.lottery || contextRef.current.lastLottery,
          lastLotteryCode: intentResult.lotteryCode || contextRef.current.lastLotteryCode,
          lastDate: intentResult.date || contextRef.current.lastDate,
          lastTicketNumber: intentResult.ticketNumber || contextRef.current.lastTicketNumber,
          history: [
            ...contextRef.current.history.slice(-5),
            { role: "user", text: query },
            { role: "model", text: generatedResponse.speechText },
          ],
        };

        const aiMsg: AgentMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: generatedResponse.displayText,
          speechText: generatedResponse.speechText,
          timestamp: Date.now(),
          verifiedData,
          intent: intentResult.intent,
          cardData: generatedResponse.cardData as any,
        };

        setResponse(aiMsg);
        setMessages((prev) => [...prev, aiMsg]);
        saveSessionToHistory(query, generatedResponse.displayText);

        // 4. SPEAKING state
        if (!isVoiceMuted && generatedResponse.speechText) {
          triggerSuccessHaptic();
          speak(generatedResponse.speechText, language);
        } else {
          // If voice muted, directly go to SUCCESS -> IDLE
          setState("success");
          setStep("speak", "completed");
          setTimeout(() => {
            if (activeRequestIdRef.current === currentReqId) {
              setState("idle");
            }
          }, 1400);
        }
      } catch (err: any) {
        if (activeRequestIdRef.current !== currentReqId) return;
        console.error("AI Agent query failed:", err);
        triggerErrorHaptic();
        setState("error");
        const fallbackErr =
          language === "ml"
            ? "ക്ഷമിക്കണം, ആ വിവരങ്ങൾ ഇപ്പോൾ ലഭ്യമാക്കാൻ സാധിച്ചില്ല."
            : "Sorry, I couldn't retrieve that information.";
        setErrorMessage(fallbackErr);

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "ai",
            text: fallbackErr,
            timestamp: Date.now(),
            error: true,
          },
        ]);
      }
    },
    [
      isVoiceMuted,
      language,
      resetSteps,
      saveSessionToHistory,
      setStep,
      speak,
      stopSpeech,
    ]
  );

  // Speech Recognition Hook
  const {
    isListening,
    startListening: startNativeListening,
    stopListening: stopNativeListening,
    abortListening,
    clearError: clearSpeechError,
  } = useSpeechRecognition({
    lang: language === "ml" ? "ml-IN" : "en-IN",
    onResult: (resultText, isFinal) => {
      setTranscript(resultText);
      if (isFinal && resultText.trim()) {
        setState("transcribing");
        stopAudioWaveAnimation();
        executeQuery(resultText);
      }
    },
    onEnd: () => {
      stopAudioWaveAnimation();
      setState((curr) => (curr === "listening" ? "transcribing" : curr));
    },
    onError: (err) => {
      stopAudioWaveAnimation();
      setState("error");
      setErrorMessage(err || "Microphone error. Please try again.");
    },
  });

  // Start Voice Listening
  const startListening = useCallback(async () => {
    if (isInputLockedRef.current) return;

    // Check offline
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || netState.isInternetReachable === false) {
      triggerErrorHaptic();
      setState("error");
      setErrorMessage(
        language === "ml"
          ? "ഇന്റർനെറ്റ് കണക്ഷൻ ലഭ്യമല്ല. ദയവായി കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക."
          : "No internet connection. Please check your connection and try again."
      );
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setState("error");
      setErrorMessage(
        language === "ml"
          ? "വോയ്‌സ് അസിസ്റ്റന്റ് ഉപയോഗിക്കാൻ മൈക്രോഫോൺ അനുമതി ആവശ്യമാണ്."
          : "Microphone permission required to use voice assistant."
      );
      return;
    }

    await stopSpeech();
    clearSpeechError();
    setErrorMessage(null);
    setTranscript("");
    setState("listening");
    startAudioWaveAnimation(true);
    await startNativeListening(language === "ml" ? "ml-IN" : "en-IN");
  }, [
    clearSpeechError,
    language,
    requestPermission,
    startAudioWaveAnimation,
    startNativeListening,
    stopSpeech,
  ]);

  // Stop Listening & proceed to transcribe
  const stopListening = useCallback(async () => {
    if (state !== "listening") return;
    setState("transcribing");
    stopAudioWaveAnimation();
    await stopNativeListening();
  }, [state, stopAudioWaveAnimation, stopNativeListening]);

  // Cancel / Abort active request
  const cancel = useCallback(async () => {
    activeRequestIdRef.current++;
    stopAudioWaveAnimation();
    await abortListening();
    await stopSpeech();
    resetSteps();
    setErrorMessage(null);
    setState("idle");
  }, [abortListening, resetSteps, stopAudioWaveAnimation, stopSpeech]);

  // Retry
  const retry = useCallback(() => {
    if (lastQueryRef.current) {
      setErrorMessage(null);
      executeQuery(lastQueryRef.current);
    } else {
      setState("idle");
      setErrorMessage(null);
    }
  }, [executeQuery]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsVoiceMuted((prev) => {
      const next = !prev;
      if (next && isSpeaking) {
        stopSpeech();
      }
      return next;
    });
  }, [isSpeaking, stopSpeech]);

  // Clear Chat History
  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY).catch(() => {});
  }, []);

  // Open past session
  const openSessionHistory = useCallback(
    (sessionId: string) => {
      const session = history.find((h) => h.id === sessionId);
      if (session) {
        executeQuery(session.query);
      }
    },
    [history, executeQuery]
  );

  // Set Language
  const setLanguage = useCallback((lang: AgentLanguage) => {
    setLanguageState(lang);
  }, []);

  // First open auto greeting
  const greetedRef = useRef<boolean>(false);
  useEffect(() => {
    if (autoGreeting && !greetedRef.current) {
      greetedRef.current = true;
      setState("greeting");
      const greetingGreeting =
        language === "ml"
          ? "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ കേരള ലോട്ടറി AI അസിസ്റ്റന്റാണ്. എന്തുസഹായം വേണം?"
          : "Hi! 👋 How can I help you today?";

      const greetingMsg: AgentMessage = {
        id: `greeting-${Date.now()}`,
        sender: "ai",
        text: greetingGreeting,
        speechText: greetingGreeting,
        timestamp: Date.now(),
      };
      setMessages([greetingMsg]);
      setResponse(greetingMsg);

      // Smoothly transition from greeting to idle after greeting plays
      const timer = setTimeout(() => {
        setState("idle");
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [autoGreeting, language]);

  return {
    state,
    transcript,
    response,
    messages,
    isListening: state === "listening" || isListening,
    isProcessing: [
      "transcribing",
      "thinking",
      "searching",
      "processing",
      "speaking",
    ].includes(state),
    isSpeaking,
    isVoiceMuted,
    language,
    activitySteps,
    audioLevel,
    errorMessage,
    permissionStatus,
    isOnline,
    history,
    startListening,
    stopListening,
    cancel,
    retry,
    askQuestion: executeQuery,
    setLanguage,
    toggleMute,
    clearHistory,
    requestPermission,
    openSessionHistory,
  };
}
