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
import { Language, SUPPORTED_LANGUAGES, getTranslation } from "../constants/translations";
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

  const getConfirmButtonText = (lang: Language) => {
    switch (lang) {
      case "ml":
        return "തുടരുക (Continue)";
      case "hi":
        return "पुष्टि करें और आगे बढ़ें (Continue)";
      case "ta":
        return "உறுதிசெய்து தொடரவும் (Continue)";
      case "kn":
        return "ದೃಢೀಕರಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ (Continue)";
      case "te":
        return "నిర్ధారించి కొనసాగండి (Continue)";
      default:
        return "Confirm & Continue";
    }
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
            <Text style={styles.malayalamTitle}>
              {selected === "ml"
                ? "ഭാഷ തിരഞ്ഞെടുക്കുക"
                : selected === "hi"
                ? "अपनी भाषा चुनें"
                : selected === "ta"
                ? "மொழியைத் தேர்ந்தெடுக்கவும்"
                : selected === "kn"
                ? "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ"
                : selected === "te"
                ? "భాషను ఎంచుకోండి"
                : "ഭാഷ തിരഞ്ഞെടുക്കുക"}
            </Text>

            <Text style={styles.subtitle}>
              {getTranslation(selected, "select_language_desc")}
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

          {/* 6 Language Cards */}
          <View style={styles.optionsContainer}>
            {SUPPORTED_LANGUAGES.map((langItem) => {
              const isSelected = selected === langItem.code;
              return (
                <TouchableOpacity
                  key={langItem.code}
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedOptionCard,
                  ]}
                  onPress={() => setSelected(langItem.code)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.flagBadge}>
                      <Text style={styles.flagText}>{langItem.flag}</Text>
                    </View>
                    <View>
                      <Text style={styles.optionTitle}>{langItem.nativeName}</Text>
                      <Text style={styles.optionSub}>
                        {langItem.name} ({langItem.shortCode}) • {langItem.subTitle}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.selectedRadioCircle,
                    ]}
                  >
                    {isSelected && <Check size={14} color={COLORS.white} strokeWidth={2.5} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subtext info */}
          <View style={styles.infoBox}>
            <Sparkles size={16} color={COLORS.gold} />
            <Text style={styles.infoText}>
              {getTranslation(selected, "language_note")}
            </Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {getConfirmButtonText(selected)}
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
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  closeTopBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 8,
  },
  globeBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 4,
  },
  malayalamTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedOptionCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  flagBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  flagText: {
    fontSize: 20,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
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
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});
