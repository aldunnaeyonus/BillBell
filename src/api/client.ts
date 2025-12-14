import * as SecureStore from "expo-secure-store";
import {
  ensureKeyPair,
  unwrapMyKey,
  cacheFamilyKey,
  pruneFamilyKeys,
  getCachedFamilyKeyVersion,
  encryptData,
  decryptDataWithVersion,
} from "../security/EncryptionService";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://dunn-carabali.com/billMVP";

async function getToken() {
  return SecureStore.getItemAsync("token");
}

// --- Generic Request Helper ---
async function request(path: string, opts: RequestInit = {}) {
  const token = await getToken();

  const isPublic =
    path.startsWith("/auth/") ||
    path === "/health" ||
    path === "/status";

  if (!token && !isPublic) {
    throw new Error("Not authenticated. Please log in again.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const text = await res.text();

  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const msg = json?.error || text || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}


// --- Key sync (version-history) ---
// Avoid hammering /keys/shared on every render
const FAMILY_KEY_SYNC_TS = "billbell_family_key_last_sync_ms";
const KEY_SYNC_MIN_INTERVAL_MS = 60_000; // 1 min

async function ensureFamilyKeyLoaded() {
  // If no token, nothing to do
  const token = await getToken();
  if (!token) return;

  // Ensure we have RSA keys (needed to unwrap)
  await ensureKeyPair();

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
  familyCreate: () => request("/family/create", { method: "POST", body: JSON.stringify({}) }),
  familyJoin: (family_code: string) =>
    request("/family/join", { method: "POST", body: JSON.stringify({ family_code }) }),
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
  },

  billsUpdate: async (id: number, bill: any) => {
    await ensureFamilyKeyLoaded();

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
  },

  billsDelete: (id: number) => request(`/bills/${id}`, { method: "DELETE" }),

  billsMarkPaid: (id: number) => request(`/bills/${id}/mark-paid`, { method: "POST", body: JSON.stringify({}) }),

  billsSnooze: (id: number, snoozed_until: string) =>
    request(`/bills/${id}/snooze`, { method: "POST", body: JSON.stringify({ snoozed_until }) }),
};
