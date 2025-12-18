import * as SecureStore from "expo-secure-store";
import {
  ensureKeyPair,
  unwrapMyKey,
  cacheFamilyKey,
  pruneFamilyKeys,
  getCachedFamilyKeyVersion,
  encryptData,
  decryptDataWithVersion,
  generateNewFamilyKey,
  wrapKeyForUser,
  getLatestCachedRawFamilyKeyHex,
  FAMILY_KEY_VERSION_ALIAS,
  FAMILY_KEY_PREFIX,
} from "../security/EncryptionService";
import { clearToken } from "../auth/session";
import { router } from "expo-router";
import { getDeviceId } from '../security/device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://dunn-carabali.com/billMVP";
const RSA_UPLOADED_FLAG = "billbell_rsa_uploaded_success";

async function getToken() {
  return SecureStore.getItemAsync("token");
}

async function hardReset() {
    await clearAllFamilyKeys();
    await AsyncStorage.removeItem("billbell_bills_list_cache");
    
    await SecureStore.deleteItemAsync("billbell_rsa_public"); 
    await SecureStore.deleteItemAsync("billbell_rsa_private"); 
    await SecureStore.deleteItemAsync(RSA_UPLOADED_FLAG);

    await clearToken(); 
    console.warn("Performing hard application reset. User must log in again.");
    router.replace("/(auth)/login");
}

async function request(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const text = await res.text();

  let json: any = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = null; }
  }

  const errMsg = (json?.error || text || "").toString();
  if (!res.ok) {
    const shouldForceLogout =
      res.status === 401 ||
      errMsg.includes("Missing Authorization header") ||
      errMsg.includes("Invalid token") ||
      errMsg.includes("User not found or token is stale");

    if (shouldForceLogout) {
      await clearToken();
      router.replace("/(auth)/login");
      throw new Error("Session ended. Please log in again.");
    }

    if (res.status === 409 && errMsg.includes("User not in family")) {
      router.replace("/(app)/family");
      throw new Error("User not in family");
    }

    throw new Error(errMsg || `Request failed (${res.status})`);
  }

  return json;
}

async function ensureRsaKeyUploaded() {
    const alreadyUploaded = await SecureStore.getItemAsync(RSA_UPLOADED_FLAG);
    if (alreadyUploaded === "true") return;

    const { publicKey } = await ensureKeyPair();
    if (typeof publicKey !== 'string' || !publicKey) {
        throw new Error("Local RSA Public Key is missing or invalid.");
    }
    
    try {
        const deviceId = await getDeviceId();
        await request("/keys/public", { 
            method: "POST", 
            body: JSON.stringify({ 
                public_key: publicKey,
                device_id: deviceId
            }) 
        });
        
        await SecureStore.setItemAsync(RSA_UPLOADED_FLAG, "true");
        console.info("RSA Public Key and Device ID uploaded successfully.");
    } catch (e: any) {
        const errMsg = String(e.message);
        if (errMsg.includes("Session ended. Please log in again.")) {
            throw e; 
        }
        console.warn("Public Key Upload failed:", e);
        throw new Error(`Failed to upload local RSA Public Key: ${String(e.message)}`);
    }
}

const FAMILY_KEY_SYNC_TS = "billbell_family_key_last_sync_ms";
const KEY_SYNC_MIN_INTERVAL_MS = 60_000;

async function clearAllFamilyKeys() {
    console.warn("Performing aggressive clear of all cached family encryption keys.");
    await SecureStore.deleteItemAsync(FAMILY_KEY_VERSION_ALIAS);
    await SecureStore.deleteItemAsync(FAMILY_KEY_SYNC_TS); 
    for (let v = 1; v <= 100; v++) { 
        await SecureStore.deleteItemAsync(`${FAMILY_KEY_PREFIX}${v}`);
    }
}

