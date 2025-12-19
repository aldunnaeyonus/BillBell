import { NativeModules, Platform, AppRegistry } from 'react-native';
import BackgroundFetch from "react-native-background-fetch";
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- Added Import
import { api } from "../../src/api/client";
import { getToken } from "../../src/auth/session";

// Lazy getters to prevent startup crashes if modules are missing
const getLiveActivityModule = () => NativeModules?.LiveActivityModule;
const getWidgetModule = () => NativeModules?.WidgetModule;

// --- 1. DEFINE HEADLESS TASK (CRITICAL FOR ANDROID) ---
// This runs when the app is terminated but Android wakes it up to update
const headlessTask = async (event: any) => {
  // Get the taskId
  const taskId = event.taskId;
  const isTimeout = event.timeout; 
  
  if (isTimeout) {
    console.warn('[BackgroundFetch] Headless TIMEOUT:', taskId);
    BackgroundFetch.finish(taskId);
    return;
  }

  console.log('[BackgroundFetch] Headless task start:', taskId);
  
  // Perform the sync
  await syncAndRefresh();
  
  // Signal completion
  BackgroundFetch.finish(taskId);
};

// --- 2. REGISTER HEADLESS TASK ---
// This must be called immediately, outside of any component
BackgroundFetch.registerHeadlessTask(headlessTask);


// --- HELPER: Get Auth Token ---
async function getMyAuthToken(): Promise<string> {
  try {    
    const token = await getToken(); // Fetch the current user token
    return token || "";
  } catch (e) {
    console.warn("Failed to get auth token", e);
    return "";
  }
}

export const startAndroidLiveActivity = (overdueText: string, count: number, nextBillId?: string) => {
  if (Platform.OS !== "android") return;
  const mod = getLiveActivityModule(); // Use getter
  if (!mod) return;

  try {
    if (nextBillId && typeof mod.startBillLiveActivityWithBillId === "function") {
      mod.startBillLiveActivityWithBillId(overdueText, count, nextBillId);
    } else if (typeof mod.startBillLiveActivity === "function") {
      mod.startBillLiveActivity(overdueText, count);
    }
  } catch (e) {
    console.warn("startAndroidLiveActivity failed:", e);
  }
};

function toNoonUtcIso(dateInput: string) {
  const d = new Date(dateInput);
  d.setUTCHours(12, 0, 0, 0);
  return d.toISOString();
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function ymdLocal(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- 3. MAIN SYNC FUNCTION ---
export async function syncAndRefresh() {
  try {
    console.log("Starting widget sync...");
    const { bills } = await api.billsList();

    // --- NEW: Cache to AsyncStorage ---
    // This matches the behavior in bills.tsx load()
    // api.billsList() returns decrypted objects, so we stringify them for storage.
    await AsyncStorage.setItem("billbell_bills_list_cache", JSON.stringify(bills));
    console.log("Bills successfully cached to storage in background.");
    // ----------------------------------

    const sanitizedBills = bills.map((b: any) => ({
      id: String(b.id),
      creditor: String(b.creditor),
      due: new Date(toNoonUtcIso(b.due_date)),
      amount_cents: Math.round(Number(b.amount_cents)),
      is_paid: b.status === 'paid',
      payment_method: b.payment_method ?? "manual",
    }));

    const widgetMod = getWidgetModule();
    const liveMod = getLiveActivityModule();

    // iOS Sync
    if (Platform.OS === "ios" && liveMod?.saveBillsToStore) {
      await liveMod.saveBillsToStore(JSON.stringify(
        sanitizedBills.map(b => ({
          id: Number(b.id),
          creditor: b.creditor,
          due_date: b.due.toISOString(),
          is_paid: b.is_paid,
          payment_method: b.payment_method
        }))
      ));
    }

    // Android Sync
    if (Platform.OS === "android") {
      const today = startOfTodayLocal();
      const unpaid = sanitizedBills.filter(b => !b.is_paid);
      const overdue = unpaid.filter(b => b.due < today);

      // Get next bill (including overdue ones)
      const next = unpaid.sort((a, b) => a.due.getTime() - b.due.getTime())[0];

      const overdueCount = sanitizedBills.length === 0 ? -1 : overdue.length;
      
      // Get Token for the "Mark Paid" button
      const token = await getMyAuthToken();

      // Update Widget
      if (widgetMod?.syncWidgetData) {
        widgetMod.syncWidgetData(
          overdueCount,
          next?.creditor ?? "None",
          next ? ymdLocal(next.due) : "",
          next?.id ?? "",
          next?.payment_method ?? "manual",
          token // Pass token to Android SharedPrefs
        );
      }

      // Update Notification
      if (liveMod?.startBillLiveActivity) {
        const headline = overdue.length > 0 ? "Needs attention" : "All clear";
        const status = overdue.length > 0 ? `${overdue.length} overdue` : "Nothing overdue";
        startAndroidLiveActivity(`${headline} • ${status}`, overdue.length, next?.id);
      }
    }

    console.log("Widget sync complete.");
  } catch (e) {
    console.error("Widget sync failed:", e);
  }
}

export async function startSummaryActivity(overdueTotal: string, overdueCount: number, monthTotal: string, monthCount: number) {
  const liveMod = getLiveActivityModule();
  if (Platform.OS === 'ios' && liveMod?.startActivity) {
    await liveMod.startActivity(overdueTotal, overdueCount, monthTotal, monthCount);
  }
}

// --- 4. INIT BACKGROUND FETCH ---
export const initBackgroundFetch = async () => {
  // Configured for both iOS and Android (Headless)
  const status = await BackgroundFetch.configure({
    minimumFetchInterval: 15, // Android limitation: runs every ~15 mins minimum
    stopOnTerminate: false,   // Continue running after app kill
    enableHeadless: true,     // Enable Headless JS
    startOnBoot: true,        // Run after device restart
    forceAlarmManager: false, // Use JobScheduler (better battery)
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
  }, async (taskId) => {
    // Foreground Fetch Event
    console.log("[BackgroundFetch] Event received:", taskId);
    await syncAndRefresh();
    BackgroundFetch.finish(taskId);
  }, (error) => {
    console.error("[BackgroundFetch] Failed to configure:", error);
  });
  
  console.log("[BackgroundFetch] Configured status:", status);
};

export function stopActivity() {
  const liveMod = getLiveActivityModule();
  if (Platform.OS === 'ios' && liveMod?.endAllActivities) {
    liveMod.endAllActivities();
  }
}