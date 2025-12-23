import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, Dimensions, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";

// --- DIMENSIONS LOGIC FIX ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard US Letter (8.5 x 11) Aspect Ratio (approx 1.29)
const ASPECT_RATIO = 11 / 8.5; 

// 1. Calculate ideal width (85% of screen), but cap it for Tablets (max 500pt)
const RAW_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 500);
const RAW_HEIGHT = RAW_WIDTH * ASPECT_RATIO;

// 2. Ensure it fits vertically. If the resulting height takes up more than 70% 
// of the screen, scale it down to fit. This preserves space for header/footer.
const MAX_HEIGHT = SCREEN_HEIGHT * 0.70;
const SCALE = RAW_HEIGHT > MAX_HEIGHT ? (MAX_HEIGHT / RAW_HEIGHT) : 1;

const SCAN_WIDTH = RAW_WIDTH * SCALE;
const SCAN_HEIGHT = RAW_HEIGHT * SCALE;

export default function BillScan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ color: '#fff', marginBottom: 20 }}>{t("Camera permission is required to scan bills.")}</Text>
        <Pressable onPress={requestPermission} style={styles.permBtn}>
          <Text style={{ fontWeight: 'bold' }}>{t("Grant Permission")}</Text>
        </Pressable>
      </View>
    );
  }

  const processImage = async () => {
    if (scanning || !cameraRef.current) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setScanning(true);

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error("Failed to take photo");

      const result = await TextRecognition.recognize(photo.uri);
      const text = result.text;
      
      const amountMatch = text.match(/\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      
      const detectedAmount = amountMatch ? amountMatch[1].replace(/,/g, '') : '';
      const detectedDate = dateMatch ? dateMatch[0] : '';
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace({
        pathname: "/(app)/bill-edit",
        params: {
          scannedAmount: detectedAmount,
          scannedDate: detectedDate,
          scannedText: text.substring(0, 200) 
        }
      });

    } catch (e: any) {
      Alert.alert(t("Scan Failed"), t("Could not read bill. Please try again."));
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView 
        style={StyleSheet.absoluteFill} 
        ref={cameraRef}
        flash="auto"
      />
      
      {/* Overlay Mask */}
      <View style={styles.overlay}>
        
        {/* TOP: Instructions */}
        <View style={styles.overlayTop}>
          <Text style={styles.instructionText}>{t("Align invoice within frame")}</Text>
        </View>

        {/* MIDDLE: Scan Window */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            
            {scanning && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.processingText}>{t("Processing...")}</Text>
              </View>
            )}
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* BOTTOM: Controls */}
        <View style={styles.overlayBottom}>
           <Pressable 
             style={({pressed}) => [styles.captureBtn, pressed && { transform: [{scale: 0.9}] }]} 
             onPress={processImage}
             disabled={scanning}
           >
             <View style={styles.captureBtnInner} />
           </Pressable>
           
           <Pressable style={styles.closeBtn} onPress={() => router.back()}>
             <Ionicons name="close" size={24} color="#FFF" />
             <Text style={styles.closeText}>{t("Cancel")}</Text>
           </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  permBtn: { padding: 15, backgroundColor: '#fff', borderRadius: 8 },
  
  overlay: { ...StyleSheet.absoluteFillObject },
  
  // Top section now flexible to push content down
  overlayTop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end', 
    alignItems: 'center',
    paddingBottom: 20 
  },
  
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  overlayMiddle: { 
    flexDirection: 'row', 
    height: SCAN_HEIGHT 
  },
  
  overlaySide: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  
  overlayBottom: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingBottom: 20 
  },
  
  scanArea: {
    width: SCAN_WIDTH,
    height: SCAN_HEIGHT,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#fff', borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  closeBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 10
  },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  processingText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});