import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import {
  getNotificationIdForBill,
  setNotificationIdForBill,
  removeNotificationIdForBill,
  getAllBillNotificationPairs,
} from "./notificationStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // Required: shows the drop-down banner
    shouldShowList: true,   // Required: shows in the notification center
  }),
});

export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return false;
  }
  return true;
}

export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync("bill-due-actions", [
    {
      identifier: "mark_paid",
      buttonTitle: "Mark as Paid",
      options: {
        opensAppToForeground: true, // Set to false if you want it to happen in background (requires extra config)
      },
    },
  ]);
}

export async function getExpoPushTokenSafe() {
  if (!Device.isDevice) return null;
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;

  // Register the categories when we get the token
  await registerNotificationCategories();

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

function nextFireDateForBill(dueDateISO: string, offsetDays: number, reminderTimeLocal: string) {
  const [y, m, d] = dueDateISO.split("-").map(Number);
  const [hh, mm] = reminderTimeLocal.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh || 9, mm || 0, 0, 0);
  dt.setDate(dt.getDate() - offsetDays);
  return dt;
}

function isPastLocalDate(dueDateISO: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDateISO + "T00:00:00");
  return due < today;
}

export async function cancelBillReminderLocal(billId: number) {
  const existingId = await getNotificationIdForBill(billId);
  if (!existingId) return;
  try { await Notifications.cancelScheduledNotificationAsync(existingId); } catch {}
  await removeNotificationIdForBill(billId);
}

export async function scheduleBillReminderLocal(bill: {
  id: number; creditor: string; amount_cents: number; due_date: string;
  status: "active" | "paid"; snoozed_until: string | null;
  reminder_offset_days: number; reminder_time_local: string;
}) {
  await cancelBillReminderLocal(bill.id);

  if (bill.status !== "active") return;
  if (isPastLocalDate(bill.due_date)) return;

  const now = new Date();
  if (bill.snoozed_until) {
    const s = new Date(bill.snoozed_until);
    if (s > now) return;
  }

  const fireAt = nextFireDateForBill(bill.due_date, bill.reminder_offset_days ?? 1, bill.reminder_time_local ?? "09:00:00");
  if (fireAt <= now) return;

  const amount = (bill.amount_cents / 100).toFixed(2);
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Bill reminder: ",
      body: `${bill.creditor} – $${amount} due ${bill.due_date}`,
      data: { bill_id: bill.id },
      sound: "default",
      categoryIdentifier: "bill-due-actions", // <--- ADD THIS
    },
    trigger: {
      date: fireAt,
      channelId: 'bill-due-actions',
    },
  });

  await setNotificationIdForBill(bill.id, notificationId);
}

export async function resyncLocalNotificationsFromBills(bills: any[]) {
  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  const billIdSet = new Set(bills.map((b) => Number(b.id)));

  const pairs = await getAllBillNotificationPairs();
  for (const p of pairs) {
    if (!billIdSet.has(p.billId)) {
      try { await Notifications.cancelScheduledNotificationAsync(p.notificationId); } catch {}
      await removeNotificationIdForBill(p.billId);
    }
  }

  for (const b of bills) await scheduleBillReminderLocal(b);
}
