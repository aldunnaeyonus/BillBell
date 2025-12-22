import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Alert, Dimensions, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Updated API for Expo 52+
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.8;

export default function BillScan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ color: '#fff', marginBottom: 20 }}>Camera permission is required to scan bills.</Text>
        <Pressable onPress={requestPermission} style={styles.permBtn}>
          <Text style={{ fontWeight: 'bold' }}>Grant Permission</Text>
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

      // 1. Recognize Text
      const result = await TextRecognition.recognize(photo.uri);
      
      // 2. Simple Parsing Logic (We will refine this AI later)
      const text = result.text;
      
      // Naive Regex Pattern Matching (To be improved)
      const amountMatch = text.match(/\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/); // Simple MM/DD/YYYY
      
      const detectedAmount = amountMatch ? amountMatch[1].replace(/,/g, '') : '';
      const detectedDate = dateMatch ? dateMatch[0] : '';
      
      // 3. Success Feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 4. Navigate to Edit Screen with Params
      router.replace({
        pathname: "/(app)/bill-edit",
        params: {
          scannedAmount: detectedAmount,
          scannedDate: detectedDate,
          scannedText: text.substring(0, 200) // Pass raw text for debugging/notes
        }
      });

    } catch (e: any) {
      Alert.alert("Scan Failed", "Could not read bill. Please try again.");
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
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            
            {scanning && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
           <Pressable 
             style={({pressed}) => [styles.captureBtn, pressed && { transform: [{scale: 0.9}] }]} 
             onPress={processImage}
             disabled={scanning}
           >
             <View style={styles.captureBtnInner} />
           </Pressable>
           
           <Pressable style={styles.closeBtn} onPress={() => router.back()}>
             <Text style={styles.closeText}>Cancel</Text>
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
  
  // Overlay Mask Strategy
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  overlayTop: { height: '20%', backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderColor: 'transparent', // Corners handles the visuals
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Custom Corners
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
    marginBottom: 20
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  closeBtn: { position: 'absolute', top: 40, right: 20 },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  processingText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});