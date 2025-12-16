import { NativeModules, Platform } from 'react-native';
import BackgroundFetch from "react-native-background-fetch";
import { api } from "../../src/api/client";

const { LiveActivityModule } = NativeModules;

// Call this once after your app loads:
if (LiveActivityModule?.clearAllSavedBills) {
  //LiveActivityModule.clearAllSavedBills();
}

/**
 * Shared logic to fetch data and tell the native side to reload widgets.
 */
export async function syncAndRefresh() {
  try {
    // 1. Fetch and Decrypt: billsList handles the key loading automatically
    const { bills } = await api.billsList(); 

    // 2. Filter: Only send unpaid bills to the widget/Live Activity for summary
    const unpaidBills = bills.filter((b: any) => b.status !== 'paid');

    // 3. Save to Native Store: Bridge the data to the App Group
    if (NativeModules.LiveActivityModule?.saveBillsToStore) {
      await NativeModules.LiveActivityModule.saveBillsToStore(JSON.stringify(unpaidBills));
    }

    // 4. Update the Widget View
    if (NativeModules.LiveActivityModule?.refreshWidget) {
      NativeModules.LiveActivityModule.refreshWidget();
    }
    
    console.log("Sync complete: Data updated in background.");
  } catch (e) {
    console.error("Sync failed:", e);
  }
}

/**
 * Initializes the background fetch listener.
 * Call this in your App.js useEffect.
 */
export const initBackgroundFetch = async () => {
  if (Platform.OS !== 'ios') return;

  const status = await BackgroundFetch.configure({
    minimumFetchInterval: 15,
    stopOnTerminate: false,
    enableHeadless: true,
    startOnBoot: true,
  }, async (taskId) => {
    console.log("[BackgroundFetch] Task received: ", taskId);

    // Perform the sync
    await syncAndRefresh();

    BackgroundFetch.finish(taskId);
  }, (error) => {
    console.error("[BackgroundFetch] FAILED: ", error);
  });

  return status;
};

/**
 * Starts (or updates) the Live Activity with summary data.
 * @param overdueTotal - Formatted string (e.g. "$150.00")
 * @param overdueCount - Integer count of overdue bills
 * @param monthTotal   - Formatted string (e.g. "$50.00")
 * @param monthCount   - Integer count of remaining bills this month
 */
export async function startSummaryActivity(
  overdueTotal: string, 
  overdueCount: number, 
  monthTotal: string, 
  monthCount: number
) {
  // Safety Check: Do nothing on Android
  if (Platform.OS !== 'ios') return;

  try {
    // Note: We generally do NOT need to stop old activities first if the 
    // Native Module handles "update vs start" logic internally (which yours now does).
    // But if you prefer a hard reset every time, you can keep the endAllActivities call.
    
    // Send the 4 new arguments to the Native Module
    if (LiveActivityModule?.startActivity) {
       await LiveActivityModule.startActivity(overdueTotal, overdueCount, monthTotal, monthCount);
       console.log("Live Activity updated with summary stats");
    }
  } catch (e) {
    console.warn("Live Activity Error:", e);
  }
}

export function stopActivity() {
  if (Platform.OS !== 'ios') return;
  
  if (LiveActivityModule?.endAllActivities) {
      LiveActivityModule.endAllActivities();
  }
}