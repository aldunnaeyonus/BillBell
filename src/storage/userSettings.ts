import { storage } from './storage'; 
import { BadgeId, UserAchievements } from '../types/domain';

const LIVE_ACTIVITY_KEY = "billbell_live_activity_enabled";
const BUDGETS_KEY = "billbell_category_budgets";
const CURRENCY_KEY = "billbell_currency_code"; // NEW
const ACHIEVEMENTS_KEY = "billbell_achievements";


export const userSettings = {
  // ... (Existing LiveActivity methods) ...
  getLiveActivityEnabledSync: (): boolean => {
    const val = storage.getBoolean(LIVE_ACTIVITY_KEY);
    return val === undefined ? true : val;
  },
  
  getAchievements: (): UserAchievements => {
    const json = storage.getString(ACHIEVEMENTS_KEY);
    if (!json) return { unlockedBadges: [], totalPaidCount: 0 };
    try { return JSON.parse(json); } catch { return { unlockedBadges: [], totalPaidCount: 0 }; }
  },

  saveAchievements: (data: UserAchievements) => {
    storage.set(ACHIEVEMENTS_KEY, JSON.stringify(data));
  },
  
  // Helper to increment paid count
  incrementPaidCount: (): number => {
    const current = userSettings.getAchievements();
    const newCount = (current.totalPaidCount || 0) + 1;
    userSettings.saveAchievements({ ...current, totalPaidCount: newCount });
    return newCount;
  },

  getLiveActivityEnabled: async (): Promise<boolean> => {
    const val = storage.getBoolean(LIVE_ACTIVITY_KEY);
    return val === undefined ? true : val;
  },

  setLiveActivityEnabled: async (enabled: boolean): Promise<void> => {
    storage.set(LIVE_ACTIVITY_KEY, enabled);
  },

  // ... (Existing Budget methods) ...
  getBudgets: (): Record<string, number> => {
    const json = storage.getString(BUDGETS_KEY);
    if (!json) return {};
    try { return JSON.parse(json); } catch { return {}; }
  },

  setCategoryBudget: (category: string, limit: number) => {
    const current = userSettings.getBudgets();
    const updated = { ...current, [category]: limit };
    storage.set(BUDGETS_KEY, JSON.stringify(updated));
  },

  // --- CURRENCY (NEW) ---
  getCurrency: (): string => {
    return storage.getString(CURRENCY_KEY) || "USD";
  },

  setCurrency: (code: string) => {
    storage.set(CURRENCY_KEY, code);
  }
};