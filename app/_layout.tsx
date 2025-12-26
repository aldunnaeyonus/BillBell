import "../polyfills";
import i18n from "../src/api/i18n";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useCameraPermissions } from "expo-camera"; // Added: Camera
import { useTheme } from "../src/ui/useTheme";
import { I18nextProvider, useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Platform,
  NativeModules,
  LogBox,
  AppState,
  LayoutAnimation,
  AppStateStatus,
  NativeEventEmitter,
  View,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { ErrorBoundary } from "../src/ui/ErrorBoundary";
import { api } from "../src/api/client";
import { getToken, clearToken } from "../src/auth/session";
import {
  initBackgroundFetch,
  syncAndRefresh,
} from "../src/native/LiveActivity";
import { configureGoogle } from "../src/auth/providers";
import {
  registerNotificationCategories,
  setupNotificationListeners,
} from "../src/notifications/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BiometricAuth } from "../src/auth/BiometricAuth";
import { PrivacyOverlay } from "../src/ui/PrivacyOverlay";
import { OfflineBanner } from "../src/ui/OfflineBanner";
import hotUpdate from "react-native-ota-hot-update";
import ReactNativeBlobUtil from "react-native-blob-util";
import { storage } from "../src/storage/storage"; // Added: Storage for tracking permissions
import { serverURL } from "@/data/vendors";
import { useWatchConnectivity } from "../src/hooks/useWatchConnectivity"; // <--- Import

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
  const [isBlurred, setIsBlurred] = useState(false);
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState("0");
  const [_, requestCameraPermission] = useCameraPermissions(); // Hook for camera
  const apiVersion = serverURL+"/ota/update.json";

  useEffect(() => {
    configureGoogle();
  }, []);

  // --- NEW: One-time Startup Permission Request ---
  useEffect(() => {
    const requestStartupPermissions = async () => {
      const PERMISSION_KEY = "billbell_startup_permissions_requested";
      const hasRequested = storage.getBoolean(PERMISSION_KEY);

      if (!hasRequested) {
        try {
          // 1. Request Notifications (for due date alerts)
          await Notifications.requestPermissionsAsync();
          
          // 2. Request Camera (for bill scanning)
          await requestCameraPermission();

          // 3. Request Calendar (for syncing bills)
          //await Calendar.requestCalendarPermissionsAsync();
          
          // 4. Request Reminders (iOS specific requirement for full calendar access)
          // if (Platform.OS === 'ios') {
          //   await Calendar.requestRemindersPermissionsAsync();
          // }
          
          // Mark as requested so it doesn't run again on next boot
          storage.set(PERMISSION_KEY, true);
        } catch (error) {
          console.warn("Failed to request startup permissions:", error);
        }
      }
    };

    requestStartupPermissions();
  }, []);
  // ------------------------------------------------

  useEffect(() => {
    initBackgroundFetch();
    registerNotificationCategories();
    const notificationCleanup = setupNotificationListeners();
    syncAndRefresh().catch((e) => console.warn("Initial sync failed", e));

    const appState = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        setIsBlurred(nextState !== "active");
        if (nextState === "active") {
          syncAndRefresh().catch(() => {});
          if (Platform.OS === "ios") {
            handlePendingPaidBill().catch(() => {});
          }
        }
      }
    );

    return () => {
      appState.remove();
      notificationCleanup();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const LiveActivityModule = getLiveActivityModule();
    if (!LiveActivityModule) return;
    const eventEmitter = new NativeEventEmitter(LiveActivityModule);
    handlePendingPaidBill();
    const subscription = eventEmitter.addListener(
      "onBillMarkedPaid",
      async (e) => {
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
      }
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const startUpdate = async (url: string, version: number) => {
    hotUpdate.downloadBundleUri(ReactNativeBlobUtil, url, version, {
      updateSuccess: () => {
        console.log("update success!");
      },
      updateFail(message?: string) {
        console.log(message);
      },
      progress(received: string, total: string) {
        const percent = (+received / +total) * 100;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setProgress(percent);
      },
      restartAfterInstall: true,
    });
  };

  const onCheckVersion = () => {
    fetch(apiVersion).then(async (data) => {
      const result = await data.json();
      if (result?.version > version) {
        Alert.alert(
          i18n.t("Minor update available"),
          "",
          [
            {
              text: "Cancel",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel",
            },
            {
              text: i18n.t("Update"),
              onPress: () =>
                startUpdate(
                  Platform.OS === "ios"
                    ? result?.downloadIosUrl
                    : result?.downloadAndroidUrl,
                  result.version
                ),
            },
          ]
        );
      }
    });
  };

  // --- INTEGRATION START ---
  useEffect(() => {
    const prepareApp = async () => {
      try {
        hotUpdate.getCurrentVersion().then((data) => {
          setVersion(`${data}`);
        });
        onCheckVersion();
        const pending = await AsyncStorage.getItem(
          "billbell_pending_family_code"
        );
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
  // --- INTEGRATION END ---

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

      <BiometricAuth>
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
          <Stack.Screen
            name="(app)/bills"
            options={{
              headerShown: false,
              title: "",
              headerBackVisible: false,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="(app)/onboarding"
            options={{
              headerShown: false,
              headerBackVisible: false,
              title: "",
              
            }}
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
          <Stack.Screen
            name="(app)/browser"
            options={{ title: t("Browser") }}
          />
          <Stack.Screen
            name="(app)/bulk-import"
            options={{ title: t("Bulk Upload") }}
          />
          <Stack.Screen name="(app)/achievements" options={{ title: t("Achievements") }} />
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
          <Stack.Screen
            name="(app)/profile"
            options={{ title: t("Profile") }}
          />
          <Stack.Screen
            name="(app)/family-settings"
            options={{ title: t("Shared Settings") }}
          />
          <Stack.Screen
            name="(app)/bill-scan"
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="(app)/recovery-kit"
            options={{ title: t("Save Recovery Kit") }}

          />
          <Stack.Screen
            name="(app)/subscriptions"
            options={{ title: t("Subscriptions") }}
          />
        </Stack>
        
      </BiometricAuth>

      {isBlurred && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView
            intensity={20}
            style={StyleSheet.absoluteFill}
            tint={theme.mode === "dark" ? "dark" : "light"}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Image
              source={require("../assets/icon.png")}
              style={{ width: 100, height: 100, borderRadius: 20 }}
            />
          </View>
        </View>
      )}
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
  useWatchConnectivity();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
      },
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <OfflineBanner />
            <AppStack />
          </QueryClientProvider>
          <PrivacyOverlay />
        </ErrorBoundary>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}