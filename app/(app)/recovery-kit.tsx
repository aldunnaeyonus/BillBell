import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { router, Stack } from "expo-router";
import * as Print from 'expo-print';
import Share from 'react-native-share';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";
import * as Haptics from 'expo-haptics';
import { getPrivateKey } from '../../src/security/EncryptionService'; 
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";
import LinearGradient from "react-native-linear-gradient";

// --- Header Component ---
function Header({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerIconCircle}>
          <Ionicons name="shield-checkmark" size={28} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// --- Main Screen ---
export default function RecoveryKit() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setGenerating(true);
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
      const options = { url: uri, type: 'application/pdf', filename: 'BillBell_Recovery_Kit', title: 'Save Recovery Kit', failOnCancel: false };
      await Share.open(options);
    } catch (e: any) {
      if (e?.message !== 'User did not share') { Alert.alert("Error", "Failed to generate Recovery Kit"); }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
              <Header 
        title={t("Recovery Kit")} 
        subtitle={t("Backup your encryption key")} 
        theme={theme} 
      />
        <View style={styles.content}>
          <Ionicons name="document-lock-outline" size={80} color={theme.colors.accent} />
          
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
              marginTop: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4
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
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShadowContainer: { 
    backgroundColor: "transparent", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    elevation: 6, 
    marginVertical: 4, 
    borderRadius: 20,
    marginHorizontal: 16, 
    marginTop: Platform.OS === 'android' ? 40 : 10 
  },
  headerGradient: { 
    borderRadius: 20, 
    height: 100, 
    paddingHorizontal: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    overflow: "hidden" 
  },
  headerIconCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: "rgba(255,255,255,0.15)", 
    justifyContent: "center", 
    alignItems: "center",
    marginRight: 12
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#FFF", 
    marginBottom: 2 
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: "rgba(255,255,255,0.7)" 
  },
});