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
import i18n from "./i18n"; 

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://dunn-carabali.com/billMVP";

// --- Helper Types ---
interface KeySharePayload {
    family_id: number;
    target_user_id: number;
    encrypted_key: string;
    device_id: string;
}

// --- Core Functions ---

async function getToken() {
  return SecureStore.getItemAsync("token");
}

async function hardReset() {
    await clearAllFamilyKeys();
    await AsyncStorage.removeItem("billbell_bills_list_cache");
    await SecureStore.deleteItemAsync("billbell_rsa_public"); 
    await SecureStore.deleteItemAsync("billbell_rsa_private"); 
    await AsyncStorage.removeItem("isLog")

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
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const text = await res.text();
  let json: any = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = null; }
  }

  if (!res.ok) {
    const errMsg = (json?.error || text || "").toString();

    const shouldForceLogout =
      (res.status === 401 && !!token) || 
      errMsg.includes("Invalid token") ||
      errMsg.includes("User not found or token is stale");

    if (shouldForceLogout) {
      await clearToken();
      await hardReset(); 
      router.replace("/(auth)/login");
      return;
    }

    if (res.status === 409 && errMsg.includes("User not in family")) {
      router.replace("/(app)/family");
      await AsyncStorage.removeItem("billbell_pending_family_code");
      return; 
    }

    throw new Error(errMsg || `Request failed (${res.status})`);
  }

  return json;
}

// --- Specific API Calls (Lifted out for internal usage) ---

const apiMembers = () => request("/family/members");
const apiShareKey = (payload: KeySharePayload) => request("/keys/shared", { method: "POST", body: JSON.stringify(payload) });
const apiGetPublicKey = (userId: number) => request(`/keys/public/${userId}`);
const apiRotateKey = () => request("/family/rotate-key", { method: "POST" });


async function ensureRsaKeyUploaded() {
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
        
    } catch (e: any) {
        const errMsg = String(e.message);
        if (errMsg.includes("Session ended. Please log in again.")) {
            throw e; 
        }
        console.warn("Public Key Upload failed, may be missing from server:", e);
        throw new Error(`Failed to upload local RSA Public Key: ${String(e.message)}`);
    }
}

// --- Key sync (version-history) ---
const FAMILY_KEY_SYNC_TS = "billbell_family_key_last_sync_ms";
const KEY_SYNC_MIN_INTERVAL_MS = 60_000; 

async function clearAllFamilyKeys() {
    console.warn("Performing aggressive clear of all cached family encryption keys.");
    await SecureStore.deleteItemAsync(FAMILY_KEY_VERSION_ALIAS);
    await SecureStore.deleteItemAsync(FAMILY_KEY_SYNC_TS); 
    
    // Performance: Use Promise.all for deletion
    const promises = [];
    for (let v = 1; v <= 100; v++) { 
        promises.push(SecureStore.deleteItemAsync(`${FAMILY_KEY_PREFIX}${v}`));
    }
    await Promise.all(promises);
}

