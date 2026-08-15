import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";

interface ModernDatePickerModalProps {
  visible: boolean;
  selectedDate: string | null; // YYYY-MM-DD or null
  onClose: () => void;
  onSelectDate: (dateStr: string | null) => void;
}

export default function ModernDatePickerModal({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
}: ModernDatePickerModalProps) {
  // Parse initial date or default to today IST
  const getTodayIST = () => {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
  };

  const initialDateStr = selectedDate || getTodayIST();
  const [activeYear, setActiveYear] = useState<number>(() => {
    const parts = initialDateStr.split("-");
    return parts.length === 3 ? parseInt(parts[0], 10) : new Date().getFullYear();
  });
  const [activeMonth, setActiveMonth] = useState<number>(() => {
    const parts = initialDateStr.split("-");
    return parts.length === 3 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
  });
  const [tempSelectedDate, setTempSelectedDate] = useState<string | null>(selectedDate);

  useEffect(() => {
    if (visible) {
      const cur = selectedDate || getTodayIST();
      setTempSelectedDate(selectedDate);
      const parts = cur.split("-");
      if (parts.length === 3) {
        setActiveYear(parseInt(parts[0], 10));
        setActiveMonth(parseInt(parts[1], 10) - 1);
      }
    }
  }, [visible, selectedDate]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      setActiveMonth(11);
      setActiveYear((y) => y - 1);
    } else {
      setActiveMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      setActiveMonth(0);
      setActiveYear((y) => y + 1);
    } else {
      setActiveMonth((m) => m + 1);
    }
  };

  // Generate calendar grid matrix
  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(activeYear, activeMonth, 1).getDay();

  const todayStr = getTodayIST();

  const handleDaySelect = (day: number) => {
    const monthStr = String(activeMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const formatted = `${activeYear}-${monthStr}-${dayStr}`;
    setTempSelectedDate(formatted);
  };

  const handleConfirm = () => {
    onSelectDate(tempSelectedDate);
    onClose();
  };

  const handleQuickToday = () => {
    const t = getTodayIST();
    setTempSelectedDate(t);
    onSelectDate(t);
    onClose();
  };

  const handleQuickYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    setTempSelectedDate(yStr);
    onSelectDate(yStr);
    onClose();
  };

  const handleClear = () => {
    setTempSelectedDate(null);
    onSelectDate(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBadge}>
                <CalendarIcon size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Select Draw Date</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetRow}>
            <TouchableOpacity style={styles.presetBtn} onPress={handleQuickToday}>
              <Text style={styles.presetBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={handleQuickYesterday}>
              <Text style={styles.presetBtnText}>Yesterday</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, tempSelectedDate === null && styles.activePresetBtn]}
              onPress={handleClear}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  tempSelectedDate === null && styles.activePresetBtnText,
                ]}
              >
                All Draws (Full DB)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
              <ChevronLeft size={20} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthNames[activeMonth]} {activeYear}
            </Text>
            <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
              <ChevronRight size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.daysHeaderRow}>
            {dayNames.map((dName) => (
              <Text key={dName} style={styles.dayHeaderCell}>
                {dName}
              </Text>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View style={styles.calendarGrid}>
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const monthStr = String(activeMonth + 1).padStart(2, "0");
              const dayStr = String(dayNum).padStart(2, "0");
              const currentCellDate = `${activeYear}-${monthStr}-${dayStr}`;
              const isSelected = tempSelectedDate === currentCellDate;
              const isToday = todayStr === currentCellDate;
              const isFuture = currentCellDate > todayStr;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDayCell,
                    isToday && !isSelected && styles.todayDayCell,
                  ]}
                  disabled={isFuture}
                  onPress={() => handleDaySelect(dayNum)}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isSelected && styles.selectedDayCellText,
                      isToday && !isSelected && styles.todayDayCellText,
                      isFuture && styles.futureDayCellText,
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Summary & Actions Footer */}
          <View style={styles.footer}>
            <Text style={styles.selectedDateText}>
              Selected:{" "}
              <Text style={styles.selectedDateValue}>
                {tempSelectedDate ? tempSelectedDate : "Full Database (All Draws)"}
              </Text>
            </Text>

            <View style={styles.footerBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Check size={16} color={COLORS.white} />
                <Text style={styles.confirmBtnText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "92%",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  closeBtn: {
    padding: 4,
  },
  presetRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  activePresetBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  activePresetBtnText: {
    color: COLORS.white,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  daysHeaderRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  dayHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    borderRadius: 8,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
  },
  todayDayCell: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  selectedDayCellText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  todayDayCellText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  futureDayCellText: {
    color: COLORS.textLight,
    opacity: 0.4,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedDateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    textAlign: "center",
  },
  selectedDateValue: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  footerBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  confirmBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
});
