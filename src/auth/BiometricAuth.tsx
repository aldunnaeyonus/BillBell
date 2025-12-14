import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Pressable, StatusBar, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSegments } from 'expo-router';
import LinearGradient from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ui/useTheme';

export function BiometricAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  
  // Ref to track successful auth (to avoid re-renders)
  const isAuthedRef = useRef(false);
  
  // FIX 1: Ref to track if the system prompt is CURRENTLY open
  const isAuthenticatingRef = useRef(false);
  
  const theme = useTheme();
  const { t } = useTranslation();
  const segments = useSegments(); 

  useEffect(() => {
    checkHardware();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Lock only on background
      if (nextAppState === 'background') {
        setIsAuthenticated(false);
        isAuthedRef.current = false;
        // Note: We do NOT reset isAuthenticatingRef here, as a background event
        // might happen while the prompt is open.
      }

      // FIX 2: Only trigger auth on 'active' if we aren't already authenticated
      // AND we aren't currently in the middle of an auth attempt.
      if (nextAppState === 'active') {
        if (!isAuthedRef.current && !isAuthenticatingRef.current) {
            // slightly longer timeout to allow iOS animation to settle
            setTimeout(() => authenticate(), 500);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  async function checkHardware() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setHasHardware(compatible);
    
    // If no hardware, bypass auth completely
    if (!compatible) {
        setIsAuthenticated(true);
        isAuthedRef.current = true;
    } else {
        authenticate();
    }
  }

  async function authenticate() {
    // FIX 3: Guard clause - stop if already authed or currently scanning
    if (isAuthedRef.current || isAuthenticatingRef.current) return;

    // Don't auth on login screens
    if (segments[0] === '(auth)') return;

    try {
        isAuthenticatingRef.current = true; // Lock

        const hasRecords = await LocalAuthentication.isEnrolledAsync();
        if (!hasRecords) {
            setIsAuthenticated(true);
            isAuthedRef.current = true;
            return;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: t('Unlock App') || 'Unlock App',
            fallbackLabel: 'Use Passcode',
            disableDeviceFallback: false,
            cancelLabel: t('Cancel')
        });

        if (result.success) {
            setIsAuthenticated(true);
            isAuthedRef.current = true;
        }
    } catch (e) {
        console.log("Auth Error", e);
    } finally {
        // FIX 4: Always release the lock, even if it failed/cancelled
        // Short delay to prevent the 'active' listener from firing immediately after failure
        setTimeout(() => {
            isAuthenticatingRef.current = false;
        }, 500);
    }
  }

  // Allow public routes to bypass the lock screen render
  const isPublicRoute = segments[0] === '(auth)'; 
  if (isPublicRoute) {
      return <>{children}</>;
  }

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
                
                <Text style={styles.title}>{t('Locked') || 'Locked'}</Text>
                <Text style={styles.subtitle}>{t('Please authenticate to continue') || 'Please authenticate to continue'}</Text>

                <Pressable onPress={authenticate} style={styles.unlockBtn}>
                    <Ionicons name="finger-print" size={24} color={theme.colors.navy} />
                    <Text style={[styles.unlockText, { color: theme.colors.navy }]}>
                        {t('Unlock') || 'Unlock'}
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
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  unlockText: {
    fontSize: 18,
    fontWeight: '700',
  }
});