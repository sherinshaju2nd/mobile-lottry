import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Building2, CalendarClock, CheckCircle2, FileText, Info, Store } from "lucide-react-native";
import SafeScreenContainer from "../components/SafeScreenContainer";
import ScreenHeader from "../components/ScreenHeader";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import {
  CLAIM_PERIOD_DAYS,
  ClaimOffice,
  calculateClaim,
  getClaimDeadline,
  getDaysUntil,
} from "../utils/claimCalculator";
import { getSafeTodayISTDate, formatSafeDateDisplay } from "../utils/formatters";
import { formatGroupedRupees, formatRupeesShort, parsePrizeAmount } from "../utils/prizeAmounts";
import { triggerLightHaptic } from "../utils/haptics";

// Current Kerala weekly prize structure plus a typical bumper jackpot.
const PRESET_AMOUNTS = [250_000_000, 10_000_000, 2_500_000, 500_000, 5_000, 2_000, 1_000, 500, 200, 100];
const MAX_AMOUNT = 1_000_000_000; // ₹100 Cr: above any Kerala prize

const OFFICE_INFO: Record<ClaimOffice, { en: [string, string]; ml: [string, string] }> = {
  agent: {
    en: ["Any authorised lottery agent", "Prizes up to ₹5,000 are paid by any authorised lottery agent in Kerala."],
    ml: ["അംഗീകൃത ലോട്ടറി ഏജന്റ്", "₹5,000 വരെയുള്ള സമ്മാനങ്ങൾ കേരളത്തിലെ ഏത് അംഗീകൃത ലോട്ടറി ഏജന്റിൽ നിന്നും ലഭിക്കും."],
  },
  district_office: {
    en: ["District Lottery Office", "₹5,001 to ₹1 Lakh: claim at any District Lottery Office (all 14 district headquarters)."],
    ml: ["ജില്ലാ ലോട്ടറി ഓഫീസ്", "₹5,001 മുതൽ ₹1 ലക്ഷം വരെ: ഏതെങ്കിലും ജില്ലാ ലോട്ടറി ഓഫീസിൽ ക്ലെയിം ചെയ്യാം."],
  },
  directorate: {
    en: [
      "Directorate of State Lotteries",
      "Above ₹1 Lakh: submit to the Directorate (Vikas Bhavan, Thiruvananthapuram) or through a nationalised / scheduled bank.",
    ],
    ml: [
      "സംസ്ഥാന ലോട്ടറി ഡയറക്ടറേറ്റ്",
      "₹1 ലക്ഷത്തിന് മുകളിൽ: ഡയറക്ടറേറ്റിൽ (വികാസ് ഭവൻ, തിരുവനന്തപുരം) അല്ലെങ്കിൽ ദേശസാൽകൃത / ഷെഡ്യൂൾഡ് ബാങ്ക് വഴി സമർപ്പിക്കുക.",
    ],
  },
};

const DOCUMENTS = {
  en: [
    "Original winning ticket, signed on the back",
    "Two passport-size photos (attested by a Gazetted Officer / Notary)",
    "Aadhaar or other government photo ID",
    "PAN card (needed for TDS on prizes above ₹10,000)",
    "Claim form with a revenue stamp",
    "Bank passbook copy or cancelled cheque (for direct transfer)",
  ],
  ml: [
    "പിന്നിൽ ഒപ്പിട്ട യഥാർത്ഥ സമ്മാന ടിക്കറ്റ്",
    "രണ്ട് പാസ്പോർട്ട് സൈസ് ഫോട്ടോ (ഗസറ്റഡ് ഓഫീസർ / നോട്ടറി സാക്ഷ്യപ്പെടുത്തിയത്)",
    "ആധാർ അല്ലെങ്കിൽ മറ്റ് സർക്കാർ ഫോട്ടോ ഐഡി",
    "പാൻ കാർഡ് (₹10,000-ൽ കൂടുതലുള്ള സമ്മാനങ്ങൾക്ക്)",
    "റവന്യൂ സ്റ്റാമ്പ് പതിച്ച ക്ലെയിം ഫോം",
    "ബാങ്ക് പാസ്ബുക്ക് കോപ്പി അല്ലെങ്കിൽ റദ്ദാക്കിയ ചെക്ക്",
  ],
};

interface RouteParams {
  amount?: number | string;
  drawDate?: string;
  prizeLabel?: string;
}

