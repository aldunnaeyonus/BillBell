import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  AppState,
  Pressable,
  StatusBar,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSegments } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ui/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function BiometricAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

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
        if (!isAuthenticatingRef.current && isBiometricEnabled) {
          if (isMounted.current) setIsAuthenticated(false);
          isAuthedRef.current = false;
        }
      }

      if (nextAppState === "active") {
        if (
          isBiometricEnabled &&
          !isAuthedRef.current &&
          !isAuthenticatingRef.current
        ) {
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
  }, [isBiometricEnabled]);

  async function checkConfiguration() {
    try {
      const enabled = await AsyncStorage.getItem("biometrics_enabled");
      const isEnabled = enabled === "true";

      if (isMounted.current) setIsBiometricEnabled(isEnabled);

      if (!isEnabled) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
        setCheckingConfig(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
      } else {
        authenticate();
      }
    } catch (e) {
      console.log("Config Check Error", e);
      setIsAuthenticated(true);
    } finally {
      if (isMounted.current) setCheckingConfig(false);
    }
  }

  async function authenticate() {
    if (isAuthedRef.current || isAuthenticatingRef.current) return;

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

  const isPublicRoute = segments[0] === "(auth)";

  // If initial check is running, render nothing (or a splash) to prevent flashes
  if (checkingConfig) return null;

  // Logic: 
  // 1. Always render {children} (this preserves the navigation state).
  // 2. If locked, render the Lock View on TOP (absolute positioning).
  const isLocked = !isAuthenticated && !isPublicRoute && isBiometricEnabled;

  return (
    <View style={{ flex: 1 }}>
      {/* 1. The App (always rendered) */}
      <View style={{ flex: 1 }}>{children}</View>

      {/* 2. The Lock Screen Overlay */}
      {isLocked && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
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
              <Text style={styles.title}>{t("Locked")}</Text>
              <Pressable onPress={authenticate} style={styles.unlockBtn}>
                <Ionicons
                  name="finger-print"
                  size={24}
                  color={theme.colors.navy}
                />
                <Text style={[styles.unlockText, { color: theme.colors.navy }]}>
                  {t("Unlock")}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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