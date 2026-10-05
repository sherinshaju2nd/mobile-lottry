import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Menu,
  Settings,
  X,
  MessageSquare,
  FileText,
  Clock,
  Mic,
  MessageCircle,
  Search,
  ArrowRight,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  ChevronRight,
  Globe,
} from "lucide-react-native";
import { useAIAgent } from "../../hooks/useAIAgent";
import AgentBackground from "./AgentBackground";
import AICharacter from "./AICharacter";
import AIStatus from "./AIStatus";
import VoiceVisualizer from "./VoiceVisualizer";
import MicrophoneButton from "./MicrophoneButton";
import QuickActions from "./QuickActions";
import ResponseCard from "./ResponseCard";
import AgentActivity from "./AgentActivity";
import AgentError from "./AgentError";
import AgentPermission from "./AgentPermission";
import { triggerLightHaptic, triggerSuccessHaptic } from "../../utils/haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface AIAssistantProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function AIAssistant({ onClose, isModal = false }: AIAssistantProps) {
  const insets = useSafeAreaInsets();
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "results" | "history">("chat");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Master AI Agent Controller
  const {
    state,
    transcript,
    response,
    messages,
    isListening,
    isProcessing,
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
    askQuestion,
    setLanguage,
    toggleMute,
    clearHistory,
    requestPermission,
    openSessionHistory,
  } = useAIAgent({
    initialLanguage: "en",
    autoGreeting: true,
  });

  const scrollRef = useRef<ScrollView>(null);

  // Auto scroll when responses arrive
  useEffect(() => {
    if (response) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [response]);

  // Handle Mic Press
  const handleMicPress = () => {
    if (isSpeaking) {
      cancel();
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    triggerLightHaptic();
    setLanguage(language === "ml" ? "en" : "ml");
  };

  const isExecuting = [
    "transcribing",
    "thinking",
    "searching",
    "processing",
  ].includes(state);

  // -------------------------------------------------------------
  // SCREEN 1: WELCOME ONBOARDING SCREEN
  // -------------------------------------------------------------
  if (showWelcome) {
    return (
      <AgentBackground>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.welcomeContainer}>
            {/* Top Close / Skip */}
            <View style={styles.welcomeTopBar}>
              <View style={{ flex: 1 }} />
              {onClose ? (
                <TouchableOpacity
                  style={styles.iconCircle}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Floating Character */}
            <View style={styles.welcomeCharacterBox}>
              <AICharacter state="idle" size={190} audioLevel={0} />
            </View>

            {/* Title & Tagline */}
            <View style={styles.welcomeTextBox}>
              <View style={styles.welcomeTitleRow}>
                <View style={styles.miniAudioWave}>
                  <View style={[styles.miniBar, { height: 10 }]} />
                  <View style={[styles.miniBar, { height: 16 }]} />
                  <View style={[styles.miniBar, { height: 8 }]} />
                </View>
                <Text style={styles.welcomeTitle}>Kerala Lottery AI</Text>
              </View>
              <Text style={styles.welcomeSubtitle}>
                Your smart assistant for Kerala Lottery results.
              </Text>
            </View>

            {/* Feature List */}
            <View style={styles.featureListBox}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBadge, { backgroundColor: "rgba(168, 85, 247, 0.2)" }]}>
                  <Mic size={15} color="#C084FC" />
                </View>
                <Text style={styles.featureText}>Get latest results</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBadge, { backgroundColor: "rgba(56, 189, 248, 0.2)" }]}>
                  <MessageCircle size={15} color="#38BDF8" />
                </View>
                <Text style={styles.featureText}>Check upcoming draws</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBadge, { backgroundColor: "rgba(34, 197, 94, 0.2)" }]}>
                  <Search size={15} color="#4ADE80" />
                </View>
                <Text style={styles.featureText}>Search ticket numbers</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBadge, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                  <Clock size={15} color="#60A5FA" />
                </View>
                <Text style={styles.featureText}>View history and more</Text>
              </View>
            </View>

            {/* Get Started Button */}
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => {
                triggerSuccessHaptic();
                setShowWelcome(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </AgentBackground>
    );
  }

  // -------------------------------------------------------------
  // SCREENS 2, 3, 4, 5: ACTIVE AI ASSISTANT EXPERIENCE
  // -------------------------------------------------------------
  return (
    <AgentBackground>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          {/* 1. TOP APP HEADER (matching Image 2) */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                triggerLightHaptic();
                if (onClose) onClose();
                else setShowSettingsModal(true);
              }}
              activeOpacity={0.7}
            >
              {onClose ? (
                <X size={20} color="#FFFFFF" />
              ) : (
                <Menu size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Kerala Lottery AI</Text>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                triggerLightHaptic();
                setShowSettingsModal(true);
              }}
              activeOpacity={0.7}
            >
              <Settings size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 2. BODY CONTENT */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 3D Character with Glow Aura */}
            <View style={styles.characterContainer}>
              <AICharacter
                state={state}
                size={SCREEN_HEIGHT > 750 ? 210 : 180}
                audioLevel={audioLevel}
              />
            </View>

            {/* Contextual Status Header */}
            <AIStatus
              state={state}
              language={language}
              customMessage={transcript && state === "transcribing" ? `"${transcript}"` : null}
            />

            {/* Soundwave Visualizer (Under status when listening or searching) */}
            {(state === "listening" || state === "searching" || state === "speaking") && (
              <VoiceVisualizer
                mode={
                  state === "listening"
                    ? "listening"
                    : state === "speaking"
                    ? "speaking"
                    : "idle"
                }
                audioLevel={audioLevel}
              />
            )}

            {/* Checklist Card during Thinking / Searching */}
            {isExecuting && (
              <AgentActivity state={state} language={language} />
            )}

            {/* Error Card */}
            {state === "error" && (
              <AgentError
                message={errorMessage}
                isOffline={!isOnline}
                language={language}
                onRetry={retry}
                onDismiss={cancel}
              />
            )}

            {/* Permission Prompt Card */}
            {permissionStatus === "denied" && (
              <AgentPermission
                language={language}
                onRequestPermission={requestPermission}
                onDismiss={() => {}}
              />
            )}

            {/* Response Card (when DB results are ready) */}
            {response && response.cardData && (
              <ResponseCard message={response} language={language} />
            )}

            {response && response.text && !response.cardData && (
              <View style={styles.simpleResponseCard}>
                <Text style={styles.simpleResponseText}>{response.text}</Text>
              </View>
            )}

            {/* 2x2 Quick Action Grid (Shown in Idle / Ready / Greeting per Screen 2) */}
            {!isExecuting && !response && (
              <QuickActions
                state={state}
                language={language}
                onSelectAction={(query) => askQuestion(query)}
              />
            )}
          </ScrollView>

          {/* 3. CENTERED CIRCULAR MICROPHONE BUTTON (matching Image 2) */}
          <View style={styles.micArea}>
            <MicrophoneButton
              state={state}
              onPress={handleMicPress}
              disabled={!isOnline || permissionStatus === "denied"}
              language={language}
              size={68}
            />
          </View>

          {/* 4. BOTTOM THREE-TAB NAVIGATION BAR (Chat, Results, History per Image 2) */}
          <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {/* Tab 1: Chat */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                triggerLightHaptic();
                setActiveTab("chat");
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconBox, activeTab === "chat" && styles.tabIconBoxActive]}>
                <MessageSquare
                  size={19}
                  color={activeTab === "chat" ? "#38BDF8" : "#64748B"}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "chat" && styles.tabLabelActive,
                ]}
              >
                Chat
              </Text>
            </TouchableOpacity>

            {/* Tab 2: Results */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                triggerLightHaptic();
                setActiveTab("results");
                askQuestion("What is today's lottery result?");
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconBox, activeTab === "results" && styles.tabIconBoxActive]}>
                <FileText
                  size={19}
                  color={activeTab === "results" ? "#38BDF8" : "#64748B"}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "results" && styles.tabLabelActive,
                ]}
              >
                Results
              </Text>
            </TouchableOpacity>

            {/* Tab 3: History */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                triggerLightHaptic();
                setActiveTab("history");
                setShowSettingsModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconBox, activeTab === "history" && styles.tabIconBoxActive]}>
                <Clock
                  size={19}
                  color={activeTab === "history" ? "#38BDF8" : "#64748B"}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "history" && styles.tabLabelActive,
                ]}
              >
                History
              </Text>
            </TouchableOpacity>
          </View>

          {/* SETTINGS & CHAT HISTORY MODAL */}
          <Modal
            visible={showSettingsModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowSettingsModal(false)}
          >
            <View style={styles.historyModalOverlay}>
              <View style={styles.historyModalContent}>
                <View style={styles.historyHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Clock size={18} color="#38BDF8" style={{ marginRight: 8 }} />
                    <Text style={styles.historyTitle}>
                      {language === "ml" ? "ക്രമീകരണങ്ങൾ & ചരിത്രം" : "Settings & History"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowSettingsModal(false)}
                    style={styles.closeHistoryBtn}
                  >
                    <X size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Quick Controls */}
                <View style={styles.settingsRow}>
                  <TouchableOpacity
                    style={styles.settingPill}
                    onPress={handleToggleLanguage}
                    activeOpacity={0.75}
                  >
                    <Globe size={15} color="#38BDF8" style={{ marginRight: 6 }} />
                    <Text style={styles.settingPillText}>
                      Language: {language === "ml" ? "മലയാളം" : "English"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.settingPill}
                    onPress={() => {
                      triggerLightHaptic();
                      toggleMute();
                    }}
                    activeOpacity={0.75}
                  >
                    {isVoiceMuted ? (
                      <VolumeX size={15} color="#EF4444" style={{ marginRight: 6 }} />
                    ) : (
                      <Volume2 size={15} color="#38BDF8" style={{ marginRight: 6 }} />
                    )}
                    <Text style={styles.settingPillText}>
                      Voice: {isVoiceMuted ? "Muted" : "Active"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#94A3B8" }}>
                    RECENT SESSIONS
                  </Text>
                  {history.length > 0 && (
                    <TouchableOpacity onPress={clearHistory} style={{ padding: 4 }}>
                      <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "600" }}>Clear All</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {history.length === 0 ? (
                  <View style={styles.emptyHistory}>
                    <Sparkles size={26} color="#475569" style={{ marginBottom: 6 }} />
                    <Text style={styles.emptyHistoryText}>
                      {language === "ml"
                        ? "ചരിത്രം ലഭ്യമല്ല. ചോദ്യങ്ങൾ ചോദിക്കൂ!"
                        : "No history yet. Start asking questions!"}
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 280 }}>
                    {history.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.historyItem}
                        onPress={() => {
                          setShowSettingsModal(false);
                          openSessionHistory(item.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyQuery} numberOfLines={1}>
                            {item.query}
                          </Text>
                          <Text style={styles.historyPreview} numberOfLines={1}>
                            {item.responsePreview}
                          </Text>
                        </View>
                        <ChevronRight size={16} color="#64748B" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AgentBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingVertical: 8,
    alignItems: "center",
  },
  characterContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  micArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
  },
  simpleResponseCard: {
    backgroundColor: "rgba(15, 23, 45, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 24,
    marginVertical: 10,
    width: "88%",
  },
  simpleResponseText: {
    fontSize: 14.5,
    color: "#F1F5F9",
    lineHeight: 22,
  },
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(8, 14, 30, 0.88)",
    borderTopWidth: 1,
    borderTopColor: "rgba(56, 189, 248, 0.12)",
    paddingTop: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabIconBox: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconBoxActive: {
    // subtle active glow
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#38BDF8",
    fontWeight: "700",
  },

  // ---------------- Welcome Screen Styles ----------------
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  welcomeTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeCharacterBox: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  welcomeTextBox: {
    alignItems: "center",
    marginVertical: 8,
  },
  welcomeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniAudioWave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
  },
  miniBar: {
    width: 2.5,
    borderRadius: 1.5,
    backgroundColor: "#38BDF8",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  featureListBox: {
    backgroundColor: "rgba(15, 23, 45, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.15)",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
    marginVertical: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 28,
    paddingVertical: 15,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // ---------------- History / Settings Modal Styles ----------------
  historyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  historyModalContent: {
    backgroundColor: "#0B1224",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  historyTitle: {
    fontSize: 16.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeHistoryBtn: {
    padding: 6,
  },
  settingsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  settingPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  settingPillText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 32, 58, 0.6)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyQuery: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#38BDF8",
    marginBottom: 2,
  },
  historyPreview: {
    fontSize: 12,
    color: "#94A3B8",
  },
});
