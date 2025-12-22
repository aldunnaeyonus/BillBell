import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo'; // npx expo install @react-native-community/netinfo
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  if (isConnected) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={16} color="#FFF" />
        <Text style={styles.text}>You are offline. Changes saved locally.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#34495E', // Neutral Slate
    width: '100%',
    zIndex: 9999,
  },
  content: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});