import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { getToken } from "../src/auth/session";
import { useTheme } from "../src/ui/useTheme";
import { screen } from "../src/ui/styles";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  
  // FIX: Track mounted state
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      
      // FIX: Check if mounted before navigating or updating state
      if (!isMounted.current) return;

      if (t) {
        router.replace("/(app)/bills");
      } else {
        router.replace("/(auth)/login");
      }
      
      // FIX: Do NOT call setLoading(false) here. 
      // router.replace() unmounts this component immediately.
      // Updating state afterwards causes a memory leak warning.
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