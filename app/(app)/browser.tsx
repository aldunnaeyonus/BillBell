import { useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { useTheme } from "../../src/ui/useTheme";
import { screen } from "../../src/ui/styles";

export default function Browser() {
  const params = useLocalSearchParams<{ url?: string | string[] }>();
  const theme = useTheme();

  const uri = useMemo(() => {
    // Handle array case (take first) or single string
    const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;
    
    if (!rawUrl) return "about:blank";

    try {
      return decodeURIComponent(rawUrl);
    } catch (e) {
      console.warn("Failed to decode browser URL:", rawUrl);
      return rawUrl;
    }
  }, [params.url]);

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