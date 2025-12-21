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

export function BiometricAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);

  const isAuthedRef = useRef(false);
  const isAuthenticatingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true); // Track mount status

  const theme = useTheme();
  const { t } = useTranslation();
  const segments = useSegments();

  const segmentsRef = useRef(segments);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    isMounted.current = true;
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
    
    checkHardware();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        if (!isAuthenticatingRef.current) {
          if (isMounted.current) setIsAuthenticated(false);
          isAuthedRef.current = false;
        }
      }

      if (nextAppState === "active") {
        if (!isAuthedRef.current && !isAuthenticatingRef.current) {
          // Clear existing timer before setting a new one
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
  }, []);

  async function checkHardware() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (isMounted.current) {
      setHasHardware(compatible);
      if (!compatible) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
      } else {
        authenticate();
      }
    }
  }

  async function authenticate() {
    if (isAuthedRef.current || isAuthenticatingRef.current) return;
    if (segmentsRef.current?.[0] === "(auth)") return;

    try {
      isAuthenticatingRef.current = true;

      const hasRecords = await LocalAuthentication.isEnrolledAsync();
      if (!hasRecords) {
        if (isMounted.current) {
          setIsAuthenticated(true);
          isAuthedRef.current = true;
        }
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("Unlock App") || "Unlock App",
        fallbackLabel: t("Use Passcode") || "Use Passcode",
        disableDeviceFallback: false,
        cancelLabel: t("Cancel") || "Cancel",
      });

      if (result.success && isMounted.current) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
      }
    } catch (e) {
      console.log("Auth Error", e);
    } finally {
      if (isMounted.current) {
         if (timerRef.current) clearTimeout(timerRef.current);
         timerRef.current = setTimeout(() => {
           isAuthenticatingRef.current = false;
         }, 500);
      } else {
        isAuthenticatingRef.current = false;
      }
    }
  }

  const isPublicRoute = segments[0] === "(auth)";
  if (isPublicRoute) return <>{children}</>;

  if (!isAuthenticated && hasHardware) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

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
              {t("Please authenticate to continue") ||
                "Please authenticate to continue"}
            </Text>

            <Pressable onPress={authenticate} style={styles.unlockBtn}>
              <Ionicons
                name="finger-print"
                size={24}
                color={theme.colors.navy}
              />
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
  content: {
    alignItems: "center",
    gap: 20,
    width: "100%",
    paddingHorizontal: 40,
  },
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
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 20,
  },
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