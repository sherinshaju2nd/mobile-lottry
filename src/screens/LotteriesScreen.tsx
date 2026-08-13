import React from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { WEEKLY_LOTTERIES, LotteryMeta } from "../constants/lotteries";
import { useLanguage } from "../context/LanguageContext";

export default function LotteriesScreen({ navigation }: any) {
  const { t, language } = useLanguage();

  const renderItem = ({ item }: { item: LotteryMeta }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("LotteryArchive", { code: item.code })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <View style={styles.codeChip}>
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          <Text style={styles.dayText}>{item.day}</Text>
        </View>
        <ChevronRight size={18} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>
        {language === "ml" && item.nameMl ? item.nameMl : item.name}
      </Text>
      <Text style={styles.subtitle}>
        {language === "ml" ? "നറുക്കെടുപ്പ്: ഉച്ചയ്ക്ക് 3:00 മണി" : `Draw: ${item.drawTime}`}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerLink}>{t("view_archive")} →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              language === "ml" && { fontSize: 18, lineHeight: 26 },
            ]}
          >
            {t("lotteries_title")}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              language === "ml" && { fontSize: 11.5, lineHeight: 17 },
            ]}
          >
            {t("lotteries_subtitle")}
          </Text>
        </View>

        <FlatList
          data={WEEKLY_LOTTERIES}
          keyExtractor={(item: LotteryMeta) => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted },
  listContainer: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeChip: {
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
  dayText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: { fontSize: 12.5, fontWeight: "600", color: "#64748B", marginBottom: 12 },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerLink: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
});
