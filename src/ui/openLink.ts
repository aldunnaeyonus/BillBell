import { Alert, Linking } from "react-native";
import { useTranslation } from 'react-i18next';


export async function openLink(url: string) {
  const can = await Linking.canOpenURL(url);
    const { t } = useTranslation();

  if (!can) {
    Alert.alert(t("Can't open link"), url);
    return;
  }
  await Linking.openURL(url);
}
