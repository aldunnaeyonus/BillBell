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
} from "../security/EncryptionService";
import { clearToken } from "../auth/session";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://dunn-carabali.com/billMVP";

async function getToken() {
  return SecureStore.getItemAsync("token");
}

// --- Generic Request Helper ---
async function request(path: string, opts: RequestInit = {}) {
// ... (rest of request function is unchanged)
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
    errMsg.includes("Invalid token");

  // real auth failures only
  if (shouldForceLogout) {
    await clearToken();
    router.replace("/(auth)/login");
    throw new Error("Session ended. Please log in again.");
  }

  // onboarding case: user is authenticated but hasn't created/joined a family
  if (res.status === 409 && errMsg.includes("User not in family")) {
    // send them to your create/join family screen (pick the correct route)
    router.replace("/(app)/family"); // <-- change to your actual screen path
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
        // Pass the string value directly
        await api.uploadPublicKey(publicKey); 
    } catch (e: any) {
        throw new Error(`Failed to upload local RSA Public Key: ${String(e.message)}`);
    }
}


// --- Key sync (version-history) ---
// Avoid hammering /keys/shared on every render
const FAMILY_KEY_SYNC_TS = "billbell_family_key_last_sync_ms";
const KEY_SYNC_MIN_INTERVAL_MS = 60_000; // 1 min

async function ensureFamilyKeyLoaded() {
  // If no token, nothing to do
  const token = await getToken();
  if (!token) return;

  // 1. CRITICAL FIX: Ensure RSA keys are generated AND uploaded before sync attempt
  try {
      await ensureRsaKeyUploaded();
  } catch (e: any) {
      // If public key upload failed, we can't proceed to sync family key
      console.warn("Stopping family key sync due to RSA Public Key upload failure:", e);
      return; 
  }

  const now = Date.now();
  const last = parseInt((await SecureStore.getItemAsync(FAMILY_KEY_SYNC_TS)) || "0", 10);

  // If we already have an active cached key version, respect the sync interval.
  // If the cached version is missing/null, force a sync even within the interval.
  const cachedVersion = await getCachedFamilyKeyVersion();
  if (cachedVersion && Number.isFinite(last) && now - last < KEY_SYNC_MIN_INTERVAL_MS) {
    return;
  }

  // Fetch current wrapped key for my user + current family key_version
  // KeysController returns: { encrypted_key, family_id, key_version }
  const resp = await request("/keys/shared");
  const wrapped = resp?.encrypted_key;
  const keyVersion = Number(resp?.key_version);

  if (!wrapped || !Number.isFinite(keyVersion) || keyVersion <= 0) {
    throw new Error("Missing encrypted key from server");
  }

  const familyKeyHex = await unwrapMyKey(String(wrapped));
  await cacheFamilyKey(familyKeyHex, keyVersion);
  await pruneFamilyKeys(5);

  await SecureStore.setItemAsync(FAMILY_KEY_SYNC_TS, String(now));
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
    } catch (e) {
      console.warn("Re-encrypt failed for bill", b?.id, e);
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
    // Note: If this fails, the error is thrown up to the caller (familyCreate)

    const recipientPublicKeyPem = pubKeyResponse.public_key;
    
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
    };
    
    // api.shareKey is defined below
    await api.shareKey(sharePayload);
    
    // 5. Cache the raw key locally for immediate use. Key version is 1 for a new family.
    await cacheFamilyKey(newFamilyKeyHex, 1);
}

// --- API Definition ---
export const api = {
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
    // If this fails, it throws a non-409 error, allowing the user to retry the button.
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

  // --- Encrypted Bills Methods ---
  billsList: async () => {
    await ensureFamilyKeyLoaded();

    const response = await request("/bills");
    const rawBills = response?.bills || response || [];

    const decryptedBills = await Promise.all(
      rawBills.map(async (b: any) => {
        try {
          const creditor = await decryptDataWithVersion(b.creditor);
          const notes = await decryptDataWithVersion(b.notes || "");
          const amount = b.amount_encrypted ? await decryptDataWithVersion(b.amount_encrypted) : null;

          return {
            ...b,
            creditor: creditor.text,
            amount_cents: amount ? Number(amount.text) : b.amount_cents,
            notes: notes.text,
          };
        } catch (e) {
          console.error("Failed to decrypt bill", b.id, e);
          return b;
        }
      })
    );

    // Best-effort lazy migration (doesn't block UI)
    try {
      await maybeReencryptBills(rawBills);
    } catch (e) {
      console.warn("Lazy re-encrypt skipped:", e);
    }

    return { bills: decryptedBills };
  },

  uploadPublicKey: (public_key: string) =>
    request("/keys/public", { method: "POST", body: JSON.stringify({ public_key }) }),

  getPublicKey: (userId: number) => request(`/keys/public/${userId}`),

  shareKey: (payload: { family_id: number; target_user_id: number; encrypted_key: string }) =>
    request("/keys/shared", { method: "POST", body: JSON.stringify(payload) }),

  getMySharedKey: () => request("/keys/shared"),

  billsCreate: async (bill: any) => {
    await ensureFamilyKeyLoaded();
    
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
    await ensureFamilyKeyLoaded();

    // Safety check for key presence before encrypting
    const currentVersion = await getCachedFamilyKeyVersion();
    if (!currentVersion) {
      throw new Error("Local Encryption Key Missing for update. Please log out and back in.");
    }
    
    try {
      const payload: any = { ...bill };

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