import * as SecureStore from "expo-secure-store";

export async function setToken(token: string) { 
    await SecureStore.setItemAsync("token", token); 
}

export async function getToken() { 
    return SecureStore.getItemAsync("token"); 
}

export async function clearToken() { 
    try {
        await SecureStore.deleteItemAsync("token"); 
        console.info("Session token cleared successfully.");
    } catch (e) {
        // Ignore errors if the token doesn't exist or keychain is inaccessible,
        // so the user can still proceed with logout.
        console.error("Failed to delete session token securely, proceeding with logout:", e);
    }
}