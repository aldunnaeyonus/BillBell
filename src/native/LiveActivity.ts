import { NativeModules, Platform } from 'react-native';
import BackgroundFetch from "react-native-background-fetch";
import { api } from "../../src/api/client";

const { LiveActivityModule } = NativeModules;

function toNoonUtcIso(dateInput: string) {
  // Handles "YYYY-MM-DD" or a full ISO string
  const d = new Date(dateInput);

  // Force time to 12:00 UTC to avoid date shifting backwards
  d.setUTCHours(12, 0, 0, 0);

  return d.toISOString();
}

export async function syncAndRefresh() {
  try {
    const { bills } = await api.billsList();
    const sanitizedBills = bills.map((b: any) => ({
      id: Number(b.id),
      creditor: String(b.creditor),
      due_date: toNoonUtcIso(b.due_date), 
      amount_cents: Math.round(Number(b.amount_cents)), 
      is_paid: b.status === 'paid',
      notes: b.notes || ""
    }));

    if (LiveActivityModule?.saveBillsToStore) {
      await LiveActivityModule.saveBillsToStore(JSON.stringify(sanitizedBills));
    }
    console.log("DEBUG: Sync complete.");
  } catch (e) {
    console.error("DEBUG: Sync failed:", e);
  }
}

export const initBackgroundFetch = async () => {
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
  if (Platform.OS === 'ios' && LiveActivityModule?.startActivity) {
    await LiveActivityModule.startActivity(overdueTotal, overdueCount, monthTotal, monthCount);
  }
}

export function stopActivity() {
  if (Platform.OS === 'ios' && LiveActivityModule?.endAllActivities) {
    LiveActivityModule.endAllActivities();
  }
}