import { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { SyncQueue } from "../../src/sync/SyncQueue";
import { useBills } from "../../src/hooks/useBills"; 
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";

// --- NEW IMPORTS ---
import { todayISO, parseScannedDate } from "../../src/utils/billEditUtils";
import { Header, RecurrenceChip, SectionTitle } from "../../src/components/bill-edit/EditFormUI";
import { BillDetailsSection, FrequencySection, RemindersSection } from "../../src/components/bill-edit/EditSections";

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
  
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [recurrence, setRecurrence] = useState<"none" | "weekly" | "bi-weekly" | "monthly" | "annually" | "semi-annually" | "semi-monthly" | "quarterly">("none");
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "auto">("manual");

  // --- DERIVED STATE ---
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

  // --- HANDLERS ---
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

  // --- EFFECTS ---
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
          setNotes((prev) => prev ? prev + "\n\n" + t("Scanned Data") + ":\n" + params.scannedText : t("Scanned Data") + ":\n" + params.scannedText);
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
        setEndDate(bill.end_date || null);
        if (bill.reminder_time_local) setReminderTime(bill.reminder_time_local);
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
        end_date: recurrence !== "none" ? endDate : null,
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
            <View style={styles.content}>
              <Header title={id ? t("Edit Bill") : t("New Bill")} subtitle={id ? t("Update details") : t("Add a new debt to track")} theme={theme} />

              <BillDetailsSection 
                creditor={creditor} setCreditor={setCreditor}
                amount={amount} onAmountChange={onAmountChange}
                reminderDateObj={reminderDateObj} onDateChange={onDateChange}
                showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker}
                notes={notes} setNotes={setNotes}
                theme={theme} t={t}
              />
              
              <View style={styles.section}>
                <SectionTitle title={t("Payment Method")} theme={theme} />
                <View style={styles.chipsContainer}>
                  {["manual", "auto"].map((m) => (
                    <RecurrenceChip key={m} label={m === "auto" ? t("Auto Draft") : t("Manual")} value={m} active={paymentMethod === m} onPress={() => setPaymentMethod(m as any)} theme={theme} />
                  ))}
                </View>
              </View>

              <FrequencySection 
                recurrence={recurrence} setRecurrence={setRecurrence}
                endDate={endDate} setEndDate={setEndDate}
                endDateObj={endDateObj} onEndDateChange={onEndDateChange}
                showEndDatePicker={showEndDatePicker} setShowEndDatePicker={setShowEndDatePicker}
                reminderDateObj={reminderDateObj}
                theme={theme} t={t}
              />

              <RemindersSection 
                offsetDays={offsetDays} setOffsetDays={setOffsetDays}
                timeObj={timeObj} onTimeChange={onTimeChange}
                showTimePicker={showTimePicker} setShowTimePicker={setShowTimePicker}
                theme={theme} t={t}
              />

              <View style={{ gap: 12, marginTop: 10 }}>
                <Pressable onPress={save} disabled={loading} style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.colors.primary, opacity: loading ? 0.6 : pressed ? 0.8 : 1 }]}>
                  {loading ? <ActivityIndicator color={theme.colors.primaryTextButton} /> : <Text style={[styles.saveButtonText, { color: theme.colors.primaryTextButton }]}>{t("Save Bill")}</Text>}
                </Pressable>
              </View>
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
  section: { gap: 12 },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  saveButton: { height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { fontSize: 16, fontWeight: "800" },
});