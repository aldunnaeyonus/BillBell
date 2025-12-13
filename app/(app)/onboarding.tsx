import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../src/ui/useTheme";

const { width } = Dimensions.get("window");

export default function Onboarding() {
  const theme = useTheme();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- Force Header Hidden ---
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  const slides = [
    {
      id: "1",
      icon: "wallet-outline",
      title: t("Track Your Bills"),
      description: t("Keep all your subscriptions, utilities, and debts in one organized list."),
    },
    {
      id: "2",
      icon: "notifications-outline",
      title: t("Never Miss a Date"),
      description: t("Receive timely reminders before bills are due so you can avoid late fees."),
    },
    {
      id: "3",
      icon: "people-outline",
      title: t("Share with Family"),
      description: t("Create a Shared Group to manage household expenses and bills together."),
    },
    {
      id: "4",
      icon: "bar-chart-outline",
      title: t("Financial Insights"),
      description: t("Visualize your spending habits and see exactly where your money goes."),
    },
    {
      id: "5",
      icon: "shield-checkmark-outline",
      title: t("Secure & Private"),
      description: t("Your data is encrypted and stored locally on your device."),
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    router.replace("/(app)/bills");
  };

  // --- FIX: Add safety check for viewableItems ---
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    // Check if viewableItems exists before accessing .length
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      {/* Ensure header is hidden */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>{t("Skip")}</Text>
            </Pressable>
          </View>

          <FlatList
            ref={flatListRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={100} color="#FFF" />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />

          <View style={styles.footer}>
            <View style={styles.paginator}>
              {slides.map((_, index) => {
                const isActive = index === currentIndex;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive
                          ? theme.colors.accent
                          : "rgba(255,255,255,0.3)",
                        width: isActive ? 24 : 8,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <Pressable
              onPress={handleNext}
              style={[styles.button, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={[styles.buttonText, { color: theme.colors.navy }]}>
                {currentIndex === slides.length - 1
                  ? t("Get Started")
                  : t("Next")}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "600",
  },
  slide: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    padding: 32,
    gap: 32,
  },
  paginator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
  },
});