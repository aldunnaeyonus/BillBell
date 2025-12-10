import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { useTheme } from "../../src/ui/useTheme";
import { screen } from "../../src/ui/styles";

export default function Browser() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const theme = useTheme();
  const uri = typeof url === "string" ? decodeURIComponent(url) : "about:blank";

  return (
    <View style={screen(theme)}>
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator />
          </View>
        )}
      />
    </View>
  );
}
