import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { Mic, Square } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { recognizeTicketByVoice } from "../api/lotteryApi";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

// Enough time to read out "KR 1 2 3 4 5 6" slowly; recording stops by itself after this.
const MAX_RECORD_MS = 8000;
// The HIGH_QUALITY preset writes MPEG-4 AAC (.m4a) on both platforms.
const RECORDING_MIME_TYPE = "audio/mp4";

interface Props {
  isMl: boolean;
  /** Called with the recognised ticket, e.g. "KR 123456" or "123456". */
  onTicket: (ticket: string) => void;
  style?: object;
}

type Phase = "idle" | "starting" | "recording" | "processing";

const logError = (context: string) => (err: unknown) =>
  console.warn(`[voice-ticket] ${context}:`, err instanceof Error ? err.message : String(err));

/** Leave record mode so later speech/audio plays through the speaker again (iOS). */
const restorePlaybackMode = () => setAudioModeAsync({ allowsRecording: false }).catch(logError("Reset audio mode"));

/** Tap, say the ticket number (Malayalam or English), tap again (or wait) → ticket text. */
export default function VoiceTicketButton({ isMl, onTicket, style }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhaseState] = useState<Phase>("idle");
  // The ref is the source of truth for taps (state updates are async).
  const phaseRef = useRef<Phase>("idle");
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const currentPhase = (): Phase => phaseRef.current;

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    if (mountedRef.current) setPhaseState(next);
  };

  const clearAutoStop = () => {
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    autoStopRef.current = null;
  };

  useEffect(
    () => () => {
      mountedRef.current = false;
      clearAutoStop();
      // Never leave the microphone running after the screen goes away. The hook may already
      // have released the native recorder, so only stop an active recording, and guard sync throws.
      if (phaseRef.current === "recording" || phaseRef.current === "starting") {
        try {
          recorder.stop().catch(logError("Stop on unmount"));
        } catch (err: unknown) {
          logError("Recorder already released")(err);
        }
      }
      phaseRef.current = "idle";
      void restorePlaybackMode();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recorder],
  );

  const fail = (message: string) => {
    setPhase("idle");
    if (!mountedRef.current) return;
    Alert.alert(isMl ? "ശബ്ദം തിരിച്ചറിയാനായില്ല" : "Voice search", message);
  };

  const stopAndRecognize = async () => {
    if (phaseRef.current !== "recording") return;
    clearAutoStop();
    setPhase("processing");
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
      if (!uri) throw new Error("No recording");
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const { ticket } = await recognizeTicketByVoice(base64, RECORDING_MIME_TYPE);
      setPhase("idle");
      if (!mountedRef.current) return;
      triggerSuccessHaptic();
      onTicket(ticket);
    } catch (err: unknown) {
      logError("Recognition failed")(err);
      fail(
        isMl
          ? "ടിക്കറ്റ് നമ്പർ വ്യക്തമായി കേട്ടില്ല. ശാന്തമായ സ്ഥലത്ത് നിന്ന് വീണ്ടും പറയൂ."
          : err instanceof Error && err.message
            ? err.message
            : "Couldn't hear a ticket number. Please try again in a quiet place.",
      );
    } finally {
      void restorePlaybackMode();
      // Recordings are only needed for this one request.
      if (uri) FileSystem.deleteAsync(uri, { idempotent: true }).catch(logError("Delete recording"));
    }
  };

  const start = async () => {
    if (phaseRef.current !== "idle") return;
    setPhase("starting"); // set synchronously so a second tap is ignored
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setPhase("idle");
        Alert.alert(
          isMl ? "മൈക്രോഫോൺ അനുമതി വേണം" : "Microphone permission needed",
          isMl ? "ടിക്കറ്റ് നമ്പർ പറയാൻ ഫോൺ സെറ്റിംഗ്സിൽ മൈക്രോഫോൺ അനുവദിക്കുക." : "Allow microphone access in your phone settings to say your ticket number.",
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      // Read through a function: the ref can change during the awaits above (e.g. unmount).
      if (!mountedRef.current || currentPhase() !== "starting") {
        void restorePlaybackMode();
        return;
      }
      recorder.record();
      triggerLightHaptic();
      setPhase("recording");
      clearAutoStop();
      autoStopRef.current = setTimeout(() => void stopAndRecognize(), MAX_RECORD_MS);
    } catch (err: unknown) {
      logError("Could not start recording")(err);
      void restorePlaybackMode();
      fail(isMl ? "മൈക്രോഫോൺ ഉപയോഗിക്കാനായില്ല." : "Couldn't use the microphone.");
    }
  };

  const onPress = () => {
    if (phaseRef.current === "idle") void start();
    else if (phaseRef.current === "recording") void stopAndRecognize();
  };

  const busy = phase === "starting" || phase === "processing";

  return (
    <TouchableOpacity
      style={[styles.btn, phase === "recording" && styles.btnRecording, style]}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={
        phase === "recording"
          ? isMl ? "നിർത്തി തിരയുക" : "Stop and search"
          : isMl ? "ടിക്കറ്റ് നമ്പർ പറയുക" : "Say your ticket number"
      }
    >
      {busy ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : phase === "recording" ? (
        <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
      ) : (
        <Mic size={22} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnRecording: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
});
