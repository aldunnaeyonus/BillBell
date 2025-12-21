import * as Calendar from 'expo-calendar';
import { Platform, Alert, Linking } from 'react-native';
import i18n from "../api/i18n"; 
import { parseISO, setHours, setMinutes, setSeconds, setMilliseconds, addHours } from 'date-fns';
import { getCalendar } from 'react-native-localize';

export async function addToCalendar(bill: any) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        i18n.t("Permission needed"), 
        i18n.t("Calendar access is required to sync bills."),
        [
            { text: i18n.t("Cancel"), style: "cancel" },
            { text: i18n.t("Settings"), onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    const calendarId = await getCalendarId();
    if (!calendarId) {
        Alert.alert(
            i18n.t("Error"), 
            i18n.t("Could not find a default calendar to add this event to. Please check your device calendar settings.")
        );
        return;
    }

    // Parse date safely. "2023-12-25" -> Local Midnight
    const due = parseISO(bill.due_date);
    const calendars =  getCalendar();
    // Set to Noon (12:00) Local Time to be safe from DST shifts at midnight boundaries
    const startDate = setMilliseconds(setSeconds(setMinutes(setHours(due, 12), 0), 0), 0);
    const endDate = addHours(startDate, 1);
    const timezones = Intl.DateTimeFormat().resolvedOptions().timeZone

    const eventDetails: Partial<Calendar.Event> = {
      title: `${i18n.t("Pay")} ${bill.creditor}`,
      startDate,
      endDate,
      allDay: true,
      notes: `${i18n.t("Amount")}: $${(bill.amount_cents / 100).toFixed(2)}\n${i18n.t("Notes")}: ${bill.notes || ''}`,
      // FIX: Removing specific timezone forces the calendar to use the device's local time,
      // which matches our 'startDate' calculation (Noon Local). 
      // Setting 'UTC' here would shift the event time and potentially the day.
      timeZone: calendars[0] ? calendars[0] : timezones, 
    };

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
    // Android: Find a writable calendar
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // 1. Try to find the primary Google calendar
    const primary = calendars.find(c => c.isPrimary && (c.accessLevel === Calendar.CalendarAccessLevel.OWNER || c.accessLevel === Calendar.CalendarAccessLevel.CONTRIBUTOR));
    if (primary) return primary.id;

    // 2. Fallback to any writable calendar
    const writableCalendar = calendars.find(
      (c) => c.accessLevel === Calendar.CalendarAccessLevel.OWNER || 
             c.accessLevel === Calendar.CalendarAccessLevel.CONTRIBUTOR
    );
    return writableCalendar ? writableCalendar.id : null;
  }
}