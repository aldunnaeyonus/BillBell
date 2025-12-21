import { useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { useTheme } from "../../src/ui/useTheme";
import { screen } from "../../src/ui/styles";

export default function Browser() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const theme = useTheme();

  // FIX: Prevent app crash if URL contains malformed encoding (e.g. "%")
  const uri = useMemo(() => {
    if (typeof url !== "string") return "about:blank";
    try {
      return decodeURIComponent(url);
    } catch (e) {
      console.warn("Failed to decode browser URL:", url);
      return url; // Fallback to raw URL or about:blank
    }
  }, [url]);

  return (
    <View style={screen(theme)}>
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
      />
    </View>
  );
}