import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";
import { api } from "../../src/api/client";
import { useTheme, Theme } from "../../src/ui/useTheme";
import { addToCalendar } from "../../src/calendar/calendarSync";

// --- Components ---

function Header({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerIconCircle}>
          <Ionicons name="receipt" size={28} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: Theme }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>
      {title}
    </Text>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  theme,
  multiline = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  theme: Theme;
  multiline?: boolean;
}) {
  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          height: multiline ? 100 : 56,
          alignItems: multiline ? "flex-start" : "center",
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={theme.colors.subtext}
        style={{ marginTop: multiline ? 12 : 0 }}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtext}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          {
            color: theme.colors.primaryText,
            height: "100%",
            paddingTop: multiline ? 12 : 0,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
      />
    </View>
  );
}

function RecurrenceChip({
  label,
  value,
  active,
  onPress,
  theme,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.colors.accent : theme.colors.card,
          borderColor: active ? theme.colors.accent : theme.colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: active ? theme.colors.navy : theme.colors.text,
            fontWeight: active ? "700" : "500",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// --- Helper Functions ---

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

// --- Main Component ---

export default function BillEdit() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const theme = useTheme();
  const { t } = useTranslation();

  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [offsetDays, setOffsetDays] = useState("0");
  const [reminderTime, setReminderTime] = useState("09:00:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const reminderDateObj = useMemo(() => {
    // Basic parsing to avoid timezone shifts on simple YYYY-MM-DD
    const [y, m, d] = dueDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [dueDate]);

  const [recurrence, setRecurrence] = useState<
    "none" | "weekly" | "bi-weekly" | "monthly" | "annually"
  >("none");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Time object for the TimePicker
  const timeObj = useMemo(() => {
    const d = new Date();
    const [h, m] = reminderTime.split(":").map(Number);
    d.setHours(h || 9, m || 0, 0, 0);
    return d;
  }, [reminderTime]);

  const amountCents = useMemo(
    () => Math.round(parseFloat(amount || "0") * 100),
    [amount]
  );

  // 1. Load Defaults (Create Mode)
  useEffect(() => {
    (async () => {
      if (id) return;
      try {
        const s = await api.familySettingsGet();
        setOffsetDays(String(s.default_reminder_offset_days ?? 0));
        if (s.default_reminder_time_local) {
          setReminderTime(s.default_reminder_time_local);
        }
      } catch {}
    })();
  }, [id]);

  // 2. Load Bill (Edit Mode)
  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await api.billsList();
        const bill = res.bills.find((b: any) => b.id === id);
        if (!bill) return;
        setCreditor(bill.creditor);
        setAmount((bill.amount_cents / 100).toFixed(2));
        setDueDate(bill.due_date);
        setRecurrence(bill.recurrence);
        setOffsetDays(String(bill.reminder_offset_days ?? 0));
        setNotes(bill.notes || "");
        if (bill.reminder_time_local) {
          setReminderTime(bill.reminder_time_local);
        }
      } catch {}
    })();
  }, [id]);

  const handleCalendarSync = async () => {
    if (!id) {
      Alert.alert(
        t("Save First"),
        t("Please save the bill before syncing to calendar.")
      );
      return;
    }
    const currentBill = {
      creditor,
      amount_cents: Number(amount) * 100,
      due_date: dueDate,
      notes: notes,
    };
    await addToCalendar(currentBill);
  };

  async function save() {
    try {
      if (!creditor.trim())
        return Alert.alert(t("Validation"), t("Creditor is required"));
      if (amountCents <= 0)
        return Alert.alert(t("Validation"), t("Amount must be > 0"));

      setLoading(true);
      const payload = {
        creditor: creditor.trim(),
        amount_cents: amountCents,
        due_date: dueDate,
        recurrence,
        reminder_offset_days: Number(offsetDays),
        reminder_time_local: reminderTime,
        notes: notes.trim(),
      };

      if (!id) await api.billsCreate(payload);
      else await api.billsUpdate(id, payload);

      router.back();
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      setDueDate(`${y}-${m}-${d}`);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (selectedDate) {
      const h = String(selectedDate.getHours()).padStart(2, "0");
      const m = String(selectedDate.getMinutes()).padStart(2, "0");
      setReminderTime(`${h}:${m}:00`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <Header
              title={id ? t("Edit Bill") : t("New Bill")}
              subtitle={id ? t("Update details") : t("Add a new debt to track")}
              theme={theme}
            />

            {/* Bill Details Section */}
            <View style={styles.section}>
              <SectionTitle title={t("Bill Details")} theme={theme} />
              <View style={{ gap: 12 }}>
                <InputField
                  icon="person-outline"
                  placeholder={t("Creditor")}
                  value={creditor}
                  onChangeText={setCreditor}
                  theme={theme}
                />
                <InputField
                  icon="cash-outline"
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  theme={theme}
                />
                
                {/* Date Picker Row */}
                <Pressable
                  // CHANGE: Use toggle (prev => !prev) instead of true
                  onPress={() => setShowDatePicker((prev) => !prev)}
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.subtext} />
                  <Text style={[styles.inputText, { color: theme.colors.primaryText }]}>
                    {reminderDateObj.toDateString()}
                  </Text>
                  {/* Visual indicator that it can be closed (optional chevron flip could be added here) */}
                  <Ionicons 
                    name={showDatePicker ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={theme.colors.subtext} 
                  />
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={reminderDateObj}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    textColor={theme.colors.primaryText}
                  />
                )}

                <InputField
                  icon="document-text-outline"
                  placeholder={t("Notes (Optional)")}
                  value={notes}
                  onChangeText={setNotes}
                  theme={theme}
                  multiline
                />
              </View>
            </View>

            {/* Recurrence Section */}
            <View style={styles.section}>
              <SectionTitle title={t("Frequency")} theme={theme} />
              <View style={styles.chipsContainer}>
                {[
                  "none",
                  "weekly",
                  "bi-weekly",
                  "monthly",
                  "annually",
                ].map((r) => (
                  <RecurrenceChip
                    key={r}
                    label={t(r.charAt(0).toUpperCase() + r.slice(1))}
                    value={r}
                    active={recurrence === r}
                    onPress={() => setRecurrence(r as any)}
                    theme={theme}
                  />
                ))}
              </View>
            </View>

            {/* Reminders Section */}
            <View style={styles.section}>
              <SectionTitle title={t("Reminders")} theme={theme} />
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ color: theme.colors.subtext, fontWeight: "600" }}>
                    {t("Remind me")}
                  </Text>
                  <Text style={{ color: theme.colors.accent, fontWeight: "700" }}>
                    {offsetDays === "0" ? t("Same day") : t("{{days}} day(s) before", { days: offsetDays })}
                  </Text>
                </View>
                
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={3}
                  step={1}
                  value={Number(offsetDays) || 0}
                  onValueChange={(val) => setOffsetDays(String(val))}
                  thumbTintColor={theme.colors.primary}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                />

                <View style={styles.divider} />

                <Pressable
                  // CHANGE: Use toggle for Time Picker as well for consistency
                  onPress={() => setShowTimePicker((prev) => !prev)}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: theme.colors.subtext, fontWeight: "600" }}>{t("Alert Time")}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: theme.colors.primaryText, fontWeight: "700", fontSize: 16 }}>
                      {timeObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </Text>
                    <Ionicons name="time-outline" size={18} color={theme.colors.subtext} />
                  </View>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={timeObj}
                    mode="time"
                    display="spinner"
                    onChange={onTimeChange}
                    textColor={theme.colors.primaryText}
                  />
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={{ gap: 12, marginTop: 10 }}>
              <Pressable
                onPress={save}
                disabled={loading}
                style={({ pressed }) => [
                  styles.saveButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: loading ? 0.6 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.primaryTextButton} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: theme.colors.primaryTextButton }]}>
                    {t("Save Bill")}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleCalendarSync}
                style={({ pressed }) => [
                  styles.calendarButton,
                  {
                    borderColor: theme.colors.primary,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>
                  {t("Add to Device Calendar")}
                </Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  // Header
  headerShadowContainer: {
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 4,
    borderRadius: 20,
  },
  headerGradient: {
    borderRadius: 20,
    height:120,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  // Sections
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  // Inputs
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  // Chips
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: "30%",
    flexGrow: 1,
    alignItems: "center",
  },
  chipText: {
    fontSize: 14,
  },
  // Card
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 12,
  },
  // Buttons
  saveButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  calendarButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});