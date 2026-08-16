import React, { useState, useEffect } from "react";
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
  Platform,
} from "react-native";
import {
  Scan,
  X,
  Save,
  Calendar,
  Ticket,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Clock,
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
  getNotificationPermissionStatus,
  openNotificationSettings,
} from "../utils/notificationScheduler";
import { fetchLotteries, formatTicketSearchInput } from "../api/lotteryApi";
import { ALL_LOTTERIES, WEEKLY_LOTTERIES, BUMPER_LOTTERIES, LotteryMeta } from "../constants/lotteries";

interface LotteryOption {
  name: string;
  nameMl?: string;
  code: string;
  drawTime: string;
  day: string;
  isBumper?: boolean;
}

function convertTo24h(timeStr: string): string {
  if (!timeStr) return "15:00";
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes("PM");
  const isAM = clean.includes("AM");
  const digits = clean.replace(/[^0-9:]/g, "").split(":");
  if (digits.length < 2) return "15:00";
  let h = parseInt(digits[0], 10) || 0;
  const m = parseInt(digits[1], 10) || 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getNextDrawDateForLottery(lotteryDay: string): Date {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = dayMap[lotteryDay];
  const now = new Date();
  if (targetDay === undefined) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  const currentDay = now.getDay();
  let daysToAdd = (targetDay - currentDay + 7) % 7;
  const istHours = now.getUTCHours() + 5.5;
  if (daysToAdd === 0 && istHours >= 15) {
    daysToAdd = 7;
  }
  const result = new Date(now);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  const [lotteries, setLotteries] = useState<LotteryOption[]>(ALL_LOTTERIES);
  const [loadingLotteries, setLoadingLotteries] = useState(false);
  const [activeSheet, setActiveSheet] = useState<"form" | "lotteryPicker" | "datePicker">("form");

  const [drawDate, setDrawDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });

  // Date picker calendar matrix state
  const [calYear, setCalYear] = useState(drawDate.getFullYear());
  const [calMonth, setCalMonth] = useState(drawDate.getMonth());

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setActiveSheet("form");
      setLoadingLotteries(true);
      fetchLotteries()
        .then((data) => {
          if (data && data.length > 0) {
            setLotteries(data as LotteryOption[]);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingLotteries(false));
    }
  }, [visible]);

  useEffect(() => {
    if (editReminder && visible) {
      setTicketNumber(editReminder.ticketNumber);
      const [y, m, d] = editReminder.drawDate.split("-").map(Number);
      const targetDate = new Date(y, m - 1, d);
      setDrawDate(targetDate);
      setCalYear(targetDate.getFullYear());
      setCalMonth(targetDate.getMonth());
    } else if (!editReminder && visible) {
      setTicketNumber("");
      setSelectedLottery(null);
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDrawDate(d);
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
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

  const handleLotterySelect = (item: LotteryOption) => {
    setSelectedLottery(item);
    if (!editReminder) {
      const nextDate = getNextDrawDateForLottery(item.day);
      setDrawDate(nextDate);
      setCalYear(nextDate.getFullYear());
      setCalMonth(nextDate.getMonth());
    }
    setActiveSheet("form");
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(calYear, calMonth, day);
    setDrawDate(newDate);
    setActiveSheet("form");
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

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
      const permState = await getNotificationPermissionStatus();
      const notifId = await scheduleReminderNotification(reminder);
      reminder.notificationId = notifId ?? undefined;
      await saveReminder(reminder);
      onSaved();
      onClose();

      if (!permState.granted && Platform.OS !== "web") {
        Alert.alert(
          "Reminder Saved",
          "Your reminder was saved! To receive push alerts 5 minutes before the draw, please enable notifications in Settings.",
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => openNotificationSettings(),
            },
          ]
        );
      }
    } catch {
      Alert.alert("Error", "Failed to save reminder. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Calendar matrix calculations
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === calYear && today.getMonth() === calMonth;
  const isCurrentMonthSelected = drawDate.getFullYear() === calYear && drawDate.getMonth() === calMonth;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (activeSheet !== "form") {
            setActiveSheet("form");
          } else {
            onClose();
          }
        }}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {/* Sheet 1: Main Add/Edit Reminder Form */}
            {activeSheet === "form" && (
              <>
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
                      placeholder="e.g. MJ 136429, 136429, or 6429"
                      placeholderTextColor={COLORS.textMuted}
                      value={ticketNumber}
                      onChangeText={(text) => setTicketNumber(formatTicketSearchInput(text))}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.scanBtn}
                      onPress={() => setIsScannerOpen(true)}
                    >
                      <Scan size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>

                  {/* Lottery Name Selection */}
                  <Text style={styles.label}>Lottery Name</Text>
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => setActiveSheet("lotteryPicker")}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.selectBtnText,
                          !selectedLottery && { color: COLORS.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedLottery
                          ? `${selectedLottery.name} ${selectedLottery.nameMl ? `(${selectedLottery.nameMl})` : ""}`
                          : "Select lottery name..."}
                      </Text>
                      {selectedLottery && (
                        <Text style={styles.selectBtnSubtext}>
                          Draw Day: {selectedLottery.day} · {selectedLottery.drawTime}
                        </Text>
                      )}
                    </View>
                    <ChevronDown size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* Draw Date Selection */}
                  <Text style={styles.label}>Draw Date</Text>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => {
                      setCalYear(drawDate.getFullYear());
                      setCalMonth(drawDate.getMonth());
                      setActiveSheet("datePicker");
                    }}
                    activeOpacity={0.8}
                  >
                    <Calendar size={18} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dateBtnText}>
                        {formatDateDisplay(drawDate)}
                      </Text>
                    </View>
                    <ChevronDown size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* Notification info banner */}
                  <View style={styles.notifInfo}>
                    <Text style={styles.notifInfoText}>
                      🔔 You'll receive a high-priority push notification 5 minutes before the draw begins.
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
              </>
            )}

            {/* Sheet 2: Lottery Selector Overlay */}
            {activeSheet === "lotteryPicker" && (
              <View style={{ flex: 1, maxHeight: "100%" }}>
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Ticket size={20} color={COLORS.primary} />
                    <Text style={styles.headerTitle}>Select Lottery</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveSheet("form")}
                    style={styles.closeBtn}
                  >
                    <X size={22} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={lotteries}
                  keyExtractor={(item) => item.code}
                  contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = selectedLottery?.code === item.code;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.lotteryCard,
                          isSelected && styles.lotteryCardSelected,
                        ]}
                        onPress={() => handleLotterySelect(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.lotteryCardContent}>
                          <View style={styles.lotteryCardHeader}>
                            <Text
                              style={[
                                styles.lotteryCardTitle,
                                isSelected && { color: COLORS.primary },
                              ]}
                            >
                              {item.name}
                            </Text>
                            <View
                              style={[
                                styles.codeBadge,
                                item.isBumper ? styles.codeBadgeBumper : styles.codeBadgeWeekly,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.codeBadgeText,
                                  item.isBumper ? styles.codeBadgeTextBumper : styles.codeBadgeTextWeekly,
                                ]}
                              >
                                {item.code}
                              </Text>
                            </View>
                          </View>

                          {item.nameMl ? (
                            <Text style={styles.lotteryCardMl}>{item.nameMl}</Text>
                          ) : null}

                          <View style={styles.lotteryCardMeta}>
                            <View style={styles.metaPill}>
                              <Calendar size={12} color="#0369A1" />
                              <Text style={styles.metaPillText}>{item.day}</Text>
                            </View>
                            <View style={styles.metaPill}>
                              <Clock size={12} color="#0369A1" />
                              <Text style={styles.metaPillText}>{item.drawTime}</Text>
                            </View>
                          </View>
                        </View>

                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Check size={16} color={COLORS.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              </View>
            )}

            {/* Sheet 3: Date Picker Calendar Overlay */}
            {activeSheet === "datePicker" && (
              <View style={{ flex: 1 }}>
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Calendar size={20} color={COLORS.primary} />
                    <Text style={styles.headerTitle}>Select Draw Date</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveSheet("form")}
                    style={styles.closeBtn}
                  >
                    <X size={22} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Month Navigation */}
                  <View style={styles.calNav}>
                    <TouchableOpacity
                      style={styles.calNavBtn}
                      onPress={handlePrevMonth}
                    >
                      <ChevronLeft size={20} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.calNavTitle}>
                      {MONTH_NAMES[calMonth]} {calYear}
                    </Text>
                    <TouchableOpacity
                      style={styles.calNavBtn}
                      onPress={handleNextMonth}
                    >
                      <ChevronRight size={20} color={COLORS.textDark} />
                    </TouchableOpacity>
                  </View>

                  {/* Day Headers (Su, Mo, Tu...) */}
                  <View style={styles.dayNamesRow}>
                    {DAY_NAMES.map((name, idx) => (
                      <Text key={idx} style={styles.dayNameCell}>
                        {name}
                      </Text>
                    ))}
                  </View>

                  {/* Calendar Matrix */}
                  <View style={styles.calendarGrid}>
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <View key={`empty-${i}`} style={styles.calendarCell} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const isToday = isCurrentMonthToday && today.getDate() === dayNum;
                      const isSelected = isCurrentMonthSelected && drawDate.getDate() === dayNum;

                      return (
                        <TouchableOpacity
                          key={`day-${dayNum}`}
                          style={[
                            styles.calendarCell,
                            isSelected && styles.calendarCellSelected,
                            isToday && !isSelected && styles.calendarCellToday,
                          ]}
                          onPress={() => handleDayClick(dayNum)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.calendarCellText,
                              isSelected && styles.calendarCellTextSelected,
                              isToday && !isSelected && styles.calendarCellTextToday,
                            ]}
                          >
                            {dayNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Quick Preset Buttons */}
                  <Text style={[styles.label, { marginTop: 20 }]}>Quick Presets</Text>
                  <View style={styles.presetsRow}>
                    <TouchableOpacity
                      style={styles.presetBtn}
                      onPress={() => {
                        const d = new Date();
                        setDrawDate(d);
                        setActiveSheet("form");
                      }}
                    >
                      <Text style={styles.presetBtnText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.presetBtn}
                      onPress={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setDrawDate(d);
                        setActiveSheet("form");
                      }}
                    >
                      <Text style={styles.presetBtnText}>Tomorrow</Text>
                    </TouchableOpacity>
                    {selectedLottery && (
                      <TouchableOpacity
                        style={[styles.presetBtn, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}
                        onPress={() => {
                          const nextDate = getNextDrawDateForLottery(selectedLottery.day);
                          setDrawDate(nextDate);
                          setActiveSheet("form");
                        }}
                      >
                        <Text style={[styles.presetBtnText, { color: "#065F46" }]}>
                          Next {selectedLottery.day}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
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
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: 480,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
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
    marginTop: 14,
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
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  selectBtnSubtext: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 2,
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
  dateBtnText: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
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

  // Lottery Card Styles
  lotteryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  lotteryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0FDF4",
  },
  lotteryCardContent: { flex: 1, marginRight: 8 },
  lotteryCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  lotteryCardTitle: { fontSize: 15, fontWeight: "800", color: "#1F2937" },
  codeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  codeBadgeWeekly: { backgroundColor: "#E0F2FE" },
  codeBadgeBumper: { backgroundColor: "#FEF3C7" },
  codeBadgeText: { fontSize: 11, fontWeight: "900" },
  codeBadgeTextWeekly: { color: "#0369A1" },
  codeBadgeTextBumper: { color: "#B45309" },
  lotteryCardMl: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  lotteryCardMeta: { flexDirection: "row", gap: 8, marginTop: 6 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaPillText: { fontSize: 11, fontWeight: "700", color: "#0369A1" },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Calendar Picker Styles
  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  calNavTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
  dayNamesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  dayNameCell: {
    width: 36,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  calendarCell: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 3,
    borderRadius: 21,
  },
  calendarCellSelected: {
    backgroundColor: COLORS.primary,
  },
  calendarCellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: "#F0FDF4",
  },
  calendarCellText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  calendarCellTextSelected: {
    color: COLORS.white,
    fontWeight: "800",
  },
  calendarCellTextToday: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  presetBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#374151",
  },
});