async function ensureFamilyKeyLoaded() {
  const token = await getToken();
  if (!token) return;

  try {
      await ensureRsaKeyUploaded();
  } catch (e: any) {
      const errMsg = String(e.message);
      if (errMsg.includes("Session ended. Please log in again.")) return;
      console.warn("Stopping family key sync due to RSA failure:", e);
      return; 
  }

  const now = Date.now();
  const last = parseInt((await SecureStore.getItemAsync(FAMILY_KEY_SYNC_TS)) || "0", 10);
  const cachedVersion = await getCachedFamilyKeyVersion();

  if (cachedVersion && Number.isFinite(last) && now - last < KEY_SYNC_MIN_INTERVAL_MS) {
    return;
  }

  const deviceId = await getDeviceId();
  const resp = await request(`/keys/shared?device_id=${deviceId}`); 
  
  const wrapped = resp?.encrypted_key;
  const keyVersion = Number(resp?.key_version);
  const familyId = Number(resp?.family_id);

  let currentUserId: number | undefined;
  try {
      const familyMembersResponse = await api.familyMembers();
      currentUserId = familyMembersResponse.current_user_id;
  } catch (e) {
      console.warn("Could not retrieve current user ID. Cannot perform self-heal if needed.");
  }

  if (!wrapped || !Number.isFinite(keyVersion) || keyVersion <= 0) {
    throw new Error("Missing encrypted key from server");
  }

  try {
    const familyKeyHex = await unwrapMyKey(String(wrapped));
    await cacheFamilyKey(familyKeyHex, keyVersion);
    await pruneFamilyKeys(50);
    await SecureStore.setItemAsync(FAMILY_KEY_SYNC_TS, String(now));
  } catch (e: any) {
    const errMsg = String(e.message);
    if (errMsg.includes("KEY_DECRYPTION_FAILED")) {
      console.warn("Decryption failed. Attempting automatic key re-share (self-heal)...");
      let selfHealFailed = false; 
      let currentRawKey: { hex: string; version: number } | null = null;
      let publicKey: string | null = null;

      try {
        currentRawKey = await getLatestCachedRawFamilyKeyHex();
        const keyPair = await ensureKeyPair();
        publicKey = keyPair.publicKey as string; 
        const deviceId = await getDeviceId();
        
        if (currentRawKey?.hex && publicKey && familyId && currentUserId) {
            const wrappedKeyBase64 = wrapKeyForUser(currentRawKey.hex, publicKey);
            await api.shareKey({
                family_id: familyId,
                target_user_id: currentUserId,
                encrypted_key: wrappedKeyBase64,
                device_id: deviceId,
            });
            await cacheFamilyKey(currentRawKey.hex, keyVersion);
            await SecureStore.setItemAsync(FAMILY_KEY_SYNC_TS, String(now));
            console.info("Automatic key re-share successful (Self-Healed).");
            return; 
        } else {
            selfHealFailed = true;
        }
      } catch (shareError: any) {
        selfHealFailed = true;
      }
      if (selfHealFailed) {
        await clearAllFamilyKeys();
        return; 
      }
    }
    throw e;
  }
}

const REENC_MAX_PER_LOAD = 3;
const REENC_COOLDOWN_MS = 60 * 60 * 1000;
const REENC_LAST_MS = "billbell_reencrypt_last_ms";

