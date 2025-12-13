import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Platform,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "../../src/api/client";
import { setToken } from "../../src/auth/session";
import {
  signInWithAppleTokens,
  configureGoogle,
  signInWithGoogleIdToken,
} from "../../src/auth/providers";
import { getExpoPushTokenSafe } from "../../src/notifications/notifications";
import { useTheme, Theme } from "../../src/ui/useTheme";

// --- Components ---

function SocialButton({
  icon,
  label,
  onPress,
  variant = "default",
  loading = false,
  theme,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: "apple" | "google" | "default";
  loading?: boolean;
  theme: Theme;
}) {
  const isApple = variant === "apple";
  const bg = isApple ? "#000" : "#FFF";
  const text = isApple ? "#FFF" : "#000";
  const border = isApple ? "#000" : "#E2E8F0";

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.socialBtn,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: pressed || loading ? 0.8 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <>
          <Ionicons
            name={icon as any}
            size={20}
            color={text}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.socialBtnText, { color: text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// --- Main Screen ---

export default function Login() {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    try {
      configureGoogle();
    } catch {}
  }, []);

  async function postLoginSetup() {
    const expoToken = await getExpoPushTokenSafe();
    if (expoToken) {
      await api.deviceTokenUpsert({
        expo_push_token: expoToken,
        platform: Platform.OS,
      });
    }

    try {
      await api.familyMembers();
      router.replace("/(app)/bills");
    } catch {
      router.replace("/(app)/family");
    }
  }

  async function loginToBackend(provider: "apple" | "google", payload: any) {
    try {
      setLoading(true);
      const res =
        provider === "apple"
          ? await api.authApple(payload)
          : await api.authGoogle(payload);
      await setToken(res.token);
      await postLoginSetup();
    } catch (e: any) {
      Alert.alert(t("Login failed"), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Branding Area (Now filled with Logo) */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image
          source={require("../../assets/black_logo.png")}
          style={{
            width: 200,
            height: 200,
            resizeMode: "contain",
            tintColor: "#71E3C3", // Tints the black logo to white
            opacity: 0.95,
          }}
        />
      </View>

      {/* Bottom Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.mode === "dark" ? "#1E293B" : "#FFF" },
        ]}
      >
        {/* Header Text */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={[styles.dot, { backgroundColor: theme.colors.accent }]}
            />
            <Text style={[styles.title, { color: theme.colors.primaryText }]}>
              {t("Notification vibes.")}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            {t("Never miss a due date again.")}
          </Text>
        </View>

        {/* Buttons */}
        <View style={{ gap: 12, width: "100%" }}>
          {Platform.OS === "ios" && (
            <SocialButton
              icon="logo-apple"
              label={t("Continue with Apple")}
              variant="apple"
              onPress={async () => {
                try {
                  const payload = await signInWithAppleTokens();
                  await loginToBackend("apple", payload);
                } catch (e: any) {
                  // Alert.alert(t("Apple sign-in"), e?.message ?? t("Cancelled"));
                }
              }}
              theme={theme}
              loading={loading}
            />
          )}

          <SocialButton
            icon="logo-google"
            label={t("Continue with Google")}
            variant="google"
            onPress={async () => {
              try {
                setLoading(true);
                const payload = await signInWithGoogleIdToken();
                await loginToBackend("google", payload);
              } catch (e: any) {
                // Alert.alert(t("Google sign-in"), e?.message ?? t("Cancelled"));
              } finally {
                setLoading(false);
              }
            }}
            theme={theme}
            loading={loading}
          />
        </View>

        <Text style={[styles.footerText, { color: theme.colors.subtext }]}>
          v1.0.0 (DueView)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: "500",
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  footerText: {
    marginTop: 32,
    fontSize: 12,
    opacity: 0.5,
  },
});
