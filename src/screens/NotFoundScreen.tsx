import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Home, Search, Compass, AlertCircle, ArrowLeft } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useDeviceAdaptive } from "../hooks/useDeviceAdaptive";
import { useLanguage } from "../context/LanguageContext";
import { triggerLightHaptic, triggerMediumHaptic } from "../utils/haptics";

export default function NotFoundScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { safeTopInset, safeBottomInset, isAndroid } = useDeviceAdaptive(false);

  const handleGoHome = () => {
    triggerMediumHaptic();
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  const handleGoSearch = () => {
    triggerLightHaptic();
    navigation.navigate("Search");
  };

  const handleGoBack = () => {
    triggerLightHaptic();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      handleGoHome();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: safeTopInset, paddingBottom: safeBottomInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Page Not Found</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual 404 Hero */}
        <View style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Compass size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.errorCode}>404</Text>
          <Text style={styles.errorTitle}>Lost in Draw Space?</Text>
          <Text style={styles.errorDesc}>
            The screen or draw record you're looking for doesn't exist, has been archived, or the link is expired.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryButton}
            onPress={handleGoHome}
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.primaryButtonText}>Go to Home Screen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.secondaryButton}
            onPress={handleGoSearch}
          >
            <Search size={18} color={COLORS.primary} strokeWidth={2.2} />
            <Text style={styles.secondaryButtonText}>Search Lottery Results</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Help Tip */}
        <View style={styles.tipCard}>
          <AlertCircle size={18} color="#64748B" />
          <Text style={styles.tipText}>
            Tip: Use the search bar on the Home tab to verify any ticket number by 4-digit code.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80%",
  },
  heroCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorCode: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -1,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 6,
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 14,
    gap: 10,
    width: "100%",
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
  },
});
