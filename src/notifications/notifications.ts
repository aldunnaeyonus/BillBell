import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import * as Device from "expo-device";
import i18n from "i18next";
import { parseISO, startOfDay, subDays, setHours, setMinutes } from "date-fns";
import { router } from "expo-router";
import { api } from "../api/client"; 

import {
  getNotificationIdForBill,
  setNotificationIdForBill,
  removeNotificationIdForBill,
  getAllBillNotificationPairs,
} from "./notificationStore";

const CATEGORY_BILL_REMINDER = "bill_reminder";
const ACTION_MARK_PAID = "mark_paid";
const ACTION_SNOOZE = "snooze";

// 1. Permissions
export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return false;
  }
  return true;
}

// 2. Categories (Interactive Actions) - FIXED API USAGE
export async function registerNotificationCategories() {
  // Fix: Use setNotificationCategoryAsync (singular) for specific category registration
  await Notifications.setNotificationCategoryAsync(CATEGORY_BILL_REMINDER, [
    {
      identifier: ACTION_MARK_PAID,
      buttonTitle: i18n.t("Mark Paid"),
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: ACTION_SNOOZE,
      buttonTitle: i18n.t("Snooze 1 Hr"),
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

// 3. Setup Listeners (Handle Taps & Actions) - FIXED REMOVE SUBSCRIPTION
export function setupNotificationListeners() {
  const responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data;
    
    // Fix: Ensure billId is a number
    const rawBillId = data.bill_id || data.billId;
    const billId = Number(rawBillId);

    // A. User Tapped Notification Body -> Open Edit Screen
    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      if (billId) router.push({ pathname: "/(app)/bill-edit", params: { id: String(billId) } });
      return;
    }

    // B. User Tapped "Mark Paid"
    if (actionIdentifier === ACTION_MARK_PAID && billId) {
      try {
        await api.billsMarkPaid(billId);
        
        // Dismiss notification
        await Notifications.dismissNotificationAsync(notification.request.identifier);
        
        // Clean up local reminder
        await cancelBillReminderLocal(billId);

        // Feedback notification
        await Notifications.scheduleNotificationAsync({
          content: { title: i18n.t("Success"), body: i18n.t("Bill marked as paid.") },
          trigger: null,
        });
      } catch (e) {
        console.error("Action failed", e);
      }
    }

    // C. User Tapped "Snooze"
    if (actionIdentifier === ACTION_SNOOZE && billId) {
      // Reschedule for 1 hour later
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: data,
          categoryIdentifier: CATEGORY_BILL_REMINDER,
        },
        // Fix: Explicit Trigger Type
        trigger: { 
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3600,
          repeats: false
        },
      });
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  });

  return () => {
    // Fix: Use .remove() on the subscription object
    if (responseListener) {
      responseListener.remove();
    }
  };
}

// 4. Token
export async function getExpoPushTokenSafe() {
  if (!Device.isDevice) return null;
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;
  await registerNotificationCategories(); 
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// --- Helpers ---

function nextFireDateForBill(dueDateISO: string, offsetDays: number, reminderTimeLocal: string) {
  const due = parseISO(dueDateISO);
  const [hh, mm] = reminderTimeLocal.split(":").map(Number);
  
  let fireDate = setHours(due, hh || 9);
  fireDate = setMinutes(fireDate, mm || 0);
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
    // === OVERDUE ===
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
        categoryIdentifier: CATEGORY_BILL_REMINDER, 
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
    // === UPCOMING ===
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
        categoryIdentifier: CATEGORY_BILL_REMINDER,
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

  // 1. Cancel stale notifications
  const pairs = await getAllBillNotificationPairs();
  const cleanupPromises = pairs
    .filter(p => !billIdSet.has(p.billId))
    .map(async (p) => {
        try { await Notifications.cancelScheduledNotificationAsync(p.notificationId); } catch {}
        await removeNotificationIdForBill(p.billId);
    });
  
  await Promise.all(cleanupPromises);

  // 2. Schedule new ones
  const schedulePromises = bills.map(b => scheduleBillReminderLocal(b));
  await Promise.all(schedulePromises);
}