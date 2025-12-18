import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { api } from "../../src/api/client";
import { setToken } from "../../src/auth/session";
import { useTheme } from "../../src/ui/useTheme";

export default function Login() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // --- Status Bar Management ---
  useFocusEffect(
    useCallback(() => {
      // Force status bar to be white (light content) on this screen
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  async function handleAppleLogin() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    setLoading(true);
    const res = await api.authApple({
      identity_token: credential.identityToken,
      email: credential.email,
      name: credential.fullName?.givenName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
        : null,
    });
    await setToken(res.token);

    // FIXED: Logic to check for family status silently
    try {
      const fam = await api.familyMembers();
      
      // If the API returned the silent error object, the user is NOT in a family
      if (fam?.error_silent) {
        router.replace("/(app)/family");
      } else {
        // User has a family, proceed to onboarding
        router.replace("/onboarding");
      }
    } catch (e) {
      // Fallback: If familyMembers throws, assume they need to join/create a family
      router.replace("/(app)/family");
    }
  } catch (e: any) {
    if (e.code === "ERR_REQUEST_CANCELED") {
      // user cancelled
    } else {
      Alert.alert(t("Login failed"), e.message);
    }
  } finally {
    setLoading(false);
  }
}

 async function handleGoogleLogin() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    if (userInfo.data?.idToken) {
      setLoading(true);
      const res = await api.authGoogle({ id_token: userInfo.data?.idToken });
      await setToken(res.token);

      // FIXED: Logic to check for family status silently
      try {
        const fam = await api.familyMembers();
        
        if (fam?.error_silent) {
          router.replace("/(app)/family");
        } else {
          router.replace("/onboarding");
        }
      } catch (e) {
        router.replace("/(app)/family");
      }
    }
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled
    } else {
      Alert.alert(t("Login failed"), error.message);
    }
  } finally {
    setLoading(false);
  }
}

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo / Icon */}
          <View style={styles.iconContainer}>
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

          {/* Title */}
          <Text style={styles.title}>{t("Notification vibes.")}</Text>
          <Text style={styles.subtitle}>
            {t("Never miss a due date again.")}
          </Text>

          {/* Spacer */}
          <View style={{ height: 60 }} />

          {/* Buttons */}
          {loading ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <View style={styles.buttonGroup}>
              {Platform.OS === "ios" && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  }
                  cornerRadius={14}
                  style={styles.appleBtn}
                  onPress={handleAppleLogin}
                />
              )}

              <Pressable onPress={handleGoogleLogin} style={styles.googleBtn}>
                <Ionicons name="logo-google" size={20} color="#000" />
                <Text style={styles.googleText}>
                  {t("Continue with Google")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontWeight: "500",
  },
  buttonGroup: {
    width: "100%",
    gap: 16,
  },
  appleBtn: {
    width: "100%",
    height: 50,
  },
  googleBtn: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
