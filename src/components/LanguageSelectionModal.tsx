import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Globe, Check, Sparkles, X } from "lucide-react-native";
import { useLanguage } from "../context/LanguageContext";
import { Language } from "../constants/translations";
import { COLORS } from "../constants/colors";

export default function LanguageSelectionModal() {
  const {
    language,
    setLanguage,
    showLanguageModal,
    setShowLanguageModal,
    isLanguageSelected,
  } = useLanguage();

  const [selected, setSelected] = useState<Language>(language || "en");

  if (!showLanguageModal) return null;

  const handleConfirm = () => {
    setLanguage(selected);
  };

  return (
    <Modal
      visible={showLanguageModal}
      animationType="fade"
      transparent={false}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.header}>
            <View style={styles.globeBadge}>
              <Globe size={32} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>Select App Language</Text>
            <Text style={styles.malayalamTitle}>ഭാഷ തിരഞ്ഞെടുക്കുക</Text>

            <Text style={styles.subtitle}>
              Choose your preferred language for Kerala Lottery results, live draw updates, and prize checking.
            </Text>

            {isLanguageSelected && (
              <TouchableOpacity
                style={styles.closeTopBtn}
                onPress={() => setShowLanguageModal(false)}
              >
                <X size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            )}
          </View>

          {/* Language Cards */}
          <View style={styles.optionsContainer}>
            {/* English Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selected === "en" && styles.selectedOptionCard,
              ]}
              onPress={() => setSelected("en")}
              activeOpacity={0.8}
            >
              <View style={styles.optionLeft}>
                <View style={styles.flagBadge}>
                  <Text style={styles.flagText}>🇬🇧</Text>
                </View>
                <View>
                  <Text style={styles.optionTitle}>English</Text>
                  <Text style={styles.optionSub}>Default App Language</Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  selected === "en" && styles.selectedRadioCircle,
                ]}
              >
                {selected === "en" && <Check size={14} color={COLORS.white} />}
              </View>
            </TouchableOpacity>

            {/* Malayalam Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selected === "ml" && styles.selectedOptionCard,
              ]}
              onPress={() => setSelected("ml")}
              activeOpacity={0.8}
            >
              <View style={styles.optionLeft}>
                <View style={styles.flagBadge}>
                  <Text style={styles.flagText}>🇮🇳</Text>
                </View>
                <View>
                  <Text style={styles.optionTitle}>മലയാളം</Text>
                  <Text style={styles.optionSub}>Malayalam Language</Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  selected === "ml" && styles.selectedRadioCircle,
                ]}
              >
                {selected === "ml" && <Check size={14} color={COLORS.white} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Subtext info */}
          <View style={styles.infoBox}>
            <Sparkles size={16} color={COLORS.gold} />
            <Text style={styles.infoText}>
               You can change your language preference anytime from the top bar.
            </Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {selected === "ml" ? "തുടരുക (Continue)" : "Confirm & Continue"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  closeTopBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 8,
  },
  globeBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 4,
  },
  malayalamTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  optionsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedOptionCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  flagBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  flagText: {
    fontSize: 24,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  optionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.textLight,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedRadioCircle: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 28,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
});
