// --- File: aldunnaeyonus/billbell/.../src/api/client.ts (COMPLETE, CORRECTED) ---
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

async function getToken() {
  return SecureStore.getItemAsync("token");
}
async function hardReset() {
    await clearAllFamilyKeys();
    await AsyncStorage.removeItem("billbell_bills_list_cache");
    // Clear the Public and Private RSA keys as well
    await SecureStore.deleteItemAsync("billbell_rsa_public"); 
    await SecureStore.deleteItemAsync("billbell_rsa_private"); 

    // Clear the session token, forcing a login
    await clearToken(); 
    
    console.warn("Performing hard application reset. User must log in again.");
    router.replace("/(auth)/login");
}

// --- Generic Request Helper ---
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

  // ---- FORCE LOGOUT CASES ----
  const errMsg = (json?.error || text || "").toString();
  if (!res.ok) {
    const shouldForceLogout =
      res.status === 401 ||
      errMsg.includes("Missing Authorization header") ||
      errMsg.includes("Invalid token") ||
      errMsg.includes("User not found or token is stale");

    // real auth failures only
    if (shouldForceLogout) {
      await clearToken();
      router.replace("/(auth)/login");
      throw new Error("Session ended. Please log in again.");
    }

    // onboarding case: user is authenticated but hasn't created/joined a family
    if (res.status === 409 && errMsg.includes("User not in family")) {
      router.replace("/(app)/family");
      throw new Error("User not in family");
    }

    throw new Error(errMsg || `Request failed (${res.status})`);
  }

  return json;
}

