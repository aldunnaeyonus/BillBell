import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://dunn-carabali.com/billMVP";

async function getToken() {
  return SecureStore.getItemAsync("token");
}

async function request(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  console.log("API request", path, "token:", token);

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = json?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

export const api = {
  authApple: (payload: any) => request("/auth/apple", { method: "POST", body: JSON.stringify(payload) }),
  authGoogle: (payload: any) => request("/auth/google", { method: "POST", body: JSON.stringify(payload) }),
  // New Delete Account method
  deleteAccount: () => request("/auth/user", { method: "DELETE" }),

  createImportCode: (ttl_minutes: number = 15) =>
  request("/import-code/create", { method: "POST", body: JSON.stringify({ ttl_minutes }) }),

  familyCreate: () => request("/family/create", { method: "POST", body: JSON.stringify({}) }),
  familyJoin: (family_code: string) => request("/family/join", { method: "POST", body: JSON.stringify({ family_code }) }),
  familyMembers: () => request("/family/members"),
  familyMemberRemove: (memberId: number) => request(`/family/members/${memberId}`, { method: "DELETE" }),
  familyLeave: () => request("/family/leave", { method: "POST" }),

  familySettingsGet: () => request("/family/settings"),
  familySettingsUpdate: (payload: { default_reminder_offset_days: number; default_reminder_time_local: string }) => request("/family/settings", { method: "PUT", body: JSON.stringify(payload) }),
  
  importBills: (import_code: string, bills: any[]) => request("/import/bills", {method: "POST", body: JSON.stringify({ import_code, bills }),}),
  
  billsList: () => request("/bills"),
  billsCreate: (bill: any) => request("/bills", { method: "POST", body: JSON.stringify(bill) }),
  billsUpdate: (id: number, bill: any) => request(`/bills/${id}`, { method: "PUT", body: JSON.stringify(bill) }),
  billsDelete: (id: number) => request(`/bills/${id}`, { method: "DELETE" }),
  billsMarkPaid: (id: number) => request(`/bills/${id}/mark-paid`, { method: "POST", body: JSON.stringify({}) }),
  billsSnooze: (id: number, snoozed_until: string) =>
    request(`/bills/${id}/snooze`, { method: "POST", body: JSON.stringify({ snoozed_until }) }),

  deviceTokenUpsert: (payload: any) =>
    request("/devices/token", { method: "POST", body: JSON.stringify(payload) }),
};
