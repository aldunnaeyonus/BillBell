import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../src/ui/useTheme";

export default function RootLayout() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTitleStyle: { color: theme.colors.text },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Bills" }} />
        <Stack.Screen name="(auth)/login" options={{ title: "Sign in" }} />
        <Stack.Screen name="(app)/family" options={{ title: "Family" }} />
        <Stack.Screen name="(app)/bills" options={{ title: "Bills" }} />
        <Stack.Screen name="(app)/bill-edit" options={{ title: "Edit bill" }} />
        <Stack.Screen name="(app)/profile" options={{ title: "Profile" }} />
        <Stack.Screen name="(app)/family-settings" options={{ title: "Family Settings" }} />
      </Stack>
    </>
  );
}
