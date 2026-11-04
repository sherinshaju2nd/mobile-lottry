import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarDays, Minus, Plus, X } from "lucide-react-native";
import ModernDatePickerModal from "./ModernDatePickerModal";
import { COLORS } from "../constants/colors";
import { BUMPER_LOTTERIES, WEEKLY_LOTTERIES } from "../constants/lotteries";
import { fetchBumperLotteries } from "../api/lotteryApi";
import { PlayEntry, PlayEntryKind, PlaySettings, addDays, addPlayEntry, checkSpendAgainstLimit, lastPriceFor } from "../utils/playSmart";
import { formatGroupedRupees, parsePrizeAmount } from "../utils/prizeAmounts";
import { getSafeTodayISTDate, formatSafeDateDisplay } from "../utils/formatters";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

// Starting price for weekly tickets when the user has never logged one. Always editable.
const DEFAULT_WEEKLY_PRICE = 50;
const OTHER_LOTTERY = "Other";
const MAX_TICKETS = 999;
const MAX_AMOUNT = 1_000_000_000;

interface Props {
  visible: boolean;
  kind: PlayEntryKind;
  entries: PlayEntry[];
  settings: PlaySettings;
  monthSpent: number;
  isMl: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Prefill for "log this win" from the claim calculator. */
  initialAmount?: number;
  initialLotteryName?: string;
}

