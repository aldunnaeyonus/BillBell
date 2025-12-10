import * as Notifications from "expo-notifications";
import { ensureNotificationPermissions } from "./notifications";

export async function notifyImportCode(code: string, expiresAt: string) {
  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Import Code (Bulk Upload)",
      body: `Code: ${code} (expires ${expiresAt})`,
      sound: "default"
    },
    trigger: null // immediate
  });
}
