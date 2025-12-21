import { NativeModules, Platform, AppRegistry } from 'react-native';
import BackgroundFetch from "react-native-background-fetch";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "../../src/api/client";
import { getToken } from "../../src/auth/session";
import i18n from "../api/i18n";

const getLiveActivityModule = () => NativeModules?.LiveActivityModule;
const getWidgetModule = () => NativeModules?.WidgetModule;

// --- 1. DEFINE HEADLESS TASK (CRITICAL FOR ANDROID) ---
const headlessTask = async (event: any) => {
  const taskId = event.taskId;
  const isTimeout = event.timeout; 
  
  if (isTimeout) {
    console.warn('[BackgroundFetch] Headless TIMEOUT:', taskId);
    BackgroundFetch.finish(taskId);
    return;
  }

  console.log('[BackgroundFetch] Headless task start:', taskId);
  
  // FIX: Pass true to indicate we are running in the background/headless
  // preventing SecureStore access which causes crashes on Android
  await syncAndRefresh(true);
  
  BackgroundFetch.finish(taskId);
};

// --- 2. REGISTER HEADLESS TASK ---
BackgroundFetch.registerHeadlessTask(headlessTask);

async function getMyAuthToken(): Promise<string> {
  try {    
    // Note: getToken uses SecureStore. This might fail in headless mode on some devices.
    // If it fails, the widget "Mark Paid" button just won't update the token, which is acceptable fail-safe.
    const token = await getToken(); 
    return token || "";
  } catch (e) {
    return "";
  }
}

export const startAndroidLiveActivity = (overdueText: string, count: number, nextBillId?: string) => {
  if (Platform.OS !== "android") return;
  const mod = getLiveActivityModule();
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
// FIX: Added backgroundMode parameter
export async function syncAndRefresh(backgroundMode = false) {
  try {
    console.log(`Starting widget sync (Background: ${backgroundMode})...`);
    
    let bills: any[] = [];

    if (backgroundMode && Platform.OS === 'android') {
      // FIX: In Android Headless mode, SecureStore is unavailable/unstable.
      // We CANNOT call api.billsList() because it attempts decryption.
      // We must rely solely on the cached decrypted data.
      const cached = await AsyncStorage.getItem("billbell_bills_list_cache");
      if (cached) {
        bills = JSON.parse(cached);
        console.log("Loaded bills from cache for background sync.");
      } else {
        console.log("No cache available for background sync.");
        return; // Abort if no data
      }
    } else {
      // Foreground: Try to fetch fresh data
      try {
        const res = await api.billsList();
        bills = res.bills;
        // Update cache for the background task to use later
        await AsyncStorage.setItem("billbell_bills_list_cache", JSON.stringify(bills));
      } catch (e) {
        console.warn("Network sync failed, falling back to cache", e);
        const cached = await AsyncStorage.getItem("billbell_bills_list_cache");
        if (cached) bills = JSON.parse(cached);
      }
    }

    const sanitizedBills = bills.map((b: any) => ({
      id: String(b.id),
      creditor: String(b.creditor),
      due: new Date(toNoonUtcIso(b.due_date)),
      amount_cents: Math.round(Number(b.amount_cents)),
      is_paid: Boolean(b.paid_at || b.is_paid || b.status === "paid"),
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
      
      // Try to get token, but don't crash if it fails in background
      let token = "";
      if (!backgroundMode) {
          token = await getMyAuthToken();
      }

      // Update Widget
      if (widgetMod?.syncWidgetData) {
        widgetMod.syncWidgetData(
          overdueCount,
          next?.creditor ?? "None",
          next ? ymdLocal(next.due) : "",
          next?.id ?? "",
          next?.payment_method ?? "manual",
          token
        );
      }

      // Update Notification
      if (liveMod?.startBillLiveActivity) {
        const headline = overdue.length > 0 ? i18n.t("Needs attention") : i18n.t("All clear");
        const status = overdue.length > 0 
          ? i18n.t("{{count}} overdue", { count: overdue.length }) 
          : i18n.t("Nothing overdue");
          
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
  const status = await BackgroundFetch.configure({
    minimumFetchInterval: 15,
    stopOnTerminate: false,
    enableHeadless: true,
    startOnBoot: true,
    forceAlarmManager: false,
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
  }, async (taskId) => {
    console.log("[BackgroundFetch] Event received:", taskId);
    await syncAndRefresh(false); // Foreground fetch
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