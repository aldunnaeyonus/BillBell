import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, AppState, Pressable, StatusBar, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSegments, useFocusEffect } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ui/useTheme";

export function BiometricAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);

  const isAuthedRef = useRef(false);
  const isAuthenticatingRef = useRef(false);

  const theme = useTheme();
  const { t } = useTranslation();
  const segments = useSegments();

  // FIX: avoid stale closure on segments inside AppState listener/authenticate
  const segmentsRef = useRef(segments);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []); 


  useEffect(() => {
    checkHardware();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        if (!isAuthenticatingRef.current) {
          setIsAuthenticated(false);
          isAuthedRef.current = false;
        }
      }

      if (nextAppState === "active") {
        if (!isAuthedRef.current && !isAuthenticatingRef.current) {
          setTimeout(() => authenticate(), 500);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  async function checkHardware() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setHasHardware(compatible);

    if (!compatible) {
      setIsAuthenticated(true);
      isAuthedRef.current = true;
    } else {
      authenticate();
    }
  }

  async function authenticate() {
    if (isAuthedRef.current || isAuthenticatingRef.current) return;

    // Don't auth on login screens (use ref to ensure it's current)
    if (segmentsRef.current?.[0] === "(auth)") return;

    try {
      isAuthenticatingRef.current = true;

      const hasRecords = await LocalAuthentication.isEnrolledAsync();
      if (!hasRecords) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
        return;
      }

     const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("Unlock App") || "Unlock App",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
        // FIX: Add a robust fallback for the cancelLabel to prevent native crashes
        cancelLabel: t("Cancel") || "Cancel", // <-- MODIFIED
      });

      if (result.success) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
      }
    } catch (e) {
      console.log("Auth Error", e);
    } finally {
      setTimeout(() => {
        isAuthenticatingRef.current = false;
      }, 500);
    }
  }

  const isPublicRoute = segments[0] === "(auth)";
  if (isPublicRoute) return <>{children}</>;

  if (!isAuthenticated && hasHardware) {
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

            <Text style={styles.title}>{t("Locked") || "Locked"}</Text>
            <Text style={styles.subtitle}>
              {t("Please authenticate to continue") || "Please authenticate to continue"}
            </Text>

            <Pressable onPress={authenticate} style={styles.unlockBtn}>
              <Ionicons name="finger-print" size={24} color={theme.colors.navy} />
              <Text style={[styles.unlockText, { color: theme.colors.navy }]}>
                {t("Unlock") || "Unlock"}
              </Text>
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
  iconContainer: {
    marginBottom: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: { fontSize: 32, fontWeight: "900", color: "#FFF", letterSpacing: 1 },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 20 },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  unlockText: { fontSize: 18, fontWeight: "700" },
});