export default function AddPlayEntryModal({
  visible,
  kind,
  entries,
  settings,
  monthSpent,
  isMl,
  onClose,
  onSaved,
  initialAmount,
  initialLotteryName,
}: Props) {
  const today = getSafeTodayISTDate();
  const [lotteryName, setLotteryName] = useState(initialLotteryName ?? WEEKLY_LOTTERIES[0]?.name ?? OTHER_LOTTERY);
  const [tickets, setTickets] = useState(1);
  const [priceText, setPriceText] = useState("");
  const [amountText, setAmountText] = useState(initialAmount ? String(initialAmount) : "");
  const [date, setDate] = useState(today);
  const [bumperPrices, setBumperPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Once the user edits the price for the selected lottery, prefills must not replace it.
  const priceTouchedRef = useRef(false);

  const lotteryOptions = useMemo(
    () => [...WEEKLY_LOTTERIES, ...BUMPER_LOTTERIES].map((l) => ({ code: l.code, name: l.name, isBumper: Boolean(l.isBumper) })),
    [],
  );

  // Bumper ticket prices come from the database (weekly prices are not stored there).
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetchBumperLotteries()
      .then((bumpers) => {
        if (cancelled) return;
        const prices: Record<string, number> = {};
        for (const b of bumpers) {
          const price = parsePrizeAmount(b.ticket_price ?? null);
          if (price) prices[b.name] = price;
        }
        setBumperPrices(prices);
      })
      .catch((err: unknown) =>
        console.warn("[play-smart] Bumper prices unavailable:", err instanceof Error ? err.message : String(err)),
      );
    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Reset the form whenever the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setLotteryName(initialLotteryName ?? WEEKLY_LOTTERIES[0]?.name ?? OTHER_LOTTERY);
    setTickets(1);
    setAmountText(initialAmount ? String(initialAmount) : "");
    setDate(today);
    setSaving(false);
    setShowDatePicker(false);
    priceTouchedRef.current = false;
  }, [visible, initialAmount, initialLotteryName, today]);

  useEffect(() => {
    priceTouchedRef.current = false;
  }, [lotteryName]);

  // Prefill the price: what the user paid last time → bumper price from DB → weekly default.
  useEffect(() => {
    if (!visible || kind !== "spend" || priceTouchedRef.current) return;
    const isBumper = lotteryOptions.find((l) => l.name === lotteryName)?.isBumper ?? false;
    const price = lastPriceFor(entries, lotteryName) ?? bumperPrices[lotteryName] ?? (isBumper ? null : DEFAULT_WEEKLY_PRICE);
    setPriceText(price ? String(price) : "");
  }, [visible, kind, lotteryName, entries, bumperPrices, lotteryOptions]);

  const price = Number(priceText) || 0;
  const amount = kind === "spend" ? tickets * price : Math.min(Number(amountText) || 0, MAX_AMOUNT);
  const canSave = amount > 0 && !saving;
  const rupees = (n: number) => `₹${formatGroupedRupees(n)}`;

  const persist = async () => {
    setSaving(true);
    try {
      const code = lotteryOptions.find((l) => l.name === lotteryName)?.code;
      await addPlayEntry({
        kind,
        date,
        lotteryName,
        ...(code ? { lotteryCode: code } : {}),
        ...(kind === "spend" ? { tickets, pricePerTicket: price } : {}),
        amount,
      });
      triggerSuccessHaptic();
      onSaved();
      onClose();
    } catch (err: unknown) {
      console.warn("[play-smart] Save failed:", err instanceof Error ? err.message : String(err));
      Alert.alert(isMl ? "സേവ് ചെയ്യാനായില്ല" : "Couldn't save", isMl ? "വീണ്ടും ശ്രമിക്കുക." : "Please try again.");
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    // A gentle check, never a block: the user stays in control.
    if (kind === "spend" && date.slice(0, 7) === today.slice(0, 7)) {
      const check = checkSpendAgainstLimit(monthSpent, amount, settings);
      if (check.crossesLimit || check.before.state === "reached") {
        Alert.alert(
          isMl ? "പ്രതിമാസ പരിധി കടക്കുന്നു" : "Over your monthly limit",
          isMl
            ? `ഇത് ചേർത്താൽ ഈ മാസം ${rupees(monthSpent + amount)} ആകും — നിങ്ങൾ വെച്ച പരിധി ${rupees(settings.monthlyLimit ?? 0)}. ഇനി ഈ മാസം വാങ്ങാതിരിക്കുന്നത് പരിഗണിക്കൂ.`
            : `This brings your spending this month to ${rupees(monthSpent + amount)}, above the ${rupees(settings.monthlyLimit ?? 0)} limit you set. Consider pausing until next month.`,
          [
            { text: isMl ? "റദ്ദാക്കുക" : "Cancel", style: "cancel" },
            { text: isMl ? "എന്നാലും ചേർക്കുക" : "Log anyway", onPress: () => void persist() },
          ],
        );
        return;
      }
    }
    void persist();
  };

  const dateOptions = [0, 1, 2].map((offset) => addDays(today, -offset));
  const isSpend = kind === "spend";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isSpend ? (isMl ? "വാങ്ങിയ ടിക്കറ്റുകൾ" : "Log tickets bought") : isMl ? "ലഭിച്ച സമ്മാനം" : "Log money won"}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={isMl ? "അടയ്ക്കുക" : "Close"} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            <Text style={styles.label}>{isMl ? "ലോട്ടറി" : "Lottery"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {[...lotteryOptions.map((l) => l.name), OTHER_LOTTERY].map((name) => {
                const active = name === lotteryName;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      triggerLightHaptic();
                      setLotteryName(name);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {isSpend ? (
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.label}>{isMl ? "ടിക്കറ്റുകൾ" : "Tickets"}</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setTickets((n) => Math.max(1, n - 1))}
                      accessibilityLabel={isMl ? "കുറയ്ക്കുക" : "Fewer tickets"}
                    >
                      <Minus size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.stepValue}>{tickets}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setTickets((n) => Math.min(MAX_TICKETS, n + 1))}
                      accessibilityLabel={isMl ? "കൂട്ടുക" : "More tickets"}
                    >
                      <Plus size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.label}>{isMl ? "ഒരു ടിക്കറ്റിന് (₹)" : "Price each (₹)"}</Text>
                  <TextInput
                    style={styles.input}
                    value={priceText}
                    onChangeText={(t) => {
                      priceTouchedRef.current = true;
                      setPriceText(t.replace(/[^\d]/g, "").slice(0, 5));
                    }}
                    keyboardType="number-pad"
                    placeholder="50"
                    placeholderTextColor={COLORS.textLight}
                    accessibilityLabel={isMl ? "ടിക്കറ്റ് വില" : "Price per ticket"}
                  />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.label}>{isMl ? "കൈയിൽ ലഭിച്ച തുക (₹)" : "Amount received (₹)"}</Text>
                <TextInput
                  style={styles.input}
                  value={amountText}
                  onChangeText={(t) => setAmountText(t.replace(/[^\d]/g, "").slice(0, 10))}
                  keyboardType="number-pad"
                  placeholder="5000"
                  placeholderTextColor={COLORS.textLight}
                  accessibilityLabel={isMl ? "ലഭിച്ച തുക" : "Amount received"}
                />
              </>
            )}

            <Text style={styles.label}>{isMl ? "തീയതി" : "Date"}</Text>
            <View style={styles.chipRowWrap}>
              {dateOptions.map((d, i) => {
                const active = d === date;
                const label = i === 0 ? (isMl ? "ഇന്ന്" : "Today") : i === 1 ? (isMl ? "ഇന്നലെ" : "Yesterday") : formatSafeDateDisplay(d);
                return (
                  <TouchableOpacity key={d} style={[styles.chip, active && styles.chipActive]} onPress={() => setDate(d)} accessibilityState={{ selected: active }}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
              {/* Any other past date: shown as its own selected chip, or as "Pick date". */}
              <TouchableOpacity
                style={[styles.chip, styles.pickChip, !dateOptions.includes(date) && styles.chipActive]}
                onPress={() => {
                  triggerLightHaptic();
                  setShowDatePicker(true);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: !dateOptions.includes(date) }}
                accessibilityLabel={isMl ? "തീയതി തിരഞ്ഞെടുക്കുക" : "Pick a date"}
              >
                <CalendarDays size={14} color={dateOptions.includes(date) ? COLORS.primary : COLORS.white} />
                <Text style={[styles.chipText, !dateOptions.includes(date) && styles.chipTextActive]}>
                  {dateOptions.includes(date) ? (isMl ? "തീയതി" : "Pick date") : formatSafeDateDisplay(date)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{isMl ? "ആകെ" : "Total"}</Text>
              <Text style={[styles.totalValue, { color: isSpend ? "#DC2626" : "#16A34A" }]}>{rupees(amount)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              accessibilityRole="button"
            >
              <Text style={styles.saveText}>{isMl ? "സേവ് ചെയ്യുക" : "Save"}</Text>
            </TouchableOpacity>
            <Text style={styles.privacy}>
              {isMl ? "ഈ വിവരങ്ങൾ നിങ്ങളുടെ ഫോണിൽ മാത്രം സൂക്ഷിക്കുന്നു." : "Saved on this phone only. Never uploaded."}
            </Text>
          </ScrollView>
        </View>
        {/* Rendered inside this Modal: iOS cannot show two sibling modals at once. Future dates are blocked by the picker. */}
        <ModernDatePickerModal
          visible={showDatePicker}
          selectedDate={date}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={(picked) => {
            if (picked && picked <= today) setDate(picked);
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "90%" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  body: { padding: 18, paddingBottom: 32, gap: 8 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, marginTop: 8 },
  chipRow: { gap: 8, paddingVertical: 4 },
  chipRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  chipTextActive: { color: COLORS.white },
  pickChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 4,
  },
  stepBtn: { padding: 12 },
  stepValue: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  input: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginTop: 4,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  totalValue: { fontSize: 24, fontWeight: "900" },
  saveBtn: { marginTop: 12, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  privacy: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 8 },
});
