import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './useTheme';
import * as Haptics from 'expo-haptics';
import { VENDOR_DOMAINS, getVendorLogo } from '../data/vendors'; // IMPORTED

interface CreditorAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  theme: Theme;
  placeholder: string;
}

export function CreditorAutocomplete({ value, onChangeText, theme, placeholder }: CreditorAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter logic using the global list
  const suggestions = useMemo(() => {
    if (!value || value.length < 2) return [];
    const lower = value.toLowerCase();
    
    // Convert object keys to array and filter
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

  // Resolve logo using the global helper
  const currentLogo = getVendorLogo(value);

  return (
    <View style={{ zIndex: 100 }}>
      {/* Input Field */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        
        {/* Dynamic Logo in Input */}
        {currentLogo ? (
          <Image 
            source={{ uri: currentLogo }} 
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
          {suggestions.map((item, index) => {
            const itemLogo = getVendorLogo(item);
            return (
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
                {/* Logo in Dropdown */}
                {itemLogo ? (
                   <Image 
                    source={{ uri: itemLogo }} 
                    style={{ width: 24, height: 24, borderRadius: 4, marginRight: 10, backgroundColor: '#fff' }} 
                  />
                ) : (
                   <Ionicons name="business" size={20} color={theme.colors.subtext} style={{ marginRight: 10 }} />
                )}
               
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>{item}</Text>
              </Pressable>
            );
          })}
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