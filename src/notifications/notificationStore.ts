import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bill_notification_map_v1";
type MapShape = Record<string, string>;

// Simple Mutex to prevent race conditions during parallel updates
let mutex = Promise.resolve();

async function withMutex<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutex.then(operation);
  // Catch errors to ensure the chain continues, but rethrow for the caller
  mutex = result.catch(() => {}) as Promise<void>; 
  return result;
}

async function readMap(): Promise<MapShape> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as MapShape) : {};
  } catch (e) {
    console.warn("Failed to parse notification map, resetting:", e);
    return {};
  }
}

async function writeMap(map: MapShape) {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

// Atomic update helper
async function updateMap(callback: (map: MapShape) => void): Promise<void> {
  return withMutex(async () => {
    const map = await readMap();
    callback(map);
    await writeMap(map);
  });
}

export async function getNotificationIdForBill(billId: number): Promise<string | null> {
  // Reads don't necessarily need the mutex if we accept slightly stale data, 
  // but for consistency with writes, we can include it or just read directly.
  // Reading directly is usually fine for "get", but "get-then-set" logic happens in the caller.
  // However, since we moved the set logic to updateMap, direct read is safer.
  const map = await readMap();
  return map[String(billId)] ?? null;
}

export async function setNotificationIdForBill(billId: number, notificationId: string): Promise<void> {
  await updateMap((map) => {
    map[String(billId)] = notificationId;
  });
}

export async function removeNotificationIdForBill(billId: number): Promise<void> {
  await updateMap((map) => {
    delete map[String(billId)];
  });
}

export async function getAllBillNotificationPairs(): Promise<Array<{ billId: number; notificationId: string }>> {
  const map = await readMap();
  return Object.entries(map).map(([billId, notificationId]) => ({
    billId: Number(billId),
    notificationId,
  }));
}