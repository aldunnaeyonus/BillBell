import React, { useEffect, useState } from 'react';
import { StyleSheet, View, AppState, Platform } from 'react-native';
import { BlurView } from 'expo-blur'; // Ensure expo-blur is installed
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './useTheme';

export function PrivacyOverlay() {
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Activate blur when app goes to inactive/background
      setIsBackgrounded(nextAppState !== 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isBackgrounded) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={90} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : (
        // Android fallback (Opaque View)
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bg, opacity: 0.98 }]} />
      )}
      
      <View style={styles.center}>
        <Ionicons name="lock-closed" size={64} color={theme.colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999, // Ensure it sits on top of everything
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },
});