async function maybeReencryptBills(bills: any[]) {
  const currentVersion = await getCachedFamilyKeyVersion();
  if (!currentVersion) return;

  const last = parseInt((await SecureStore.getItemAsync(REENC_LAST_MS)) || "0", 10);
  const now = Date.now();
  if (Number.isFinite(last) && now - last < REENC_COOLDOWN_MS) return;

  let upgraded = 0;
  for (const b of bills) {
    if (upgraded >= REENC_MAX_PER_LOAD) break;
    const billVersion = Number(b.cipher_version ?? 1);
    if (!Number.isFinite(billVersion) || billVersion >= currentVersion) continue;

    try {
      const creditor = await decryptDataWithVersion(b.creditor || "");
      const notes = await decryptDataWithVersion(b.notes || "");
      const amount = b.amount_encrypted ? await decryptDataWithVersion(b.amount_encrypted) : null;

      const payload: any = {
        creditor: await encryptData(creditor.text),
        notes: await encryptData(notes.text || ""),
      };

      if (b.amount_encrypted) {
        const cents = amount?.text ? String(amount.text) : String(b.amount_cents ?? "");
        if (cents) payload.amount_encrypted = await encryptData(cents);
      }

      await request(`/bills/${b.id}`, { method: "PUT", body: JSON.stringify(payload) });
      upgraded++;
    } catch (e: any) {}
  }
  if (upgraded > 0) {
    await SecureStore.setItemAsync(REENC_LAST_MS, String(now));
  }
}

async function orchestrateFamilyKeyExchange(familyId: number, targetUserId: number): Promise<void> {
    const pubKeyResponse = await api.getPublicKey(targetUserId);
    const recipientPublicKeyPem = pubKeyResponse.public_key;
    const deviceId = (pubKeyResponse.device_id as string) || (await getDeviceId()); 

    if (!recipientPublicKeyPem) throw new Error("Could not retrieve creator's Public Key.");
    
    const newFamilyKeyHex = generateNewFamilyKey();
    const wrappedKeyBase64 = wrapKeyForUser(newFamilyKeyHex, recipientPublicKeyPem);
    
    await api.shareKey({
      family_id: familyId,
      target_user_id: targetUserId,
      encrypted_key: wrappedKeyBase64,
      device_id: deviceId,
    });
    
    await cacheFamilyKey(newFamilyKeyHex, 1);
}

async function orchestrateKeyRotation(): Promise<{ familyId: number; keyVersion: number }> {
    const serverResponse = await api.rotateKey(); 
    const familyId = serverResponse.family_id;
    const newKeyVersion = serverResponse.key_version;

    if (!familyId || !newKeyVersion) throw new Error("Server did not return rotation data.");
    
    await AsyncStorage.removeItem("billbell_bills_list_cache");
    const newFamilyKeyHex = generateNewFamilyKey();
    const membersResponse = await api.familyMembers();
    const members = membersResponse.members || [];

    for (const member of members) {
        const pubKeyResponse = await api.getPublicKey(member.id); 
        const keysToShare = pubKeyResponse.public_keys || 
                            (pubKeyResponse.public_key ? [{
                                public_key: pubKeyResponse.public_key,
                                device_id: pubKeyResponse.device_id || '00000000-0000-0000-0000-000000000000'
                            }] : []);

        for (const keyInfo of keysToShare) {
            const wrappedKeyBase64 = wrapKeyForUser(newFamilyKeyHex, keyInfo.public_key);
            await api.shareKey({
                family_id: familyId,
                target_user_id: member.id,
                encrypted_key: wrappedKeyBase64,
                device_id: keyInfo.device_id,
            });
        }
    }

    await cacheFamilyKey(newFamilyKeyHex, newKeyVersion);
    await pruneFamilyKeys(50);
    return { familyId, keyVersion: newKeyVersion };
}

