import React from "react";
import { Modal, StyleSheet, View } from "react-native";
import AIAssistant from "./ai/AIAssistant";

interface AiVoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AiVoiceAssistantModal({
  visible,
  onClose,
}: AiVoiceAssistantModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <AIAssistant onClose={onClose} isModal />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1120",
  },
});
