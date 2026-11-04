import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  CalendarOff,
  HeartHandshake,
  PhoneCall,
  PiggyBank,
  Plus,
  Share2,
  ShieldCheck,
  Trash2,
  TrendingDown,
  Trophy,
} from "lucide-react-native";
import SafeScreenContainer from "../components/SafeScreenContainer";
import ScreenHeader from "../components/ScreenHeader";
import AddPlayEntryModal from "../components/AddPlayEntryModal";
import { COLORS } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";
import {
  BREAK_OPTIONS_DAYS,
  DEFAULT_PLAY_SETTINGS,
  PlayEntry,
  PlayEntryKind,
  PlaySettings,
  addDays,
  buildSummaryText,
  clearPlaySmartData,
  deletePlayEntry,
  getLimitStatus,
  isBreakActive,
  isSelfCheckFlagged,
  loadPlayEntries,
  loadPlaySettings,
  monthOf,
  monthlyTrend,
  projectMonthSpend,
  savePlaySettings,
  summarizeAllTime,
  summarizeMonth,
} from "../utils/playSmart";
import { formatGroupedRupees } from "../utils/prizeAmounts";
import { formatSafeDateDisplay, getSafeTodayISTDate } from "../utils/formatters";
import { syncAllDrawNotifications } from "../utils/notificationScheduler";
import { universalShare } from "../utils/shareHelper";
import { triggerLightHaptic } from "../utils/haptics";
import { ALL_LOTTERIES } from "../constants/lotteries";

/** Tele-MANAS: Government of India's free, 24×7 mental-health helpline (Malayalam supported). */
const HELPLINE_NUMBER = "14416";
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RECENT_ENTRIES = 15;

const SELF_CHECK_QUESTIONS = {
  en: [
    "Have you ever felt the need to bet more and more money?",
    "Have you ever had to lie to people important to you about how much you gambled?",
  ],
  ml: [
    "കൂടുതൽ കൂടുതൽ പണം ലോട്ടറിക്ക് ചെലവാക്കണമെന്ന് എപ്പോഴെങ്കിലും തോന്നിയിട്ടുണ്ടോ?",
    "എത്ര ചെലവാക്കി എന്നതിനെക്കുറിച്ച് പ്രിയപ്പെട്ടവരോട് എപ്പോഴെങ്കിലും കള്ളം പറയേണ്ടി വന്നിട്ടുണ്ടോ?",
  ],
};

const rupees = (n: number) => `₹${formatGroupedRupees(Math.abs(n))}`;
const monthLabel = (month: string) => `${MONTHS_SHORT[Number(month.slice(5, 7)) - 1] ?? ""} ${month.slice(0, 4)}`;

