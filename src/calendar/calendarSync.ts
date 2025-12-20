import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import i18n from "i18next"; // Import i18n instance

export async function addToCalendar(bill: any) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        i18n.t("Permission needed"), 
        i18n.t("Calendar access is required to sync bills.")
      );
      return;
    }

    const calendarId = await getCalendarId();
    if (!calendarId) return;

    // Parse date (ensure it's noon to avoid timezone edge cases shifts)
    const dueDate = new Date(bill.due_date);
    dueDate.setHours(12, 0, 0, 0);

    const eventDetails = {
      // FIX: Use i18n.t() for the title
      title: `${i18n.t("Pay")} ${bill.creditor}`,
      startDate: dueDate,
      endDate: dueDate,
      allDay: true,
      notes: `${i18n.t("Amount")}: $${(bill.amount_cents / 100).toFixed(2)}\n${i18n.t("Notes")}: ${bill.notes || ''}`,
      timeZone: 'UTC',
    };

    // Check if we already synced this bill (you might want to store eventId in your DB later)
    // For now, we just create a new event.
    await Calendar.createEventAsync(calendarId, eventDetails);
    
    Alert.alert(i18n.t("Success"), i18n.t("Bill added to your calendar!"));
  } catch (e: any) {
    console.log(e);
    Alert.alert(i18n.t("Calendar Error"), e.message);
  }
}

async function getCalendarId(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    // iOS: Use the default calendar
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.id;
  } else {
    // Android: Find a writable calendar (usually Google Calendar)
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writableCalendar = calendars.find(
      (c) => c.accessLevel === Calendar.CalendarAccessLevel.OWNER || 
             c.accessLevel === Calendar.CalendarAccessLevel.CONTRIBUTOR
    );
    return writableCalendar ? writableCalendar.id : null;
  }
}