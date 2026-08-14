import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import {
  Scan,
  X,
  Save,
  Calendar,
  Ticket,
  ChevronDown,
  Check,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import BarcodeScannerModal from "./BarcodeScannerModal";
import {
  LotteryReminder,
  generateId,
  saveReminder,
} from "../utils/reminderStorage";
import {
  scheduleReminderNotification,
  cancelReminderNotification,
} from "../utils/notificationScheduler";
import { fetchLotteries } from "../api/lotteryApi";

interface LotteryOption {
  name: string;
  code: string;
  drawTime: string;
  day: string;
}

function convertTo24h(timeStr: string): string {
  if (!timeStr) return "15:00";
  if (timeStr.includes(":") && !timeStr.toUpperCase().includes("M"))
    return timeStr;
  const upper = timeStr.toUpperCase().trim();
  const [timePart, meridiem] = upper.split(" ");
  const [h, m] = timePart.split(":").map(Number);
  let hour = h;
  if (meridiem === "PM" && h !== 12) hour = h + 12;
  if (meridiem === "AM" && h === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
}

// ─── Inline Date Picker ────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

const ITEM_H = 50;
const VISIBLE_ITEMS = 5; // must be odd
const PICKER_H = ITEM_H * VISIBLE_ITEMS;

function SpinnerColumn({
  items,
  selectedIndex,
  onSelect,
  flex,
  align = "center",
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  flex?: number;
  align?: "left" | "center" | "right";
}) {
  const ref = useRef<ScrollView>(null);
  const lastIdx = useRef(selectedIndex);

  useEffect(() => {
    // Scroll to initial position without animation on first mount
    setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 50);
  }, []);

  // When selectedIndex changes externally (e.g. month changes day count), re-scroll
  useEffect(() => {
    if (lastIdx.current !== selectedIndex) {
      lastIdx.current = selectedIndex;
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: true });
    }
  }, [selectedIndex]);

  const textAlign =
    align === "left" ? "left" : align === "right" ? "right" : "center";

  return (
    <View style={[pS.col, flex !== undefined ? { flex } : {}]}>
      {/* Top fade */}
      <View style={pS.fadeTop} pointerEvents="none" />
      {/* Bottom fade */}
      <View style={pS.fadeBottom} pointerEvents="none" />
      {/* Center selection pill */}
      <View style={pS.pill} pointerEvents="none" />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.min(Math.max(idx, 0), items.length - 1);
          lastIdx.current = clamped;
          onSelect(clamped);
        }}
        onScrollEndDrag={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.min(Math.max(idx, 0), items.length - 1);
          lastIdx.current = clamped;
          onSelect(clamped);
        }}
        contentContainerStyle={{
          paddingVertical: ITEM_H * Math.floor(VISIBLE_ITEMS / 2),
        }}
        style={{ height: PICKER_H }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIndex);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2;
          const fontSize = dist === 0 ? 20 : dist === 1 ? 16 : 14;
          const fontWeight: any = dist === 0 ? "800" : "500";
          const color = dist === 0 ? COLORS.primary : "#6B7280";
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              style={pS.item}
              onPress={() => {
                lastIdx.current = i;
                onSelect(i);
                ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
              }}
            >
              <Text
                style={[
                  pS.itemText,
                  { opacity, fontSize, fontWeight, color, textAlign },
                ]}
                numberOfLines={1}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const pS = StyleSheet.create({
  col: {
    position: "relative",
    overflow: "hidden",
  },
  item: {
    height: ITEM_H,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  itemText: {
    letterSpacing: 0.2,
  },
  pill: {
    position: "absolute",
    top: ITEM_H * Math.floor(VISIBLE_ITEMS / 2),
    left: 6,
    right: 6,
    height: ITEM_H,
    backgroundColor: "rgba(11, 60, 93, 0.08)",
    borderRadius: 12,
    zIndex: 0,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_H * 2,
    zIndex: 1,
    // Simulated gradient from white to transparent
    backgroundColor: "transparent",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_H * 2,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});

// ─── Date Picker Modal ─────────────────────────────────────────────────────
function DatePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (d: Date) => void;
}) {
  const today = new Date();
  const minYear = today.getFullYear();
  const maxYear = minYear + 3;

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) =>
    String(minYear + i)
  );

  const [selYear, setSelYear] = useState(value.getFullYear());
  const [selMonth, setSelMonth] = useState(value.getMonth());
  const [selDay, setSelDay] = useState(value.getDate());

  useEffect(() => {
    if (visible) {
      setSelYear(value.getFullYear());
      setSelMonth(value.getMonth());
      setSelDay(value.getDate());
    }
  }, [visible, value]);

  const daysInMonth = getDaysInMonth(selMonth, selYear);
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const adjustedDay = Math.min(selDay, daysInMonth);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dpStyles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={dpStyles.sheet}>
          {/* Drag handle */}
          <View style={dpStyles.handle} />

          <View style={dpStyles.header}>
            <TouchableOpacity style={dpStyles.headerBtn} onPress={onClose}>
              <Text style={dpStyles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <View style={dpStyles.headerCenter}>
              <Calendar size={16} color={COLORS.primary} />
              <Text style={dpStyles.title}>Draw Date</Text>
            </View>
            <TouchableOpacity
              style={dpStyles.headerBtn}
              onPress={() => {
                onConfirm(new Date(selYear, selMonth, adjustedDay));
              }}
            >
              <Text style={dpStyles.done}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Selected date preview */}
          <View style={dpStyles.preview}>
            <Text style={dpStyles.previewText}>
              {new Date(selYear, selMonth, adjustedDay).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={dpStyles.pickerRow}>
            {/* Day */}
            <SpinnerColumn
              items={days}
              selectedIndex={adjustedDay - 1}
              onSelect={(i) => setSelDay(i + 1)}
              flex={1}
              align="center"
            />
            {/* Separator */}
            <Text style={dpStyles.sep}>/</Text>
            {/* Month */}
            <SpinnerColumn
              items={MONTHS.map((m) => m.substring(0, 3))}
              selectedIndex={selMonth}
              onSelect={setSelMonth}
              flex={2}
              align="center"
            />
            {/* Separator */}
            <Text style={dpStyles.sep}>/</Text>
            {/* Year */}
            <SpinnerColumn
              items={years}
              selectedIndex={selYear - minYear}
              onSelect={(i) => setSelYear(minYear + i)}
              flex={1.5}
              align="center"
            />
          </View>

          {/* Column labels */}
          <View style={dpStyles.labels}>
            <Text style={[dpStyles.colLabel, { flex: 1 }]}>DAY</Text>
            <View style={{ width: 14 }} />
            <Text style={[dpStyles.colLabel, { flex: 2 }]}>MONTH</Text>
            <View style={{ width: 14 }} />
            <Text style={[dpStyles.colLabel, { flex: 1.5 }]}>YEAR</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  cancel: { fontSize: 15, color: "#6B7280", fontWeight: "600" },
  done: { fontSize: 15, color: COLORS.primary, fontWeight: "800" },
  preview: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  previewText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 4,
  },
  sep: {
    fontSize: 20,
    color: "#D1D5DB",
    fontWeight: "300",
    width: 14,
    textAlign: "center",
  },
  labels: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: 4,
  },
  colLabel: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
});

