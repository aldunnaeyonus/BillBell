// app/(auth)/import-recovery.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { EncryptionService } from '../../src/security/EncryptionService';
import { useTheme } from "../../src/ui/useTheme";
import { Ionicons } from '@expo/vector-icons';

export default function ImportRecoveryScreen() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setKey(text);
  };

  const handleImport = async () => {
    if (!key) {
      Alert.alert('Error', 'Please enter your recovery key');
      return;
    }

    setIsLoading(true);
    try {
      const success = await EncryptionService.importMasterKey(key);
      if (success) {
        Alert.alert('Success', 'Account recovered successfully.', [
          { text: 'OK', onPress: () => router.replace('/(app)/bills') }
        ]);
      } else {
        Alert.alert('Error', 'Invalid recovery key. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Ionicons name="key-outline" size={64} color={theme.colors.primary} />
        <Text style={styles.title}>Import Recovery Key</Text>
        <Text style={styles.subtitle}>
          Paste your Recovery Key below to restore access to your encrypted data.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Paste your key here..."
          placeholderTextColor="#999"
          value={key}
          onChangeText={setKey}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
          <Text style={styles.pasteText}>Paste</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleImport}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Restoring...' : 'Restore Account'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff', // Use theme.colors.background if available
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    paddingTop: 16,
    minHeight: 120,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  pasteButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pasteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF', // theme.colors.primary
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});