export const api = {
  clearAllFamilyKeys,
  hardReset,
  authApple: (payload: any) => request("/auth/apple", { method: "POST", body: JSON.stringify(payload) }),
  authGoogle: (payload: any) => request("/auth/google", { method: "POST", body: JSON.stringify(payload) }),
  deleteAccount: () => request("/auth/user", { method: "DELETE" }),
  createImportCode: (ttl_minutes: number = 15) =>
    request("/import-code/create", { method: "POST", body: JSON.stringify({ ttl_minutes }) }),
  importBills: (import_code: string, bills: any[]) =>
    request("/import/bills", { method: "POST", body: JSON.stringify({ import_code, bills }) }),
  familyCreate: async () => {
    await ensureRsaKeyUploaded(); 
    const response = await request("/family/create", { method: "POST", body: JSON.stringify({}) });
    if (response.family_id && response.current_user_id) {
        await orchestrateFamilyKeyExchange(response.family_id, response.current_user_id);
    }
    return response;
  },
  familyJoin: (family_code: string) => request("/family/join", { method: "POST", body: JSON.stringify({ family_code }) }),
  familyMembers: () => request("/family/members"),
  familyMemberRemove: (memberId: number) => request(`/family/members/${memberId}`, { method: "DELETE" }),
  familyLeave: () => request("/family/leave", { method: "POST" }),
  familySettingsGet: () => request("/family/settings"),
  familySettingsUpdate: (payload: any) => request("/family/settings", { method: "PUT", body: JSON.stringify(payload) }),
  deviceTokenUpsert: (payload: any) => request("/devices/token", { method: "POST", body: JSON.stringify(payload) }),
  rotateKey: () => request("/family/rotate-key", { method: "POST" }),
  orchestrateKeyRotation,
  billsList: async () => {
    await ensureFamilyKeyLoaded();
    const currentVersion = await getCachedFamilyKeyVersion();
    if (!currentVersion) throw new Error("Key Rotation required.");

    const response = await request("/bills");
    const rawBills = response?.bills || response || [];

    const decryptedBills = await Promise.all(
      rawBills.map(async (b: any) => {
        try {
          const creditor = await decryptDataWithVersion(b.creditor || "");
          const notes = await decryptDataWithVersion(b.notes || "");
          const amount = b.amount_encrypted ? await decryptDataWithVersion(b.amount_encrypted) : null;
          return {
            ...b,
            creditor: creditor.text,
            amount_cents: amount ? Number(amount.text) : b.amount_cents,
            notes: notes.text,
          };
        } catch (e) {
          return { ...b, creditor: '[DECRYPTION FAILED]', amount_cents: 0 };
        }
      })
    );
    try { await maybeReencryptBills(rawBills); } catch (e) {}
    return { bills: decryptedBills };
  },
  uploadPublicKey: (public_key: string) => request("/keys/public", { method: "POST", body: JSON.stringify({ public_key }) }),
  getPublicKey: (userId: number) => request(`/keys/public/${userId}`),
  shareKey: (payload: { family_id: number; target_user_id: number; encrypted_key: string; device_id: string }) =>
    request("/keys/shared", { method: "POST", body: JSON.stringify(payload) }),
  getMySharedKey: () => request("/keys/shared"),
  billsCreate: async (bill: any) => {
    await ensureFamilyKeyLoaded();
    const payload = {
        ...bill,
        creditor: await encryptData(bill.creditor),
        amount_encrypted: await encryptData(String(bill.amount_cents)),
        notes: await encryptData(bill.notes || ""),
        recurrence: bill.recurrence_rule ?? "none",
    };
    return request("/bills", { method: "POST", body: JSON.stringify(payload) });
  },
  billsUpdate: async (id: number, bill: any) => {
    await ensureFamilyKeyLoaded();
    const payload: any = { ...bill };
    if (Object.prototype.hasOwnProperty.call(payload, "creditor")) payload.creditor = await encryptData(payload.creditor ?? "");
    if (Object.prototype.hasOwnProperty.call(payload, "notes")) payload.notes = await encryptData(payload.notes ?? "");
    if (payload.amount_cents !== undefined) payload.amount_encrypted = await encryptData(String(payload.amount_cents));
    return request(`/bills/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  billsDelete: (id: number) => request(`/bills/${id}`, { method: "DELETE" }),
  billsMarkPaid: (id: number) => request(`/bills/${id}/mark-paid`, { method: "POST" }),
  billsSnooze: (id: number, snoozed_until: string) =>
    request(`/bills/${id}/snooze`, { method: "POST", body: JSON.stringify({ snoozed_until }) }),
};