import React from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { WEEKLY_LOTTERIES, LotteryMeta } from "../constants/lotteries";

export default function LotteriesScreen({ navigation }: any) {
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
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.subtitle}>Scheduled Official Draw: {item.drawTime}</Text>

      <View style={styles.footer}>
        <Text style={styles.footerLink}>View Draw Archives & History →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kerala Weekly Lotteries</Text>
          <Text style={styles.headerSubtitle}>
            Select any weekly lottery below to view its complete historical draw results.
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
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted },
  listContainer: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeChip: { backgroundColor: COLORS.chipBlueBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  codeText: { fontSize: 12, fontWeight: "900", color: COLORS.chipBlueText },
  dayText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  footer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.background },
  footerLink: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
});
