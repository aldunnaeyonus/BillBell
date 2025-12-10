import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { setToken } from "../../src/auth/session";
import { signInWithAppleTokens, useGoogleRequest } from "../../src/auth/providers";
import { getExpoPushTokenSafe } from "../../src/notifications/notifications";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = useGoogleRequest();
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        const idToken = (response.params as any)?.id_token;
        if (!idToken) return Alert.alert("Google sign-in error", "Missing id_token");
        await loginToBackend("google", { id_token: idToken });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function postLoginSetup() {
    const expoToken = await getExpoPushTokenSafe();
    if (expoToken) {
      await api.deviceTokenUpsert({ expo_push_token: expoToken, platform: Platform.OS });
    }

    try { await api.familyMembers(); router.replace("/(app)/bills"); }
    catch { router.replace("/(app)/family"); }
  }

  async function loginToBackend(provider: "apple" | "google", payload: any) {
    try {
      setLoading(true);
      const res = provider === "apple" ? await api.authApple(payload) : await api.authGoogle(payload);
      await setToken(res.token);
      await postLoginSetup();
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[screen(theme), { justifyContent: "center", gap: 12 }]}>
      <View style={[card(theme)]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.accent }} />
          <Text style={{ fontSize: 26, fontWeight: "800", color: theme.colors.text }}>Bill Tracker</Text>
        </View>
        <Text style={{ color: theme.colors.subtext }}>Wallet + bell vibes. Never miss a due date.</Text>

        <View style={{ height: 14 }} />

        <Pressable
          disabled={loading}
          onPress={async () => {
            try { const payload = await signInWithAppleTokens(); await loginToBackend("apple", payload); }
            catch (e: any) { Alert.alert("Apple sign-in", e?.message ?? "Cancelled"); }
          }}
          style={[button(theme, "primary"), { marginBottom: 10 }]}
        >
          <Text style={buttonText(theme, "primary")}>Continue with Apple</Text>
        </Pressable>

        <Pressable
          disabled={!request || loading}
          onPress={() => promptAsync()}
          style={[button(theme, "ghost")]}
        >
          <Text style={[buttonText(theme, "ghost")]}>Continue with Google</Text>
        </Pressable>
      </View>
    </View>
  );
}
