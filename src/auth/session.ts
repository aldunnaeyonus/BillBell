import * as SecureStore from "expo-secure-store";
export async function setToken(token: string) { await SecureStore.setItemAsync("token", token); }
export async function getToken() { return SecureStore.getItemAsync("token"); }
export async function clearToken() { await SecureStore.deleteItemAsync("token"); }
