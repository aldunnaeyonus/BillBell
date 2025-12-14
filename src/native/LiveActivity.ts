import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

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