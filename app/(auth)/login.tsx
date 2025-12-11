import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, Platform, Image } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { setToken } from "../../src/auth/session";
import { signInWithAppleTokens } from "../../src/auth/providers";
import {
  configureGoogle,
  signInWithGoogleIdToken,
} from "../../src/auth/providers";

import { getExpoPushTokenSafe } from "../../src/notifications/notifications";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

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
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[screen(theme), { alignItems: "center", gap: 12 }]}>
      <Image
        source={require("../../assets/black_logo.png")}
        style={{ width: 200, height: 200, resizeMode: "contain" }}
      />
      <View style={[card(theme)]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: theme.colors.accent,
            }}
          />
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: theme.colors.text,
            }}
          >
            Bill Bell
          </Text>
        </View>
        <Text style={{ color: theme.colors.subtext }}>
          Wallet + bell vibes. Never miss a due date.
        </Text>

        <View style={{ height: 14 }} />

        <Pressable
          disabled={loading}
          onPress={async () => {
            try {
              const payload = await signInWithAppleTokens();
              await loginToBackend("apple", payload);
            } catch (e: any) {
              Alert.alert("Apple sign-in", e?.message ?? "Cancelled");
            }
          }}
          style={[button(theme, "primary"), { marginBottom: 10 }]}
        >
          <Text style={buttonText(theme, "primary")}>Continue with Apple</Text>
        </Pressable>

        <Pressable
          disabled={loading}
          onPress={async () => {
            try {
              setLoading(true);
              const payload = await signInWithGoogleIdToken(); // returns { id_token }
              await loginToBackend("google", payload);
            } catch (e: any) {
              Alert.alert("Google sign-in", e?.message ?? "Cancelled");
            } finally {
              setLoading(false);
            }
          }}
          style={[button(theme, "ghost")]}
        >
          <Text style={[buttonText(theme, "ghost")]}>Continue with Google</Text>
        </Pressable>
      </View>
    </View>
  );
}
