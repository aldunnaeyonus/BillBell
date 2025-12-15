import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { api } from "../../src/api/client";
import { useTheme, Theme } from "../../src/ui/useTheme";
import * as EncryptionService from '../../src/security/EncryptionService';
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
          <Ionicons name="options" size={24} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function OffsetChip({
  label,
  active,
  onPress,
  theme,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: Theme;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.colors.accent : theme.colors.card,
          borderColor: active ? theme.colors.accent : theme.colors.border,
          opacity: disabled ? 0.6 : pressed ? 0.8 : 1,
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

// --- Main Screen ---

export default function FamilySettings() {
  const [offset, setOffset] = useState<number>(1);
  const [time, setTime] = useState<string>("09:00:00");
  const [editable, setEditable] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [reminderDateObj, setReminderDateObj] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });

  const OFFSETS = [
    { label: t("Same day"), value: 0 },
    { label: t("1 day before"), value: 1 },
    { label: t("2 day before"), value: 2 },
    { label: t("3 day before"), value: 3 },
  ];

  useEffect(() => {
    (async () => {
      try {
        const s = await api.familySettingsGet();
        setOffset(Number(s.default_reminder_offset_days ?? 1));
        setTime(String(s.default_reminder_time_local ?? "09:00:00"));
        setEditable(Boolean(s.editable));
        
        // Parse time string to Date object for picker
        const [h, m] = String(s.default_reminder_time_local ?? "09:00").split(":");
        const d = new Date();
        d.setHours(Number(h), Number(m), 0, 0);
        setReminderDateObj(d);
        
      } catch (e: any) {
        Alert.alert(t("Error"), e.message);
      } finally {
        setDataLoaded(true);
      }
    })();
  }, [t]);

  function normalizeTime(tStr: string) {
    if (/^\d{2}:\d{2}$/.test(tStr)) return tStr + ":00";
    return tStr;
  }

  const onReminderDateChange = (event: any, selectedDate: any) => {
    if (Platform.OS === 'android') setShowReminderDatePicker(false);
    
    if (selectedDate) {
      setReminderDateObj(selectedDate);
      const h = String(selectedDate.getHours()).padStart(2, '0');
      const m = String(selectedDate.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}:00`);
    }
  };

  async function save() {
    if (!editable)
      return Alert.alert(
        t("Not allowed"),
        t("Only a admin can change shared settings.")
      );

    try {
      setLoading(true);
      const formattedTime = normalizeTime(time.trim());

      if (!/^\d{2}:\d{2}:\d{2}$/.test(formattedTime)) {
        return Alert.alert(t("Validation"), t("Time must be HH:MM or HH:MM:SS"));
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

  if (!dataLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg, justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        
        {/* Header */}
        <Header 
          title={t("Share Settings")} 
          subtitle={t("Shared reminder defaults for the whole group.")}
          theme={theme}
        />

        {/* Admin Warning */}
        {!editable && (
          <View style={[styles.warningCard, { backgroundColor: 'rgba(255, 179, 0, 0.1)', borderColor: 'rgba(255, 179, 0, 0.3)' }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.text} />
            <Text style={[styles.warningText, { color: theme.colors.text }]}>
              {t("Ask a family admin to change these.")}
            </Text>
          </View>
        )}

        {/* Offset Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>{t("Default offset")}</Text>
          <View style={styles.chipsContainer}>
            {OFFSETS.map((o) => (
              <OffsetChip
                key={o.value}
                label={o.label}
                active={offset === o.value}
                onPress={() => setOffset(o.value)}
                theme={theme}
                disabled={!editable}
              />
            ))}
          </View>
        </View>

        {/* Time Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>{t("Default time (local)")}</Text>
          <Pressable
            disabled={!editable}
            // CHANGED: Use toggle (prev => !prev) instead of true
            onPress={() => setShowReminderDatePicker((prev) => !prev)}
            style={({ pressed }) => [
              styles.timeRow,
              { 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: !editable ? 0.6 : pressed ? 0.7 : 1
              }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconBox, { backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F1F5F9' }]}>
                <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.timeLabel, { color: theme.colors.primaryText }]}>
                {t("Alert Time")}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.timeValue, { color: theme.colors.accent }]}>
                {reminderDateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </Text>
              {editable && (
                <Ionicons 
                  // OPTIONAL: Flip chevron if open
                  name={showReminderDatePicker ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={theme.colors.subtext} 
                />
              )}
            </View>
          </Pressable>

          {showReminderDatePicker && (
            <DateTimePicker
              value={reminderDateObj}
              mode="time"
              display="spinner"
              onChange={onReminderDateChange}
              textColor={theme.colors.primaryText}
            />
          )}
        </View>

        {/* Save Button */}
        {editable && (
          <Pressable
            disabled={loading}
            onPress={save}
            style={({ pressed }) => [
              styles.saveButton,
              { 
                backgroundColor: theme.colors.primary,
                opacity: pressed || loading ? 0.8 : 1,
                marginTop: 20
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.primaryTextButton} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.colors.primaryTextButton }]}>
                {t("Save Changes")}
              </Text>
            )}
          </Pressable>
        )}

      </View>
    </ScrollView>
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
    backgroundColor: 'transparent',
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
    marginLeft:10
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
    width:'70%'

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
    minWidth: '45%', // 2 per row roughly
    flex: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
  },
  // Time Row
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  // Warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  // Save Button
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});