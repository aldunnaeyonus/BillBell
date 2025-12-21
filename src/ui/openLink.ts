import { Alert, Linking } from "react-native";
import i18n from "../api/i18n"; 

export async function openLink(url: string) {
  if (!url) return;
  
  try {
    // Attempt to open directly. relying on the OS to handle the scheme (http, mailto, tel, etc.)
    // logic is often more robust than checking canOpenURL first due to Android 11+ package visibility changes.
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback: Try opening anyway, as canOpenURL returns false for some unlisted schemes on Android
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert(i18n.t("Can't open link"), url);
      }
    }
  } catch (e) {
    console.error("Link error:", e);
    Alert.alert(i18n.t("Error"), String(e));
  }
}