export default function PlaySmartScreen({ navigation, route }: any) {
  const { language } = useLanguage();
  const isMl = language === "ml";
  const today = getSafeTodayISTDate();
  const currentMonth = monthOf(today);

  const [entries, setEntries] = useState<PlayEntry[]>([]);
  const [settings, setSettings] = useState<PlaySettings>(DEFAULT_PLAY_SETTINGS);
  const [modalKind, setModalKind] = useState<PlayEntryKind | null>(null);
  const [limitText, setLimitText] = useState("");
  const [answers, setAnswers] = useState<[boolean | null, boolean | null]>([null, null]);

  // Opening with { logWin: { amount, lotteryName } } (from the claim calculator) prefills a win.
  const logWin: { amount?: number; lotteryName?: string; lotteryCode?: string } | undefined = route?.params?.logWin;
  // Use the app's canonical lottery name so the win groups with that lottery's spending.
  const logWinLotteryName =
    ALL_LOTTERIES.find((l) => l.code === logWin?.lotteryCode?.toUpperCase())?.name ?? logWin?.lotteryName;

  /** Runs a storage action from an Alert button and tells the user if it fails. */
  const safely = (action: () => Promise<void>) => async () => {
    try {
      await action();
    } catch (err: unknown) {
      console.warn("[play-smart] Action failed:", err instanceof Error ? err.message : String(err));
      Alert.alert(isMl ? "പിശക്" : "Something went wrong", isMl ? "വീണ്ടും ശ്രമിക്കുക." : "Please try again.");
    }
  };

  const reload = useCallback(async () => {
    const [loadedEntries, loadedSettings] = await Promise.all([loadPlayEntries(), loadPlaySettings()]);
    setEntries(loadedEntries);
    setSettings(loadedSettings);
    setLimitText(loadedSettings.monthlyLimit ? String(loadedSettings.monthlyLimit) : "");
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      if (logWin?.amount) setModalKind("win");
    }, [reload, logWin?.amount]),
  );

  const month = useMemo(() => summarizeMonth(entries, currentMonth), [entries, currentMonth]);
  const trend = useMemo(() => monthlyTrend(entries, currentMonth, 6), [entries, currentMonth]);
  const allTime = useMemo(() => summarizeAllTime(entries), [entries]);
  const limit = getLimitStatus(month.spent, settings.monthlyLimit, settings.warnAtPercent);
  const projection = projectMonthSpend(month.spent, today);
  const onBreak = isBreakActive(settings, today);
  const trendMax = Math.max(1, ...trend.flatMap((t) => [t.spent, t.won]));
  const recent = entries.slice(0, RECENT_ENTRIES);

  const limitColor = limit.state === "reached" ? "#DC2626" : limit.state === "near" ? "#D97706" : "#16A34A";

  // ------------------------------------------------------------------ actions
  const saveLimit = safely(async () => {
    const value = Number(limitText.replace(/[^\d]/g, ""));
    const next = await savePlaySettings({ monthlyLimit: value > 0 ? value : null });
    setSettings(next);
    triggerLightHaptic();
    Alert.alert(
      isMl ? "പരിധി സേവ് ചെയ്തു" : "Limit saved",
      next.monthlyLimit
        ? isMl
          ? `പ്രതിമാസ പരിധി: ${rupees(next.monthlyLimit)}`
          : `Monthly limit: ${rupees(next.monthlyLimit)}`
        : isMl
          ? "പരിധി നീക്കം ചെയ്തു."
          : "Limit removed.",
    );
  });

  const startBreak = (days: number) => {
    const until = addDays(today, days - 1);
    Alert.alert(
      isMl ? `${days} ദിവസത്തെ ഇടവേള` : `Take a ${days}-day break?`,
      isMl
        ? `${formatSafeDateDisplay(until)} വരെ നറുക്കെടുപ്പിന് മുമ്പുള്ള ഓർമ്മപ്പെടുത്തലുകൾ നിർത്തിവെക്കും. ഫലങ്ങൾ കാണാനും വാങ്ങിയ ടിക്കറ്റുകൾ പരിശോധിക്കാനും തുടർന്നും കഴിയും.`
        : `Pre-draw reminders pause until ${formatSafeDateDisplay(until)}. You can still check results and tickets you already have.`,
      [
        { text: isMl ? "റദ്ദാക്കുക" : "Cancel", style: "cancel" },
        {
          text: isMl ? "ഇടവേള തുടങ്ങുക" : "Start break",
          onPress: safely(async () => {
            setSettings(await savePlaySettings({ breakUntil: until }));
            await syncAllDrawNotifications();
          }),
        },
      ],
    );
  };

  const endBreak = () => {
    Alert.alert(
      isMl ? "ഇടവേള അവസാനിപ്പിക്കണോ?" : "End your break early?",
      isMl
        ? "നിങ്ങൾ സ്വയം എടുത്ത തീരുമാനമാണിത്. ഉറപ്പാണോ?"
        : "You chose this break for a reason. Are you sure you want to end it now?",
      [
        { text: isMl ? "ഇടവേള തുടരുക" : "Keep my break", style: "cancel" },
        {
          text: isMl ? "അവസാനിപ്പിക്കുക" : "End break",
          style: "destructive",
          onPress: safely(async () => {
            setSettings(await savePlaySettings({ breakUntil: null }));
            await syncAllDrawNotifications();
          }),
        },
      ],
    );
  };

  const answerSelfCheck = async (index: 0 | 1, value: boolean) => {
    const next: [boolean | null, boolean | null] = index === 0 ? [value, answers[1]] : [answers[0], value];
    setAnswers(next);
    if (next[0] !== null && next[1] !== null) {
      setSettings(
        await savePlaySettings({ lastSelfCheck: { date: today, flagged: isSelfCheckFlagged([next[0], next[1]]) } }),
      );
    }
  };

  const confirmDeleteEntry = (entry: PlayEntry) => {
    Alert.alert(isMl ? "ഈ എൻട്രി നീക്കം ചെയ്യണോ?" : "Delete this entry?", `${entry.lotteryName} · ${rupees(entry.amount)}`, [
      { text: isMl ? "റദ്ദാക്കുക" : "Cancel", style: "cancel" },
      {
        text: isMl ? "നീക്കം ചെയ്യുക" : "Delete",
        style: "destructive",
        onPress: safely(async () => {
          await deletePlayEntry(entry.id);
          await reload();
        }),
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      isMl ? "എല്ലാ വിവരങ്ങളും മായ്ക്കണോ?" : "Delete all Play Smart data?",
      isMl ? "ചെലവ് രേഖകൾ, പരിധി, ഇടവേള എന്നിവ ഈ ഫോണിൽ നിന്ന് മായ്ക്കും." : "Your spending log, limit and break are removed from this phone. This can't be undone.",
      [
        { text: isMl ? "റദ്ദാക്കുക" : "Cancel", style: "cancel" },
        {
          text: isMl ? "എല്ലാം മായ്ക്കുക" : "Delete all",
          style: "destructive",
          onPress: safely(async () => {
            await clearPlaySmartData();
            setAnswers([null, null]);
            await reload();
            await syncAllDrawNotifications();
          }),
        },
      ],
    );
  };

  const shareSummary = async () => {
    triggerLightHaptic();
    await universalShare({
      title: isMl ? "എന്റെ ലോട്ടറി ചെലവ്" : "My lottery spending",
      message: buildSummaryText(entries, currentMonth, rupees),
    });
  };

  const callHelpline = () => {
    Linking.openURL(`tel:${HELPLINE_NUMBER}`).catch((err: unknown) => {
      console.warn("[play-smart] Dialer unavailable:", err instanceof Error ? err.message : String(err));
      Alert.alert("Tele-MANAS", HELPLINE_NUMBER);
    });
  };

  const selfCheckDone = answers[0] !== null && answers[1] !== null;
  const selfCheckFlagged = selfCheckDone && isSelfCheckFlagged([Boolean(answers[0]), Boolean(answers[1])]);

  // ------------------------------------------------------------------ render
  return (
    <SafeScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScreenHeader
        title={isMl ? "പ്ലേ സ്മാർട്ട്" : "Play Smart"}
        subtitle={isMl ? "ചെലവ്, പരിധി, ഇടവേള" : "Your spending, limits & breaks"}
        onBack={() => navigation.goBack()}
        right={
          entries.length > 0 ? (
            <TouchableOpacity onPress={shareSummary} style={styles.headerBtn} accessibilityLabel={isMl ? "സംഗ്രഹം പങ്കിടുക" : "Share summary"}>
              <Share2 size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {onBreak ? (
          <View style={styles.breakBanner}>
            <CalendarOff size={20} color="#1D4ED8" />
            <View style={styles.flex}>
              <Text style={styles.breakTitle}>
                {isMl ? `${formatSafeDateDisplay(settings.breakUntil)} വരെ ഇടവേളയിലാണ്` : `On a break until ${formatSafeDateDisplay(settings.breakUntil)}`}
              </Text>
              <Text style={styles.breakText}>
                {isMl ? "നറുക്കെടുപ്പ് ഓർമ്മപ്പെടുത്തലുകൾ നിർത്തിവെച്ചിരിക്കുന്നു." : "Pre-draw reminders are paused. Well done for taking time out."}
              </Text>
              <TouchableOpacity onPress={endBreak} accessibilityRole="button">
                <Text style={styles.linkText}>{isMl ? "ഇടവേള അവസാനിപ്പിക്കുക" : "End break early"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* This month */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isMl ? `ഈ മാസം · ${monthLabel(currentMonth)}` : `This month · ${monthLabel(currentMonth)}`}</Text>
          <View style={styles.statRow}>
            <Stat label={isMl ? "ചെലവ്" : "Spent"} value={rupees(month.spent)} color="#DC2626" />
            <Stat label={isMl ? "ലഭിച്ചത്" : "Won"} value={rupees(month.won)} color="#16A34A" />
            <Stat
              label={isMl ? "ബാക്കി" : "Net"}
              value={`${month.net >= 0 ? "+" : "−"}${rupees(month.net)}`}
              color={month.net >= 0 ? "#16A34A" : "#DC2626"}
            />
          </View>
          <Text style={styles.muted}>
            {isMl
              ? `${month.tickets} ടിക്കറ്റുകൾ · ${month.playDays} ദിവസം`
              : `${month.tickets} tickets on ${month.playDays} ${month.playDays === 1 ? "day" : "days"}`}
          </Text>

          {limit.state !== "none" ? (
            <View style={styles.limitBox}>
              <View style={styles.limitHeader}>
                <Text style={styles.limitLabel}>
                  {isMl ? `പരിധി ${rupees(settings.monthlyLimit ?? 0)}` : `Limit ${rupees(settings.monthlyLimit ?? 0)}`}
                </Text>
                <Text style={[styles.limitPercent, { color: limitColor }]}>{limit.percent}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, limit.percent)}%`, backgroundColor: limitColor }]} />
              </View>
              <Text style={[styles.limitNote, { color: limitColor }]}>
                {limit.state === "reached"
                  ? isMl
                    ? "ഈ മാസത്തെ പരിധി എത്തി. അടുത്ത മാസം വരെ നിർത്തുന്നത് പരിഗണിക്കൂ."
                    : "You've reached your limit for this month. Consider stopping until next month."
                  : limit.state === "near"
                    ? isMl
                      ? `പരിധിയോട് അടുക്കുന്നു: ${rupees(limit.remaining)} മാത്രം ബാക്കി.`
                      : `Close to your limit: ${rupees(limit.remaining)} left.`
                    : isMl
                      ? `${rupees(limit.remaining)} ബാക്കി.`
                      : `${rupees(limit.remaining)} left this month.`}
              </Text>
            </View>
          ) : null}

          {projection && projection > month.spent ? (
            <View style={styles.paceRow}>
              <TrendingDown size={16} color={COLORS.textMuted} />
              <Text style={styles.muted}>
                {isMl
                  ? `ഈ വേഗതയിൽ ഈ മാസം ഏകദേശം ${rupees(projection)} ചെലവാകും.`
                  : `At this pace you'll spend about ${rupees(projection)} this month.`}
                {settings.monthlyLimit && projection > settings.monthlyLimit
                  ? isMl
                    ? " ഇത് നിങ്ങളുടെ പരിധിയേക്കാൾ കൂടുതലാണ്."
                    : " That's above your limit."
                  : ""}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.spendBtn]} onPress={() => setModalKind("spend")} accessibilityRole="button">
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>{isMl ? "ടിക്കറ്റ് ചേർക്കുക" : "Log tickets"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.winBtn]} onPress={() => setModalKind("win")} accessibilityRole="button">
              <Trophy size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>{isMl ? "സമ്മാനം ചേർക്കുക" : "Log a win"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Six-month trend */}
        {entries.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isMl ? "കഴിഞ്ഞ 6 മാസം" : "Last 6 months"}</Text>
            <View style={styles.chart}>
              {trend.map((t) => (
                <View key={t.month} style={styles.chartCol} accessible accessibilityLabel={`${monthLabel(t.month)}: spent ${rupees(t.spent)}, won ${rupees(t.won)}`}>
                  <View style={styles.chartBars}>
                    <View style={[styles.chartBar, { height: `${(t.spent / trendMax) * 100}%`, backgroundColor: "#F87171" }]} />
                    <View style={[styles.chartBar, { height: `${(t.won / trendMax) * 100}%`, backgroundColor: "#4ADE80" }]} />
                  </View>
                  <Text style={styles.chartLabel}>{MONTHS_SHORT[Number(t.month.slice(5, 7)) - 1]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: "#F87171" }]} />
              <Text style={styles.muted}>{isMl ? "ചെലവ്" : "Spent"}</Text>
              <View style={[styles.legendDot, { backgroundColor: "#4ADE80", marginLeft: 12 }]} />
              <Text style={styles.muted}>{isMl ? "ലഭിച്ചത്" : "Won"}</Text>
            </View>
            {allTime.returnPercent !== null ? (
              <Text style={styles.reality}>
                {isMl
                  ? `ആകെ: ${rupees(allTime.spent)} ചെലവാക്കി, ${rupees(allTime.won)} തിരികെ ലഭിച്ചു. ഓരോ ₹100-നും ₹${allTime.returnPercent} തിരികെ.`
                  : `All time: spent ${rupees(allTime.spent)}, got back ${rupees(allTime.won)}. Every ₹100 spent returned ₹${allTime.returnPercent}.`}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* By lottery */}
        {month.byLottery.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isMl ? "ലോട്ടറി തിരിച്ച് (ഈ മാസം)" : "By lottery (this month)"}</Text>
            {month.byLottery.map((l) => (
              <View key={l.lotteryName} style={styles.listRow}>
                <Text style={styles.listName}>{l.lotteryName}</Text>
                <Text style={styles.listMeta}>
                  {l.tickets ? `${l.tickets} × ` : ""}
                  <Text style={{ color: "#DC2626" }}>−{rupees(l.spent)}</Text>
                  {l.won ? <Text style={{ color: "#16A34A" }}>{`  +${rupees(l.won)}`}</Text> : null}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Recent entries */}
        {recent.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isMl ? "സമീപകാല എൻട്രികൾ" : "Recent entries"}</Text>
            {recent.map((e) => (
              <View key={e.id} style={styles.listRow}>
                <View style={styles.flex}>
                  <Text style={styles.listName}>{e.lotteryName}</Text>
                  <Text style={styles.listSub}>
                    {formatSafeDateDisplay(e.date)}
                    {e.kind === "spend" && e.tickets ? ` · ${e.tickets} × ₹${e.pricePerTicket ?? 0}` : ""}
                  </Text>
                </View>
                <Text style={[styles.entryAmount, { color: e.kind === "spend" ? "#DC2626" : "#16A34A" }]}>
                  {e.kind === "spend" ? "−" : "+"}
                  {rupees(e.amount)}
                </Text>
                <TouchableOpacity onPress={() => confirmDeleteEntry(e)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={isMl ? "നീക്കം ചെയ്യുക" : "Delete entry"}>
                  <Trash2 size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.card, styles.emptyCard]}>
            <PiggyBank size={32} color={COLORS.gold} />
            <Text style={styles.emptyText}>
              {isMl
                ? "വാങ്ങുന്ന ടിക്കറ്റുകൾ ചേർത്ത് ഓരോ മാസവും എത്ര ചെലവാക്കുന്നു എന്ന് കാണൂ. എല്ലാം ഈ ഫോണിൽ മാത്രം."
                : "Log the tickets you buy to see what you really spend each month. Everything stays on this phone."}
            </Text>
          </View>
        )}

        {/* Monthly limit */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <ShieldCheck size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{isMl ? "പ്രതിമാസ ചെലവ് പരിധി" : "Monthly spending limit"}</Text>
          </View>
          <Text style={styles.muted}>
            {isMl ? "പരിധിയോട് അടുക്കുമ്പോഴും കടക്കുമ്പോഴും ഓർമ്മിപ്പിക്കും." : "We'll remind you as you get close to it, and before you go over."}
          </Text>
          <View style={styles.limitInputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.limitInput}
              value={limitText}
              onChangeText={(t) => setLimitText(t.replace(/[^\d]/g, "").slice(0, 8))}
              keyboardType="number-pad"
              placeholder={isMl ? "ഉദാ. 500" : "e.g. 500"}
              placeholderTextColor={COLORS.textLight}
              accessibilityLabel={isMl ? "പ്രതിമാസ പരിധി" : "Monthly limit in rupees"}
            />
            <TouchableOpacity style={styles.smallBtn} onPress={saveLimit} accessibilityRole="button">
              <Text style={styles.smallBtnText}>{isMl ? "സേവ്" : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Take a break */}
        {!onBreak ? (
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <CalendarOff size={18} color="#1D4ED8" />
              <Text style={styles.cardTitle}>{isMl ? "ഒരു ഇടവേള എടുക്കുക" : "Take a break"}</Text>
            </View>
            <Text style={styles.muted}>
              {isMl ? "നറുക്കെടുപ്പിന് മുമ്പുള്ള ഓർമ്മപ്പെടുത്തലുകൾ താൽക്കാലികമായി നിർത്തുക." : "Pause the \"draw starts soon\" reminders for a while."}
            </Text>
            <View style={styles.chipRow}>
              {BREAK_OPTIONS_DAYS.map((days) => (
                <TouchableOpacity key={days} style={styles.breakChip} onPress={() => startBreak(days)} accessibilityRole="button">
                  <Text style={styles.breakChipText}>{isMl ? `${days} ദിവസം` : `${days} days`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Self-check */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <HeartHandshake size={18} color="#9333EA" />
            <Text style={styles.cardTitle}>{isMl ? "സ്വയം പരിശോധന (2 ചോദ്യങ്ങൾ)" : "Quick self-check (2 questions)"}</Text>
          </View>
          {SELF_CHECK_QUESTIONS[isMl ? "ml" : "en"].map((question, index) => (
            <View key={question} style={styles.question}>
              <Text style={styles.questionText}>{question}</Text>
              <View style={styles.chipRow}>
                {[true, false].map((value) => {
                  const active = answers[index] === value;
                  return (
                    <TouchableOpacity
                      key={String(value)}
                      style={[styles.answerChip, active && styles.answerChipActive]}
                      onPress={() => void answerSelfCheck(index as 0 | 1, value)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.answerText, active && styles.answerTextActive]}>
                        {value ? (isMl ? "ഉണ്ട്" : "Yes") : isMl ? "ഇല്ല" : "No"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          {selfCheckDone ? (
            <View style={[styles.resultBox, selfCheckFlagged ? styles.resultFlagged : styles.resultOk]}>
              <Text style={styles.resultText}>
                {selfCheckFlagged
                  ? isMl
                    ? "ലോട്ടറി നിങ്ങളെ ബുദ്ധിമുട്ടിക്കുന്നുണ്ടാകാം. വിശ്വസിക്കുന്ന ഒരാളോട് സംസാരിക്കൂ, അല്ലെങ്കിൽ സൗജന്യ Tele-MANAS ഹെൽപ്പ്‌ലൈനിൽ വിളിക്കൂ (24×7, മലയാളം)."
                    : "Lottery may be causing you stress. Consider talking to someone you trust, or call the free Tele-MANAS helpline (24×7, Malayalam available)."
                  : isMl
                    ? "നന്നായി! ഇടയ്ക്കിടെ ഈ പരിശോധന വീണ്ടും ചെയ്യുക."
                    : "Good. It's worth checking in with yourself from time to time."}
              </Text>
              {selfCheckFlagged ? (
                <TouchableOpacity style={styles.callBtn} onPress={callHelpline} accessibilityRole="button">
                  <PhoneCall size={16} color="#FFFFFF" />
                  <Text style={styles.callText}>Tele-MANAS {HELPLINE_NUMBER}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          <Text style={styles.footnote}>
            {isMl ? "ഇതൊരു രോഗനിർണയമല്ല. ഉത്തരങ്ങൾ ഈ ഫോണിൽ മാത്രം." : "Not a diagnosis. Answers stay on this phone."}
          </Text>
        </View>

        <TouchableOpacity onPress={confirmDeleteAll} style={styles.deleteAll} accessibilityRole="button">
          <Trash2 size={14} color="#DC2626" />
          <Text style={styles.deleteAllText}>{isMl ? "എല്ലാ വിവരങ്ങളും മായ്ക്കുക" : "Delete all Play Smart data"}</Text>
        </TouchableOpacity>
        <Text style={styles.footnote}>
          {isMl
            ? "ലോട്ടറി വിനോദത്തിനായി മാത്രം കളിക്കുക. നഷ്ടപ്പെടുത്താൻ കഴിയുന്ന തുക മാത്രം ചെലവാക്കുക."
            : "Play for fun, and only spend what you can afford to lose."}
        </Text>
      </ScrollView>

      <AddPlayEntryModal
        visible={modalKind !== null}
        kind={modalKind ?? "spend"}
        entries={entries}
        settings={settings}
        monthSpent={month.spent}
        isMl={isMl}
        initialAmount={modalKind === "win" ? logWin?.amount : undefined}
        initialLotteryName={modalKind === "win" ? logWinLotteryName : undefined}
        onClose={() => {
          setModalKind(null);
          if (logWin) navigation.setParams({ logWin: undefined });
        }}
        onSaved={() => void reload()}
      />
    </SafeScreenContainer>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  flex: { flex: 1 },
  headerBtn: { padding: 9, borderRadius: 10, backgroundColor: COLORS.primaryLight },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  muted: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, flexShrink: 1 },
  statRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, backgroundColor: COLORS.background, borderRadius: 12, padding: 10 },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  statValue: { fontSize: 18, fontWeight: "900", marginTop: 2 },
  limitBox: { marginTop: 4, gap: 6 },
  limitHeader: { flexDirection: "row", justifyContent: "space-between" },
  limitLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  limitPercent: { fontSize: 13, fontWeight: "900" },
  limitNote: { fontSize: 13, fontWeight: "700" },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: "#F1F5F9", overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  paceRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  actionBtn: { flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  spendBtn: { backgroundColor: COLORS.primary },
  winBtn: { backgroundColor: "#16A34A" },
  actionText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  breakBanner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  breakTitle: { fontSize: 15, fontWeight: "800", color: "#1E3A8A" },
  breakText: { fontSize: 13, color: "#1E40AF", marginTop: 2 },
  linkText: { fontSize: 13, fontWeight: "800", color: COLORS.primary, marginTop: 6 },
  chart: { flexDirection: "row", height: 120, alignItems: "flex-end", gap: 6, marginTop: 4 },
  chartCol: { flex: 1, alignItems: "center", height: "100%" },
  chartBars: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 2, width: "100%", justifyContent: "center" },
  chartBar: { width: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 1 },
  chartLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  reality: { fontSize: 13, color: COLORS.textDark, fontWeight: "700", lineHeight: 19, marginTop: 4 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  listName: { fontSize: 14, fontWeight: "700", color: COLORS.textDark, flexShrink: 1 },
  listMeta: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, marginLeft: "auto" },
  listSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  entryAmount: { fontSize: 14, fontWeight: "800" },
  emptyCard: { alignItems: "center" },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
  limitInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  rupee: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  limitInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  smallBtnText: { color: "#FFFFFF", fontWeight: "800" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  breakChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: "#DBEAFE" },
  breakChipText: { color: "#1E3A8A", fontWeight: "800" },
  question: { gap: 6, marginTop: 4 },
  questionText: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  answerChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border },
  answerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  answerText: { fontWeight: "700", color: COLORS.textDark },
  answerTextActive: { color: "#FFFFFF" },
  resultBox: { padding: 12, borderRadius: 12, gap: 10 },
  resultFlagged: { backgroundColor: "#FEF3C7" },
  resultOk: { backgroundColor: "#DCFCE7" },
  resultText: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  callBtn: { flexDirection: "row", gap: 8, alignItems: "center", alignSelf: "flex-start", backgroundColor: "#16A34A", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  callText: { color: "#FFFFFF", fontWeight: "800" },
  footnote: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", lineHeight: 17 },
  deleteAll: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  deleteAllText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
});
