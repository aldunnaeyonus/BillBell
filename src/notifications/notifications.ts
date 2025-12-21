import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import * as Device from "expo-device";
import i18n from "i18next";
import { parseISO, startOfDay, subDays, setHours, setMinutes } from "date-fns";
import {
  getNotificationIdForBill,
  setNotificationIdForBill,
  removeNotificationIdForBill,
  getAllBillNotificationPairs,
} from "./notificationStore";

// 1. Permissions
export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return false;
  }
  return true;
}

// 2. Categories
export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync("bill-due-actions", [
    {
      identifier: "mark_paid",
      buttonTitle: i18n.t("Mark as Paid"),
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
}

// 3. Token
export async function getExpoPushTokenSafe() {
  if (!Device.isDevice) return null;
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;
  await registerNotificationCategories();
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// --- Helpers ---

// FIX: Use date-fns for robust ISO parsing and date math
function nextFireDateForBill(dueDateISO: string, offsetDays: number, reminderTimeLocal: string) {
  const due = parseISO(dueDateISO); // Safely parse YYYY-MM-DD to local date
  
  const [hh, mm] = reminderTimeLocal.split(":").map(Number);
  
  // Set the reminder time
  let fireDate = setHours(due, hh || 9);
  fireDate = setMinutes(fireDate, mm || 0);
  
  // Subtract the offset days safely (handles DST/Month boundaries correctly)
  fireDate = subDays(fireDate, offsetDays);
  
  return fireDate;
}

function isOverdue(dueDateISO: string) {
  const today = startOfDay(new Date());
  const due = parseISO(dueDateISO);
  return due < today;
}

// --- Main Logic ---

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

  const now = new Date();
  if (bill.snoozed_until) {
    const s = parseISO(bill.snoozed_until);
    if (s > now) return;
  }

  const [hh, mm] = (bill.reminder_time_local || "09:00:00").split(":").map(Number);
  const amount = (bill.amount_cents / 100).toFixed(2);

  if (isOverdue(bill.due_date)) {
    // === OVERDUE: High Priority ===
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t("Bill Overdue"),
        body: i18n.t("OVERDUE: {{creditor}} - ${{amount}} was due {{date}}", { 
            creditor: bill.creditor, 
            amount, 
            date: bill.due_date 
        }),
        data: { bill_id: bill.id },
        sound: "default",
        categoryIdentifier: "bill-due-actions",
        color: "#ff4444",
        interruptionLevel: 'timeSensitive', 
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: hh || 9,
        minute: mm || 0,
      },
    });
    
    await setNotificationIdForBill(bill.id, notificationId);

  } else {
    // === UPCOMING: Normal Priority ===
    const fireAt = nextFireDateForBill(
      bill.due_date, 
      bill.reminder_offset_days ?? 0, 
      bill.reminder_time_local ?? "09:00:00"
    );

    if (fireAt <= now) return;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t("Bill reminder"),
        body: `${bill.creditor} – $${amount} due ${bill.due_date}`,
        data: { bill_id: bill.id },
        sound: "default",
        categoryIdentifier: "bill-due-actions",
        color: "#ffffff",
        interruptionLevel: 'active',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });

    await setNotificationIdForBill(bill.id, notificationId);
  }
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