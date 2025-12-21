import * as Notifications from "expo-notifications";
import { ensureNotificationPermissions } from "./notifications";

export async function notifyImportCode(title: string, body: string) {
  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
    },
    trigger: null, // Schedule immediately
  });
}