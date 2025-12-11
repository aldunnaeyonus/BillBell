import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useTheme } from "../src/ui/useTheme";
import { api } from "../src/api/client";
import { 
  cancelBillReminderLocal, 
  registerNotificationCategories // <--- Import this
} from "../src/notifications/notifications";

export default function RootLayout() {
  const theme = useTheme();

  useEffect(() => {
    // 1. Register the "Mark Paid" category immediately on launch
    registerNotificationCategories(); 

    // 2. Listen for user interaction with notifications
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const billId = response.notification.request.content.data.bill_id;

      if (actionId === "mark_paid" && billId) {
        try {
          await api.billsMarkPaid(Number(billId));
          await cancelBillReminderLocal(Number(billId));
          // Optional: Refresh data if on the bills screen, or show feedback
          alert("Bill marked as paid! ✅");
        } catch (error) {
          console.error("Failed to mark paid from notification:", error);
          alert("Error marking bill as paid.");
        }
      }
    });

    return () => subscription.remove();
  }, []);

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
        <Stack.Screen name="(app)/browser" options={{ title: "Browser" }} />
        <Stack.Screen name="(app)/bulk-import" options={{ title: "Bulk Upload" }} />
        <Stack.Screen name="index" options={{ title: "Debts" }} />
        <Stack.Screen name="(auth)/login" options={{ title: "Sign in" }} />
        <Stack.Screen name="(app)/family" options={{ title: "Shared Group" }} />
        <Stack.Screen name="(app)/bills" options={{ title: "DueView App" }} />
        <Stack.Screen
          name="(app)/bill-edit"
          options={{ title: "Edit Debts" }}
        />
        <Stack.Screen name="(app)/profile" options={{ title: "Profile" }} />

        <Stack.Screen
          name="(app)/family-settings"
          options={{ title: "Shared Settings" }}
        />
      </Stack>
    </>
  );
}