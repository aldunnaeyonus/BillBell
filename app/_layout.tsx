import "../polyfills"; // MUST BE FIRST
import i18n from "../src/api/i18n";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useTheme } from "../src/ui/useTheme";
import { I18nextProvider, useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, NativeModules, LogBox, AppState, AppStateStatus, NativeEventEmitter } from "react-native";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "../src/api/client";
import { getToken, clearToken } from "../src/auth/session";
import { initBackgroundFetch, syncAndRefresh } from "../src/native/LiveActivity";
// FIX: Import the centralized configuration
import { configureGoogle } from "../src/auth/providers"; 

(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;

if (!__DEV__) {
  LogBox.ignoreAllLogs();
}

const getLiveActivityModule = () => {
  if (Platform.OS !== "ios") return undefined;
  try {
    return NativeModules?.LiveActivityModule;
  } catch {
    return undefined;
  }
};

function AppStack() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string>("(auth)/login");

  // Initialize Google Auth
  useEffect(() => {
    configureGoogle(); // FIX: Use the imported function
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const LiveActivityModule = getLiveActivityModule();
    const eventEmitter = LiveActivityModule ? new NativeEventEmitter(LiveActivityModule) : null;

    if (!eventEmitter) {
      initBackgroundFetch();
      (async () => { await syncAndRefresh(); })();
      return;
    }

    handlePendingPaidBill();
    initBackgroundFetch();

    (async () => {
      await handlePendingPaidBill();
      await syncAndRefresh();
    })();

    const subscription = eventEmitter.addListener("onBillMarkedPaid", async (e) => {
        try {
          const billId = Number(e?.billId);
          if (Number.isFinite(billId) && billId > 0) {
            await api.billsMarkPaid(billId);
          }
        } catch (err) {
          console.warn("onBillMarkedPaid handler failed:", err);
        } finally {
          await syncAndRefresh();
        }
    });

    const appState = AppState.addEventListener("change", (nextState: AppStateStatus) => {
        if (nextState === "active") {
          (async () => {
            await handlePendingPaidBill();
            await syncAndRefresh();
          })();
        }
    });

    return () => {
      subscription.remove();
      appState.remove();
    };
  }, []);
  
  useEffect(() => {
    const prepareApp = async () => {
      try {
        const pending = await AsyncStorage.getItem("billbell_pending_family_code");
        const login = await AsyncStorage.getItem("isLog");
        const token = await getToken();

        if (pending && token && login) {
          setInitialRoute("(app)/family");
          return;
        } else if (token && login) {
          setInitialRoute("(app)/bills");
          return;
        } else {
          await clearToken();
          await api.clearAllFamilyKeys();
          await AsyncStorage.removeItem("isLog");
          setInitialRoute("(auth)/login");
          return;
        }
      } catch (e) {
        setInitialRoute("(auth)/login");
      } finally {
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  async function handlePendingPaidBill() {
    if (Platform.OS !== "ios") return;
    const LiveActivityModule = getLiveActivityModule();
    if (!LiveActivityModule?.consumeLastPaidBillId) return;

    try {
      const billIdStr = await LiveActivityModule.consumeLastPaidBillId();
      const billId = Number(billIdStr);
      if (Number.isFinite(billId) && billId > 0) {
        await api.billsMarkPaid(billId);
      }
      await syncAndRefresh();
    } catch (e) {
      console.warn("handlePendingPaidBill failed", e);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        initialRouteName={initialRoute}
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTitleStyle: { color: theme.colors.primaryText },
          headerTintColor: theme.colors.primaryText,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          // @ts-ignore
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(app)/bills" options={{ title: "", headerBackVisible: false, gestureEnabled: true }} />
        <Stack.Screen name="(app)/onboarding" options={{ headerShown: false, headerBackVisible: false, title: "" }} />
        <Stack.Screen name="(app)/feedback" options={{ title: t("Feedback & Bugs") }} />
        <Stack.Screen name="(app)/faq" options={{ title: t("FAQ") }} />
        <Stack.Screen name="(app)/privacy" options={{ title: t("Privacy Policy") }} />
        <Stack.Screen name="(app)/terms" options={{ title: t("Terms of Use") }} />
        <Stack.Screen name="(app)/insights" options={{ title: t("Financial Insights") }} />
        <Stack.Screen name="(app)/family-requests" options={{ title: t("Join Requests") }} />
        <Stack.Screen name="(app)/browser" options={{ title: t("Browser") }} />
        <Stack.Screen name="(app)/bulk-import" options={{ title: t("Bulk Upload") }} />
        <Stack.Screen name="index" options={{ title: t("Debts") }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false, headerBackVisible: false }} />
        <Stack.Screen name="(app)/family" options={{ title: "" }} />
        <Stack.Screen name="(app)/bill-edit" options={{ title: t("Edit Debts") }} />
        <Stack.Screen name="(app)/profile" options={{ title: t("Profile") }} />
        <Stack.Screen name="(app)/family-settings" options={{ title: t("Shared Settings") }} />
      </Stack>
    </>
  );
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <AppStack />
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}