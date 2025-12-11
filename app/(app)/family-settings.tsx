import { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

const OFFSETS = [
  { label: "Same day", value: 0 },
  { label: "1 day before", value: 1 },
  { label: "2 days before", value: 2 },
  { label: "3 days before", value: 3 },
];

export default function FamilySettings() {
  const [offset, setOffset] = useState<number>(1);
  const [time, setTime] = useState<string>("09:00:00");
  const [editable, setEditable] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const s = await api.familySettingsGet();
        setOffset(Number(s.default_reminder_offset_days ?? 1));
        setTime(String(s.default_reminder_time_local ?? "09:00:00"));
        setEditable(Boolean(s.editable));
      } catch (e: any) { Alert.alert("Error", e.message); }
    })();
  }, []);

  function normalizeTime(t: string) {
    if (/^\d{2}:\d{2}$/.test(t)) return t + ":00";
    return t;
  }

  async function save() {
    if (!editable) return Alert.alert("Not allowed", "Only a admin can change shared settings.");
    try {
      setLoading(true);
      const t = normalizeTime(time.trim());
      if (!/^\d{2}:\d{2}:\d{2}$/.test(t)) return Alert.alert("Validation", "Time must be HH:MM or HH:MM:SS");
      if (offset < 0 || offset > 3) return Alert.alert("Validation", "Offset must be 0..3");

      await api.familySettingsUpdate({ default_reminder_offset_days: offset, default_reminder_time_local: t });
      Alert.alert("Saved", "Share defaults updated.");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderWidth: 1, borderColor: theme.colors.border,
    padding: 12, borderRadius: 12,
    color: theme.colors.text, backgroundColor: theme.colors.bg,
    opacity: editable ? 1 : 0.6
  };

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 12 }]}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: theme.colors.text }}>Share Settings</Text>
        <Text style={{ color: theme.colors.subtext }}>Shared reminder defaults for the whole group.</Text>

        <Text style={{ fontWeight: "800", color: theme.colors.text }}>Default offset</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {OFFSETS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => editable && setOffset(o.value)}
              style={[
                button(theme, "ghost"),
                { opacity: editable ? 1 : 0.6, borderColor: offset === o.value ? theme.colors.accent : theme.colors.border }
              ]}
            >
              <Text style={buttonText(theme, "ghost")}>{o.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontWeight: "800", color: theme.colors.text }}>Default time (local)</Text>
        <TextInput editable={editable} value={time} onChangeText={setTime} style={inputStyle} placeholderTextColor={theme.colors.subtext} />

        {!editable && <Text style={{ color: theme.colors.subtext }}>Ask a family admin to change these.</Text>}

        <Pressable disabled={!editable || loading} onPress={save} style={[button(theme, "primary"), { opacity: (!editable || loading) ? 0.5 : 1 }]}>
          <Text style={buttonText(theme, "primary")}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