async function ensureFamilyKeyLoaded() {
  const token = await getToken();
  if (!token) return;

  try {
      await ensureRsaKeyUploaded();
  } catch (e: any) {
      const errMsg = String(e.message);
      if (errMsg.includes("Session ended. Please log in again.")) {
          return;
      }
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
  const history = resp?.history || []; // <--- Capture history

  let currentUserId: number | undefined;
  try {
      const familyMembersResponse = await apiMembers();
      currentUserId = familyMembersResponse.current_user_id;
  } catch (e) {
      console.warn("Could not retrieve current user ID. Cannot perform self-heal if needed.");
  }

  if (!wrapped || !Number.isFinite(keyVersion) || keyVersion <= 0) {
    throw new Error("Missing encrypted key from server");
  }

  try {
    // 2. PROCESS KEY HISTORY
    // If server returned history, cache ALL keys to ensure we can read old bills
    if (Array.isArray(history) && history.length > 0) {
        console.log(`Syncing ${history.length} family keys from history...`);
        for (const k of history) {
            try {
                if (k.encrypted_key && k.key_version) {
                    const kHex = await unwrapMyKey(String(k.encrypted_key));
                    await cacheFamilyKey(kHex, Number(k.key_version));
                }
            } catch (err) {
                console.warn(`Failed to unwrap historical key v${k.key_version}`, err);
            }
        }
    }

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
            
            await apiShareKey({
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
        console.error("Self-healing failed due to API/network error or key processing:", shareError);
        selfHealFailed = true;
      }
      
      if (selfHealFailed) {
        const failureReason = !currentRawKey?.hex ? "Local key missing." : 
                            !familyId || !currentUserId ? "Family or User ID unavailable." : 
                            "Re-share API failed.";

        console.warn(`Key sync failed and self-heal failed: ${failureReason} Requires Admin Key Rotation.`);
        await clearAllFamilyKeys();
        return; 
      }
      return;
    }
    throw e;
  }
}

// --- Lazy re-encrypt on read (best-effort) ---
// BOOSTED LIMITS for faster migration
const REENC_MAX_PER_LOAD = 50; 
const REENC_COOLDOWN_MS = 5000; 
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
    } catch (e: any) {
      const errMsg = String(e.message);
      if (!errMsg.includes("Function not implemented.")) {
        console.warn("Re-encrypt failed for bill", b?.id, e);
      }
    }
  }

  if (upgraded > 0) {
    await SecureStore.setItemAsync(REENC_LAST_MS, String(now));
  }
}

async function orchestrateFamilyKeyExchange(familyId: number, targetUserId: number): Promise<void> {
    const { publicKey } = await ensureKeyPair();
    const deviceId = await getDeviceId();
    const newFamilyKeyHex = generateNewFamilyKey();
    const wrappedKeyBase64 = wrapKeyForUser(newFamilyKeyHex, publicKey as string);
    
    await apiShareKey({
      family_id: familyId,
      target_user_id: targetUserId,
      encrypted_key: wrappedKeyBase64,
      device_id: deviceId,
    });
    await cacheFamilyKey(newFamilyKeyHex, 1);
}

async function orchestrateKeyRotation(): Promise<{ familyId: number; keyVersion: number }> {
    const serverResponse = await apiRotateKey(); 
    const familyId = serverResponse.family_id;
    const newKeyVersion = serverResponse.key_version;

    if (!familyId || !newKeyVersion) {
        throw new Error("Server did not return Family ID or new Key Version.");
    }
    await AsyncStorage.removeItem("billbell_bills_list_cache");
    const newFamilyKeyHex = generateNewFamilyKey();

    const membersResponse = await apiMembers();
    const members = membersResponse.members || [];

    const sharePromises: Promise<any>[] = [];

    for (const member of members) {
        const targetUserId = member.id;
        
        sharePromises.push((async () => {
             const pubKeyResponse = await apiGetPublicKey(targetUserId); 
        
            const keysToShare = pubKeyResponse.public_keys || 
                                (pubKeyResponse.public_key ? [{
                                    public_key: pubKeyResponse.public_key,
                                    device_id: pubKeyResponse.device_id || '00000000-0000-0000-0000-000000000000' 
                                }] : []);
    
            if (keysToShare.length === 0) {
                console.warn(`Skipping key share for user ${targetUserId}: No Public Keys found.`);
                return;
            }
            
            const userDevicePromises = keysToShare.map((keyInfo: any) => {
                const recipientPublicKeyPem = keyInfo.public_key;
                const deviceId = keyInfo.device_id;
                
                if (!recipientPublicKeyPem || !deviceId) return Promise.resolve();
    
                const wrappedKeyBase64 = wrapKeyForUser(newFamilyKeyHex, recipientPublicKeyPem);
                
                const sharePayload = {
                    family_id: familyId,
                    target_user_id: targetUserId,
                    encrypted_key: wrappedKeyBase64,
                    device_id: deviceId, 
                };
                
                return apiShareKey(sharePayload);
            });
            
            await Promise.all(userDevicePromises);
        })());
    }

    await Promise.all(sharePromises);

    await cacheFamilyKey(newFamilyKeyHex, newKeyVersion);
    await pruneFamilyKeys(50); 
    console.info(`Key Rotation successful. Cached key version ${newKeyVersion} locally.`);
    
    return { familyId, keyVersion: newKeyVersion };
}

