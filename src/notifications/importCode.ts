import * as Notifications from "expo-notifications";
import { ensureNotificationPermissions } from "./notifications";
// REMOVE: import { useTranslation } from 'react-i18next';
// REMOVE: const { t } = useTranslation();
import { SchedulableTriggerInputTypes } from "expo-notifications"; // <--- ADD THIS

// FIX: Accept title and body as arguments
export async function notifyImportCode(title: string, body: string) {
  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: "default"
    },
    trigger: null // immediate
  });
}