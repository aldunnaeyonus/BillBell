import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { getToken } from "../src/auth/session";
import { useTheme } from "../src/ui/useTheme";
import { screen } from "../src/ui/styles";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      const t = await getToken();
      router.replace(t ? "/(app)/bills" : "/(auth)/login");
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[screen(theme), { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }
  return null;
}
