// --- File: aldunnaeyonus/billbell/.../src/security/device.ts (UPLOADED CONTENT) ---
// --- File: src/security/device.ts (MODIFIED) ---

import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from 'uuid'; 

const DEVICE_ID_KEY = "billbell_device_id";

export async function getDeviceId(): Promise<string> {
    try {
        let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

        if (deviceId) {
            console.info(`Retrieved existing device ID: ${deviceId}`);
            return deviceId;
        }

        // Device ID not found, generate a new one
        const newDeviceId = uuidv4();
        
        try {
            // --- CRITICAL STORAGE ATTEMPT ---
            await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
            console.warn(`Generated and successfully stored new device ID: ${newDeviceId}`);
        } catch (storageError) {
            // --- LOG THE STORAGE FAILURE ---
            console.error("FAILED TO STORE DEVICE ID IN SECURE STORE:", storageError);
            console.warn("Returning ephemeral ID. Public Key will be overwritten on next launch!");
        }
        
        return newDeviceId;

    } catch (e) {
        console.error("CRITICAL ERROR: Failed to access SecureStore for device ID:", e);
        // Fallback to a random ID for this session
        return uuidv4(); 
    }
}