// --- API Definition ---
export const api = {
  clearAllFamilyKeys: clearAllFamilyKeys,
  hardReset: hardReset,
  // Auth
  authApple: (payload: any) => request("/auth/apple", { method: "POST", body: JSON.stringify(payload) }),
  authGoogle: (payload: any) => request("/auth/google", { method: "POST", body: JSON.stringify(payload) }),
  deleteAccount: () => request("/auth/user", { method: "DELETE" }),

  // Import / Export
  createImportCode: (ttl_minutes: number = 15) =>
    request("/import-code/create", { method: "POST", body: JSON.stringify({ ttl_minutes }) }),
  importBills: (import_code: string, bills: any[]) =>
    request("/import/bills", { method: "POST", body: JSON.stringify({ import_code, bills }) }),

  // Family
  familyCreate: async () => {
    await ensureRsaKeyUploaded(); 
    const response = await request("/family/create", { method: "POST", body: JSON.stringify({}) });
  
    if (response.family_id && response.current_user_id) {
        await orchestrateFamilyKeyExchange(response.family_id, response.current_user_id);
    }
    return response;
  },
  
  familyJoin: (family_code: string) => request("/family/join", { method: "POST", body: JSON.stringify({ family_code }) }),
  familyMembers: apiMembers,
  familyMemberRemove: (memberId: number) => request(`/family/members/${memberId}`, { method: "DELETE" }),
  familyLeave: () => request("/family/leave", { method: "POST" }),
  familySettingsGet: () => request("/family/settings"),
  familySettingsUpdate: (payload: { default_reminder_offset_days: number; default_reminder_time_local: string }) =>
    request("/family/settings", { method: "PUT", body: JSON.stringify(payload) }),
  
  familyRequests: () => request("/family/requests"),
  familyRequestRespond: (request_id: number, action: "approve" | "reject") =>
    request("/family/requests/respond", { method: "POST", body: JSON.stringify({ request_id, action }) }),

  // Devices
  deviceTokenUpsert: (payload: any) => request("/devices/token", { method: "POST", body: JSON.stringify(payload) }),

  // Key Rotation
  rotateKey: apiRotateKey,
  orchestrateKeyRotation: orchestrateKeyRotation,

  // Encrypted Bills
  billsList: async () => {
    const response = await request("/bills");
    const rawBills = Array.isArray(response?.bills) 
        ? response.bills 
        : (Array.isArray(response) ? response : []);

    if (rawBills.length === 0) {
        return { bills: [] };
    }

    try {
      await ensureFamilyKeyLoaded(); 
    } catch (e) {
      throw e;
    }

    const currentVersion = await getCachedFamilyKeyVersion(); 
    if (!currentVersion) {
      throw new Error("Cannot load family data. A Key Rotation is required by a family Admin to restore access on this device."); 
    }

    const decryptedBills = await Promise.all(
      rawBills.map(async (b: any) => {
        try {
          const creditor = await decryptDataWithVersion(b.creditor || "");
          const notes = await decryptDataWithVersion(b.notes || "");
          const amount = b.amount_encrypted ? await decryptDataWithVersion(b.amount_encrypted) : null;

          const decryptionFailed = 
              (b.creditor && creditor.text.includes(':')) ||
              (b.amount_encrypted && amount?.text?.includes(':'));
              
          if (decryptionFailed) {
             return {
                 ...b,
                  creditor: i18n.t("Decryption Failed"),
                 amount_cents: 0,
                  notes: i18n.t("Decryption Failed"),
                 amount_encrypted: undefined, 
                 cipher_version: 0, 
             };
          }

          return {
            ...b,
            creditor: creditor.text,
            amount_cents: amount ? Number(amount.text) : b.amount_cents,
            notes: notes.text,
          };
        } catch (e: any) { 
          const errorDetail = String(e.message);
          return {
              ...b,
              creditor: i18n.t("Decryption Error", { error: errorDetail }),
              amount_cents: 0,
              notes: i18n.t("Decryption Error", { error: errorDetail }),
              amount_encrypted: undefined,
              cipher_version: 0,
          };
        }
      })
    );

    try {
      await maybeReencryptBills(rawBills);
    } catch (e: any) {
      const errMsg = String(e.message);
      if (!errMsg.includes("Function not implemented.")) {
        console.warn("Lazy re-encrypt skipped:", e); 
      }
    }

    return { bills: decryptedBills };
  },

  uploadPublicKey: (public_key: string) => request("/keys/public", { method: "POST", body: JSON.stringify({ public_key }) }),
  getPublicKey: apiGetPublicKey,

  shareKey: apiShareKey,

  getMySharedKey: () => request("/keys/shared"),

  billsCreate: async (bill: any) => {
    try { 
      await ensureFamilyKeyLoaded();
    } catch (e) {
      throw e;
    }
    
    const currentVersion = await getCachedFamilyKeyVersion();
    if (!currentVersion) {
      throw new Error("Local Encryption Key Missing. Please log out and back in.");
    }

    try {
      const payload = {
        ...bill,
        creditor: await encryptData(bill.creditor),
        amount_encrypted: await encryptData(String(bill.amount_cents)),
        notes: await encryptData(bill.notes || ""),
        due_date: bill.due_date,
        status: bill.status,
        recurrence: bill.recurrence_rule ?? bill.recurrence ?? "none",
        // FIX: Explicitly send the key version used for encryption
        cipher_version: currentVersion, 
      };

      return request("/bills", { method: "POST", body: JSON.stringify(payload) });
    } catch (e: any) {
      const message = String(e.message);
      if (message.includes("Encryption failed") || message.includes("Family key not loaded")) {
            throw new Error(i18n.t("Security Key Missing Create"));
      }
      throw e;
    }
  },

  billsUpdate: async (id: number, bill: any) => {
    try { 
      await ensureFamilyKeyLoaded();
    } catch (e) {
      throw e;
    }

    const currentVersion = await getCachedFamilyKeyVersion();
    if (!currentVersion) {
throw new Error(i18n.t("Local Key Missing"));
    }
    
    try {
      const payload: any = { ...bill };

      if (bill.payment_method) {
        payload.payment_method = bill.payment_method;
      }
    
      if (Object.prototype.hasOwnProperty.call(payload, "creditor")) {
        payload.creditor = await encryptData(payload.creditor ?? "");
      }
      if (Object.prototype.hasOwnProperty.call(payload, "notes")) {
        payload.notes = await encryptData(payload.notes ?? "");
      }

      if (payload.amount_cents !== undefined && payload.amount_cents !== null) {
        payload.amount_encrypted = await encryptData(String(payload.amount_cents));
      }

      if (payload.recurrence_rule && !payload.recurrence) {
        payload.recurrence = payload.recurrence_rule;
        delete payload.recurrence_rule;
      }

      return request(`/bills/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch (e: any) {
      const message = String(e.message);
      if (message.includes("Encryption failed") || message.includes("Family key not loaded")) {
throw new Error(i18n.t("Security Key Missing Update"));
      }
      throw e;
    }
  },
  billsDelete: (id: number) => request(`/bills/${id}`, { method: "DELETE" }),
  billsMarkPaid: (id: number) => request(`/bills/${id}/mark-paid`, { method: "POST", body: JSON.stringify({}) }),
  billsSnooze: (id: number, snoozed_until: string) =>
    request(`/bills/${id}/snooze`, { method: "POST", body: JSON.stringify({ snoozed_until }) }),
};