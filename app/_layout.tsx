import i18n from "../src/api/i18n";
import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useTheme } from "../src/ui/useTheme";
import { useTranslation, I18nextProvider } from "react-i18next";
import { BiometricAuth } from "../src/auth/BiometricAuth";
import { Platform, NativeEventEmitter, NativeModules, LogBox, AppState, AppStateStatus } from "react-native";
import { Buffer } from "buffer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initBackgroundFetch, syncAndRefresh } from '../src/native/LiveActivity';
import { api } from "../src/api/client";


// Polyfill Buffer for network/data operations
(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;

if (!__DEV__) {
  LogBox.ignoreAllLogs();
}

// Initialize the Native Module and Emitter once at the top level
const { LiveActivityModule } = NativeModules;
const eventEmitter =
  Platform.OS === 'ios' && LiveActivityModule
    ? new NativeEventEmitter(LiveActivityModule)
    : null;

function AppStack() {
  const theme = useTheme();
  const { t } = useTranslation();
const appState = useRef(AppState.currentState);

async function handlePendingPaidBill() {
  try {
    const billIdStr = await LiveActivityModule.consumeLastPaidBillId();
    const billId = Number(billIdStr);

    if (Number.isFinite(billId) && billId > 0) {
      console.log("Consuming widget-paid bill:", billId);
      await api.billsMarkPaid(billId);
    }

    await syncAndRefresh();
  } catch (e) {
    console.warn("handlePendingPaidBill failed", e);
  }
}

 useEffect(() => {
    if (Platform.OS !== "ios") return;

    initBackgroundFetch();

    // initial load
    (async () => {
      await handlePendingPaidBill();
      await syncAndRefresh(); // always refresh once on startup
    })();

    const subscription = eventEmitter?.addListener("onBillMarkedPaid", async (e) => {
      try {
        const billId = Number(e?.billId);
        if (Number.isFinite(billId) && billId > 0) {
          await api.billsMarkPaid(billId);
          console.log("Marked paid from event:", billId);
        }
      } catch (err) {
        console.warn("onBillMarkedPaid handler failed:", err);
      } finally {
        await syncAndRefresh();
      }
    });

    const appStateSub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        (async () => {
          const didMark = await handlePendingPaidBill();
          await syncAndRefresh();
        })();
      }
      appState.current = nextState;
    });

    return () => {
      subscription?.remove();
      appStateSub.remove();
    };
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
          // @ts-ignore - Handle specific back button behavior
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

// Configure how notifications appear when the app is in the foreground
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
      <BiometricAuth>
        <I18nextProvider i18n={i18n}>
          <AppStack />
        </I18nextProvider>
      </BiometricAuth>
    </GestureHandlerRootView>
  );
}