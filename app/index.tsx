import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { getToken } from "../src/auth/session";
import { useTheme } from "../src/ui/useTheme";
import { screen } from "../src/ui/styles";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      
      if (!isMounted.current) return;

      if (t) {
        router.replace("/(app)/bills");
      } else {
        router.replace("/(auth)/login");
      }
      // No need to setLoading(false) here, component will unmount
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