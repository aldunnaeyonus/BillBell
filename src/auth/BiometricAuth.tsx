import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../ui/useTheme';
import { button, buttonText } from '../ui/styles';
import { Pressable } from 'react-native';

export function BiometricAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    checkHardware();
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Lock app when it goes to background
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsAuthenticated(false);
      }
      // Trigger auth when coming back to foreground
      if (nextAppState === 'active') {
        authenticate();
      }
    });
    return () => subscription.remove();
  }, []);

  async function checkHardware() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setHasHardware(compatible);
    if (compatible) authenticate();
    else setIsAuthenticated(true); // Fallback if no hardware
  }

  async function authenticate() {
    try {
        const hasRecords = await LocalAuthentication.isEnrolledAsync();
        if (!hasRecords) {
            setIsAuthenticated(true); // No face/fingerprint set up on phone
            return;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock DueView',
            fallbackLabel: 'Use Passcode',
        });

        if (result.success) {
            setIsAuthenticated(true);
        }
    } catch (e) {
        console.log(e);
    }
  }

  if (!isAuthenticated && hasHardware) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.primaryText, marginBottom: 20 }}>
            Locked
        </Text>
        <Pressable onPress={authenticate} style={button(theme, 'primary')}>
            <Text style={buttonText(theme, 'primary')}>Unlock with FaceID</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});