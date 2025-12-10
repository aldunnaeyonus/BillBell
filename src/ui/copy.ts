import * as Clipboard from "expo-clipboard";

export async function copyToClipboard(text: string) {
  await Clipboard.setStringAsync(text);
}
