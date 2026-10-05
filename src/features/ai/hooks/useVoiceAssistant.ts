import { useState, useCallback, useRef, useEffect } from "react";
import {
  AssistantVoiceState,
  ChatMessage,
  ConversationContext,
  StructuredIntent,
  ActivityStep,
} from "../types/aiTypes";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useTextToSpeech } from "./useTextToSpeech";
import { detectIntentWithGemini } from "../services/intentDetector";
import { queryVerifiedLotteryData } from "../services/verifiedLotteryService";
import { generateNaturalMalayalamResponse } from "../services/malayalamResponseGenerator";
import { Language } from "../../../constants/translations";
import { triggerLightHaptic, triggerSuccessHaptic, triggerErrorHaptic } from "../../../utils/haptics";

export interface UseVoiceAssistantProps {
  initialLanguage?: Language;
  onStateChange?: (state: AssistantVoiceState) => void;
}

const DEFAULT_STEPS: ActivityStep[] = [
  { id: "understand", label: "Understanding question", labelMl: "ചോദ്യം മനസ്സിലാക്കുന്നു", status: "pending" },
  { id: "search", label: "Searching lottery database", labelMl: "ഡാറ്റാബേസിൽ തിരയുന്നു", status: "pending" },
  { id: "verify", label: "Verifying official numbers", labelMl: "ഫലങ്ങൾ പരിശോധിക്കുന്നു", status: "pending" },
  { id: "speak", label: "Speaking response", labelMl: "മറുപടി നൽകുന്നു", status: "pending" },
];

