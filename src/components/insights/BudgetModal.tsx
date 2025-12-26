import React from 'react';
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, TextInput, Pressable, Platform } from 'react-native';
import { Theme } from "../../ui/useTheme";

interface BudgetModalProps {
  visible: boolean;
  category: string | null;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
  theme: Theme;
  t: any;
}

export default function BudgetModal({ visible, category, value, onChangeText, onClose, onSave, theme, t }: BudgetModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>
              {t("Set Limit for {{category}}", { category: category ? t(category) : '' })}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.bg }]}>
              <Text style={{ fontSize: 20, color: theme.colors.primaryText, fontWeight: '700' }}>$</Text>
              <TextInput 
                autoFocus 
                keyboardType="numeric" 
                value={value} 
                onChangeText={onChangeText} 
                placeholder="0" 
                placeholderTextColor={theme.colors.subtext} 
                style={[styles.input, { color: theme.colors.primaryText }]} 
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={styles.modalBtn}>
                <Text style={{ color: theme.colors.subtext, fontWeight: '600' }}>{t("Cancel")}</Text>
              </Pressable>
              <Pressable onPress={onSave} style={[styles.modalBtn, { backgroundColor: theme.colors.primary, paddingHorizontal: 24 }]}>
                <Text style={{ color: theme.colors.primaryTextButton, fontWeight: '700' }}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24, alignItems: 'center', gap: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 60, width: '100%', borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  input: { flex: 1, fontSize: 24, fontWeight: '700', marginLeft: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  modalBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', minWidth: 80 },
});