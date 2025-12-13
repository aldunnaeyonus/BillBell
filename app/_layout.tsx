import i18n from "../src/api/i18n";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useTheme } from "../src/ui/useTheme";
import { api } from "../src/api/client";
import {
  cancelBillReminderLocal,
  registerNotificationCategories,
} from "../src/notifications/notifications";
import { useTranslation, I18nextProvider } from "react-i18next";
import { BiometricAuth } from "../src/auth/BiometricAuth";

// 1. Create a child component for the actual App logic
function AppStack() {
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    registerNotificationCategories();
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const actionId = response.actionIdentifier;
        const billId = response.notification.request.content.data.bill_id;

        if (actionId === "mark_paid" && billId) {
          try {
            await api.billsMarkPaid(Number(billId));
            await cancelBillReminderLocal(Number(billId));
            alert(t("markedPaid"));
          } catch (error) {
            console.error(t("Failed to mark paid from notification"), error);
            alert(t("Error marking bill as paid"));
          }
        }
      }
    );
    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTitleStyle: { color: theme.colors.primaryText },
          headerTintColor: theme.colors.primaryText,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
         <Stack.Screen
          name="(app)/bills"
          options={{
            title: "",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="(app)/feedback"
          options={{ title: t("Feedback & Bugs") }}
        />
        <Stack.Screen name="(app)/faq" options={{ title: t("FAQ") }} />
        <Stack.Screen name="(app)/insights" options={{ title: t("Financial Insights") }} />
        <Stack.Screen name="(app)/browser" options={{ title: t("Browser") }} />
        <Stack.Screen
          name="(app)/bulk-import"
          options={{ title: t("Bulk Upload") }}
        />
        <Stack.Screen name="index" options={{ title: t("Debts") }} />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: "",
            headerBackVisible: false,
            headerShown: false
          }}
        />
        <Stack.Screen
          name="(app)/family"
          options={{ title: t("Shared Group") }}
        />
        <Stack.Screen
          name="(app)/bill-edit"
          options={{ title: t("Edit Debts") }}
        />
        <Stack.Screen name="(app)/profile" options={{ title: t("Profile") }} />
        <Stack.Screen
          name="(app)/family-settings"
          options={{ title: t("Shared Settings") }}
        />
      </Stack>
    </>
  );
}

// 2. Export the RootLayout which strictly provides the Context
export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <BiometricAuth>
      <AppStack />
      </BiometricAuth>
    </I18nextProvider>
  );
}
