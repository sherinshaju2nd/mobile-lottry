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
  KeyboardAvoidingView,
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
import { ALL_LOTTERIES, WEEKLY_LOTTERIES, BUMPER_LOTTERIES, LotteryMeta, getDayTranslated } from "../constants/lotteries";
import { useLanguage } from "../context/LanguageContext";

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

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_NAMES_ML = [
  "ജനുവരി", "ഫെബ്രുവരി", "മാർച്ച്", "ഏപ്രിൽ", "മേയ്", "ജൂൺ",
  "ജൂലൈ", "ഓഗസ്റ്റ്", "സെപ്റ്റംബർ", "ഒക്ടോബർ", "നവംബർ", "ഡിസംബർ"
];
const DAY_NAMES_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_NAMES_ML = ["ഞാ", "തി", "ചൊ", "ബു", "വ്യാ", "വെ", "ശ"];

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
  const { language, t } = useLanguage();
  const isMl = language === "ml";
  const monthNames = isMl ? MONTH_NAMES_ML : MONTH_NAMES_EN;
  const dayNames = isMl ? DAY_NAMES_ML : DAY_NAMES_EN;

  const [ticketNumber, setTicketNumber] = useState("");
  const [selectedLottery, setSelectedLottery] = useState<LotteryOption | null>(null);
  const [lotteries, setLotteries] = useState<LotteryOption[]>(ALL_LOTTERIES);
  const [loadingLotteries, setLoadingLotteries] = useState(false);
  const [activeSheet, setActiveSheet] = useState<"form" | "lotteryPicker" | "datePicker">("form");

  const [ticketError, setTicketError] = useState<string | null>(null);
  const [lotteryError, setLotteryError] = useState<string | null>(null);

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
      setTicketError(null);
      setLotteryError(null);
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
      setTicketError(null);
      setLotteryError(null);
      const [y, m, d] = editReminder.drawDate.split("-").map(Number);
      const targetDate = new Date(y, m - 1, d);
      setDrawDate(targetDate);
      setCalYear(targetDate.getFullYear());
      setCalMonth(targetDate.getMonth());
    } else if (!editReminder && visible) {
      setTicketNumber("");
      setSelectedLottery(null);
      setTicketError(null);
      setLotteryError(null);
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
    setLotteryError(null);
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
    let hasError = false;
    const cleanTicket = ticketNumber.trim();

    if (!cleanTicket) {
      setTicketError(isMl ? "ദയവായി ടിക്കറ്റ് നമ്പർ നൽകുക." : "Please enter your ticket number.");
      hasError = true;
    } else {
      const digits = cleanTicket.replace(/\D/g, "");
      if (digits.length < 4) {
        setTicketError(
          isMl
            ? "കുറഞ്ഞത് 4 അക്കങ്ങൾ നൽകുക (ഉദാ: MJ 136429 അല്ലെങ്കിൽ 6429)"
            : "Please enter at least 4 digits (e.g. MJ 136429, 136429, or 6429)"
        );
        hasError = true;
      } else {
        setTicketError(null);
      }
    }

    if (!selectedLottery) {
      setLotteryError(isMl ? "ദയവായി ലോട്ടറി തിരഞ്ഞെടുക്കുക." : "Please select the lottery name.");
      hasError = true;
    } else {
      setLotteryError(null);
    }

    if (hasError) {
      Alert.alert(
        isMl ? "വിവരം അപൂർണ്ണമാണ്" : "Validation Error",
        !cleanTicket
          ? isMl ? "ദയവായി നിങ്ങളുടെ ടിക്കറ്റ് നമ്പർ നൽകുക." : "Please enter your ticket number."
          : cleanTicket.replace(/\D/g, "").length < 4
          ? isMl ? "ദയവായി കുറഞ്ഞത് 4 അക്കങ്ങളെങ്കിലും നൽകുക (ഉദാ: MJ 136429 അല്ലെങ്കിൽ 6429)." : "Please enter at least 4 digits (e.g. MJ 136429, 136429, or 6429)."
          : isMl ? "ദയവായി ലോട്ടറി പേര് തിരഞ്ഞെടുക്കുക." : "Please select the lottery name."
      );
      return;
    }

    setSaving(true);
    try {
      if (editReminder?.notificationId) {
        await cancelReminderNotification(editReminder.notificationId);
      }
      const drawTime24 = convertTo24h(selectedLottery!.drawTime);
      const reminder: LotteryReminder = {
        id: editReminder?.id ?? generateId(),
        ticketNumber: cleanTicket.toUpperCase(),
        lotteryName: selectedLottery!.name,
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
          isMl ? "റിമൈൻഡർ സേവ് ചെയ്തു" : "Reminder Saved",
          isMl
            ? "നിങ്ങളുടെ റിമൈൻഡർ സേവ് ചെയ്തു! നറുക്കെടുപ്പിന് 5 മിനിറ്റ് മുൻപ് അലേർട്ട് ലഭിക്കാൻ സെറ്റിംഗ്സിൽ നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക."
            : "Your reminder was saved! To receive push alerts 5 minutes before the draw, please enable notifications in Settings.",
          [
            { text: isMl ? "ഇപ്പോൾ വേണ്ട" : "Not Now", style: "cancel" },
            {
              text: isMl ? "സെറ്റിംഗ്സ് തുറക്കുക" : "Open Settings",
              onPress: () => openNotificationSettings(),
            },
          ]
        );
      }
    } catch {
      Alert.alert(
        isMl ? "പിശക്" : "Error",
        isMl ? "റിമൈൻഡർ സേവ് ചെയ്യാൻ സാധിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക." : "Failed to save reminder. Please try again."
      );
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", justifyContent: "flex-end" }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <View style={styles.sheet}>
              {activeSheet === "form" && (
                <>
                  <View style={styles.header}>
                    <View style={styles.headerLeft}>
                      <Ticket size={20} color={COLORS.primary} />
                      <Text style={styles.headerTitle}>
                        {editReminder ? t("edit_reminder_title") : t("add_reminder_title")}
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
                    automaticallyAdjustKeyboardInsets={true}
                  >
                  <Text style={styles.label}>{t("ticket_number")}</Text>
                  <View style={[styles.inputRow, ticketError && { borderColor: "#EF4444", borderWidth: 1.5 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder={isMl ? "ഉദാ: MJ 136429 അല്ലെങ്കിൽ 6429" : "e.g. MJ 136429, 136429, or 6429"}
                      placeholderTextColor={COLORS.textMuted}
                      value={ticketNumber}
                      onChangeText={(text) => {
                        setTicketNumber(formatTicketSearchInput(text));
                        if (ticketError) setTicketError(null);
                      }}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.scanBtn}
                      onPress={() => setIsScannerOpen(true)}
                    >
                      <Scan size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                  {ticketError && (
                    <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "700", marginTop: 4, marginLeft: 2 }}>
                      ⚠ {ticketError}
                    </Text>
                  )}

                  <Text style={[styles.label, { marginTop: 12 }]}>{t("select_lottery_label")}</Text>
                  <TouchableOpacity
                    style={[styles.selectBtn, lotteryError && { borderColor: "#EF4444", borderWidth: 1.5 }]}
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
                          ? (isMl ? (selectedLottery.nameMl || selectedLottery.name) : selectedLottery.name)
                          : t("choose_lottery")}
                      </Text>
                      {selectedLottery && (
                        <Text style={styles.selectBtnSubtext}>
                          {t("draw_day")}: {getDayTranslated(selectedLottery.day, language)} · {selectedLottery.drawTime}
                        </Text>
                      )}
                    </View>
                    <ChevronDown size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  {lotteryError && (
                    <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "700", marginTop: 4, marginLeft: 2 }}>
                      ⚠ {lotteryError}
                    </Text>
                  )}

                  <Text style={[styles.label, { marginTop: 12 }]}>{t("draw_date_label")}</Text>
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

                  <View style={styles.notifInfo}>
                    <Text style={styles.notifInfoText}>
                      🔔 {isMl
                        ? "നറുക്കെടുപ്പ് ആരംഭിക്കുന്നതിന് 5 മിനിറ്റ് മുൻപ് ഹൈ-പ്രയോരിറ്റി നോട്ടിഫിക്കേഷൻ ലഭിക്കുന്നതാണ്."
                        : "You'll receive a high-priority push notification 5 minutes before the draw begins."}
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
                        ? t("loading")
                        : editReminder
                        ? (isMl ? "മാറ്റം വരുത്തുക" : "Update Reminder")
                        : t("save_reminder_btn")}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}

            {activeSheet === "lotteryPicker" && (
              <View style={{ flex: 1, maxHeight: "100%" }}>
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Ticket size={20} color={COLORS.primary} />
                    <Text style={styles.headerTitle}>{isMl ? "ലോട്ടറി തിരഞ്ഞെടുക്കുക" : "Select Lottery"}</Text>
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
                        activeOpacity={0.75}
                      >
                        <View style={styles.lotteryCardLeft}>
                          <View
                            style={[
                              styles.codeBadge,
                              isSelected && { backgroundColor: COLORS.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.codeBadgeText,
                                isSelected && { color: COLORS.white },
                              ]}
                            >
                              {item.code}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.lotteryName,
                                isSelected && { color: COLORS.primary, fontWeight: "900" },
                              ]}
                            >
                              {isMl ? (item.nameMl || item.name) : item.name}
                            </Text>
                            <Text style={styles.lotteryMeta}>
                              {getDayTranslated(item.day, language)} · {item.drawTime}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {activeSheet === "datePicker" && (
              <View style={{ flex: 1, maxHeight: "100%" }}>
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Calendar size={20} color={COLORS.primary} />
                    <Text style={styles.headerTitle}>{isMl ? "തീയതി തിരഞ്ഞെടുക്കുക" : "Select Draw Date"}</Text>
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
                  <View style={styles.monthNavRow}>
                    <TouchableOpacity
                      style={styles.navArrowBtn}
                      onPress={handlePrevMonth}
                    >
                      <ChevronLeft size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.monthNavTitle}>
                      {monthNames[calMonth]} {calYear}
                    </Text>
                    <TouchableOpacity
                      style={styles.navArrowBtn}
                      onPress={handleNextMonth}
                    >
                      <ChevronRight size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dayNamesRow}>
                    {dayNames.map((name, idx) => (
                      <Text key={idx} style={styles.dayNameCell}>
                        {name}
                      </Text>
                    ))}
                  </View>

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

                  <Text style={[styles.label, { marginTop: 20 }]}>
                    {isMl ? "ദ്രുത തീയതികൾ" : "Quick Presets"}
                  </Text>
                  <View style={styles.presetsRow}>
                    <TouchableOpacity
                      style={styles.presetBtn}
                      onPress={() => {
                        const d = new Date();
                        setDrawDate(d);
                        setActiveSheet("form");
                      }}
                    >
                      <Text style={styles.presetBtnText}>{isMl ? "ഇന്ന്" : "Today"}</Text>
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
                      <Text style={styles.presetBtnText}>{isMl ? "നാളെ" : "Tomorrow"}</Text>
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
                          {isMl
                            ? `അടുത്ത ${getDayTranslated(selectedLottery.day, language)}`
                            : `Next ${selectedLottery.day}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={(value) => {
          const cleanVal = formatTicketSearchInput(value);
          setTicketNumber(cleanVal);
          setTicketError(null);
          if (!selectedLottery && lotteries.length > 0) {
            const upper = cleanVal.toUpperCase();
            const matched = lotteries.find((l) =>
              upper.startsWith(l.code) || upper.includes(l.code)
            );
            if (matched) {
              setSelectedLottery(matched);
              setLotteryError(null);
              if (!editReminder) {
                const nextDate = getNextDrawDateForLottery(matched.day);
                setDrawDate(nextDate);
                setCalYear(nextDate.getFullYear());
                setCalMonth(nextDate.getMonth());
              }
            }
          }
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
    marginBottom: 8,
  },
  lotteryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0FDF4",
  },
  lotteryCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  lotteryName: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#1F2937",
  },
  lotteryMeta: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 2,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
  },
  codeBadgeWeekly: { backgroundColor: "#E0F2FE" },
  codeBadgeBumper: { backgroundColor: "#FEF3C7" },
  codeBadgeText: { fontSize: 11, fontWeight: "900", color: "#0369A1" },
  codeBadgeTextWeekly: { color: "#0369A1" },
  codeBadgeTextBumper: { color: "#B45309" },

  // Calendar Picker Styles
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  monthNavTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
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
