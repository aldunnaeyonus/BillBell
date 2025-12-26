import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './useTheme';
import * as Haptics from 'expo-haptics';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

export function QRScannerModal({ visible, onClose, onScan, title }: QRScannerModalProps) {
  const theme = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScan(data);
    // Reset scan state after a delay if the modal doesn't close immediately
    setTimeout(() => setScanned(false), 2000);
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
          <Text style={{ color: theme.colors.text }}>No access to camera</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: theme.colors.primary }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: 'black' }]}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>{title || "Scan Recovery Kit"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Ionicons name="close-circle" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanFrameContainer}>
            <View style={[styles.scanFrame, { borderColor: theme.colors.primary }]} />
            <Text style={styles.hintText}>Align the QR code within the frame</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  closeIcon: {
    position: 'absolute',
    right: 20,
  },
  scanFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  hintText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
  }
});