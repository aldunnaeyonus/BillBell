import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/ui/useTheme";
import { useBills } from "../../src/hooks/useBills";
import { Bill } from "../../src/types/domain";
import { AnimatedAmount } from "../../src/ui/AnimatedAmount";
import { ScaleButton } from "../../src/ui/ScaleButton";
import { Skeleton } from "../../src/ui/Skeleton";
import { BILL_ICON_MAP } from "../../src/data/vendors";

function getBillIcon(creditor: string) {
  const match = BILL_ICON_MAP.find((m) => creditor.match(m.regex));
  return match
    ? { name: match.icon, color: match.color, type: "MaterialCommunityIcons" }
    : { name: "ticket-outline", color: "#808080", type: "Ionicons" };
}

export default function Subscriptions() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: bills, isLoading } = useBills();

  // Filter for "Subscriptions" (Auto-pay or Recurring)
  const subs = useMemo(() => {
    if (!bills) return [];
    return bills.filter(
      (b: { status: string; payment_method: string; recurrence: string; }) =>
        b.status === "active" &&
        (b.payment_method === "auto" || (b.recurrence && b.recurrence !== "none"))
    ).sort((a: { amount_cents: number; }, b: { amount_cents: number; }) => b.amount_cents - a.amount_cents); // Highest first
  }, [bills]);

  const totalMonthly = useMemo(() => {
    return subs.reduce((sum: any, b: { amount_cents: any; }) => sum + b.amount_cents, 0);
  }, [subs]);

  const renderItem = ({ item }: { item: Bill }) => {
    const icon = getBillIcon(item.creditor);
    const IconLib = icon.type === "Ionicons" ? Ionicons : MaterialCommunityIcons;

    return (
      <ScaleButton
        onPress={() => router.push({ pathname: "/(app)/bill-edit", params: { id: String(item.id) } })}
        style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      >
        <View style={[styles.iconBox, { backgroundColor: icon.color + "20" }]}>
          <IconLib name={icon.name as any} size={24} color={icon.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.colors.primaryText }]}>{item.creditor}</Text>
          <Text style={[styles.date, { color: theme.colors.subtext }]}>
            {item.recurrence ? t("Repeats: {{freq}}", { freq: item.recurrence }) : t("Auto-Payment")}
          </Text>
        </View>
        <Text style={[styles.amount, { color: theme.colors.primaryText }]}>
          ${(item.amount_cents / 100).toFixed(2)}
        </Text>
      </ScaleButton>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg, padding: 16, gap: 16 }]}>
        <Skeleton width="100%" height={120} borderRadius={20} />
        <Skeleton width="100%" height={80} borderRadius={16} />
        <Skeleton width="100%" height={80} borderRadius={16} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Stack.Screen options={{ title: t("Subscriptions") }} />

      <FlatList
        data={subs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <View style={[styles.summary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>{t("Monthly Fixed Cost")}</Text>
            <AnimatedAmount
              amount={totalMonthly}
              prefix="$"
              style={{ fontSize: 40, fontWeight: "900", color: theme.colors.primaryText }}
            />
            <Text style={{ color: theme.colors.subtext, marginTop: 4, fontSize: 12 }}>
              {t("{{count}} active subscriptions", { count: subs.length })}
            </Text>
          </View>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="infinite" size={64} color={theme.colors.border} />
            <Text style={{ color: theme.colors.subtext, marginTop: 12, textAlign: 'center' }}>
              {t("No subscriptions found.\nSet a bill to 'Auto-Pay' or 'Recurring' to see it here.")}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { padding: 24, borderRadius: 24, borderWidth: 1, alignItems: "center", marginBottom: 24 },
  label: { fontSize: 14, textTransform: "uppercase", letterSpacing: 1, fontWeight: "600", marginBottom: 4 },
  card: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700" },
  date: { fontSize: 13, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: "700" },
});