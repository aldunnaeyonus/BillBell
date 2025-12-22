import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './useTheme';
import * as Haptics from 'expo-haptics';

// Map common names to domains for Clearbit
const VENDOR_DOMAINS: Record<string, string> = {
  "Netflix": "netflix.com",
  "Spotify": "spotify.com",
  "Hulu": "hulu.com",
  "Disney+": "disneyplus.com",
  "HBO Max": "hbo.com",
  "Amazon Prime": "amazon.com",
  "Chase": "chase.com",
  "Bank of America": "bankofamerica.com",
  "Wells Fargo": "wellsfargo.com",
  "Citi": "citi.com",
  "Capital One": "capitalone.com",
  "American Express": "americanexpress.com",
  "Geico": "geico.com",
  "State Farm": "statefarm.com",
  "ComEd": "comed.com",
  "PG&E": "pge.com",
  "T-Mobile": "t-mobile.com",
  "Verizon": "verizon.com",
  "AT&T": "att.com",
  "Xfinity": "xfinity.com"
};

interface CreditorAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  theme: Theme;
  placeholder: string;
}

export function CreditorAutocomplete({ value, onChangeText, theme, placeholder }: CreditorAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!value || value.length < 2) return [];
    const lower = value.toLowerCase();
    return Object.keys(VENDOR_DOMAINS)
      .filter(v => v.toLowerCase().includes(lower))
      .slice(0, 5);
  }, [value]);

  const handleSelect = (vendor: string) => {
    Haptics.selectionAsync();
    onChangeText(vendor);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  return (
    <View style={{ zIndex: 100 }}>
      {/* Input Field */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {/* Dynamic Logo in Input */}
        {VENDOR_DOMAINS[value] ? (
          <Image 
            source={{ uri: `https://logo.clearbit.com/${VENDOR_DOMAINS[value]}` }} 
            style={{ width: 24, height: 24, borderRadius: 12 }} 
          />
        ) : (
          <Ionicons name="search-outline" size={20} color={theme.colors.subtext} />
        )}
        
        <TextInput
          value={value}
          onChangeText={(t) => { onChangeText(t); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.subtext}
          style={[styles.input, { color: theme.colors.primaryText }]}
        />
      </View>

      {/* Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {suggestions.map((item, index) => (
            <Pressable
              key={item}
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                styles.item,
                { 
                  borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.border,
                  backgroundColor: pressed ? theme.colors.bg : 'transparent'
                }
              ]}
            >
              <Image 
                source={{ uri: `https://logo.clearbit.com/${VENDOR_DOMAINS[item]}` }} 
                style={{ width: 24, height: 24, borderRadius: 4, marginRight: 10, backgroundColor: '#eee' }} 
              />
              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: "500", height: "100%" },
  dropdown: { position: 'absolute', top: 60, left: 0, right: 0, borderRadius: 12, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, zIndex: 999, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14 }
});