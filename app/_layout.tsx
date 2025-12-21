import "../polyfills"; // MUST BE FIRST
import i18n from "../src/api/i18n";
import { useEffect, useRef, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useTheme } from "../src/ui/useTheme";
import { useTranslation, I18nextProvider } from "react-i18next";
import { BiometricAuth } from "../src/auth/BiometricAuth";
import {
  Platform,
  NativeEventEmitter,
  NativeModules,
  LogBox,
  AppState,
  AppStateStatus,
} from "react-native";
import { Buffer } from "buffer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initBackgroundFetch,
  syncAndRefresh,
} from "../src/native/LiveActivity";
import { api } from "../src/api/client";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken, clearToken } from "../src/auth/session";

// Polyfill Buffer for network/data operations
(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;

if (!__DEV__) {
  LogBox.ignoreAllLogs();
}

/**
 * IMPORTANT:
 * Do NOT destructure LiveActivityModule at the top level.
 * Accessing NativeModules.LiveActivityModule on Android will crash if the native
 * module has TurboModule parsing issues.
 */
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

  // FIX: Use state to handle async initial route determination
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string>("(auth)/login");

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const LiveActivityModule = getLiveActivityModule();
    // FIX: Only create emitter if module exists to avoid memory leak/crash on Android/Web
    const eventEmitter = LiveActivityModule
      ? new NativeEventEmitter(LiveActivityModule)
      : null;

    if (!eventEmitter) {
      // Still run background fetch + refresh without iOS event bridge
      initBackgroundFetch();
      (async () => {
        await syncAndRefresh();
      })();
      return;
    }

    handlePendingPaidBill();
    initBackgroundFetch();

    // initial load
    (async () => {
      await handlePendingPaidBill();
      await syncAndRefresh();
    })();

    const subscription = eventEmitter.addListener(
      "onBillMarkedPaid",
      async (e) => {
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
      }
    );

    const appState = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          (async () => {
            await handlePendingPaidBill();
            await syncAndRefresh();
          })();
        }
      }
    );

    return () => {
      subscription.remove();
      appState.remove();
    };
  }, []);
  
  useEffect(() => {
    const initializeApp = async () => {
      GoogleSignin.configure({
        scopes: ["profile", "email"],
        profileImageSize: 120,
        webClientId:
          "249297362734-q0atl2p733pufsrgb3jl25459i24b92h.apps.googleusercontent.com",
      });
      // FIX: Removed aggressive Google SignOut. 
      // This was forcing users to re-login every time the app opened.
    };
    initializeApp();
  }, []);
  
  // --- Combined Startup Logic (Token + Pending Check) ---
  useEffect(() => {
    const prepareApp = async () => {
      try {
        // 1. Check for Pending Family Request (Highest Priority)
        const pending = await AsyncStorage.getItem(
          "billbell_pending_family_code"
        );
        const login = await AsyncStorage.getItem("isLog");

        // 2. Check for User Token
        const token = await getToken();

        if (pending && token && login) {
          // If user is logged in AND has a pending request -> Go to Family Waiting Screen
          console.log(
            "Redirecting to pending family screen...",
            token,
            pending
          );
          setInitialRoute("(app)/family");
          return;
        } else if (token && login) {
          console.log("Redirecting to bills screen...", token);
          setInitialRoute("(app)/bills");
          return;
        } else {
          // FIX: Do NOT call api.hardReset() here. 
          // hardReset() calls router.replace() which crashes if the Stack isn't mounted yet.
          // Instead, perform silent cleanup and direct to login via initialRoute.
          
          await clearToken();
          await api.clearAllFamilyKeys(); // Clean up sensitive keys safely
          await AsyncStorage.removeItem("isLog");
          
          console.log("Redirecting to login screen...");
          setInitialRoute("(auth)/login");
          return;
        }
      } catch (e) {
        console.warn("Startup check failed", e);
        // Fallback cleanup
        await AsyncStorage.removeItem("billbell_pending_family_code");
        await AsyncStorage.removeItem("isLog");
        setInitialRoute("(auth)/login");
        return;
      } finally {
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);
  // ----------------------------------------------------

  async function handlePendingPaidBill() {
    if (Platform.OS !== "ios") return;

    const LiveActivityModule = getLiveActivityModule();
    if (!LiveActivityModule?.consumeLastPaidBillId) return;

    try {
      console.log(
        "LiveActivityModule keys:",
        Object.keys(LiveActivityModule || {})
      );

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


  // Show nothing (or splash) until we know where to route the user
  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        initialRouteName={initialRoute} // FIX: Use the resolved state variable safely
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
        <Stack.Screen
          name="(app)/bills"
          options={{
            title: "",
            headerBackVisible: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="(app)/onboarding"
          options={{ headerShown: false, headerBackVisible: false, title: "" }}
        />
        <Stack.Screen
          name="(app)/feedback"
          options={{ title: t("Feedback & Bugs") }}
        />
        <Stack.Screen name="(app)/faq" options={{ title: t("FAQ") }} />
        <Stack.Screen
          name="(app)/privacy"
          options={{ title: t("Privacy Policy") }}
        />
        <Stack.Screen
          name="(app)/terms"
          options={{ title: t("Terms of Use") }}
        />
        <Stack.Screen
          name="(app)/insights"
          options={{ title: t("Financial Insights") }}
        />
        <Stack.Screen
          name="(app)/family-requests"
          options={{ title: t("Join Requests") }}
        />
        <Stack.Screen name="(app)/browser" options={{ title: t("Browser") }} />
        <Stack.Screen
          name="(app)/bulk-import"
          options={{ title: t("Bulk Upload") }}
        />
        <Stack.Screen name="index" options={{ title: t("Debts") }} />
        <Stack.Screen
          name="(auth)/login"
          options={{ headerShown: false, headerBackVisible: false }}
        />
        <Stack.Screen name="(app)/family" options={{ title: "" }} />
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
      <I18nextProvider i18n={i18n}>
        <AppStack />
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}