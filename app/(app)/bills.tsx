import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/api/client";
import { resyncLocalNotificationsFromBills, cancelBillReminderLocal } from "../../src/notifications/notifications";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

export default function Bills() {
  const [bills, setBills] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const load = useCallback(async () => {
    const res = await api.billsList();
    setBills(res.bills);
    await resyncLocalNotificationsFromBills(res.bills);
  }, []);

  useFocusEffect(useCallback(() => { load().catch(() => {}); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  return (
    <View style={screen(theme)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.accent }} />
          <Text style={{ fontSize: 22, fontWeight: "900", color: theme.colors.text }}>Bills</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => router.push("/(app)/profile")} style={button(theme, "ghost")}>
            <Text style={buttonText(theme, "ghost")}>Profile</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(app)/bill-edit")} style={button(theme, "primary")}>
            <Text style={buttonText(theme, "primary")}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const amt = (item.amount_cents / 100).toFixed(2);
          const status = item.status;
          return (
            <View style={[card(theme), { marginBottom: 10 }]}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: theme.colors.text }}>
                {item.creditor} {status === "paid" ? "✅" : ""}
              </Text>
              <Text style={{ color: theme.colors.subtext }}>${amt} • Due {item.due_date}</Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable
                  onPress={() => router.push({ pathname: "/(app)/bill-edit", params: { id: String(item.id) } })}
                  style={button(theme, "ghost")}
                >
                  <Text style={buttonText(theme, "ghost")}>Edit</Text>
                </Pressable>

                {status !== "paid" && (
                  <Pressable
                    onPress={async () => {
                      try {
                        await api.billsMarkPaid(item.id);
                        await cancelBillReminderLocal(item.id);
                        await load();
                      } catch (e: any) { Alert.alert("Error", e.message); }
                    }}
                    style={button(theme, "primary")}
                  >
                    <Text style={buttonText(theme, "primary")}>Mark Paid</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={async () => {
                    try {
                      await api.billsDelete(item.id);
                      await cancelBillReminderLocal(item.id);
                      await load();
                    } catch (e: any) { Alert.alert("Error", e.message); }
                  }}
                  style={button(theme, "danger")}
                >
                  <Text style={buttonText(theme, "danger")}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
