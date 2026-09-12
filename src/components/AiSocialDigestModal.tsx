import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Linking,
} from "react-native";
import { X, Sparkles, Share2, MessageCircle, Send } from "lucide-react-native";
import { useLanguage } from "../context/LanguageContext";
import { generateSocialMediaDigestsMobile, MobileSocialDigest } from "../api/lotteryApi";

interface AiSocialDigestModalProps {
  visible: boolean;
  onClose: () => void;
  drawData: any;
}

export default function AiSocialDigestModal({
  visible,
  onClose,
  drawData,
}: AiSocialDigestModalProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"wa_ml" | "wa_en" | "tg">(language === "en" ? "wa_en" : "wa_ml");
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<MobileSocialDigest | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(language === "en" ? "wa_en" : "wa_ml");
      if (drawData) {
        loadDigest();
      }
    }
  }, [visible, drawData, language]);

  const loadDigest = async () => {
    setLoading(true);
    try {
      const res = await generateSocialMediaDigestsMobile(drawData);
      setDigest(res);
    } catch {
      const dName = drawData.draw_name || drawData.name || "Kerala Lottery";
      const dCode = drawData.draw_code || drawData.code || "";
      const dDate = drawData.draw_date || "";
      const fPrize = drawData.first?.ticket || drawData.first_prize?.ticket || "N/A";

      setDigest({
        whatsapp_malayalam: `🎉 *ഇന്നത്തെ കേരള ലോട്ടറി ഫലം* 🎉\n\n📌 *${dName} (${dCode})*\n📅 തീയതി: ${dDate}\n\n🏆 *ഒന്നാം സമ്മാനം:* *${fPrize}*\n\n🔗 മുഴുവൻ ഫലങ്ങൾ പരിശോധിക്കാൻ:\nhttps://www.keralalotteryresultstoday.in\n\n_ലോട്ടറി ഫലങ്ങൾ വേഗത്തിൽ അറിയാൻ ഷെയർ ചെയ്യൂ!_`,
        whatsapp_english: `🎉 *Kerala Lottery Result Today* 🎉\n\n📌 *${dName} (${dCode})*\n📅 Date: ${dDate}\n\n🏆 *1st Prize Winner:* *${fPrize}*\n\n🔗 Check Full Prize List & Search Ticket:\nhttps://www.keralalotteryresultstoday.in`,
        telegram_post: `📢 *Kerala Lottery Result Announcement*\n\n🎯 *${dName} (${dCode})* | ${dDate}\n🥇 1st Prize: \`${fPrize}\`\n\n⚡ Live Results & Search:\n👉 https://www.keralalotteryresultstoday.in\n\n#KeralaLottery #${dCode} #LotteryResult`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentText = () => {
    if (!digest) return "";
    if (activeTab === "wa_ml") return digest.whatsapp_malayalam;
    if (activeTab === "wa_en") return digest.whatsapp_english;
    return digest.telegram_post;
  };

  const handleShareToWhatsApp = async () => {
    const text = getCurrentText();
    if (!text) return;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: text });
      }
    } catch {
      await Share.share({ message: text });
    }
  };

  const handleShareToTelegram = async () => {
    const text = getCurrentText();
    if (!text) return;
    const url = `tg://msg?text=${encodeURIComponent(text)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: text });
      }
    } catch {
      await Share.share({ message: text });
    }
  };

  const handleGeneralShare = async () => {
    const text = getCurrentText();
    if (!text) return;
    try {
      await Share.share({ message: text });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={20} color="#FBBF24" />
              <Text style={styles.title}>{t("ai_social_title")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "wa_ml" && styles.tabActive]}
              onPress={() => setActiveTab("wa_ml")}
            >
              <Text style={[styles.tabText, activeTab === "wa_ml" && styles.tabTextActive]}>
                WhatsApp (മലയാളം)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "wa_en" && styles.tabActive]}
              onPress={() => setActiveTab("wa_en")}
            >
              <Text style={[styles.tabText, activeTab === "wa_en" && styles.tabTextActive]}>
                WhatsApp (EN)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "tg" && styles.tabActive]}
              onPress={() => setActiveTab("tg")}
            >
              <Text style={[styles.tabText, activeTab === "tg" && styles.tabTextActive]}>
                Telegram
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#0B3C5D" />
                <Text style={styles.loaderText}>{t("generating_ai_status")}</Text>
              </View>
            ) : (
              <ScrollView style={styles.textScroll} contentContainerStyle={styles.textScrollContent}>
                <View style={styles.previewBox}>
                  <Text style={styles.previewText}>{getCurrentText()}</Text>
                </View>
              </ScrollView>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtnWa} onPress={handleShareToWhatsApp}>
              <MessageCircle size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>{t("share_to_whatsapp")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnTg} onPress={handleShareToTelegram}>
              <Send size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>{t("share_to_telegram")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnGeneric} onPress={handleGeneralShare}>
              <Share2 size={18} color="#0B3C5D" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  container: {
    height: "75%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#0B3C5D",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#0B3C5D",
  },
  tabText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#0B3C5D",
    fontWeight: "800",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  textScroll: {
    flex: 1,
  },
  textScrollContent: {
    paddingBottom: 8,
  },
  previewBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  previewText: {
    color: "#1E293B",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
  actions: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  actionBtnWa: {
    flex: 1,
    height: 44,
    backgroundColor: "#25D366",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnTg: {
    flex: 1,
    height: 44,
    backgroundColor: "#229ED9",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnGeneric: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EBF5FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});
