import * as SecureStore from "expo-secure-store";
import * as Crypto from 'expo-crypto';
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "billbell_device_id";

// In-memory cache to prevent frequent async lookups
let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
    if (cachedDeviceId) return cachedDeviceId;

    try {
        // 1. Try SecureStore (Primary)
        let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        
        // 2. Try AsyncStorage (Fallback) if SecureStore is empty
        if (!deviceId) {
            deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        }

        // 3. Generate New if missing
        if (!deviceId) {
            deviceId = Crypto.randomUUID();
            
            // Try to persist to both
            try { await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId); } catch (e) { console.warn("SecureStore write failed for deviceId", e); }
            try { await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId); } catch (e) { console.warn("AsyncStorage write failed for deviceId", e); }
        } else {
             // If we found it in one but not the other, heal the missing one
             // (Not strictly necessary but good for consistency)
             // We won't block execution for this healing.
        }

        cachedDeviceId = deviceId;
        return deviceId;
    } catch (e) {
        console.error("Critical Device ID failure:", e);
        
        // If everything fails, return a temporary one but DO NOT cache it globally
        // to encourage retrying persistence next time.
        // However, for the session duration, we should probably stick to one.
        if (!cachedDeviceId) {
            cachedDeviceId = Crypto.randomUUID();
        }
        return cachedDeviceId; 
    }
}