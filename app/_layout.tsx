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
import { LogBox } from "react-native";
import { Buffer } from "buffer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;
// --- Configuration ---
// Explicitly ignore all logs in Production (Release builds), but keep them in Dev.
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}

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
        screenOptions={
          {
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: theme.colors.bg },
            headerTitleStyle: { color: theme.colors.primaryText },
            headerTintColor: theme.colors.primaryText,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.bg },
            // @ts-ignore: 'headerBackButtonDisplayMode' is new in React Nav 7 / Expo Router 6
            headerBackButtonDisplayMode: "minimal",
            headerBackTitleVisible: false,
          } as any
        }
      >
        {/* ADDED: Onboarding Screen */}

        <Stack.Screen
          name="(app)/bills"
          options={{
            title: "",
            headerBackVisible: false,
            gestureEnabled: true
          }}
        />
        <Stack.Screen
          name="(app)/onboarding"
          options={{
            gestureEnabled: true,
            headerShown: false, // This removes the navigation bar
            headerBackVisible: false,
            title: ""
          }}
        />
        <Stack.Screen
          name="(app)/feedback"
          options={{ title: t("Feedback & Bugs"), gestureEnabled: true }}
        />
        <Stack.Screen name="(app)/faq" options={{ title: t("FAQ"), gestureEnabled: true }} />
        <Stack.Screen
          name="(app)/privacy"
          options={{ title: t("Privacy Policy") || "Privacy Policy", gestureEnabled: true }}
        />
        <Stack.Screen
          name="(app)/terms"
          options={{ title: t("Terms of Use") || "Terms of Use", gestureEnabled: true }}
        />
        <Stack.Screen
          name="(app)/insights"
          options={{ title: t("Financial Insights"), gestureEnabled: true }}
        />
        <Stack.Screen name="(app)/browser" options={{ title: t("Browser"), gestureEnabled: true }} />
        <Stack.Screen
          name="(app)/bulk-import"
          options={{ title: t("Bulk Upload"), gestureEnabled: true }}
        />
        <Stack.Screen name="index" options={{ title: t("Debts"), gestureEnabled: true }} />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: "",
            headerBackVisible: false,
            headerShown: false,
            gestureEnabled: true
          }}
        />
        <Stack.Screen
          name="(app)/family"
          options={{ title: "",             
            headerBackVisible: false, gestureEnabled: true }}
        />
        <Stack.Screen
          name="(app)/bill-edit"
          options={{ title: t("Edit Debts"), gestureEnabled: true }}
        />
        <Stack.Screen name="(app)/profile" options={{ title: t("Profile"), gestureEnabled: true }} />
        <Stack.Screen
          name="(app)/family-settings"
          options={{ title: t("Shared Settings"), gestureEnabled: true }}
        />
      </Stack>
    </>
  );
}

// 2. Export the RootLayout which strictly provides the Context
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <I18nextProvider i18n={i18n}>
        <AppStack />
    </I18nextProvider>
    </GestureHandlerRootView>
  );
}
