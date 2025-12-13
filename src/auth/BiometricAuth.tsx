import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState, Pressable } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSegments } from 'expo-router'; // Import this
import { useTheme } from '../ui/useTheme';
import { button, buttonText } from '../ui/styles';

export function BiometricAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  const theme = useTheme();
  
  // 1. Get current navigation segment (e.g., "(auth)" or "(app)")
  const segments = useSegments(); 

  useEffect(() => {
    checkHardware();
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsAuthenticated(false);
      }
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
    else setIsAuthenticated(true); 
  }

  async function authenticate() {
    try {
        const hasRecords = await LocalAuthentication.isEnrolledAsync();
        if (!hasRecords) {
            setIsAuthenticated(true);
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

  // 2. BYPASS LOGIC: If on Login screen, render children immediately
  // This prevents the "Locked" screen from blocking the Sign-In buttons
  const isPublicRoute = segments[0] === '(auth)'; 
  if (isPublicRoute) {
      return <>{children}</>;
  }

  // 3. Normal Lock Logic
  if (!isAuthenticated && hasHardware) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <View style={{alignItems:'center', gap: 20}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.primaryText }}>
                Locked
            </Text>
            <Pressable onPress={authenticate} style={button(theme, 'primary')}>
                <Text style={buttonText(theme, 'primary')}>Unlock with FaceID</Text>
            </Pressable>
        </View>
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