import * as SecureStore from "expo-secure-store";
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = "billbell_device_id";

export async function getDeviceId(): Promise<string> {
    try {
        let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (deviceId) return deviceId;

        // Use randomUUID for cross-platform reliability
        const newDeviceId = Crypto.randomUUID(); 
        await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
        return newDeviceId;
    } catch (e) {
        console.error("SecureStore access failed:", e);
        return Crypto.randomUUID(); 
    }
}