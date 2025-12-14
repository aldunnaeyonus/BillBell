import AsyncStorage from '@react-native-async-storage/async-storage';

const LIVE_ACTIVITY_KEY = 'user_pref_live_activity_enabled';

export const userSettings = {
  // Get the setting (Default to TRUE if not set)
  getLiveActivityEnabled: async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(LIVE_ACTIVITY_KEY);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  },

  // Save the setting
  setLiveActivityEnabled: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(LIVE_ACTIVITY_KEY, String(enabled));
    } catch (e) {
      console.warn("Failed to save setting", e);
    }
  }
};