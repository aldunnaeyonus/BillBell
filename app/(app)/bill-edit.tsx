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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default function BillEdit() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const theme = useTheme();
  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [dueDate, setDueDate] = useState(todayISO());
  const [offsetDays, setOffsetDays] = useState("0");
  const reminderDateObj = useMemo(() => {
    const d = new Date(dueDate);
    d.setDate(d.getDate() - parseInt(offsetDays || "0"));
    return d;
  }, [dueDate, offsetDays]);
  // Updated type definition
  const [recurrence, setRecurrence] = useState<
    "none" | "weekly" | "bi-weekly" | "monthly"
  >("none");

  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);

  const amountCents = useMemo(
    () => Math.round(parseFloat(amount || "0") * 100),
    [amount]
  );
  useEffect(() => {
    (async () => {
      if (id) return;
      try {
        const s = await api.familySettingsGet();
        setOffsetDays(String(s.default_reminder_offset_days ?? 0));
      } catch {}
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const res = await api.billsList();
      const bill = res.bills.find((b: any) => b.id === id);
      if (!bill) return;
      setCreditor(bill.creditor);
      setAmount((bill.amount_cents / 100).toFixed(2));
      setDueDate(bill.due_date);
      setRecurrence(bill.recurrence);
      setOffsetDays(String(bill.reminder_offset_days ?? 0));
    })().catch(() => {});
  }, [id]);

  async function save() {
    try {
      if (!creditor.trim())
        return Alert.alert("Validation", "Creditor is required");
      if (amountCents <= 0)
        return Alert.alert("Validation", "Amount must be > 0");

      const payload = {
        creditor: creditor.trim(),
        amount_cents: amountCents,
        due_date: dueDate,
        recurrence,
        reminder_offset_days: Number(offsetDays),
        reminder_time_local: "09:00:00",
      };

      if (!id) await api.billsCreate(payload);
      else await api.billsUpdate(id, payload);

      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    borderRadius: 12,
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
  };

  const inputSliderStyle = {
    width: "95%",
    color: theme.colors.text,
  };
  // Helper to render recurrence buttons cleanly
  const renderRecurrenceBtn = (
    value: "none" | "weekly" | "bi-weekly" | "monthly",
    label: string
  ) => (
    <Pressable
      onPress={() => setRecurrence(value)}
      style={[
        button(theme, "ghost"),
        {
          // roughly 48% width allows 2 buttons per row with a small gap
          width: "48%",
          opacity: recurrence === value ? 1 : 0.75,
          borderColor:
            recurrence === value ? theme.colors.accent : theme.colors.border,
        },
      ]}
    >
      <Text style={buttonText(theme, "ghost")}>{label}</Text>
    </Pressable>
  );

  const onReminderDateChange = (event: any, selectedDate?: Date) => {
    setShowReminderDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const due = new Date(dueDate);
      const diffTime = due.getTime() - selectedDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const validOffset = Math.max(0, Math.min(3, diffDays));
      setOffsetDays(String(validOffset));
      setShowReminderDatePicker(false);
    }
  };

  return (
    <View style={screen(theme)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={[card(theme), { gap: 10 }]}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: theme.colors.text,
              }}
            >
              {id ? "Edit Debts" : "Add Debts"}
            </Text>

            <Text style={{ color: theme.colors.subtext }}>Creditor</Text>
            <TextInput
              value={creditor}
              onChangeText={setCreditor}
              style={inputStyle}
              placeholderTextColor={theme.colors.subtext}
            />

            <Text style={{ color: theme.colors.subtext }}>Amount (USD)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={inputStyle}
              placeholderTextColor={theme.colors.subtext}
            />

            <Text style={{ color: theme.colors.subtext }}>
              Due Date ({reminderDateObj.toDateString()})
            </Text>
            <Pressable
              onPress={() => setShowReminderDatePicker(true)}
              style={inputStyle}
            >
              <Text style={{ color: theme.colors.text }}>
                {reminderDateObj.toDateString()}
              </Text>
            </Pressable>
            {showReminderDatePicker && (
              <DateTimePicker
                value={reminderDateObj}
                mode="date"
                display="default"
                maximumDate={new Date(dueDate)}
                onChange={onReminderDateChange}
              />
            )}
            <Text style={{ color: theme.colors.subtext }}>Recurring</Text>
            {/* Added flexWrap to handle 4 buttons gracefully */}
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {renderRecurrenceBtn("none", "None")}
              {renderRecurrenceBtn("weekly", "Weekly")}
              {renderRecurrenceBtn("bi-weekly", "Bi-Weekly")}
              {renderRecurrenceBtn("monthly", "Monthly")}
            </View>

            <Text style={{ color: theme.colors.subtext }}>
              Reminder Offset Days ({offsetDays})
            </Text>

            <Slider
              thumbTintColor={theme.colors.primary}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.subtext}
              // 2. Style only controls layout (width, height, margins)
              style={{
                width: "100%", // Valid: "100%" or a number (e.g., 300)
                height: 40,
              }}
              minimumValue={0} // Minimum days
              maximumValue={3} // Maximum days
              step={1} // Increment by whole days
              value={Number(offsetDays) || 0} // Ensure value is a Number
              onValueChange={(val) => setOffsetDays(String(val))}
            />
            <Pressable onPress={save} style={button(theme, "primary")}>
              <Text style={buttonText(theme, "primary")}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
