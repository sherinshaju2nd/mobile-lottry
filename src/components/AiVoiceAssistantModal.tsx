import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import {
  X,
  Sparkles,
  Send,
  Mic,
  Trash2,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import {
  chatWithGeminiAssistantMobile,
  chatWithGeminiAudioMobile,
} from "../api/lotteryApi";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

import { useLanguage } from "../context/LanguageContext";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  time: string;
  isVoice?: boolean;
  voiceDuration?: number;
}

interface AiVoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS_ML = [
  "🏆 ഇന്നത്തെ ഒന്നാം സമ്മാനം ഏതാണ്?",
  "💳 സമ്മാനം ക്ലെയിം ചെയ്യുന്ന വിധം",
  "📅 അടുത്ത ബംപർ ലോട്ടറി എന്നാണ്?",
  "🔍 ഇന്നത്തെ റിസൾട്ട് പരിശോധിക്കുക",
  "📑 ലോട്ടറി ടാക്സ് (TDS 30%) നിയമങ്ങൾ",
  "⏰ നറുക്കെടുപ്പ് സമയം (ഉച്ചയ്ക്ക് 3:00 മണി)",
];

const QUICK_SUGGESTIONS_EN = [
  "🏆 What is today's 1st prize result?",
  "💳 How to claim Kerala lottery prize?",
  "📅 When is the next bumper lottery draw?",
  "🔍 Check today's lottery winning ticket",
  "📑 Kerala lottery tax (TDS 30%) rules",
  "⏰ Daily Live Draw Timings (3:00 PM)",
];

const WAVE_BARS_COUNT = 14;

