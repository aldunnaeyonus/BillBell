import * as SecureStore from "expo-secure-store";
import { encryptData, decryptData } from '../security/EncryptionService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://dunn-carabali.com/billMVP";

async function getToken() {
  return SecureStore.getItemAsync("token");
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
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = json?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
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
  familyJoin: (family_code: string) => request("/family/join", { method: "POST", body: JSON.stringify({ family_code }) }),
  familyMembers: () => request("/family/members"),
  familyMemberRemove: (memberId: number) => request(`/family/members/${memberId}`, { method: "DELETE" }),
  familyLeave: () => request("/family/leave", { method: "POST" }),
  familySettingsGet: () => request("/family/settings"),
  familySettingsUpdate: (payload: { default_reminder_offset_days: number; default_reminder_time_local: string }) => 
    request("/family/settings", { method: "PUT", body: JSON.stringify(payload) }),

  // Devices
  deviceTokenUpsert: (payload: any) =>
    request("/devices/token", { method: "POST", body: JSON.stringify(payload) }),

  // --- Encrypted Bills Methods ---

  billsList: async () => {
    const response = await request("/bills");
    const rawBills = response.bills || response; // Handle { bills: [] } or []

    // Decrypt locally
    const decryptedBills = await Promise.all(
      rawBills.map(async (b: any) => {
        try {
          return {
            ...b,
            creditor: await decryptData(b.creditor),
            // Handle legacy unencrypted amounts OR new encrypted amounts
            amount_cents: b.amount_encrypted 
              ? Number(await decryptData(b.amount_encrypted)) 
              : b.amount_cents,
            notes: await decryptData(b.notes || ""),
          };
        } catch (e) {
          console.error("Failed to decrypt bill", b.id, e);
          return b; // Fallback: return raw data if decryption fails
        }
      })
    );

    // Return structure matching original API ( { bills: [...] } )
    return { bills: decryptedBills };
  },

  billsCreate: async (bill: any) => {
    // Encrypt sensitive fields before sending
    const payload = {
      ...bill,
      creditor: await encryptData(bill.creditor),
      amount_encrypted: await encryptData(String(bill.amount_cents)), 
      notes: await encryptData(bill.notes || ""),
      
      // Fields kept plain for DB logic
      due_date: bill.due_date,
      status: bill.status,
      recurrence_rule: bill.recurrence_rule
    };

    return request("/bills", { method: "POST", body: JSON.stringify(payload) });
  },

  billsUpdate: async (id: number, bill: any) => {
    const payload = { ...bill };

    // Encrypt if these fields are present in the update object
    if (payload.creditor) payload.creditor = await encryptData(payload.creditor);
    if (payload.notes) payload.notes = await encryptData(payload.notes);
    if (payload.amount_cents !== undefined) {
      payload.amount_encrypted = await encryptData(String(payload.amount_cents));
      // Optionally remove raw amount_cents if you don't want it sent at all
      // delete payload.amount_cents; 
    }

    return request(`/bills/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },

  billsDelete: (id: number) => request(`/bills/${id}`, { method: "DELETE" }),
  
  billsMarkPaid: (id: number) => request(`/bills/${id}/mark-paid`, { method: "POST", body: JSON.stringify({}) }),
  
  billsSnooze: (id: number, snoozed_until: string) =>
    request(`/bills/${id}/snooze`, { method: "POST", body: JSON.stringify({ snoozed_until }) }),
};