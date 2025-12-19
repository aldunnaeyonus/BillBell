import { NativeModules, Platform } from 'react-native';
import BackgroundFetch from "react-native-background-fetch";
import { api } from "../../src/api/client";

// Lazy getters so importing this file never crashes if modules aren't present yet
const getLiveActivityModule = () => NativeModules?.LiveActivityModule;
const getWidgetModule = () => NativeModules?.WidgetModule;

// Optional: call this once (e.g., from app startup) to debug native availability
export const debugNativeModules = () => {
  try {
    console.log("NativeModules keys:", Object.keys(NativeModules));
    console.log("LiveActivityModule:", getLiveActivityModule());
    console.log("WidgetModule:", getWidgetModule());
  } catch (e) {
    console.log("NativeModules debug failed:", e);
  }
};


export const startAndroidLiveActivity = (overdueText: string, count: number, nextBillId?: string) => {
  if (Platform.OS !== "android") return;

  let mod: any;
  try {
    // IMPORTANT: property access can throw if TurboModule parsing fails
    mod = NativeModules.LiveActivityModule;
  } catch (e) {
    // Native module is currently broken/unavailable -> don't crash JS
    console.warn("LiveActivityModule unavailable:", e);
    return;
  }

  if (!mod) return;

  try {
    if (nextBillId && typeof mod.startBillLiveActivityWithBillId === "function") {
      mod.startBillLiveActivityWithBillId(overdueText, count, nextBillId);
      return;
    }
    if (typeof mod.startBillLiveActivity === "function") {
      mod.startBillLiveActivity(overdueText, count);
    }
  } catch (e) {
    console.warn("startAndroidLiveActivity failed:", e);
  }
};


export const endAndroidLiveActivity = () => {
  if (Platform.OS !== 'android') return;

  const mod = getLiveActivityModule();
  if (mod?.endBillBillLiveActivity) {
    try {
      mod.endBillBillLiveActivity();
    } catch {
      // swallow
    }
  }
};

// iOS uses a noon-UTC trick to avoid shifting backwards.
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
  // stable "YYYY-MM-DD" for widget display
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function syncAndRefresh() {
  try {
    const { bills } = await api.billsList();

    const sanitizedBills = bills.map((b: any) => ({
      id: String(b.id),
      creditor: String(b.creditor),
      due: new Date(toNoonUtcIso(b.due_date)),
      amount_cents: Math.round(Number(b.amount_cents)),
      is_paid: b.status === 'paid',
      notes: b.notes || "",
      payment_method: b.payment_method ?? "manual",
    }));

    const liveMod = getLiveActivityModule();
    const widgetMod = getWidgetModule();

    // ---- iOS: keep existing behavior if you have it ----
    if (Platform.OS === "ios" && liveMod?.saveBillsToStore) {
      await liveMod.saveBillsToStore(JSON.stringify(
        sanitizedBills.map(b => ({
          id: Number(b.id),
          creditor: b.creditor,
          due_date: b.due.toISOString(),
          amount_cents: b.amount_cents,
          is_paid: b.is_paid,
          notes: b.notes,
          payment_method: b.payment_method
        }))
      ));
    }

    // ---- ANDROID: compute widget entry + push into WidgetModule + update ongoing notification ----
    if (Platform.OS === "android") {
      const today = startOfTodayLocal();

      const unpaid = sanitizedBills.filter(b => !b.is_paid);
      const overdue = unpaid.filter(b => b.due < today);

      const next = unpaid
        .filter(b => b.due >= today)
        .sort((a, b) => a.due.getTime() - b.due.getTime())[0];

      // Match iOS: if there are no bills at all, overdueCount is -1 ("no data" state)
      const overdueCount = sanitizedBills.length === 0 ? -1 : overdue.length;

      // Update Android widget
      if (widgetMod?.syncWidgetData) {
        widgetMod.syncWidgetData(
          overdueCount,
          next?.creditor ?? "None",
          next ? ymdLocal(next.due) : "",
          next?.id ?? "",
          next?.payment_method ?? "manual"
        );
      }

      // Update Android ongoing notification
      const headline = overdue.length > 0 ? "Needs attention" : "All clear";
      const status = overdue.length > 0 ? `${overdue.length} overdue` : "Nothing overdue";
      const notificationText = `${headline} • ${status}`;

      if (liveMod?.startBillLiveActivity) {
        startAndroidLiveActivity(notificationText, overdue.length, next?.id);
      }
    }

    console.log("DEBUG: Sync complete.");
  } catch (e) {
    console.error("DEBUG: Sync failed:", e);
  }
}

export const initBackgroundFetch = async () => {
  // Your file currently only enables BackgroundFetch for iOS.
  if (Platform.OS !== 'ios') return;

  return await BackgroundFetch.configure({
    minimumFetchInterval: 15,
    stopOnTerminate: false,
    enableHeadless: true,
    startOnBoot: true,
  }, async (taskId) => {
    await syncAndRefresh();
    BackgroundFetch.finish(taskId);
  }, (error) => console.error(error));
};

export async function startSummaryActivity(overdueTotal: string, overdueCount: number, monthTotal: string, monthCount: number) {
  const liveMod = getLiveActivityModule();
  if (Platform.OS === 'ios' && liveMod?.startActivity) {
    await liveMod.startActivity(overdueTotal, overdueCount, monthTotal, monthCount);
  }
}

export function stopActivity() {
  const liveMod = getLiveActivityModule();
  if (Platform.OS === 'ios' && liveMod?.endAllActivities) {
    liveMod.endAllActivities();
  }
}
