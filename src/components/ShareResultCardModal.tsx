import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, type ViewInstance } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Share2, X } from "lucide-react-native";
import { DrawResult } from "../api/lotteryApi";
import { getLotteryTranslatedName } from "../constants/lotteries";
import { formatSafeDateDisplay } from "../utils/formatters";
import { formatRupeesShort, getTierAmount } from "../utils/prizeAmounts";
import { recordPositiveMoment } from "../utils/ratingPrompt";
import { triggerLightHaptic } from "../utils/haptics";

const NAVY = "#0B3C5D";
const GOLD = "#FBBF24";
const WEBSITE = "keralalotteryresultstoday.in";

interface Props {
  visible: boolean;
  draw: DrawResult | null;
  isMl: boolean;
  onClose: () => void;
}

const isRealTicket = (ticket?: string): ticket is string => {
  const value = ticket?.trim().toLowerCase() ?? "";
  return value.length > 0 && value !== "n/a" && value !== "pending";
};

const titleCase = (text: string) =>
  text
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
    .join(" ");

/** Branded result image for WhatsApp / Status: preview first, then share the PNG. */
export default function ShareResultCardModal({ visible, draw, isMl, onClose }: Props) {
  const cardRef = useRef<ViewInstance>(null);
  const [sharing, setSharing] = useState(false);

  if (!draw) return null;

  const lotteryName = (isMl ? getLotteryTranslatedName(draw.lottery_code, "ml") : "") || draw.draw_name;
  const firstAmount = getTierAmount(draw.prizes, "1st");
  const secondAmount = getTierAmount(draw.prizes, "2nd");
  const thirdAmount = getTierAmount(draw.prizes, "3rd");
  const second = (draw.prizes?.["2nd"] ?? []).filter(isRealTicket).slice(0, 2);
  const third = (draw.prizes?.["3rd"] ?? []).filter(isRealTicket).slice(0, 2);
  const location = draw.first?.location && draw.first.location.toLowerCase() !== "n/a" ? titleCase(draw.first.location) : null;

  const share = async () => {
    if (!cardRef.current || sharing) return;
    triggerLightHaptic();
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(isMl ? "പങ്കിടാൻ കഴിയില്ല" : "Sharing unavailable", isMl ? "ഈ ഫോണിൽ ഷെയർ ലഭ്യമല്ല." : "Sharing isn't available on this device.");
        return;
      }
      // RN 0.88 ViewInstance is a host element; view-shot accepts a ref to it.
      const uri = await captureRef(cardRef as Parameters<typeof captureRef>[0], { format: "png", quality: 1, result: "tmpfile" });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: isMl ? "ഫലം പങ്കിടുക" : "Share result",
      });
      void recordPositiveMoment("result_shared");
    } catch (err: unknown) {
      console.warn("[share-card] Failed:", err instanceof Error ? err.message : String(err));
      Alert.alert(isMl ? "പങ്കിടാനായില്ല" : "Couldn't share", isMl ? "വീണ്ടും ശ്രമിക്കുക." : "Please try again.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* The card that becomes the image. collapsable={false} keeps it a real native view for capture. */}
          <View ref={cardRef} collapsable={false} style={styles.card}>
            <Text style={styles.kicker}>{isMl ? "കേരള ലോട്ടറി ഫലം" : "KERALA LOTTERY RESULT"}</Text>
            <Text style={styles.lottery}>{lotteryName}</Text>
            <Text style={styles.meta}>
              {draw.draw_code ? `${draw.draw_code} · ` : ""}
              {formatSafeDateDisplay(draw.draw_date)}
            </Text>

            {isRealTicket(draw.first?.ticket) ? (
              <View style={styles.firstBox}>
                <Text style={styles.firstLabel}>
                  {isMl ? "ഒന്നാം സമ്മാനം" : "1st PRIZE"}
                  {firstAmount ? ` · ${formatRupeesShort(firstAmount)}` : ""}
                </Text>
                <Text style={styles.firstTicket}>{draw.first?.ticket}</Text>
                {location ? <Text style={styles.firstLocation}>{location}</Text> : null}
              </View>
            ) : (
              <Text style={styles.pending}>{isMl ? "ഫലം ഉടൻ" : "Result coming soon"}</Text>
            )}

            {second.length > 0 || third.length > 0 ? (
              <View style={styles.tiers}>
                {second.length > 0 ? (
                  <View style={styles.tier}>
                    <Text style={styles.tierLabel}>
                      {isMl ? "രണ്ടാം സമ്മാനം" : "2nd Prize"}
                      {secondAmount ? ` · ${formatRupeesShort(secondAmount)}` : ""}
                    </Text>
                    <Text style={styles.tierTicket}>{second.join("   ")}</Text>
                  </View>
                ) : null}
                {third.length > 0 ? (
                  <View style={styles.tier}>
                    <Text style={styles.tierLabel}>
                      {isMl ? "മൂന്നാം സമ്മാനം" : "3rd Prize"}
                      {thirdAmount ? ` · ${formatRupeesShort(thirdAmount)}` : ""}
                    </Text>
                    <Text style={styles.tierTicket}>{third.join("   ")}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.footer}>
              <Text style={styles.footerCta}>{isMl ? "മുഴുവൻ ഫലവും ടിക്കറ്റ് പരിശോധനയും" : "Full results & ticket check"}</Text>
              <Text style={styles.footerSite}>{WEBSITE}</Text>
              <Text style={styles.footerNote}>
                {isMl ? "ഔദ്യോഗിക ഗസറ്റുമായി ഒത്തുനോക്കുക" : "Verify with the official gazette"}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel={isMl ? "അടയ്ക്കുക" : "Close"}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={() => void share()} disabled={sharing} accessibilityRole="button">
              {sharing ? <ActivityIndicator color="#FFFFFF" /> : <Share2 size={18} color="#FFFFFF" />}
              <Text style={styles.shareText}>{isMl ? "ചിത്രമായി പങ്കിടുക" : "Share image"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(2,6,23,0.8)" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 16 },
  card: { backgroundColor: NAVY, borderRadius: 20, padding: 22, alignItems: "center" },
  kicker: { color: GOLD, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  lottery: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginTop: 6, textAlign: "center" },
  meta: { color: "#BFD7EA", fontSize: 13, marginTop: 4 },
  firstBox: {
    marginTop: 18,
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(251,191,36,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.5)",
    borderRadius: 16,
    paddingVertical: 16,
  },
  firstLabel: { color: GOLD, fontSize: 14, fontWeight: "900" },
  firstTicket: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: 2, marginTop: 4 },
  firstLocation: { color: "#BFD7EA", fontSize: 14, marginTop: 2 },
  pending: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 18 },
  tiers: { width: "100%", marginTop: 14, gap: 10 },
  tier: { alignItems: "center" },
  tierLabel: { color: "#BFD7EA", fontSize: 12, fontWeight: "800" },
  tierTicket: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 2 },
  footer: { marginTop: 20, alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", paddingTop: 14, width: "100%" },
  footerCta: { color: "#BFD7EA", fontSize: 12 },
  footerSite: { color: GOLD, fontSize: 16, fontWeight: "900", marginTop: 2 },
  footerNote: { color: "#7FA5C2", fontSize: 11, marginTop: 6 },
  actions: { flexDirection: "row", gap: 12, justifyContent: "center" },
  closeBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#25D366",
  },
  shareText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
});
