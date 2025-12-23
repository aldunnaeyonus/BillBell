// app/(app)/bill-edit.tsx
import { useEffect, useMemo, useState, useRef } from "react";
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
import { CreditorAutocomplete } from "../../src/ui/CreditorAutocomplete";
import { SyncQueue } from "../../src/sync/SyncQueue";
import { useBills } from "../../src/hooks/useBills"; 

function Header({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient colors={[theme.colors.navy, "#1a2c4e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
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

function InputField({ icon, placeholder, value, onChangeText, keyboardType = "default", theme, multiline = false }: { icon: keyof typeof Ionicons.glyphMap; placeholder: string; value: string; onChangeText: (t: string) => void; keyboardType?: any; theme: Theme; multiline?: boolean; }) {
  return (
    <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, height: multiline ? 100 : 56, alignItems: multiline ? "flex-start" : "center" }]}>
      <Ionicons name={icon} size={20} color={theme.colors.subtext} style={{ marginTop: multiline ? 12 : 0 }} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.subtext} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { color: theme.colors.primaryText, height: "100%", paddingTop: multiline ? 12 : 0, textAlignVertical: multiline ? "top" : "center" }]} />
    </View>
  );
}

function RecurrenceChip({ label, value, active, onPress, theme }: { label: string; value: string; active: boolean; onPress: () => void; theme: Theme; }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: active ? theme.colors.accent : theme.colors.card, borderColor: active ? theme.colors.accent : theme.colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={[styles.chipText, { color: active ? theme.colors.navy : theme.colors.text, fontWeight: active ? "700" : "500" }]}>{label}</Text>
    </Pressable>
  );
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function parseScannedDate(dateStr: string): string | null {
  try {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const m = parts[0].padStart(2, "0");
      const d = parts[1].padStart(2, "0");
      let y = parts[2];
      if (y.length === 2) y = "20" + y; 
      return `${y}-${m}-${d}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function BillEdit() {
  const params = useLocalSearchParams<{ id?: string; scannedAmount?: string; scannedDate?: string; scannedText?: string; }>();
  const id = params.id ? Number(params.id) : null;
  const theme = useTheme();
  const { t } = useTranslation();
  const { refetch } = useBills();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [offsetDays, setOffsetDays] = useState("0");
  const [reminderTime, setReminderTime] = useState("09:00:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  // New State for End Date
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const reminderDateObj = useMemo(() => {
    try {
      const [y, m, d] = dueDate.split("-").map(Number);
      return new Date(y, m - 1, d);
    } catch { return new Date(); }
  }, [dueDate]);
  
  const endDateObj = useMemo(() => {
    if (!endDate) return new Date();
    try {
      const [y, m, d] = endDate.split("-").map(Number);
      return new Date(y, m - 1, d);
    } catch { return new Date(); }
  }, [endDate]);

  const [recurrence, setRecurrence] = useState<"none" | "weekly" | "bi-weekly" | "monthly" | "annually" | "semi-annually" | "semi-monthly" | "quarterly">("none");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "auto">("manual");

  const timeObj = useMemo(() => {
    try {
      const d = new Date();
      const [h, m] = reminderTime.split(":").map(Number);
      d.setHours(h || 9, m || 0, 0, 0);
      return d;
    } catch { return new Date(); }
  }, [reminderTime]);

  const amountCents = useMemo(() => {
    const normalized = amount.replace(/,/g, ".");
    const floatVal = parseFloat(normalized);
    if (isNaN(floatVal)) return 0;
    return Math.round(floatVal * 100);
  }, [amount]);

  useEffect(() => {
    (async () => {
      if (id) return;
      if (params.scannedAmount) {
        setAmount(params.scannedAmount);
        if (params.scannedDate) {
          const isoDate = parseScannedDate(params.scannedDate);
          if (isoDate) setDueDate(isoDate);
        }
        if (params.scannedText) {
          setNotes((prev) => prev ? prev + "\n\nScanned Data:\n" + params.scannedText : "Scanned Data:\n" + params.scannedText);
        }
        Alert.alert(t("Scan Successful"), t("We found an amount of ${{amt}}. Please verify the details.", { amt: params.scannedAmount }));
      }
      try {
        const s = await api.familySettingsGet();
        if (!isMounted.current) return;
        setOffsetDays(String(s.default_reminder_offset_days ?? 0));
        if (s.default_reminder_time_local) {
          setReminderTime(s.default_reminder_time_local);
        }
      } catch {}
    })();
  }, [id, params.scannedAmount, params.scannedDate, params.scannedText]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await api.billsList();
        if (!isMounted.current) return;

        const bill = res.bills.find((b: any) => b.id === id);
        if (!bill) return;
        setCreditor(bill.creditor);
        setAmount((bill.amount_cents / 100).toFixed(2));
        setDueDate(bill.due_date);
        setRecurrence(bill.recurrence);
        setPaymentMethod(bill.payment_method);
        setOffsetDays(String(bill.reminder_offset_days ?? 0));
        setNotes(bill.notes || "");
        setEndDate(bill.end_date || null); // Load end_date
        if (bill.reminder_time_local) {
          setReminderTime(bill.reminder_time_local);
        }
      } catch {}
    })();
  }, [id]);

  async function save() {
    try {
      if (!creditor.trim()) return Alert.alert(t("Validation"), t("Creditor is required"));
      if (!amountCents || amountCents <= 0) return Alert.alert(t("Validation"), t("Amount must be > 0"));

      setLoading(true);
      const payload = {
        creditor: creditor.trim(),
        amount_cents: amountCents,
        due_date: dueDate,
        recurrence,
        reminder_offset_days: Number(offsetDays),
        reminder_time_local: reminderTime,
        notes: notes.trim(),
        payment_method: paymentMethod,
        end_date: recurrence !== "none" ? endDate : null, // Include end_date
      };

      if (!id) await SyncQueue.enqueue(id ? "UPDATE" : "CREATE", { id, ...payload });
      else await api.billsUpdate(id, payload);
      
      refetch();
      if (isMounted.current) router.back();
    } catch (e: any) {
      if (isMounted.current) Alert.alert(t("Error"), e.message);
    } finally {
      if (isMounted.current) setLoading(false);
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
  
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowEndDatePicker(false);
    if (selectedDate) {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const d = String(selectedDate.getDate()).padStart(2, "0");
        setEndDate(`${y}-${m}-${d}`);
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

  const onAmountChange = (text: string) => {
    if (/^[0-9.,]*$/.test(text)) setAmount(text);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Header title={id ? t("Edit Bill") : t("New Bill")} subtitle={id ? t("Update details") : t("Add a new debt to track")} theme={theme} />

            <View style={styles.section}>
              <SectionTitle title={t("Bill Details")} theme={theme} />
              <View style={{ gap: 12 }}>
                <View style={{ zIndex: 2000 }}>
                  <CreditorAutocomplete value={creditor} onChangeText={setCreditor} theme={theme} placeholder={t("Creditor (e.g. Netflix)")} />
                </View>
                <InputField icon="cash-outline" placeholder="0.00" value={amount} onChangeText={onAmountChange} keyboardType="decimal-pad" theme={theme} />

                <Pressable onPress={() => setShowDatePicker((prev) => !prev)} style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.subtext} />
                  <Text style={[styles.inputText, { color: theme.colors.primaryText }]}>{reminderDateObj.toDateString()}</Text>
                  <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.subtext} />
                </Pressable>
                {showDatePicker && <DateTimePicker value={reminderDateObj} mode="date" display="spinner" onChange={onDateChange} textColor={theme.colors.primaryText} />}
                <InputField icon="document-text-outline" placeholder={t("Notes (Optional)")} value={notes} onChangeText={setNotes} theme={theme} multiline />
              </View>
            </View>
            
            <View style={styles.section}>
              <SectionTitle title={t("Payment Method")} theme={theme} />
              <View style={styles.chipsContainer}>
                {["manual", "auto"].map((m) => (
                  <RecurrenceChip key={m} label={m === "auto" ? t("Auto Draft") : t("Manual")} value={m} active={paymentMethod === m} onPress={() => setPaymentMethod(m as any)} theme={theme} />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionTitle title={t("Frequency")} theme={theme} />
              <View style={styles.chipsContainer}>
                {["none", "weekly", "bi-weekly", "monthly", "semi-monthly", "quarterly", "semi-annually", "annually"].map((r) => (
                  <RecurrenceChip key={r} label={t(r.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-"))} value={r} active={recurrence === r} onPress={() => setRecurrence(r as any)} theme={theme} />
                ))}
              </View>
              
              {/* --- END DATE PICKER --- */}
              {recurrence !== "none" && (
                <View style={{ marginTop: 12 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                         <Text style={{ color: theme.colors.subtext, fontWeight: '600', fontSize: 13, marginLeft: 4 }}>{t("End Date (Optional)")}</Text>
                         {endDate && (
                             <Pressable onPress={() => setEndDate(null)}>
                                 <Text style={{ color: theme.colors.danger, fontSize: 12, fontWeight: '700' }}>{t("Clear")}</Text>
                             </Pressable>
                         )}
                     </View>
                     <Pressable onPress={() => setShowEndDatePicker((prev) => !prev)} style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Ionicons name="calendar-clear-outline" size={20} color={theme.colors.subtext} />
                        <Text style={[styles.inputText, { color: endDate ? theme.colors.primaryText : theme.colors.subtext }]}>
                            {endDate ? endDateObj.toDateString() : t("No End Date (Indefinite)")}
                        </Text>
                        <Ionicons name={showEndDatePicker ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.subtext} />
                     </Pressable>
                     {showEndDatePicker && (
                        <DateTimePicker value={endDateObj} mode="date" display="spinner" onChange={onEndDateChange} textColor={theme.colors.primaryText} minimumDate={reminderDateObj} />
                     )}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle title={t("Reminders")} theme={theme} />
              <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ color: theme.colors.subtext, fontWeight: "600" }}>{t("Remind me")}</Text>
                  <Text style={{ color: theme.colors.accent, fontWeight: "700" }}>{offsetDays === "0" ? t("Same day") : t("{{days}} day(s) before", { days: offsetDays })}</Text>
                </View>
                <Slider style={{ width: "100%", height: 40 }} minimumValue={0} maximumValue={3} step={1} value={Number(offsetDays) || 0} onValueChange={(val) => setOffsetDays(String(val))} thumbTintColor={theme.colors.primary} minimumTrackTintColor={theme.colors.primary} maximumTrackTintColor={theme.colors.border} />
                <View style={styles.divider} />
                <Pressable onPress={() => setShowTimePicker((prev) => !prev)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
                  <Text style={{ color: theme.colors.subtext, fontWeight: "600" }}>{t("Alert Time")}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: theme.colors.primaryText, fontWeight: "700", fontSize: 16 }}>{timeObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
                    <Ionicons name="time-outline" size={18} color={theme.colors.subtext} />
                  </View>
                </Pressable>
                {showTimePicker && <DateTimePicker value={timeObj} mode="time" display="spinner" onChange={onTimeChange} textColor={theme.colors.primaryText} />}
              </View>
            </View>

            <View style={{ gap: 12, marginTop: 10 }}>
              <Pressable onPress={save} disabled={loading} style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.colors.primary, opacity: loading ? 0.6 : pressed ? 0.8 : 1 }]}>
                {loading ? <ActivityIndicator color={theme.colors.primaryTextButton} /> : <Text style={[styles.saveButtonText, { color: theme.colors.primaryTextButton }]}>{t("Save Bill")}</Text>}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 24 },
  headerShadowContainer: { backgroundColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginVertical: 4, borderRadius: 20 },
  headerGradient: { borderRadius: 20, height: 120, paddingBottom: 24, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" },
  headerIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  inputText: { flex: 1, fontSize: 16, fontWeight: "500" },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: "center", flexGrow: 1, minWidth: "30%" },
  chipText: { fontSize: 14 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, minHeight: 120 },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginVertical: 12 },
  saveButton: { height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { fontSize: 16, fontWeight: "800" },
  calendarButton: { flexDirection: "row", height: 50, borderRadius: 16, borderWidth: 1, justifyContent: "center", alignItems: "center", gap: 8 },
});