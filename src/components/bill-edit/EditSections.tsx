import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { Theme } from "../../ui/useTheme";
import { CreditorAutocomplete } from "../../ui/CreditorAutocomplete";
import { InputField, RecurrenceChip, SectionTitle } from "./EditFormUI";

// --- BILL DETAILS SECTION ---
interface DetailsProps {
  creditor: string; setCreditor: (v: string) => void;
  amount: string; onAmountChange: (v: string) => void;
  reminderDateObj: Date; onDateChange: (e: any, d?: Date) => void;
  showDatePicker: boolean; setShowDatePicker: (v: any) => void;
  notes: string; setNotes: (v: string) => void;
  theme: Theme; t: any;
}
export function BillDetailsSection({ creditor, setCreditor, amount, onAmountChange, reminderDateObj, onDateChange, showDatePicker, setShowDatePicker, notes, setNotes, theme, t }: DetailsProps) {
  return (
    <View style={styles.section}>
      <SectionTitle title={t("Bill Details")} theme={theme} />
      <View style={{ gap: 12 }}>
        <View style={{ zIndex: 2000 }}>
          <CreditorAutocomplete value={creditor} onChangeText={setCreditor} theme={theme} placeholder={t("Creditor (e.g. Netflix)")} />
        </View>
        <InputField icon="cash-outline" placeholder="0.00" value={amount} onChangeText={onAmountChange} keyboardType="decimal-pad" theme={theme} />

        <Pressable onPress={() => setShowDatePicker((prev: boolean) => !prev)} style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="calendar-outline" size={20} color={theme.colors.subtext} />
          <Text style={[styles.inputText, { color: theme.colors.primaryText }]}>{reminderDateObj.toDateString()}</Text>
          <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.subtext} />
        </Pressable>
        {showDatePicker && <DateTimePicker value={reminderDateObj} mode="date" display="spinner" onChange={onDateChange} textColor={theme.colors.primaryText} />}
        <InputField icon="document-text-outline" placeholder={t("Notes (Optional)")} value={notes} onChangeText={setNotes} theme={theme} multiline />
      </View>
    </View>
  );
}

// --- FREQUENCY SECTION ---
interface FrequencyProps {
  recurrence: string; setRecurrence: (v: any) => void;
  endDate: string | null; setEndDate: (v: string | null) => void;
  endDateObj: Date; onEndDateChange: (e: any, d?: Date) => void;
  showEndDatePicker: boolean; setShowEndDatePicker: (v: any) => void;
  reminderDateObj: Date; theme: Theme; t: any;
}
export function FrequencySection({ recurrence, setRecurrence, endDate, setEndDate, endDateObj, onEndDateChange, showEndDatePicker, setShowEndDatePicker, reminderDateObj, theme, t }: FrequencyProps) {
  return (
    <View style={styles.section}>
      <SectionTitle title={t("Frequency")} theme={theme} />
      <View style={styles.chipsContainer}>
        {["none", "weekly", "bi-weekly", "monthly", "semi-monthly", "quarterly", "semi-annually", "annually"].map((r) => (
          <RecurrenceChip key={r} label={t(r.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-"))} value={r} active={recurrence === r} onPress={() => setRecurrence(r as any)} theme={theme} />
        ))}
      </View>
      
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
             <Pressable onPress={() => setShowEndDatePicker((prev: boolean) => !prev)} style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
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
  );
}

// --- REMINDERS SECTION ---
interface RemindersProps {
  offsetDays: string; setOffsetDays: (v: string) => void;
  timeObj: Date; onTimeChange: (e: any, d?: Date) => void;
  showTimePicker: boolean; setShowTimePicker: (v: any) => void;
  theme: Theme; t: any;
}
export function RemindersSection({ offsetDays, setOffsetDays, timeObj, onTimeChange, showTimePicker, setShowTimePicker, theme, t }: RemindersProps) {
  return (
    <View style={styles.section}>
      <SectionTitle title={t("Reminders")} theme={theme} />
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: theme.colors.subtext, fontWeight: "600" }}>{t("Remind me")}</Text>
          <Text style={{ color: theme.colors.accent, fontWeight: "700" }}>{offsetDays === "0" ? t("Same day") : t("{{days}} day(s) before", { days: offsetDays })}</Text>
        </View>
        <Slider style={{ width: "100%", height: 40 }} minimumValue={0} maximumValue={3} step={1} value={Number(offsetDays) || 0} onValueChange={(val) => setOffsetDays(String(val))} thumbTintColor={theme.colors.primary} minimumTrackTintColor={theme.colors.primary} maximumTrackTintColor={theme.colors.border} />
        <View style={styles.divider} />
        <Pressable onPress={() => setShowTimePicker((prev: boolean) => !prev)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ color: theme.colors.subtext, fontWeight: "600" }}>{t("Alert Time")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: theme.colors.primaryText, fontWeight: "700", fontSize: 16 }}>{timeObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
            <Ionicons name="time-outline" size={18} color={theme.colors.subtext} />
          </View>
        </Pressable>
        {showTimePicker && <DateTimePicker value={timeObj} mode="time" display="spinner" onChange={onTimeChange} textColor={theme.colors.primaryText} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, height: 56, gap: 12 },
  inputText: { flex: 1, fontSize: 16, fontWeight: "500" },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, minHeight: 120 },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginVertical: 12 },
});