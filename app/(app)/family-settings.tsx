import { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function FamilySettings() {
  const [offset, setOffset] = useState<number>(1);
  const [time, setTime] = useState<string>("09:00:00");
  const [editable, setEditable] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [reminderDateObj, setReminderDateObj] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0); // Default to 9:00 AM
    return d;
  });

  const OFFSETS = [
    { label: t("Same day"), value: 0 },
    { label: t("1 day before"), value: 1 },
    { label: t("2 days before"), value: 2 },
    { label: t("3 days before"), value: 3 },
  ];

  useEffect(() => {
    (async () => {
      try {
        const s = await api.familySettingsGet();
        setOffset(Number(s.default_reminder_offset_days ?? 1));
        setTime(String(s.default_reminder_time_local ?? "09:00:00"));
        setEditable(Boolean(s.editable));
      } catch (e: any) {
        Alert.alert(t("Error"), e.message);
      }
    })();
  }, []);

  function normalizeTime(t: string) {
    if (/^\d{2}:\d{2}$/.test(t)) return t + ":00";
    return t;
  }

  const onReminderDateChange = (event: any, selectedDate: any) => {
    // If the user cancels (Android), selectedDate is undefined.
    // The '||' operator ensures we keep the old value in that case.
    const currentDate = selectedDate || reminderDateObj;

    // Note: If you are on Android, you typically set the picker visibility to false here.
    //setShowReminderDatePicker(false);

    setReminderDateObj(currentDate);
  };

  async function save() {
    if (!editable)
      return Alert.alert(
        t("Not allowed"),
        t("Only a admin can change shared settings.")
      );

    try {
      setLoading(true);
      // CHANGE: Rename 't' to 'formattedTime' to avoid conflict
      const formattedTime = normalizeTime(time.trim());

      // Update references below to use 'formattedTime'
      if (!/^\d{2}:\d{2}:\d{2}$/.test(formattedTime)) {
        return Alert.alert(
          t("Validation"),
          t("Time must be HH:MM or HH:MM:SS")
        );
      }

      if (offset < 0 || offset > 3) {
        return Alert.alert(t("Validation"), t("Offset must be 0, 1, 2, or 3"));
      }

      await api.familySettingsUpdate({
        default_reminder_offset_days: offset,
        default_reminder_time_local: formattedTime,
      });

      Alert.alert(t("Saved"), t("Share defaults updated."));
      router.back();
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    borderRadius: 12,
    color: theme.colors.primaryText,
    backgroundColor: theme.colors.bg,
  };

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 12 }]}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: theme.colors.primaryText,
          }}
        >
          {t("Share Settings")}
        </Text>
        <Text style={{ color: theme.colors.subtext }}>
          {t("Shared reminder defaults for the whole group.")}
        </Text>

        <Text style={{ fontWeight: "800", color: theme.colors.primaryText }}>
          {t("Default offset")}
        </Text>
        <View style={[card(theme), { gap: 10 }]}>
          {OFFSETS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => editable && setOffset(o.value)}
              style={[
                button(theme, "primary"),
                {
                  opacity: editable ? 1 : 0.6,
                  backgroundColor:
                    offset === o.value
                      ? theme.colors.accent
                      : theme.colors.navy,
                },
              ]}
            >
              <Text style={buttonText(theme, "danger")}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ fontWeight: "800", color: theme.colors.primaryText }}>
          {t("Default time (local)")}
        </Text>
        <Pressable
          onPress={() => {
            setShowReminderDatePicker(true);
          }}
          style={inputStyle}
        >
          <Text style={{ color: theme.colors.primaryText }}>
            {reminderDateObj.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>
        {showReminderDatePicker && (
          <DateTimePicker
            value={reminderDateObj}
            mode="time" // Correct: Shows clock wheel/input
            display="default"
            onChange={onReminderDateChange}
          />
        )}
        {!editable && (
          <Text style={{ color: theme.colors.subtext }}>
            {t("Ask a family admin to change these.")}
          </Text>
        )}

        <Pressable
          disabled={!editable || loading}
          onPress={save}
          style={[
            button(theme, "primary"),
            { opacity: !editable || loading ? 0.5 : 1 },
          ]}
        >
          <Text style={buttonText(theme, "danger")}>{t("Save")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
