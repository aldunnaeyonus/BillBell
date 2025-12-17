import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { api } from "../../src/api/client";
import { useTheme, Theme } from "../../src/ui/useTheme";

// --- Components ---

function Header({
  title,
  subtitle,
  theme,
}: {
  title: string;
  subtitle: string;
  theme: Theme;
}) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerIconCircle}>
          <Ionicons name="people" size={32} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// --- Main Screen ---

export default function Family() {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const { code: urlCode } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(urlCode || ""); // Auto-fill if link was used
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("black");
        StatusBar.setTranslucent(true);
      }
      return () => {
        const defaultStyle =
          theme.mode === "dark" ? "light-content" : "dark-content";
        StatusBar.setBarStyle(defaultStyle);
      };
    }, [theme.mode])
  );

  async function handleCreate() {
    setLoading(true);
    try {
      const res: any = await api.familyCreate();
      console.log("familyCreate:", res);

      const code = res?.family_code;
      if (!code) throw new Error("family_code missing from server response");

      Alert.alert(t("Family created"), `${t("Family ID")}: ${code}`, [
        { text: "OK", onPress: () => router.push("/(app)/bills") },
      ]);
    } catch (e: any) {
      Alert.alert(t("Error"), e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) {
      Alert.alert(t("Validation"), t("Please enter an import code.")); // Reusing error msg key or create new
      return;
    }

    try {
      setLoading(true);
      await api.familyJoin(code.trim().toUpperCase());
      router.replace("/onboarding");
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <Header
              title={t("Family Setup")}
              subtitle={t("Sync bills with your family or housemates.")}
              theme={theme}
            />

            {/* Option 1: Join */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.subtext }]}
              >
                {t("Join a Group")}
              </Text>

              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}
                >
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor:
                          theme.mode === "dark" ? "#1E293B" : "#F1F5F9",
                      },
                    ]}
                  >
                    <Ionicons
                      name="enter-outline"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: theme.colors.primaryText },
                      ]}
                    >
                      {t("Have an ID?")}
                    </Text>
                    <Text
                      style={[styles.cardBody, { color: theme.colors.subtext }]}
                    >
                      {t(
                        "Enter the Family ID shared with you to join an existing group."
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.bg,
                    },
                  ]}
                >
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder={t("e.g. K7P3D9")}
                    placeholderTextColor={theme.colors.subtext}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={[styles.input, { color: theme.colors.primaryText }]}
                  />
                </View>

                <Pressable
                  onPress={handleJoin}
                  disabled={loading || !code.trim()}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity:
                        loading || !code.trim() ? 0.5 : pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.primaryTextButton} />
                  ) : (
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: theme.colors.primaryTextButton },
                      ]}
                    >
                      {t("Join Family")}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Divider with Text */}
            <View style={styles.orContainer}>
              <View
                style={[styles.line, { backgroundColor: theme.colors.border }]}
              />
              <Text style={{ color: theme.colors.subtext, fontWeight: "600" }}>
                {t("OR")}
              </Text>
              <View
                style={[styles.line, { backgroundColor: theme.colors.border }]}
              />
            </View>

            {/* Option 2: Create */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.subtext }]}
              >
                {t("Start Fresh")}
              </Text>

              <Pressable
                onPress={handleCreate}
                disabled={loading}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: theme.colors.accent + "20" },
                    ]}
                  >
                    <Ionicons
                      name="add-circle"
                      size={28}
                      color={theme.colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: theme.colors.primaryText },
                      ]}
                    >
                      {t("Create New Family")}
                    </Text>
                    <Text
                      style={[styles.cardBody, { color: theme.colors.subtext }]}
                    >
                      {t("Become an admin and invite others.")}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.subtext}
                  />
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    backgroundColor: "transparent",
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
    height: 120,
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
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  // Section
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  // Card
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Input
  inputContainer: {
    borderWidth: 1,
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    marginBottom: 16,
  },
  input: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 2,
  },
  // Button
  actionButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Divider
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
