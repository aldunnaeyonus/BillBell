import * as SecureStore from "expo-secure-store";

export async function setToken(token: string) { 
    // SecureStore.setItemAsync("token", token) might optionally include 
    // { requireAuthentication: true } to link it to biometrics.
    await SecureStore.setItemAsync("token", token); 
}

export async function getToken() { 
    return SecureStore.getItemAsync("token"); 
}

export async function clearToken() { 
    // --- CRITICAL FIX: Add try...catch to prevent native keychain crash ---
    try {
        await SecureStore.deleteItemAsync("token"); 
        console.info("Session token cleared successfully.");
    } catch (e) {
        // Suppress the error. The token is either already gone or the native 
        // keychain access failed due to corruption (which caused the original crash).
        console.error("Failed to delete session token securely, proceeding with logout:", e);
    }
}