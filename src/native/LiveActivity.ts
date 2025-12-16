import { NativeModules, Platform } from 'react-native';
import BackgroundFetch from "react-native-background-fetch";
import { api } from "../../src/api/client";
import * as Notifications from 'expo-notifications';

const { LiveActivityModule } = NativeModules;

// Call this once after your app loads:
if (LiveActivityModule?.clearAllSavedBills) {
  //LiveActivityModule.clearAllSavedBills();
}

export async function syncAndRefresh() {
  try {
    const { bills } = await api.billsList();

    const unpaidBills = bills.filter((b: any) => b.status !== 'paid');

    if (NativeModules.LiveActivityModule?.saveBillsToStore) {
      await NativeModules.LiveActivityModule.saveBillsToStore(JSON.stringify(unpaidBills));
    }

    if (NativeModules.LiveActivityModule?.refreshWidget) {
      NativeModules.LiveActivityModule.refreshWidget();
    }
    

    
  } catch (e: any) {
    const errorMsg = String(e.message);
    
    if (errorMsg.includes("A Key Rotation is required")) {
      // Trigger a Local Notification for background awareness
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Action Required: Encryption Out of Sync",
          body: "Please open the app and contact an Admin to perform a Key Rotation. Your widgets cannot update until this is resolved.",
          data: { type: 'key_rotation_needed' },
        },
        trigger: null, // Send immediately
      });
    }
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