// ─── Main Component ────────────────────────────────────────────────────────
interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editReminder?: LotteryReminder | null;
}

export default function AddReminderModal({
  visible,
  onClose,
  onSaved,
  editReminder,
}: AddReminderModalProps) {
  const [ticketNumber, setTicketNumber] = useState("");
  const [selectedLottery, setSelectedLottery] = useState<LotteryOption | null>(null);
  const [lotteries, setLotteries] = useState<LotteryOption[]>([]);
  const [loadingLotteries, setLoadingLotteries] = useState(false);
  const [showLotteryPicker, setShowLotteryPicker] = useState(false);
  const [drawDate, setDrawDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoadingLotteries(true);
      fetchLotteries()
        .then((data) => setLotteries(data as LotteryOption[]))
        .catch(() => {})
        .finally(() => setLoadingLotteries(false));
    }
  }, [visible]);

  useEffect(() => {
    if (editReminder && visible) {
      setTicketNumber(editReminder.ticketNumber);
      const [y, m, d] = editReminder.drawDate.split("-").map(Number);
      setDrawDate(new Date(y, m - 1, d));
    } else if (!editReminder && visible) {
      setTicketNumber("");
      setSelectedLottery(null);
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDrawDate(d);
    }
  }, [editReminder, visible]);

  useEffect(() => {
    if (editReminder && lotteries.length > 0) {
      const found = lotteries.find((l) => l.name === editReminder.lotteryName);
      setSelectedLottery(found ?? null);
    }
  }, [editReminder, lotteries]);

  const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const handleSave = async () => {
    if (!ticketNumber.trim()) {
      Alert.alert("Missing Info", "Please enter your ticket number.");
      return;
    }
    if (!selectedLottery) {
      Alert.alert("Missing Info", "Please select the lottery name.");
      return;
    }
    setSaving(true);
    try {
      if (editReminder?.notificationId) {
        await cancelReminderNotification(editReminder.notificationId);
      }
      const drawTime24 = convertTo24h(selectedLottery.drawTime);
      const reminder: LotteryReminder = {
        id: editReminder?.id ?? generateId(),
        ticketNumber: ticketNumber.trim().toUpperCase(),
        lotteryName: selectedLottery.name,
        drawDate: formatDate(drawDate),
        drawTime: drawTime24,
        createdAt: editReminder?.createdAt ?? new Date().toISOString(),
      };
      const notifId = await scheduleReminderNotification(reminder);
      reminder.notificationId = notifId ?? undefined;
      await saveReminder(reminder);
      onSaved();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save reminder. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ticket size={20} color={COLORS.primary} />
                <Text style={styles.headerTitle}>
                  {editReminder ? "Edit Reminder" : "Add Ticket Reminder"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Ticket Number */}
              <Text style={styles.label}>Ticket Number</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. BT 704781"
                  placeholderTextColor={COLORS.textMuted}
                  value={ticketNumber}
                  onChangeText={setTicketNumber}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.scanBtn}
                  onPress={() => setIsScannerOpen(true)}
                >
                  <Scan size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              {/* Lottery Name */}
              <Text style={styles.label}>Lottery Name</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => setShowLotteryPicker(true)}
              >
                {loadingLotteries ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.selectBtnText,
                        !selectedLottery && { color: COLORS.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedLottery
                        ? `${selectedLottery.name} (${selectedLottery.day})`
                        : "Select lottery..."}
                    </Text>
                    <ChevronDown size={18} color={COLORS.textMuted} />
                  </>
                )}
              </TouchableOpacity>
              {selectedLottery && (
                <Text style={styles.drawTimeHint}>
                  ⏰ Draw time: {selectedLottery.drawTime}
                </Text>
              )}

              {/* Draw Date */}
              <Text style={styles.label}>Draw Date</Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color={COLORS.primary} />
                <Text style={styles.dateBtnText}>
                  {formatDateDisplay(drawDate)}
                </Text>
              </TouchableOpacity>

              {/* Notification info */}
              <View style={styles.notifInfo}>
                <Text style={styles.notifInfoText}>
                  🔔 You'll receive a push notification 5 minutes before the draw starts.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Save size={18} color={COLORS.white} />
                <Text style={styles.saveBtnText}>
                  {saving
                    ? "Saving..."
                    : editReminder
                    ? "Update Reminder"
                    : "Save Reminder"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker — rendered OUTSIDE the main modal */}
      <DatePickerModal
        visible={showDatePicker}
        value={drawDate}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(d) => {
          setDrawDate(d);
          setShowDatePicker(false);
        }}
      />

      {/* Lottery Picker */}
      <Modal
        visible={showLotteryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLotteryPicker(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { maxHeight: "70%" }]}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Lottery</Text>
              <TouchableOpacity onPress={() => setShowLotteryPicker(false)}>
                <X size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            {loadingLotteries ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <FlatList
                data={lotteries}
                keyExtractor={(item) => item.code}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => {
                  const isSelected = selectedLottery?.code === item.code;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.lotteryRow,
                        isSelected && styles.lotteryRowSelected,
                      ]}
                      onPress={() => {
                        setSelectedLottery(item);
                        setShowLotteryPicker(false);
                      }}
                    >
                      <View style={styles.lotteryRowLeft}>
                        <Text
                          style={[
                            styles.lotteryRowName,
                            isSelected && { color: COLORS.primary },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.lotteryRowMeta}>
                          {item.day} · {item.drawTime}
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={(value) => {
          setTicketNumber(value);
          setIsScannerOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#1F2937" },
  closeBtn: { padding: 4 },
  body: { padding: 20, paddingBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 6,
  },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  drawTimeHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
  },
  dateBtnText: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  notifInfo: {
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 16,
  },
  notifInfoText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    lineHeight: 18,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  lotteryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  lotteryRowSelected: { backgroundColor: "#F0F9FF" },
  lotteryRowLeft: { flex: 1 },
  lotteryRowName: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  lotteryRowMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
});
