import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bill_notification_map_v1";
type MapShape = Record<string, string>;

async function readMap(): Promise<MapShape> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as MapShape) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: MapShape) {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function getNotificationIdForBill(billId: number): Promise<string | null> {
  const map = await readMap();
  return map[String(billId)] ?? null;
}

export async function setNotificationIdForBill(billId: number, notificationId: string): Promise<void> {
  const map = await readMap();
  map[String(billId)] = notificationId;
  await writeMap(map);
}

export async function removeNotificationIdForBill(billId: number): Promise<void> {
  const map = await readMap();
  delete map[String(billId)];
  await writeMap(map);
}

export async function getAllBillNotificationPairs(): Promise<Array<{ billId: number; notificationId: string }>> {
  const map = await readMap();
  return Object.entries(map).map(([billId, notificationId]) => ({
    billId: Number(billId),
    notificationId,
  }));
}