// WhatsApp-style Animated Audio Waveform Timeline Component
function AnimatedWaveformTimeline({ isRecording }: { isRecording: boolean }) {
  const animatedValues = useRef(
    Array.from({ length: WAVE_BARS_COUNT }, () => new Animated.Value(0.35))
  ).current;

  useEffect(() => {
    if (!isRecording) return;
    const animations = animatedValues.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.2 + ((i * 17 + 23) % 80) / 100,
            duration: 140 + (i % 6) * 40,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.12 + (i % 4) * 0.08,
            duration: 140 + (i % 6) * 40,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [isRecording, animatedValues]);

  return (
    <View style={styles.waveformContainer}>
      {animatedValues.map((anim, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.waveformBar,
            {
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function AiVoiceAssistantModal({
  visible,
  onClose,
}: AiVoiceAssistantModalProps) {
  const { language, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<"ml" | "en">(language || "ml");

  const getGreeting = (lang: "ml" | "en") => {
    return lang === "ml"
      ? "നമസ്കാരം! ഞാൻ കേരള ലോട്ടറി AI വോയ്‌സ് അസിസ്റ്റന്റാണ്. മൈക്ക് അമർത്തി സംസാരിക്കൂ അല്ലെങ്കിൽ ചോദ്യങ്ങൾ ടൈപ്പ് ചെയ്യൂ.\n\n(Tap the microphone to speak or type your question in Malayalam or English.)"
      : "Hello! I am Kerala Lottery AI Assistant. Tap the microphone to speak or type your question in English or Malayalam.";
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "model",
      text: getGreeting(language || "ml"),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Sync language when modal becomes visible
  useEffect(() => {
    if (visible) {
      setSelectedLang(language);
      setMessages([
        {
          id: "init",
          role: "model",
          text: getGreeting(language),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [visible, language]);


  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Blinking red dot animation during WhatsApp recording
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.15,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [isRecording, blinkAnim]);

  // Stop any playing audio
  const stopAudio = useCallback(() => {
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
    setPlayingMessageId(null);
  }, []);

  // Speak text using expo-speech
  const speakText = useCallback(
    (text: string, msgId?: string) => {
      stopAudio();
      const cleanText = text.replace(/[*#_`]/g, "").trim();
      const langCode = selectedLang === "ml" ? "ml-IN" : "en-IN";

      if (msgId) setPlayingMessageId(msgId);

      try {
        Speech.speak(cleanText, {
          language: langCode,
          pitch: 1.0,
          rate: 0.95,
          onDone: () => setPlayingMessageId(null),
          onError: () => setPlayingMessageId(null),
        });
      } catch {
        if (
          Platform.OS === "web" &&
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = langCode;
          utterance.onend = () => setPlayingMessageId(null);
          utterance.onerror = () => setPlayingMessageId(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setPlayingMessageId(null);
        }
      }
    },
    [selectedLang, stopAudio]
  );

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } else {
      stopAudio();
      cancelRecording();
    }
  }, [visible, stopAudio]);

  // 1. WhatsApp Voice Start Recording
  const startRecording = async () => {
    stopAudio();
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone Permission Required",
          "Please enable microphone access in your phone Settings so you can speak to Kerala Lottery AI in Malayalam or English.",
          [{ text: "OK" }]
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Audio recording init error:", err);
      Alert.alert(
        "Recording Error",
        "Could not access microphone. Please ensure microphone permissions are allowed."
      );
      setIsRecording(false);
    }
  };

  // 2. WhatsApp Voice Cancel / Trash Recording
  const cancelRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isRecording) {
      try {
        await audioRecorder.stop();
      } catch {}
    }
    setIsRecording(false);
    setRecordSeconds(0);
  };

  // 3. WhatsApp Voice Send Recording
  const sendRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = recordSeconds;
    setIsRecording(false);
    setIsLoading(true);

    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = audioRecorder.uri;
      if (!uri) throw new Error("Audio file URI not found.");

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const tempId = `u-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "user",
          text: `🎙️ Processing Voice (${duration}s)...`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isVoice: true,
          voiceDuration: duration,
        },
      ]);

      const historyPayload = messages
        .slice(-4)
        .map((m) => ({ role: m.role, text: m.text }));
      const mimeType = Platform.OS === "ios" ? "audio/m4a" : "audio/mp4";

      const result = await chatWithGeminiAudioMobile(
        base64Audio,
        mimeType,
        historyPayload
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, text: result.userTranscript }
            : m
        )
      );

      const botMsgId = `b-${Date.now()}`;
      const botMsg: Message = {
        id: botMsgId,
        role: "model",
        text: result.reply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMsg]);

      speakText(result.reply, botMsgId);
    } catch (err: any) {
      console.warn("Audio processing error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "model",
          text: "ക്ഷമിക്കണം, ശബ്ദം വ്യക്തമായി കേൾക്കാൻ സാധിച്ചില്ല. ദയവായി അല്പം ഉറക്കെ വീണ്ടും ചോദിക്കുക.\n\n(Could not understand voice clearly. Please speak closer to the mic and retry.)",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setRecordSeconds(0);
    }
  };

  const handleSendText = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading || isRecording) return;

    triggerLightHaptic();
    stopAudio();

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const historyPayload = messages
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));
      const reply = await chatWithGeminiAssistantMobile(text, historyPayload);

      const botMsgId = `b-${Date.now()}`;
      const botMsg: Message = {
        id: botMsgId,
        role: "model",
        text: reply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMsg]);
      triggerSuccessHaptic();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "model",
          text: err.message || "Connection error with AI. Please retry.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    stopAudio();
    cancelRecording();
    setMessages([
      {
        id: "init",
        role: "model",
        text: selectedLang === "ml"
          ? "ചാറ്റ് ക്ലിയർ ചെയ്തു. എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?\n\n(Chat cleared. How can I assist you?)"
          : "Chat cleared. How can I assist you today?",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const handleLanguageSwitch = (lang: "ml" | "en") => {
    setSelectedLang(lang);
    stopAudio();
  };

  const currentSuggestions = selectedLang === "ml" ? QUICK_SUGGESTIONS_ML : QUICK_SUGGESTIONS_EN;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          {/* Mobile Bottom Sheet Pull Pill */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.avatarWrap}>
                <Sparkles size={18} color="#FBBF24" />
              </View>
              <View>
                <View style={styles.badgeRow}>
                  <Text style={styles.title}>Kerala Lottery AI</Text>
                  <View style={styles.modelBadge}>
                    <Text style={styles.modelBadgeText}>Gemini AI</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  {selectedLang === "ml"
                    ? "മലയാളം വോയ്‌സ് അസിസ്റ്റന്റ്"
                    : "English Voice Assistant"}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* Segmented Language Switch */}
              <View style={styles.segmentedLang}>
                <TouchableOpacity
                  onPress={() => handleLanguageSwitch("ml")}
                  style={[
                    styles.langPill,
                    selectedLang === "ml" && styles.langPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      selectedLang === "ml" && styles.langPillTextActive,
                    ]}
                  >
                    മലയാളം
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleLanguageSwitch("en")}
                  style={[
                    styles.langPill,
                    selectedLang === "en" && styles.langPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      selectedLang === "en" && styles.langPillTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleClear} style={styles.iconBtn}>
                <RotateCcw size={16} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Prompt Chips (Single-Row Horizontal Scroll) */}
          {!isRecording && (
            <View style={styles.chipsWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {currentSuggestions.map((q, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.chip}
                    onPress={() => handleSendText(q)}
                  >
                    <Text style={styles.chipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.msgRow,
                  m.role === "user" ? styles.msgRowUser : styles.msgRowBot,
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    m.role === "user"
                      ? styles.msgBubbleUser
                      : styles.msgBubbleBot,
                  ]}
                >
                  {/* WhatsApp Voice Note Bubble Header if user spoke */}
                  {m.isVoice && (
                    <View style={styles.voiceNoteHeader}>
                      <View style={styles.voiceNoteMicIcon}>
                        <Mic size={14} color="#FBBF24" />
                      </View>
                      <View style={styles.miniWaveform}>
                        {[6, 12, 18, 10, 22, 14, 19, 9, 15, 23, 16, 11].map(
                          (h, i) => (
                            <View
                              key={i}
                              style={[styles.miniBar, { height: h * 0.7 }]}
                            />
                          )
                        )}
                      </View>
                      <Text style={styles.voiceDurationText}>
                        {m.voiceDuration ? `${m.voiceDuration}s voice` : "Voice"}
                      </Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.msgText,
                      m.role === "user"
                        ? styles.msgTextUser
                        : styles.msgTextBot,
                    ]}
                  >
                    {m.text}
                  </Text>

                  <View style={styles.msgFooter}>
                    <Text
                      style={[
                        styles.msgTime,
                        m.role === "user"
                          ? styles.msgTimeUser
                          : styles.msgTimeBot,
                      ]}
                    >
                      {m.time}
                    </Text>

                    {/* Audio Playback Button for Bot Messages */}
                    {m.role === "model" && (
                      <TouchableOpacity
                        onPress={() =>
                          playingMessageId === m.id
                            ? stopAudio()
                            : speakText(m.text, m.id)
                        }
                        style={styles.speakerBtn}
                      >
                        {playingMessageId === m.id ? (
                          <VolumeX size={16} color="#DC2626" />
                        ) : (
                          <Volume2 size={16} color="#64748B" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#0B3C5D" />
                <Text style={styles.loadingText}>
                  {selectedLang === "ml"
                    ? "AI വോയ്‌സ് ചോദ്യം വിശകലനം ചെയ്യുന്നു..."
                    : "Gemini AI analyzing voice query..."}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* WhatsApp-style Voice & Text Dock */}
          <View style={styles.dock}>
            {isRecording ? (
              /* WhatsApp Voice Recording Active Bar with Live Waveform Timeline */
              <View style={styles.waRecordingBar}>
                {/* Trash/Cancel on left */}
                <TouchableOpacity
                  style={styles.waTrashBtn}
                  onPress={cancelRecording}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>

                {/* Pulsing red dot + Recording timer */}
                <View style={styles.waTimerGroup}>
                  <Animated.View
                    style={[styles.waPulseDot, { opacity: blinkAnim }]}
                  />
                  <Text style={styles.waTimerText}>
                    {formatTimer(recordSeconds)}
                  </Text>
                </View>

                {/* Animated Audio Waveform Timeline */}
                <AnimatedWaveformTimeline isRecording={isRecording} />

                {/* Send button on right */}
                <TouchableOpacity
                  style={styles.waSendRecordBtn}
                  onPress={sendRecording}
                >
                  <Send size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              /* Normal Text & Mic Input Bar */
              <View style={styles.normalInputBar}>
                <TextInput
                  style={styles.inputField}
                  placeholder={
                    selectedLang === "ml"
                      ? "ചോദിക്കാൻ മൈക്ക് അമർത്തുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക..."
                      : "Tap mic to speak or type query..."
                  }
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  editable={!isLoading}
                  onSubmitEditing={() => handleSendText()}
                  returnKeyType="send"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />

                {inputText.trim().length > 0 ? (
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={() => handleSendText()}
                    disabled={isLoading}
                  >
                    <Send size={17} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  /* WhatsApp-style Mic Button */
                  <TouchableOpacity
                    style={styles.micBtn}
                    onPress={startRecording}
                    activeOpacity={0.7}
                  >
                    <Mic size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  container: {
    height: "88%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  sheetHandleWrap: {
    backgroundColor: "#07263b",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  header: {
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(251, 191, 36, 0.6)",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
  },
  modelBadge: {
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  modelBadgeText: {
    color: "#FDE68A",
    fontSize: 9.5,
    fontWeight: "800",
  },
  subtitle: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  segmentedLang: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  langPillActive: {
    backgroundColor: "#FBBF24",
  },
  langPillText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "700",
  },
  langPillTextActive: {
    color: "#0F172A",
    fontWeight: "800",
  },
  iconBtn: {
    padding: 6,
  },
  chipsWrap: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  chipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipText: {
    color: "#334155",
    fontSize: 11.5,
    fontWeight: "700",
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 14,
    gap: 10,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  msgRowUser: {
    justifyContent: "flex-end",
  },
  msgRowBot: {
    justifyContent: "flex-start",
  },
  msgBubble: {
    maxWidth: "88%",
    padding: 12,
    borderRadius: 18,
  },
  msgBubbleUser: {
    backgroundColor: "#0B3C5D",
    borderBottomRightRadius: 4,
  },
  msgBubbleBot: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  voiceNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  voiceNoteMicIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(251, 191, 36, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniWaveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 20,
    paddingHorizontal: 4,
  },
  miniBar: {
    width: 2.5,
    backgroundColor: "#93C5FD",
    borderRadius: 2,
  },
  voiceDurationText: {
    color: "#93C5FD",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: "auto",
  },
  msgText: {
    fontSize: 13.5,
    lineHeight: 19.5,
  },
  msgTextUser: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  msgTextBot: {
    color: "#1E293B",
  },
  msgFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  speakerBtn: {
    padding: 2,
    marginLeft: 8,
  },
  msgTime: {
    fontSize: 9.5,
  },
  msgTimeUser: {
    color: "#93C5FD",
  },
  msgTimeBot: {
    color: "#94A3B8",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  dock: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  normalInputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputField: {
    flex: 1,
    height: 42,
    backgroundColor: "#F8FAFC",
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0B3C5D",
    alignItems: "center",
    justifyContent: "center",
  },
  waRecordingBar: {
    height: 46,
    backgroundColor: "#FEF2F2",
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "#F87171",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  waTrashBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  waTimerGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
  },
  waPulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#DC2626",
  },
  waTimerText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 26,
    marginHorizontal: 6,
  },
  waveformBar: {
    width: 2.5,
    height: 22,
    backgroundColor: "#DC2626",
    borderRadius: 1.5,
  },
  waSendRecordBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});
