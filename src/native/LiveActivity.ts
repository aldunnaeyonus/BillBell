import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

export async function startOverdueActivity(billName: string, amount: string, dueDate: string) {
  // Safety Check: Do nothing on Android
  if (Platform.OS !== 'ios') return;

  try {
    // 1. Stop any old activities first (so we don't have duplicates)
    if (LiveActivityModule?.endAllActivities) {
       LiveActivityModule.endAllActivities(); 
    }
    
    // 2. Start the new one
    if (LiveActivityModule?.startActivity) {
       await LiveActivityModule.startActivity(billName, amount, dueDate);
       console.log("Live Activity started for:", billName);
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