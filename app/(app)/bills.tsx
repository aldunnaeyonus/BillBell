import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/api/client";
import {
  resyncLocalNotificationsFromBills,
  cancelBillReminderLocal,
} from "../../src/notifications/notifications";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";
import { useTranslation } from "react-i18next";

export default function Bills() {
  const [bills, setBills] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();

  // 🔹 Pending / Paid tab state
  const [tab, setTab] = useState<"pending" | "paid">("pending");

  // 🔹 Derive pending vs paid
  const pendingBills = bills.filter(
    (b: any) =>
      (!b.paid_at && !b.is_paid && b.status !== "paid") // try to be defensive w/ shape
  );
  const paidBills = bills.filter(
    (b: any) =>
      b.paid_at || b.is_paid || b.status === "paid"
  );

  const visibleBills = tab === "pending" ? pendingBills : paidBills;

  const load = useCallback(async () => {
    const res = await api.billsList();
    setBills(res.bills);
    await resyncLocalNotificationsFromBills(res.bills);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={screen(theme)}>
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: theme.colors.accent,
            }}
          />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: theme.colors.text,
            }}
          >
            {t("Debts")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/(app)/profile")}
            style={button(theme, "ghost")}
          >
            <Text style={buttonText(theme, "ghost")}>{t("Profile")}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)/bill-edit")}
            style={button(theme, "primary")}
          >
            <Text style={buttonText(theme, "primary")}>{t("+ Add")}</Text>
          </Pressable>
        </View>
      </View>

      {/* 🔹 Pending / Paid toggle */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 16,
          alignSelf: "center",
        }}
      >
        <Pressable
          onPress={() => setTab("pending")}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor:
              tab === "pending" ? theme.colors.accent : theme.colors.subtext,
            backgroundColor:
              tab === "pending" ? theme.colors.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: tab === "pending" ? "#fff" : theme.colors.text,
              fontWeight: "600",
            }}
          >
            {t("Pending", { pendingBills: pendingBills.length } )}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab("paid")}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor:
              tab === "paid" ? theme.colors.accent : theme.colors.subtext,
            backgroundColor:
              tab === "paid" ? theme.colors.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: tab === "paid" ? "#fff" : theme.colors.text,
              fontWeight: "600",
            }}
          >
           {t("Paid", { paidBills: paidBills.length } )}
          </Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={visibleBills} // ⬅️ use filtered list
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              color: theme.colors.subtext,
            }}
          >
            {tab === "pending"
              ? t("No pending debts")
              : t("No paid debts")}
          </Text>
        }
        renderItem={({ item }) => {
          const amt = (item.amount_cents / 100).toFixed(2);
          const status = item.status;
          const isPaid =
            status === "paid" || item.paid_at || item.is_paid;

          return (
            <View style={[card(theme), { marginBottom: 10 }]}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                {item.creditor} {isPaid ? "✅" : ""}
              </Text>
              <Text style={{ color: theme.colors.subtext }}>
                ${amt} • {t("Due")} {item.due_date}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/bill-edit",
                      params: { id: String(item.id) },
                    })
                  }
                  style={button(theme, "ghost")}
                >
                  <Text style={buttonText(theme, "ghost")}>{t("Edit")}</Text>
                </Pressable>

                {!isPaid && (
                  <Pressable
                    onPress={async () => {
                      try {
                        await api.billsMarkPaid(item.id);
                        await cancelBillReminderLocal(item.id);
                        await load();
                      } catch (e: any) {
                        Alert.alert(t("Error"), e.message);
                      }
                    }}
                    style={button(theme, "primary")}
                  >
                    <Text style={buttonText(theme, "primary")}>
                      {t("Mark Paid")}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={async () => {
                    try {
                      await api.billsDelete(item.id);
                      await cancelBillReminderLocal(item.id);
                      await load();
                    } catch (e: any) {
                      Alert.alert(t("Error"), e.message);
                    }
                  }}
                  style={button(theme, "danger")}
                >
                  <Text style={buttonText(theme, "danger")}>{t("Delete")}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
