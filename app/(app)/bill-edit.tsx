import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

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
  const [recurrence, setRecurrence] = useState<"none" | "monthly">("none");
  const [offsetDays, setOffsetDays] = useState("1");
  const [reminderTime, setReminderTime] = useState("09:00:00");

  const amountCents = useMemo(() => Math.round(parseFloat(amount || "0") * 100), [amount]);

  useEffect(() => {
    (async () => {
      if (id) return;
      try {
        const s = await api.familySettingsGet();
        setOffsetDays(String(s.default_reminder_offset_days ?? 1));
        setReminderTime(String(s.default_reminder_time_local ?? "09:00:00"));
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
      setOffsetDays(String(bill.reminder_offset_days ?? 1));
      setReminderTime(bill.reminder_time_local ?? "09:00:00");
    })().catch(() => {});
  }, [id]);

  async function save() {
    try {
      if (!creditor.trim()) return Alert.alert("Validation", "Creditor is required");
      if (amountCents <= 0) return Alert.alert("Validation", "Amount must be > 0");

      const payload = {
        creditor: creditor.trim(),
        amount_cents: amountCents,
        due_date: dueDate,
        recurrence,
        reminder_offset_days: Number(offsetDays),
        reminder_time_local: reminderTime,
      };

      if (!id) await api.billsCreate(payload);
      else await api.billsUpdate(id, payload);

      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  const inputStyle = {
    borderWidth: 1, borderColor: theme.colors.border,
    padding: 12, borderRadius: 12,
    color: theme.colors.text, backgroundColor: theme.colors.bg
  };

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 10 }]}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: theme.colors.text }}>
          {id ? "Edit bill" : "Add bill"}
        </Text>

        <Text style={{ color: theme.colors.subtext }}>Creditor</Text>
        <TextInput value={creditor} onChangeText={setCreditor} style={inputStyle} placeholderTextColor={theme.colors.subtext} />

        <Text style={{ color: theme.colors.subtext }}>Amount (USD)</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={inputStyle} placeholderTextColor={theme.colors.subtext} />

        <Text style={{ color: theme.colors.subtext }}>Due Date (YYYY-MM-DD)</Text>
        <TextInput value={dueDate} onChangeText={setDueDate} style={inputStyle} placeholderTextColor={theme.colors.subtext} />

        <Text style={{ color: theme.colors.subtext }}>Recurring</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => setRecurrence("none")} style={[button(theme, "ghost"), { flex: 1, opacity: recurrence==="none" ? 1 : 0.75 }]}>
            <Text style={buttonText(theme, "ghost")}>None</Text>
          </Pressable>
          <Pressable onPress={() => setRecurrence("monthly")} style={[button(theme, "ghost"), { flex: 1, opacity: recurrence==="monthly" ? 1 : 0.75 }]}>
            <Text style={buttonText(theme, "ghost")}>Monthly</Text>
          </Pressable>
        </View>

        <Text style={{ color: theme.colors.subtext }}>Reminder Offset Days (0..3)</Text>
        <TextInput value={offsetDays} onChangeText={setOffsetDays} keyboardType="number-pad" style={inputStyle} placeholderTextColor={theme.colors.subtext} />

        <Text style={{ color: theme.colors.subtext }}>Reminder Time Local (HH:MM:SS)</Text>
        <TextInput value={reminderTime} onChangeText={setReminderTime} style={inputStyle} placeholderTextColor={theme.colors.subtext} />

        <Pressable onPress={save} style={button(theme, "primary")}>
          <Text style={buttonText(theme, "primary")}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
