import React, { useCallback, useState, useRef, useEffect } from "react";
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
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from "../../src/api/client";
import { setToken } from "../../src/auth/session";
import { useTheme } from "../../src/ui/useTheme";

export default function Login() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // FIX: Track mounted state to prevent memory leaks during navigation
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- Status Bar Management ---
  useFocusEffect(
    useCallback(() => {
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
          : credential.email,
      });
      
      await setToken(res.token);
      // Short delay to ensure token persistence before network calls
      await new Promise(resolve => setTimeout(resolve, 100));

      await checkFamilyAndRedirect();

    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        // user cancelled
      } else {
        if(isMounted.current) Alert.alert(t("Login failed"), e.message);
      }
    } finally {
      if (isMounted.current) setLoading(false);
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
        await new Promise(resolve => setTimeout(resolve, 100));

        await checkFamilyAndRedirect();
      }
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        // user cancelled
      } else {
        if(isMounted.current) Alert.alert(t("Login failed"), e.message);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // Helper to centralize navigation logic and fix race conditions
  async function checkFamilyAndRedirect() {
    try {
      // NOTE: api.familyMembers() will redirect to /(app)/family automatically 
      // via client.ts if it returns a 409 error.
      const fam = await api.familyMembers();

      // FIX: If fam is undefined, it means client.ts already intercepted a 409 
      // and performed a redirect. We MUST stop here to prevent double-navigation.
      if (!fam) return;

      await AsyncStorage.setItem("isLog", "1");

      if (fam?.error_silent) {
        router.replace("/(app)/family");
      } else {
        // User is successfully in a family
        router.replace("/onboarding");
      }
    } catch (e) {
      // Fallback
      if (isMounted.current) router.replace("/(app)/family");
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
                tintColor: "#71E3C3",
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