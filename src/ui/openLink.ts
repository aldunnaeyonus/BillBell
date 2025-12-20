import { Alert, Linking } from "react-native";
import i18n from "../api/i18n"; // Import instance directly

export async function openLink(url: string) {
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert(i18n.t("Can't open link"), url);
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    // safely handle linking errors
    console.error(e);
  }
}