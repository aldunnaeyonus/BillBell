import { useEffect, useState, useRef } from "react";
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
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";

// ... (Header and OffsetChip components remain unchanged from previous, included below for completeness) ...

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
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
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

export default function FamilySettings() {
  const [offset, setOffset] = useState<number>(1);
  const [time, setTime] = useState<string>("09:00:00");
  const [editable, setEditable] = useState<boolean>(false); // Server-side permission
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [isRotating, setIsRotating] = useState(false);
  const [familyInfo, setFamilyInfo] = useState<{ members: { id: number; role: string; }[]; current_user_id: number; } | null>(null);

  const theme = useTheme();
  const { t } = useTranslation();
  
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [reminderDateObj, setReminderDateObj] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });

  const OFFSETS = [
    { label: t("Same day"), value: 0 },
    { label: t("1 day before"), value: 1 },
    { label: t("2 days before"), value: 2 },
    { label: t("3 days before"), value: 3 },
  ];

  // Client-side admin check
  const currentUserRole = familyInfo?.members.find(
    m => m.id === familyInfo.current_user_id
  )?.role;
  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const [settings, members] = await Promise.all([
            api.familySettingsGet(),
            api.familyMembers()
        ]);

        if(isMounted.current) {
            setOffset(Number(settings.default_reminder_offset_days ?? 1));
            setTime(String(settings.default_reminder_time_local ?? "09:00:00"));
            setEditable(Boolean(settings.editable));
            setFamilyInfo(members);
            
            const [h, m] = String(settings.default_reminder_time_local ?? "09:00").split(":");
            const d = new Date();
            d.setHours(Number(h), Number(m), 0, 0);
            setReminderDateObj(d);
        }
      } catch (e: any) {
        if(isMounted.current) Alert.alert(t("Error"), e.message);
      } finally {
        if(isMounted.current) setDataLoaded(true);
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
    if (!editable) return;

    try {
      setLoading(true);
      const formattedTime = normalizeTime(time.trim());

      await api.familySettingsUpdate({
        default_reminder_offset_days: offset,
        default_reminder_time_local: formattedTime,
      });

      if(isMounted.current) {
          Alert.alert(t("Success"), t("Settings updated successfully."));
          router.back();
      }
    } catch (e: any) {
      if(isMounted.current) Alert.alert(t("Error"), e.message);
    } finally {
      if(isMounted.current) setLoading(false);
    }
  }

  const handleKeyRotation = async () => {
    if (!isAdmin || isRotating) return;
    
    Alert.alert(
      t("Rotate Encryption Key"),
      t("Use this ONLY if family members are having decryption issues. This will generate a new key and attempt to re-sync all devices."),
      [
        { text: t("Cancel"), style: 'cancel' },
        { 
          text: t("Rotate Key"), 
          style: 'destructive',
          onPress: async () => {
            setIsRotating(true);
            try {
              // This function (defined in client.ts) handles the heavy lifting
              await api.orchestrateKeyRotation();              
              
              if(isMounted.current) {
                  Alert.alert(
                      t("Success"), 
                      t("Key rotation complete. You will be redirected to the bills list to verify access."),
                      [{ text: "OK", onPress: () => router.replace("/(app)/bills") }]
                  );
              }
            } catch (e: any) {
              console.error("Key Rotation Failed:", e);
              if(isMounted.current) Alert.alert(t("Error"), e.message);
            } finally {
              if(isMounted.current) setIsRotating(false);
            }
          }
        },
      ]
    );
  };

  if (!dataLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg, justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      
      {/* Centered Content Wrapper */}
      <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
        <View style={styles.content}>
          
          <Header 
            title={t("Shared Settings")} 
            subtitle={t("Defaults for new bills")}
            theme={theme}
          />

          {!editable && (
            <View style={[styles.warningCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.subtext} />
              <Text style={[styles.warningText, { color: theme.colors.subtext }]}>
                {t("Only an admin can change these settings.")}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>{t("Default Reminder Offset")}</Text>
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

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>{t("Default Alert Time")}</Text>
            <Pressable
              disabled={!editable}
              onPress={() => setShowReminderDatePicker(prev => !prev)}
              style={({ pressed }) => [
                styles.timeRow,
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  opacity: !editable ? 0.5 : pressed ? 0.7 : 1
                }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
                <Text style={[styles.timeLabel, { color: theme.colors.primaryText }]}>
                  {t("Time")}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.timeValue, { color: theme.colors.accent }]}>
                  {reminderDateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </Text>
                {editable && (
                  <Ionicons name={showReminderDatePicker ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.subtext} />
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

          {isAdmin && (
              <View style={{ marginTop: 40, borderTopWidth: 1, borderColor: theme.colors.border, paddingBottom: 40 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.danger, marginTop: 20 }]}>
                  {t("Advanced Security")}
                </Text>
                
                <Pressable 
                  onPress={handleKeyRotation} 
                  disabled={isRotating}
                  style={({ pressed }) => [
                    styles.rotationButton, 
                    { 
                      backgroundColor: theme.colors.card, 
                      borderColor: theme.colors.danger,
                      opacity: pressed || isRotating ? 0.6 : 1
                    }
                  ]}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                      <Ionicons 
                      name="refresh-circle" 
                      size={24} 
                      color={theme.colors.danger} 
                      style={isRotating ? { transform: [{ rotate: "45deg" }] } : {}}
                      />
                      <Text style={[styles.rowText, { color: theme.colors.danger }]}>
                      {isRotating ? t("Rotating Keys...") : t("Rotate Family Encryption Key")}
                      </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.danger} />
                </Pressable>
                
                <Text style={[styles.helpText, { color: theme.colors.subtext }]}>
                    {t("Use this if a member cannot decrypt data. It will re-encrypt all bills with a new key and share it with all members.")}
                </Text>
              </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 24 },
  headerShadowContainer: { backgroundColor: 'transparent', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginVertical: 4, borderRadius: 20 },
  headerGradient: { borderRadius: 20, height:120, paddingBottom: 24, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" },
  headerIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginLeft:10 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFF", marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 18, width:'70%' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, minWidth: '45%', flex: 1, alignItems: 'center' },
  chipText: { fontSize: 14 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, borderWidth: 1 },
  timeLabel: { fontSize: 16, fontWeight: "600" },
  timeValue: { fontSize: 18, fontWeight: "700" },
  warningCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  warningText: { fontSize: 13, fontWeight: "500", flex: 1 },
  saveButton: { paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { fontSize: 16, fontWeight: "700" },
  rotationButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 10 },
  rowText: { fontSize: 15, fontWeight: '700' },
  helpText: { marginTop: 10, fontSize: 12, paddingHorizontal: 4, lineHeight: 18 },
});