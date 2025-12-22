import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from "expo-router";
import * as Print from 'expo-print';
import Share from 'react-native-share';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";
import * as Haptics from 'expo-haptics';

// 1. Import the real function
import { getPrivateKey } from '../../src/security/EncryptionService'; 

export default function RecoveryKit() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setGenerating(true);

      // 2. Fetch the REAL key
      const privateKey = await getPrivateKey();

      const html = `
        <html>
          <body style="font-family: Helvetica, sans-serif; padding: 40px; color: #333;">
            <h1 style="color: #000;">BillBell Recovery Kit</h1>
            <p><strong>Keep this document safe.</strong> It contains the master key to decrypt your financial data.</p>
            
            <div style="border: 2px solid #000; padding: 20px; margin: 20px 0; background: #f9f9f9; word-break: break-all;">
              <code style="font-size: 14px;">${privateKey}</code>
            </div>

            <h3>Recovery Instructions</h3>
            <ol>
              <li>Install BillBell on your new device.</li>
              <li>Select "Recover Account".</li>
              <li>Scan the QR Code below or enter the key manually.</li>
            </ol>
            
            <center>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(privateKey)}" />
            </center>
            
            <p style="margin-top: 50px; font-size: 10px; color: #999;">Generated on ${new Date().toLocaleDateString()}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      const options = {
        url: uri,
        type: 'application/pdf',
        filename: 'BillBell_Recovery_Kit', 
        title: 'Save Recovery Kit',
        failOnCancel: false,
      };

      await Share.open(options);
      
    } catch (e: any) {
      if (e?.message !== 'User did not share') {
        Alert.alert("Error", "Failed to generate Recovery Kit");
        console.error(e);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={{ backgroundColor: theme.colors.navy, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 40 : 60, paddingHorizontal: 20 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF' }}>{t("Recovery Kit")}</Text>
      </View>

      <View style={{ padding: 20, gap: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Ionicons name="shield-checkmark" size={80} color={theme.colors.accent} />
        
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, textAlign: 'center' }}>
          {t("Backup Your Encryption Key")}
        </Text>
        
        <Text style={{ fontSize: 14, color: theme.colors.subtext, textAlign: 'center', lineHeight: 22 }}>
          {t("Your data is end-to-end encrypted. If you lose this device, you will need your Recovery Kit to restore your bills. We do not store your private key.")}
        </Text>

        <Pressable
          onPress={generatePDF}
          disabled={generating}
          style={({ pressed }) => ({
            backgroundColor: theme.colors.primary,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            opacity: pressed ? 0.8 : 1,
            width: '100%',
            justifyContent: 'center',
            marginTop: 20
          })}
        >
          {generating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="print-outline" size={20} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>{t("Generate PDF")}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}