async function ensureRsaKeyUploaded() {
    const { publicKey } = await ensureKeyPair();
    
    // Check if the key exists and is a string
    if (typeof publicKey !== 'string' || !publicKey) {
        throw new Error("Local RSA Public Key is missing or invalid.");
    }
    
    try {
        // --- FIX: Get Device ID and include in upload payload ---
        const deviceId = await getDeviceId();

        await request("/keys/public", { 
            method: "POST", 
            body: JSON.stringify({ 
                public_key: publicKey,
                device_id: deviceId // CRITICAL NEW FIELD
            }) 
        });
        
        console.info("RSA Public Key and Device ID uploaded successfully.");
        
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
// Avoid hammering /keys/shared on every render
const FAMILY_KEY_SYNC_TS = "billbell_family_key_last_sync_ms";
const KEY_SYNC_MIN_INTERVAL_MS = 60_000; // 1 min

async function clearAllFamilyKeys() {
    console.warn("Performing aggressive clear of all cached family encryption keys.");
    
    // Clear the core version tracker and sync cooldown
    await SecureStore.deleteItemAsync(FAMILY_KEY_VERSION_ALIAS);
    await SecureStore.deleteItemAsync(FAMILY_KEY_SYNC_TS); 
    
    // Aggressively search and clear all versioned keys (v1, v2, v3, etc.)
    for (let v = 1; v <= 100; v++) { 
        await SecureStore.deleteItemAsync(`${FAMILY_KEY_PREFIX}${v}`);
    }
}

async function ensureFamilyKeyLoaded() {
  // If no token, nothing to do
  const token = await getToken();
  if (!token) return;

  // 1. CRITICAL FIX: Ensure RSA keys are generated AND uploaded before sync attempt
  try {
      await ensureRsaKeyUploaded();
  } catch (e: any) {
      const errMsg = String(e.message);
      if (errMsg.includes("Session ended. Please log in again.")) {
          return;
      }
      console.warn("Stopping family key sync due to RSA Public Key upload failure:", e);
      return; 
  }

  const now = Date.now();
  const last = parseInt((await SecureStore.getItemAsync(FAMILY_KEY_SYNC_TS)) || "0", 10);

  // If we already have an active cached key version, respect the sync interval.
  const cachedVersion = await getCachedFamilyKeyVersion();
  if (cachedVersion && Number.isFinite(last) && now - last < KEY_SYNC_MIN_INTERVAL_MS) {
    return;
  }

  // --- FIX: Pass deviceId to fetch request ---
  const deviceId = await getDeviceId(); // 1. Fetch the ID
  
  // Fetch current wrapped key for my user + current family key_version
  // 2. Pass the deviceId as a query parameter for the server to use
  const resp = await request(`/keys/shared?device_id=${deviceId}`); 
  // --- END FIX ---
  
  const wrapped = resp?.encrypted_key;
  const keyVersion = Number(resp?.key_version);
  const familyId = Number(resp?.family_id);

  // Get current user ID for the self-healing share API call
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
    // Attempt to unwrap the key fetched from the server
    const familyKeyHex = await unwrapMyKey(String(wrapped));
    await cacheFamilyKey(familyKeyHex, keyVersion);
    await pruneFamilyKeys(50); // FIX: Increased limit from 5 to 50 for safe migration

    await SecureStore.setItemAsync(FAMILY_KEY_SYNC_TS, String(now));
    
  } catch (e: any) {
    const errMsg = String(e.message);

    if (errMsg.includes("KEY_DECRYPTION_FAILED")) {
      // --- START AUTOMATIC SELF-HEALING FIX ---
      console.warn("Decryption failed. Attempting automatic key re-share (self-heal)...");
      
      let selfHealFailed = false; 
      let currentRawKey: { hex: string; version: number } | null = null;
      let publicKey: string | null = null;

      try {
        currentRawKey = await getLatestCachedRawFamilyKeyHex();
        
        const keyPair = await ensureKeyPair();
        publicKey = keyPair.publicKey as string; 
        
        const deviceId = await getDeviceId(); // Retrieve device ID for the self-heal payload
        
        if (currentRawKey?.hex && publicKey && familyId && currentUserId) {
            const wrappedKeyBase64 = wrapKeyForUser(currentRawKey.hex, publicKey);
            
            await api.shareKey({
                family_id: familyId,
                target_user_id: currentUserId,
                encrypted_key: wrappedKeyBase64,
                device_id: deviceId, // CRITICAL FIX: Include device_id in self-heal share payload
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
        const failureReason = !currentRawKey?.hex ? "Local key missing (re-install/migration issue)." : 
                            !familyId || !currentUserId ? "Family or User ID unavailable." : 
                            "Re-share API failed.";

        console.warn(`Key sync failed and self-heal failed: ${failureReason} Requires Admin Key Rotation. Key is currently unavailable.`);
        
        // --- FINAL FIX: Use aggressive clear to ensure no old key versions interfere ---
        await clearAllFamilyKeys();
        // -----------------------------------------------------------------------------
        
        return; 
      }
      
      return;
    }
    
    // For any other general API error (non-decryption error)
    throw e;
  }
}

// --- Lazy re-encrypt on read (best-effort) ---
const REENC_MAX_PER_LOAD = 3;
const REENC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
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
      // Decrypt using fallback (will try older cached versions)
      const creditor = await decryptDataWithVersion(b.creditor || "");
      const notes = await decryptDataWithVersion(b.notes || "");
      const amount = b.amount_encrypted ? await decryptDataWithVersion(b.amount_encrypted) : null;

      // Re-encrypt under CURRENT active key (encryptData uses active version)
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
      // FIX: Suppress warning if it's the known "Function not implemented." error
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

/**
 * Orchestrates the creation of a new family key, wraps it for the target user, 
 * stores it on the server, and caches it locally. This is for the CREATOR only.
 */
async function orchestrateFamilyKeyExchange(
  familyId: number, 
  targetUserId: number, 
): Promise<void> {
    // 1. Get the recipient's public key (the creator's key)
    const pubKeyResponse = await api.getPublicKey(targetUserId);

    const recipientPublicKeyPem = pubKeyResponse.public_key;
    
    // FIX: Must use the device_id from the public key response
    const deviceId = (pubKeyResponse.device_id as string) || (await getDeviceId()); 

    if (!recipientPublicKeyPem) {
        throw new Error("Could not retrieve creator's Public Key for key exchange.");
    }
    
    // 2. Generate a new, random Family Key (Master Key)
    const newFamilyKeyHex = generateNewFamilyKey();
    
    // 3. Wrap the Master Key with the Creator's Public Key (Client-side encryption)
    const wrappedKeyBase64 = wrapKeyForUser(newFamilyKeyHex, recipientPublicKeyPem);
    
    // 4. Store the wrapped key on the server via POST /keys/shared
    const sharePayload = {
      family_id: familyId,
      target_user_id: targetUserId,
      encrypted_key: wrappedKeyBase64,
      device_id: deviceId, // CRITICAL FIX: Include device_id
    };
    
    await api.shareKey(sharePayload);
    
    // 5. Cache the raw key locally for immediate use. Key version is 1 for a new family.
    await cacheFamilyKey(newFamilyKeyHex, 1);
}

// --- Key Rotation Orchestration Logic ---
/**
 * Orchestrates the full Key Rotation process. Requires Admin privileges.
 */
async function orchestrateKeyRotation(): Promise<{ familyId: number; keyVersion: number }> {
    // 1. Trigger server to increment key_version (POST /family/rotate-key)
    const serverResponse = await api.rotateKey(); 
    const familyId = serverResponse.family_id;
    const newKeyVersion = serverResponse.key_version;

    if (!familyId || !newKeyVersion) {
        throw new Error("Server did not return Family ID or new Key Version.");
    }
    
    // 2. Generate a new, random Family Key (Master Key)
    const newFamilyKeyHex = generateNewFamilyKey();

    // 3. Fetch all family members
    const membersResponse = await api.familyMembers();
    const members = membersResponse.members || [];

    // 4. Wrap and Share the key for every member
    for (const member of members) {
        const targetUserId = member.id;
        
        // Fetch recipient's ALL Public Keys (one per device)
        const pubKeyResponse = await api.getPublicKey(targetUserId); 
        
        // Normalize keysToShare to be an array of objects {public_key, device_id}
        const keysToShare = pubKeyResponse.public_keys || 
                            (pubKeyResponse.public_key ? [{
                                public_key: pubKeyResponse.public_key,
                                device_id: pubKeyResponse.device_id || '00000000-0000-0000-0000-000000000000' // Legacy fallback
                            }] : []);

        if (keysToShare.length === 0) {
            console.warn(`Skipping key share for user ${targetUserId}: No Public Keys found. User needs to re-upload their key.`);
            continue; 
        }

        for (const keyInfo of keysToShare) {
            const recipientPublicKeyPem = keyInfo.public_key;
            const deviceId = keyInfo.device_id;
            
            if (!recipientPublicKeyPem || !deviceId) {
                 console.warn(`Skipping key share for user ${targetUserId}: Missing Public Key or Device ID in server response.`);
                 continue;
            }

            // Wrap the new Master Key with the member's Public Key
            const wrappedKeyBase64 = wrapKeyForUser(newFamilyKeyHex, recipientPublicKeyPem);
            
            // Share the key with the new key version
            const sharePayload = {
                family_id: familyId,
                target_user_id: targetUserId,
                encrypted_key: wrappedKeyBase64,
                device_id: deviceId, // CRITICAL FIX: Include device_id in share payload
            };
            
            // 5. Store the wrapped key on the server
            await api.shareKey(sharePayload);
            console.log(`Key shared for user ${targetUserId} device ${deviceId} at version ${newKeyVersion}`);
        }
    }

    // 6. Cache the raw key locally for the admin's device
    await cacheFamilyKey(newFamilyKeyHex, newKeyVersion);
    await pruneFamilyKeys(50); // FIX: Increased limit from 5 to 50 for safe migration
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
    // CRITICAL FIX: Guarantee Public Key is on server before creation starts.
    await ensureRsaKeyUploaded(); 

    // 1. Create the family on the server
    const response = await request("/family/create", { method: "POST", body: JSON.stringify({}) });
    
    const familyId = response.family_id;
    const currentUserId = response.current_user_id;

    if (familyId && currentUserId) {
        // 2. Orchestrate the key exchange (generate, wrap, store, and cache)
        await orchestrateFamilyKeyExchange(familyId, currentUserId);
    } else {
        // If the server didn't return IDs, it's a fatal error
        throw new Error("Family created, but required data (ID or UserID) was missing for key setup.");
    }

    return response;
  },
  
  familyJoin: (family_code: string) => request("/family/join", { method: "POST", body: JSON.stringify({ family_code }) }),
  familyMembers: () => request("/family/members"),
  familyMemberRemove: (memberId: number) => request(`/family/members/${memberId}`, { method: "DELETE" }),
  familyLeave: () => request("/family/leave", { method: "POST" }),
  familySettingsGet: () => request("/family/settings"),
  familySettingsUpdate: (payload: { default_reminder_offset_days: number; default_reminder_time_local: string }) =>
    request("/family/settings", { method: "PUT", body: JSON.stringify(payload) }),

  // Devices
  deviceTokenUpsert: (payload: any) => request("/devices/token", { method: "POST", body: JSON.stringify(payload) }),

  // --- KEY ROTATION METHODS ---
  rotateKey: () => request("/family/rotate-key", { method: "POST" }),
  orchestrateKeyRotation: orchestrateKeyRotation, // <--- ADDED EXPORT
  // ----------------------------

  // --- Encrypted Bills Methods ---
  billsList: async () => {
try {
      await ensureFamilyKeyLoaded(); // Fetches key if needed
    } catch (e) {
      throw e;
    }

    // --- CRITICAL FIX: Mandatory Key Presence Check ---
    const currentVersion = await getCachedFamilyKeyVersion(); // Check local cache
    if (!currentVersion) {
      // Throw a clean, user-facing error if key is still missing
      throw new Error("Cannot load family data. A Key Rotation is required by a family Admin to restore access on this device."); // <--- HITS HERE
    }
    // --------------------------------------------------

    const response = await request("/bills");
    const rawBills = response?.bills || response || [];

    const decryptedBills = await Promise.all(
      rawBills.map(async (b: any) => {
try {
          const creditor = await decryptDataWithVersion(b.creditor || "");
          const notes = await decryptDataWithVersion(b.notes || "");
          const amount = b.amount_encrypted ? await decryptDataWithVersion(b.amount_encrypted) : null;

          // Check if decryption failed by looking for the ciphertext delimiter (:)
          const decryptionFailed = 
              (b.creditor && creditor.text.includes(':')) ||
              (b.amount_encrypted && amount?.text?.includes(':'));
              
          if (decryptionFailed) {
             console.info(`Decryption failed for bill ${b.id}: Key missing or corrupted data. Showing placeholder.`);
             console.info(`Decryption failed for bill ${b.id}: Key missing or corrupted data. Showing placeholder.`);
             
             // Return a placeholder object to prevent raw ciphertext display
             return {
                 ...b,
                 creditor: '[DECRYPTION FAILED]',
                 amount_cents: 0,
                 notes: '[DECRYPTION FAILED]',
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
        } catch (e: any) { // <--- Catch the new specific error
          // This catches the specific DECRYPT_FAILED_ALL_KEYS error from EncryptionService
          const errorDetail = String(e.message);
          console.error(`Decryption failed for bill ${b.id}. Root cause: ${errorDetail}`, e);
          
          // On unexpected error, return a clearly failed object
          return {
              ...b,
              creditor: `[ERROR: ${errorDetail}]`, // Show the error in the UI for debug
              amount_cents: 0,
              notes: `[ERROR: ${errorDetail}]`,
              amount_encrypted: undefined,
              cipher_version: 0,
          };
        }
      })
    );

    // Best-effort lazy migration (doesn't block UI)
    try {
      await maybeReencryptBills(rawBills);
    } catch (e: any) {
      // FIX: Suppress warning if it's the known "Function not implemented." error
      const errMsg = String(e.message);
      if (!errMsg.includes("Function not implemented.")) {
        console.warn("Lazy re-encrypt skipped:", e); 
      }
    }

    return { bills: decryptedBills };
  },

  uploadPublicKey: (public_key: string) => request("/keys/public", { method: "POST", body: JSON.stringify({ public_key }) }),
  getPublicKey: (userId: number) => request(`/keys/public/${userId}`),

  // FIX: Update shareKey payload definition to include device_id
shareKey: (payload: { family_id: number; target_user_id: number; encrypted_key: string; device_id: string }) => // <--- CORRECT PAYLOAD
  request("/keys/shared", { method: "POST", body: JSON.stringify(payload) }),

  getMySharedKey: () => request("/keys/shared"),

  billsCreate: async (bill: any) => {
    try { // FIX: Added try/catch
      await ensureFamilyKeyLoaded();
    } catch (e) {
      throw e;
    }
    
    // Safety check for key presence before encrypting
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
      };

      return request("/bills", { method: "POST", body: JSON.stringify(payload) });
    } catch (e: any) {
      // Clearer error message if encryption fails
      const message = String(e.message);
      if (message.includes("Encryption failed") || message.includes("Family key not loaded")) {
         throw new Error("Security Key Missing: The app could not find the required encryption key locally to create the bill. Please log out and back in.");
      }
      throw e;
    }
  },

  billsUpdate: async (id: number, bill: any) => {
    try { // FIX: Added try/catch
      await ensureFamilyKeyLoaded();
    } catch (e) {
      throw e;
    }

    // Safety check for key presence before encrypting
    const currentVersion = await getCachedFamilyKeyVersion();
    if (!currentVersion) {
      throw new Error("Local Encryption Key Missing for update. Please log out and back in.");
    }
    
    try {
      const payload: any = { ...bill };

      if (bill.payment_method) {
      payload.payment_method = bill.payment_method;
    }
    
      // IMPORTANT: allow empty-string updates (""), not just truthy values
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
      // Clearer error message if encryption fails
      const message = String(e.message);
      if (message.includes("Encryption failed") || message.includes("Family key not loaded")) {
         throw new Error("Security Key Missing: The app could not find the required encryption key locally to update the bill. Please log out and back in.");
      }
      throw e;
    }
  },
  billsDelete: (id: number) => request(`/bills/${id}`, { method: "DELETE" }),

  billsMarkPaid: (id: number) => request(`/bills/${id}/mark-paid`, { method: "POST", body: JSON.stringify({}) }),

  billsSnooze: (id: number, snoozed_until: string) =>
    request(`/bills/${id}/snooze`, { method: "POST", body: JSON.stringify({ snoozed_until }) }),
};