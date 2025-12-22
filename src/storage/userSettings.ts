import { storage } from './storage'; // Import your new MMKV instance

const LIVE_ACTIVITY_KEY = "billbell_live_activity_enabled";
// You likely have a theme key here as well, e.g.
// const THEME_KEY = "billbell_theme_preference"; 

export const userSettings = {
  // 1. Get Synchronously (No Promise needed!)
  getLiveActivityEnabledSync: (): boolean => {
    const val = storage.getBoolean(LIVE_ACTIVITY_KEY);
    // Return true if undefined (default) or true
    return val === undefined ? true : val;
  },

  // Keep async wrapper if your existing code expects promises, 
  // but internally it is now instant.
  getLiveActivityEnabled: async (): Promise<boolean> => {
    const val = storage.getBoolean(LIVE_ACTIVITY_KEY);
    return val === undefined ? true : val;
  },

  setLiveActivityEnabled: async (enabled: boolean): Promise<void> => {
    storage.set(LIVE_ACTIVITY_KEY, enabled);
  },
};