export default function ClaimCalculatorScreen({ navigation, route }: any) {
  const { language } = useLanguage();
  const isMl = language === "ml";
  const params: RouteParams = route?.params ?? {};
  const initialAmount = parsePrizeAmount(params.amount ?? null);

  const [amountText, setAmountText] = useState(initialAmount ? String(Math.min(initialAmount, MAX_AMOUNT)) : "");
  const amount = parsePrizeAmount(amountText) ?? 0;
  const estimate = useMemo(() => calculateClaim(amount), [amount]);

  const deadline = getClaimDeadline(params.drawDate);
  const daysLeft = deadline ? getDaysUntil(deadline, getSafeTodayISTDate()) : null;
  const [officeTitle, officeDesc] = OFFICE_INFO[estimate.claimOffice][isMl ? "ml" : "en"];

  const selectPreset = (value: number) => {
    triggerLightHaptic();
    setAmountText(String(value));
  };

  const rupees = (value: number) => `₹${formatGroupedRupees(value)}`;

  return (
    <SafeScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScreenHeader
        title={isMl ? "സമ്മാനത്തുക കാൽക്കുലേറ്റർ" : "Prize Claim Calculator"}
        subtitle={isMl ? "കൈയിൽ കിട്ടുന്ന തുക & എവിടെ ക്ലെയിം ചെയ്യണം" : "Amount you receive & where to claim"}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {params.prizeLabel ? (
            <Text style={styles.prizeContext}>
              {params.prizeLabel}
              {params.drawDate ? ` · ${formatSafeDateDisplay(params.drawDate)}` : ""}
            </Text>
          ) : null}

          {/* Amount input */}
          <View style={styles.card}>
            <Text style={styles.label}>{isMl ? "സമ്മാനത്തുക (₹)" : "Prize amount (₹)"}</Text>
            <TextInput
              style={styles.input}
              value={amountText}
              onChangeText={(text) => {
                const digits = text.replace(/[^\d]/g, "");
                setAmountText(digits ? String(Math.min(Number(digits), MAX_AMOUNT)) : "");
              }}
              keyboardType="number-pad"
              placeholder="1,00,00,000"
              placeholderTextColor={COLORS.textLight}
              accessibilityLabel={isMl ? "സമ്മാനത്തുക" : "Prize amount in rupees"}
              maxLength={10}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
              {PRESET_AMOUNTS.map((value) => {
                const active = value === amount;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.preset, active && styles.presetActive]}
                    onPress={() => selectPreset(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>{formatRupeesShort(value)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {amount > 0 ? (
            <>
              {/* Breakdown */}
              <View style={styles.card}>
                <Row label={isMl ? "സമ്മാനത്തുക" : "Prize amount"} value={rupees(estimate.grossPrize)} />
                <Row
                  label={isMl ? "ഏജന്റ് കമ്മീഷൻ (10%)" : "Agent commission (10%)"}
                  value={estimate.agentCommission ? `− ${rupees(estimate.agentCommission)}` : rupees(0)}
                  tone="minus"
                />
                <Row
                  label={isMl ? "ആദായ നികുതി TDS (30%)" : "Income tax TDS (30%)"}
                  value={estimate.tds ? `− ${rupees(estimate.tds)}` : rupees(0)}
                  tone="minus"
                />
                <View style={styles.divider} />
                <View style={styles.netRow}>
                  <Text style={styles.netLabel}>{isMl ? "കൈയിൽ ലഭിക്കുന്നത്" : "You receive"}</Text>
                  <Text style={styles.netValue} accessibilityLiveRegion="polite">
                    {rupees(estimate.netAmount)}
                  </Text>
                </View>
                <Text style={styles.netShort}>{formatRupeesShort(estimate.netAmount)}</Text>
                <Text style={styles.note}>
                  {estimate.grossPrize > 10_000
                    ? isMl
                      ? "കമ്മീഷൻ കുറച്ച ശേഷമുള്ള തുകയിൽ നിന്നാണ് 30% TDS. ആദായനികുതി റിട്ടേൺ ഫയൽ ചെയ്യുമ്പോൾ സർചാർജും 4% സെസും അടയ്ക്കേണ്ടി വന്നേക്കാം."
                      : "TDS is taken from the amount left after the agent's commission. Surcharge and 4% cess may still be due when you file your income-tax return."
                    : isMl
                      ? "₹10,000 വരെയുള്ള സമ്മാനങ്ങൾക്ക് കിഴിവുകളില്ല."
                      : "Prizes up to ₹10,000 are paid in full, with no deductions."}
                </Text>
              </View>

              {/* Where to claim */}
              <View style={styles.card}>
                <View style={styles.sectionTitleRow}>
                  {estimate.claimOffice === "agent" ? (
                    <Store size={18} color={COLORS.primary} />
                  ) : (
                    <Building2 size={18} color={COLORS.primary} />
                  )}
                  <Text style={styles.sectionTitle}>{isMl ? "എവിടെ ക്ലെയിം ചെയ്യണം" : "Where to claim"}</Text>
                </View>
                <Text style={styles.officeTitle}>{officeTitle}</Text>
                <Text style={styles.body}>{officeDesc}</Text>

                <View style={[styles.sectionTitleRow, { marginTop: 14 }]}>
                  <CalendarClock size={18} color={COLORS.gold} />
                  <Text style={styles.sectionTitle}>{isMl ? "സമയപരിധി" : "Deadline"}</Text>
                </View>
                {deadline && daysLeft !== null ? (
                  <Text style={[styles.body, daysLeft <= 7 && styles.urgent]}>
                    {isMl
                      ? `${formatSafeDateDisplay(deadline)}-നകം ക്ലെയിം ചെയ്യുക (${daysLeft >= 0 ? `${daysLeft} ദിവസം ബാക്കി` : "സമയപരിധി കഴിഞ്ഞു"})`
                      : `Claim by ${formatSafeDateDisplay(deadline)} (${daysLeft >= 0 ? `${daysLeft} days left` : "deadline passed"})`}
                  </Text>
                ) : (
                  <Text style={styles.body}>
                    {isMl
                      ? `നറുക്കെടുപ്പ് തീയതി മുതൽ ${CLAIM_PERIOD_DAYS} ദിവസത്തിനകം ടിക്കറ്റ് സമർപ്പിക്കുക.`
                      : `Submit the ticket within ${CLAIM_PERIOD_DAYS} days of the draw date.`}
                  </Text>
                )}
              </View>

              {/* Documents */}
              {estimate.needsDocuments ? (
                <View style={styles.card}>
                  <View style={styles.sectionTitleRow}>
                    <FileText size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>{isMl ? "ആവശ്യമായ രേഖകൾ" : "Documents to bring"}</Text>
                  </View>
                  {DOCUMENTS[isMl ? "ml" : "en"].map((doc) => (
                    <View key={doc} style={styles.docRow}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <Text style={styles.docText}>{doc}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          <View style={styles.disclaimer}>
            <Info size={14} color={COLORS.textMuted} />
            <Text style={styles.disclaimerText}>
              {isMl
                ? "ഇതൊരു ഏകദേശ കണക്കാണ്. അന്തിമ തുക സംസ്ഥാന ലോട്ടറി വകുപ്പ് നിശ്ചയിക്കും."
                : "This is an estimate. The final amount is decided by the Kerala State Lotteries Department."}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreenContainer>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "minus" }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, tone === "minus" && styles.minus]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  prizeContext: { fontSize: 13, fontWeight: "700", color: COLORS.gold },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, marginBottom: 8 },
  input: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    backgroundColor: COLORS.background,
  },
  presetRow: { gap: 8, paddingTop: 12 },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  presetActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  presetText: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  presetTextActive: { color: COLORS.white },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, gap: 12 },
  rowLabel: { flex: 1, fontSize: 15, color: COLORS.textDark },
  rowValue: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  minus: { color: "#DC2626" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  netRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  netLabel: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  netValue: { fontSize: 22, fontWeight: "900", color: "#16A34A" },
  netShort: { alignSelf: "flex-end", fontSize: 13, fontWeight: "700", color: "#15803D", marginTop: 2 },
  note: { fontSize: 12.5, color: COLORS.textMuted, marginTop: 10, lineHeight: 18 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  officeTitle: { fontSize: 15, fontWeight: "700", color: COLORS.primary, marginBottom: 4 },
  body: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  urgent: { color: "#DC2626", fontWeight: "700" },
  docRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 5 },
  docText: { flex: 1, fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  disclaimer: { flexDirection: "row", gap: 6, alignItems: "flex-start", paddingHorizontal: 4 },
  disclaimerText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
});
