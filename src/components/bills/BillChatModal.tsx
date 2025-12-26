import React, { useState, useRef } from "react";
import { View, Text, Modal, TouchableOpacity, KeyboardAvoidingView, FlatList, TextInput, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../ui/useTheme";
import { sendMessageToBillBell } from "../../api/chat";
import { generateBillContext } from "../../utils/billLogic";

interface BillChatModalProps {
  visible: boolean;
  onClose: () => void;
  bills: any[];
  t: any;
}

export default function BillChatModal({ visible, onClose, bills, t }: BillChatModalProps) {
  const theme = useTheme();
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: t("Hi! I'm Bill Bell. Ask me about your finances.") }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setChatLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    const contextString = generateBillContext(bills, "$", t);

    try {
      const response = await sendMessageToBillBell(userMsg, contextString);
      if (response) {
        setMessages(prev => [...prev, { role: 'bot', text: response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: t("Network error.") }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.chatContainer, { backgroundColor: theme.colors.bg }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.chatTitle, { color: theme.colors.text }]}>{t("Bill Bell AI")}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[
              styles.msgBubble,
              item.role === 'user' ? styles.msgUser : styles.msgBot,
              item.role === 'bot' && { backgroundColor: theme.colors.card }
            ]}>
              <Text style={item.role === 'user' ? styles.textUser : { color: theme.colors.text }}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={[styles.inputArea, { borderTopColor: theme.colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            placeholder={t("Ask about your bills...")}
            placeholderTextColor={theme.colors.subtext}
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isChatLoading}
            style={[styles.sendBtn, isChatLoading && { opacity: 0.5 }, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, alignItems: 'center' },
  chatTitle: { fontSize: 18, fontWeight: 'bold' },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: '80%' },
  msgUser: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  msgBot: { alignSelf: 'flex-start' },
  textUser: { color: 'white' },
  inputArea: { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  input: { flex: 1, padding: 12, borderRadius: 20, marginRight: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});