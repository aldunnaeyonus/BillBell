import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LinearGradient from "react-native-linear-gradient";
import { Theme } from "../../ui/useTheme";

export function Header({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
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

export function SectionTitle({ title, theme }: { title: string; theme: Theme }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>
      {title}
    </Text>
  );
}

export function InputField({ icon, placeholder, value, onChangeText, keyboardType = "default", theme, multiline = false }: { icon: keyof typeof Ionicons.glyphMap; placeholder: string; value: string; onChangeText: (t: string) => void; keyboardType?: any; theme: Theme; multiline?: boolean; }) {
  return (
    <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, height: multiline ? 100 : 56, alignItems: multiline ? "flex-start" : "center" }]}>
      <Ionicons name={icon} size={20} color={theme.colors.subtext} style={{ marginTop: multiline ? 12 : 0 }} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.subtext} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { color: theme.colors.primaryText, height: "100%", paddingTop: multiline ? 12 : 0, textAlignVertical: multiline ? "top" : "center" }]} />
    </View>
  );
}

export function RecurrenceChip({ label, value, active, onPress, theme }: { label: string; value: string; active: boolean; onPress: () => void; theme: Theme; }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: active ? theme.colors.accent : theme.colors.card, borderColor: active ? theme.colors.accent : theme.colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={[styles.chipText, { color: active ? theme.colors.navy : theme.colors.text, fontWeight: active ? "700" : "500" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerShadowContainer: { backgroundColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginVertical: 4, borderRadius: 20 },
  headerGradient: { borderRadius: 20, height: 120, paddingBottom: 24, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" },
  headerIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: "center", flexGrow: 1, minWidth: "30%" },
  chipText: { fontSize: 14 },
});