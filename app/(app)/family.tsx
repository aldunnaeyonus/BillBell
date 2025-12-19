import { useState, useCallback, useEffect } from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added persistence
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

// --- New Component: Waiting View ---
function WaitingView({ 
  code, 
  onCheckStatus, 
  onCancel, 
  loading, 
  theme 
}: { 
  code: string; 
  onCheckStatus: () => void; 
  onCancel: () => void; 
  loading: boolean; 
  theme: Theme 
}) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 32 }}>
      
      {/* Icon */}
      <View style={[styles.iconBox, { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}>
         <Ionicons name="hourglass-outline" size={48} color={theme.colors.primary} />
      </View>
      
      {/* Text Info */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Text style={[styles.headerTitle, { color: theme.colors.primaryText, textAlign: 'center', fontSize: 24 }]}>
          Approval Pending
        </Text>
        <Text style={[styles.cardBody, { color: theme.colors.subtext, textAlign: 'center', fontSize: 16 }]}>
          You requested to join family <Text style={{ fontWeight: '700', color: theme.colors.primaryText }}>{code}</Text>.
        </Text>
        <Text style={[styles.cardBody, { color: theme.colors.subtext, textAlign: 'center', opacity: 0.8 }]}>
          Waiting for an admin to approve your request.
        </Text>
      </View>

      {/* Buttons */}
      <View style={{ width: '100%', gap: 16 }}>
        <Pressable
            onPress={onCheckStatus}
            disabled={loading}
            style={({ pressed }) => [
            styles.actionButton,
            {
                backgroundColor: theme.colors.primary,
                width: '100%',
                opacity: loading ? 0.6 : pressed ? 0.9 : 1,
            },
            ]}
        >
            {loading ? (
            <ActivityIndicator color={theme.colors.primaryTextButton} />
            ) : (
            <Text style={[styles.actionButtonText, { color: theme.colors.primaryTextButton }]}>
                Check Status
            </Text>
            )}
        </Pressable>

        <Pressable 
            onPress={onCancel} 
            disabled={loading} 
            style={({ pressed }) => [{ padding: 12, alignItems: 'center', opacity: pressed ? 0.6 : 1 }]}
        >
            <Text style={{ color: theme.colors.danger, fontWeight: '600', fontSize: 15 }}>Cancel Request</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --- Main Screen ---

export default function Family() {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const { code: urlCode } = useLocalSearchParams<{ code?: string }>();
  
  const [code, setCode] = useState(urlCode || ""); 
  const [pendingCode, setPendingCode] = useState<string | null>(null); // New State

  // 1. Load Pending State on Mount
  useEffect(() => {
    checkPendingState();
  }, []);

  async function checkPendingState() {
    try {
      const stored = await AsyncStorage.getItem("billbell_pending_family_code");
      if (stored) setPendingCode(stored);
    } catch (e) {
      console.log("Failed to load pending state", e);
    }
  }

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

  async function handleJoin(inputCode?: string) {
    // If inputCode is provided (from Check Status), use it. Otherwise use state (from Input).
    const codeToUse = inputCode || code;
    
    if (!codeToUse || !codeToUse.trim()) {
      Alert.alert(t("Validation"), t("Please enter an import code.")); 
      return;
    }

    try {
      setLoading(true);
      const res: any = await api.familyJoin(codeToUse.trim().toUpperCase());
      
      if (res.status === "pending") {
        // --- SAVE STATE ---
        const cleanCode = codeToUse.trim().toUpperCase();
        await AsyncStorage.setItem("billbell_pending_family_code", cleanCode);
        setPendingCode(cleanCode);
        
        // Only show alert if this was a manual join attempt
        if (!inputCode) { 
            Alert.alert(
              t("Request Sent"),
              t("Your request has been sent to the family admin for approval.")
            );
        } else {
             Alert.alert(t("Still Pending"), t("Your request has not been approved yet."));
        }
      } else {
        // --- SUCCESS ---
        await AsyncStorage.removeItem("billbell_pending_family_code");
        setPendingCode(null);
        router.replace("/onboarding");
      }
    } catch (e: any) {
      const msg = e.message || "";
      // If the API throws "User already in family" (409), that means we are approved!
      if (msg.toLowerCase().includes("user not in family") === false && (msg.includes("already in") || msg.includes("member"))) {
         await AsyncStorage.removeItem("billbell_pending_family_code");
         setPendingCode(null);
         router.replace("/(app)/bills");
      } else {
         Alert.alert(t("Error"), msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Cancel
  async function handleCancel() {
    Alert.alert(
        t("Cancel Request"),
        t("Are you sure you want to cancel your join request?"),
        [
            { text: t("No"), style: "cancel" },
            { 
                text: t("Yes"), 
                style: "destructive", 
                onPress: async () => {
                    await AsyncStorage.removeItem("billbell_pending_family_code");
                    setPendingCode(null);
                    setCode("");
                }
            }
        ]
    );
  }

  // --- RENDER ---
  
  // 1. Pending View
  if (pendingCode) {
     return (
       <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
         <WaitingView 
           code={pendingCode} 
           loading={loading}
           theme={theme}
           onCheckStatus={() => handleJoin(pendingCode)}
           onCancel={handleCancel}
         />
       </View>
     );
  }

  // 2. Standard View (Join/Create)
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
                  onPress={() => handleJoin()}
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