export function useVoiceAssistant({
  initialLanguage = "ml",
  onStateChange,
}: UseVoiceAssistantProps = {}) {
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>("READY");
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>(DEFAULT_STEPS);
  const [lastQueryText, setLastQueryText] = useState<string>("");

  // Strict concurrency and input-lock guard
  const isProcessingRef = useRef(false);

  // Stable ref for onStateChange callback
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Conversation Context Tracking (Multi-turn conversational memory)
  const contextRef = useRef<ConversationContext>({
    lastLottery: null,
    lastLotteryCode: null,
    lastDate: null,
    lastTicketNumber: null,
    history: [],
  });

  const updateState = useCallback(
    (newState: AssistantVoiceState) => {
      setVoiceState(newState);
      onStateChangeRef.current?.(newState);
    },
    []
  );

  // Step state helper
  const updateStepStatus = useCallback(
    (stepId: string, status: "completed" | "in_progress" | "pending") => {
      setActivitySteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status } : s))
      );
    },
    []
  );

  const resetSteps = useCallback(() => {
    setActivitySteps(DEFAULT_STEPS.map((s) => ({ ...s, status: "pending" })));
  }, []);

  // Text-To-Speech hook
  const { isSpeaking, isPaused, speak, pause, resume, stop } = useTextToSpeech({
    onStart: () => {
      updateState("SPEAKING");
      updateStepStatus("speak", "in_progress");
    },
    onDone: () => {
      updateStepStatus("speak", "completed");
      updateState("COMPLETED");
      setTimeout(() => {
        isProcessingRef.current = false;
        updateState("READY");
      }, 1400);
    },
    onStopped: () => {
      isProcessingRef.current = false;
      updateState("READY");
    },
    onError: () => {
      isProcessingRef.current = false;
      updateState("READY");
    },
  });

  // Execute AI query pipeline: Intent -> DB Query -> Natural Malayalam Response -> TTS
  const processUserQuery = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;

      // Prevent concurrent/duplicate executions while processing
      if (isProcessingRef.current) {
        console.warn("AI query already in progress, ignoring duplicate input.");
        return;
      }

      isProcessingRef.current = true;
      setLastQueryText(text);

      // Stop any ongoing speech
      await stop();
      triggerLightHaptic();

      // Reset activity steps
      setActivitySteps([
        { id: "understand", label: "Understanding question", labelMl: "ചോദ്യം മനസ്സിലാക്കുന്നു", status: "in_progress" },
        { id: "search", label: "Searching lottery database", labelMl: "ഡാറ്റാബേസിൽ തിരയുന്നു", status: "pending" },
        { id: "verify", label: "Verifying official numbers", labelMl: "ഫലങ്ങൾ പരിശോധിക്കുന്നു", status: "pending" },
        { id: "speak", label: "Speaking response", labelMl: "മറുപടി നൽകുന്നു", status: "pending" },
      ]);

      // 1. Add user message to conversation list immediately
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Lifecycle step: THINKING
      updateState("THINKING");

      try {
        // Step 1: Detect intent with Gemini AI + grounded conversational context
        const intentResult: StructuredIntent = await detectIntentWithGemini(
          text,
          contextRef.current
        );

        updateStepStatus("understand", "completed");

        // Lifecycle step: SEARCHING (dedicated database state)
        updateState("SEARCHING");
        updateStepStatus("search", "in_progress");

        // Step 2: Query verified Supabase database (strictly no hallucinations)
        const verifiedData = await queryVerifiedLotteryData(intentResult);
        updateStepStatus("search", "completed");

        // Lifecycle step: PROCESSING
        updateState("PROCESSING");
        updateStepStatus("verify", "in_progress");

        // Step 3: Generate empathetic, accurate Malayalam response with voice optimizations
        const generatedResponse = generateNaturalMalayalamResponse(
          intentResult,
          verifiedData,
          language
        );
        updateStepStatus("verify", "completed");

        // Update multi-turn context
        contextRef.current = {
          lastLottery: intentResult.lottery || contextRef.current.lastLottery,
          lastLotteryCode: intentResult.lotteryCode || contextRef.current.lastLotteryCode,
          lastDate: intentResult.date || contextRef.current.lastDate,
          lastTicketNumber: intentResult.ticketNumber || contextRef.current.lastTicketNumber,
          history: [
            ...contextRef.current.history.slice(-5),
            { role: "user", text },
            { role: "model", text: generatedResponse.speechText },
          ],
        };

        // Step 4: Add AI response message
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: generatedResponse.displayText,
          speechText: generatedResponse.speechText,
          timestamp: Date.now(),
          verifiedData,
          intent: intentResult.intent,
          cardData: generatedResponse.cardData,
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Lifecycle step: SPEAKING
        if (!isVoiceMuted && generatedResponse.speechText) {
          triggerSuccessHaptic();
          speak(generatedResponse.speechText, language);
        } else {
          updateState("COMPLETED");
          updateStepStatus("speak", "completed");
          setTimeout(() => {
            isProcessingRef.current = false;
            updateState("READY");
          }, 1400);
        }
      } catch (err: any) {
        console.error("processUserQuery error:", err);
        triggerErrorHaptic();
        updateState("ERROR");
        isProcessingRef.current = false;

        const errorText =
          language === "ml"
            ? "ക്ഷമിക്കണം, ലോട്ടറി വിവരങ്ങൾ ലഭ്യമാക്കാൻ തടസ്സം നേരിട്ടു. വീണ്ടും ശ്രമിക്കുക."
            : "Sorry, I could not retrieve the lottery information right now. Please try again.";

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "ai",
            text: errorText,
            speechText: errorText,
            timestamp: Date.now(),
            error: true,
          },
        ]);
      }
    },
    [language, isVoiceMuted, speak, stop, updateState, updateStepStatus]
  );

  // Speech Recognition hook
  const {
    isListening,
    transcript,
    errorMessage,
    recordingDuration,
    startListening: startSpeechRec,
    stopListening: stopSpeechRec,
    abortListening: abortSpeechRec,
    clearError,
  } = useSpeechRecognition({
    lang: language === "ml" ? "ml-IN" : "en-IN",
    onResult: (resultText, isFinal) => {
      if (isFinal && resultText.trim()) {
        if (!isProcessingRef.current) {
          processUserQuery(resultText);
        }
      }
    },
    onEnd: () => {
      setTimeout(() => {
        setVoiceState((currentState) => {
          if (currentState === "LISTENING") {
            return "READY";
          }
          return currentState;
        });
      }, 500);
    },
    onError: (errText?: string) => {
      isProcessingRef.current = false;
      updateState("READY");
      if (errText) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "ai",
            text: errText,
            speechText: errText,
            timestamp: Date.now(),
            error: true,
          },
        ]);
      }
    },
  });

  // Start Mic Listening (with concurrency guard)
  const startListening = useCallback(async () => {
    if (isProcessingRef.current) {
      console.warn("Cannot start listening while processing.");
      return;
    }
    await stop();
    clearError();
    updateState("LISTENING");
    await startSpeechRec(language === "ml" ? "ml-IN" : "en-IN");
  }, [clearError, language, startSpeechRec, stop, updateState]);

  // Stop Mic Listening & Process
  const stopListening = useCallback(async () => {
    updateState("THINKING");
    await stopSpeechRec();
  }, [stopSpeechRec, updateState]);

  // Cancel / Abort
  const cancel = useCallback(async () => {
    isProcessingRef.current = false;
    await abortSpeechRec();
    await stop();
    resetSteps();
    updateState("READY");
  }, [abortSpeechRec, resetSteps, stop, updateState]);

  // Play Greeting on First Open
  const playGreeting = useCallback(
    async (customText?: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      updateState("GREETING");

      const greetingText =
        customText ||
        (language === "ml"
          ? "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ കേരള ലോട്ടറി AI അസിസ്റ്റന്റാണ്. എന്തുസഹായം വേണം?"
          : "Hi! 👋 How can I help you today?");

      const welcomeMsg: ChatMessage = {
        id: `greeting-${Date.now()}`,
        sender: "ai",
        text: greetingText,
        speechText: greetingText,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        if (prev.length === 0 || (prev.length === 1 && prev[0].id.startsWith("greeting"))) {
          return [welcomeMsg];
        }
        return prev;
      });

      if (!isVoiceMuted) {
        speak(greetingText, language);
      } else {
        setTimeout(() => {
          isProcessingRef.current = false;
          updateState("READY");
        }, 1500);
      }
    },
    [isVoiceMuted, language, speak, updateState]
  );

  // Retry last query
  const retryLastQuery = useCallback(() => {
    if (lastQueryText && !isProcessingRef.current) {
      processUserQuery(lastQueryText);
    }
  }, [lastQueryText, processUserQuery]);

  // Reset Conversation
  const resetConversation = useCallback(() => {
    isProcessingRef.current = false;
    contextRef.current = {
      lastLottery: null,
      lastLotteryCode: null,
      lastDate: null,
      lastTicketNumber: null,
      history: [],
    };
    setMessages([]);
    resetSteps();
    stop();
    updateState("READY");
  }, [resetSteps, stop, updateState]);

  // Global processing lock flag
  const isProcessing =
    voiceState === "THINKING" ||
    voiceState === "SEARCHING" ||
    voiceState === "PROCESSING" ||
    voiceState === "SPEAKING";

  return {
    voiceState,
    isListening,
    isSpeaking,
    isPaused,
    isProcessing,
    isVoiceMuted,
    activitySteps,
    transcript,
    messages,
    language,
    errorMessage,
    recordingDuration,
    setLanguage,
    setIsVoiceMuted,
    startListening,
    stopListening,
    cancel,
    clearError,
    askQuestion: processUserQuery,
    retryLastQuery,
    playGreeting,
    stopSpeech: stop,
    pauseSpeech: pause,
    resumeSpeech: resume,
    resetConversation,
  };
}
