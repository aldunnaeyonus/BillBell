import { Alert, Linking } from "react-native";

export async function openLink(url: string) {
  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert("Can't open link", url);
    return;
  }
  await Linking.openURL(url);
}
