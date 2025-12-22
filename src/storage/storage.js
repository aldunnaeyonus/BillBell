import  MMKV  from 'react-native-mmkv';

export const storage = new MMKV();


// Helper to read objects
export function getJson(key) {
  const json = storage.getString(key);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Helper to save objects
export function setJson(key, value) {
  storage.set(key, JSON.stringify(value));
}