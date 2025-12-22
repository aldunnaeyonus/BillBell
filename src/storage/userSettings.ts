import { storage } from './storage'; 

const LIVE_ACTIVITY_KEY = "billbell_live_activity_enabled";
const BUDGETS_KEY = "billbell_category_budgets";
const CURRENCY_KEY = "billbell_currency_code"; // NEW

export const userSettings = {
  // ... (Existing LiveActivity methods) ...
  getLiveActivityEnabledSync: (): boolean => {
    const val = storage.getBoolean(LIVE_ACTIVITY_KEY);
    return val === undefined ? true : val;
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