import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  AppState,
  Pressable,
  StatusBar,
  Platform,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSegments } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ui/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import Storage

export function BiometricAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false); // New State
  const [checkingConfig, setCheckingConfig] = useState(true); // Prevent flash

  const isAuthedRef = useRef(false);
  const isAuthenticatingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const theme = useTheme();
  const { t } = useTranslation();
  const segments = useSegments();
  const segmentsRef = useRef(segments);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    isMounted.current = true;
    checkConfiguration();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        // Only reset auth if biometrics are actually enabled
        if (!isAuthenticatingRef.current && isBiometricEnabled) {
          if (isMounted.current) setIsAuthenticated(false);
          isAuthedRef.current = false;
        }
      }

      if (nextAppState === "active") {
        // Only trigger auth if enabled
        if (isBiometricEnabled && !isAuthedRef.current && !isAuthenticatingRef.current) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            if (isMounted.current) authenticate();
          }, 500);
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isBiometricEnabled]); // Re-run if enablement changes

  async function checkConfiguration() {
    try {
      // 1. Check User Preference
      const enabled = await AsyncStorage.getItem("biometrics_enabled");
      const isEnabled = enabled === "true";
      
      if (isMounted.current) setIsBiometricEnabled(isEnabled);

      if (!isEnabled) {
        // If disabled by user, just let them in
        setIsAuthenticated(true);
        isAuthedRef.current = true;
        setCheckingConfig(false);
        return;
      }

      // 2. Check Hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If enabled but no hardware/enrollment, fallback to allowing (or force PIN if you had one)
        setIsAuthenticated(true);
        isAuthedRef.current = true;
      } else {
        // Enabled AND Hardware exists -> Authenticate
        authenticate();
      }
    } catch (e) {
      console.log("Config Check Error", e);
      setIsAuthenticated(true); // Fallback to open on error to prevent lockout
    } finally {
      if (isMounted.current) setCheckingConfig(false);
    }
  }

  async function authenticate() {
    if (isAuthedRef.current || isAuthenticatingRef.current) return;
    
    // Don't auth on public routes (Login)
    const currentSegment = segmentsRef.current?.[0];
    if (currentSegment === "(auth)") {
        setIsAuthenticated(true);
        return;
    }

    try {
      isAuthenticatingRef.current = true;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("Unlock App"),
        fallbackLabel: t("Use Passcode"),
        cancelLabel: t("Cancel"),
        disableDeviceFallback: false,
      });

      if (result.success && isMounted.current) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
      }
    } catch (e) {
      console.log("Auth Failed", e);
    } finally {
      if (isMounted.current) {
         if (timerRef.current) clearTimeout(timerRef.current);
         timerRef.current = setTimeout(() => {
           isAuthenticatingRef.current = false;
         }, 1000);
      }
    }
  }

  // Bypass logic
  const isPublicRoute = segments[0] === "(auth)";
  
  if (checkingConfig) return null; // Show nothing while checking settings
  if (isPublicRoute || !isBiometricEnabled) return <>{children}</>;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[theme.colors.navy, "#1a2c4e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={80} color="#FFF" />
            </View>
            <Text style={styles.title}>{t("Locked")}</Text>
            <Pressable onPress={authenticate} style={styles.unlockBtn}>
              <Ionicons name="finger-print" size={24} color={theme.colors.navy} />
              <Text style={[styles.unlockText, { color: theme.colors.navy }]}>{t("Unlock")}</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center", gap: 20, width: "100%", paddingHorizontal: 40 },
  iconContainer: { marginBottom: 10, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  title: { fontSize: 32, fontWeight: "900", color: "#FFF", letterSpacing: 1 },
  unlockBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, gap: 12, width: "100%", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  unlockText: { fontSize: 18, fontWeight: "700" },
});