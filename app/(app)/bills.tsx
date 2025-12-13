import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import { api } from "../../src/api/client";
import {
  resyncLocalNotificationsFromBills,
  cancelBillReminderLocal,
} from "../../src/notifications/notifications";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";
import RNFS from "react-native-fs";
import Share from "react-native-share";

type SortKey = "due" | "amount" | "name";

// --- Helper Functions ---

function centsToDollars(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function safeDateNum(s?: string | null) {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function isOverdue(item: any) {
  const isPaid = Boolean(
    item.paid_at || item.is_paid || item.status === "paid"
  );
  if (isPaid) return false;
  const due = safeDateNum(item.due_date);
  if (!due) return false;
  return Date.now() > due;
}

const jsonToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  
  const escapeField = (field: any) => {
    if (field === null || field === undefined) return "";
    const stringField = String(field);
    if (stringField.match(/["\n,]/)) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const headerRow = headers.map(escapeField).join(",");
  const rows = data.map((row) =>
    headers.map((header) => escapeField(row[header])).join(",")
  );

  return [headerRow, ...rows].join("\n");
};

// --- Main Component ---

export default function Bills() {
  const theme = useTheme();

  const [bills, setBills] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<"pending" | "paid">("pending");
  const [sort, setSort] = useState<SortKey>("due");

  const pendingBills = useMemo(
    () =>
      bills.filter((b: any) => !b.paid_at && !b.is_paid && b.status !== "paid"),
    [bills]
  );
  const paidBills = useMemo(
    () =>
      bills.filter((b: any) => b.paid_at || b.is_paid || b.status === "paid"),
    [bills]
  );

  const visibleBills = useMemo(() => {
    const list = tab === "pending" ? pendingBills : paidBills;

    const sorted = [...list].sort((a: any, b: any) => {
      if (sort === "name") {
        return String(a.creditor || "").localeCompare(String(b.creditor || ""));
      }
      if (sort === "amount") {
        return Number(b.amount_cents || 0) - Number(a.amount_cents || 0);
      }
      // sort === "due"
      if (tab === "pending") {
        return safeDateNum(a.due_date) - safeDateNum(b.due_date);
      } else {
        const ap =
          safeDateNum(a.paid_at) ||
          safeDateNum(a.updated_at) ||
          safeDateNum(a.due_date);
        const bp =
          safeDateNum(b.paid_at) ||
          safeDateNum(b.updated_at) ||
          safeDateNum(b.due_date);
        return bp - ap;
      }
    });

    return sorted;
  }, [tab, pendingBills, paidBills, sort]);

  const generateAndShareCSV = async () => {
    try {
      if (bills.length === 0) {
        Alert.alert("No Data", "There are no bills to export.");
        return;
      }

      const exportData = bills.map((b) => ({
        ID: b.id,
        Creditor: b.creditor,
        Amount: centsToDollars(b.amount_cents),
        DueDate: b.due_date,
        Status: b.status === "paid" ? "Paid" : "Pending",
        Notes: b.notes || "",
        Recurrence: b.recurrence || "none",
        OffsetDays: b.reminder_offset_days || "0",
        Reminder: b.reminder_time_local || "",
      }));

      const csvString = jsonToCSV(exportData);

      const path =
        Platform.OS === "ios"
          ? `${RNFS.DocumentDirectoryPath}/bills_export.csv`
          : `${RNFS.CachesDirectoryPath}/bills_export.csv`;

      await RNFS.writeFile(path, csvString, "utf8");

      await Share.open({
        url: `file://${path}`,
        type: "text/csv",
        filename: "bills_export",
        title: "Export Bills CSV",
      });
    } catch (error) {
      console.log("Share cancelled or failed", error);
    }
  };

  const stats = useMemo(() => {
    const pendingTotal = pendingBills.reduce(
      (sum: number, b: any) => sum + Number(b.amount_cents || 0),
      0
    );
    const paidTotal = paidBills.reduce(
      (sum: number, b: any) => sum + Number(b.amount_cents || 0),
      0
    );

    return {
      pendingCount: pendingBills.length,
      pendingTotal,
      paidCount: paidBills.length,
      paidTotal,
    };
  }, [pendingBills, paidBills]);

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

  async function markPaid(item: any) {
    try {
      await api.billsMarkPaid(item.id);
      await cancelBillReminderLocal(item.id);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function deleteBill(item: any) {
    try {
      await api.billsDelete(item.id);
      await cancelBillReminderLocal(item.id);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  function onLongPressBill(item: any) {
    const isPaid = Boolean(
      item.paid_at || item.is_paid || item.status === "paid"
    );

    const actions: {
      text: string;
      style?: "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      {
        text: "Edit",
        onPress: () =>
          router.push({
            pathname: "/(app)/bill-edit",
            params: { id: String(item.id) },
          }),
      },
    ];

    if (!isPaid) {
      actions.push({
        text: "Mark Paid",
        onPress: () => markPaid(item),
      });
    }

    actions.push({
      text: "Delete",
      style: "destructive",
      onPress: () => deleteBill(item),
    });

    actions.push({ text: "Cancel", style: "cancel" });

    Alert.alert(item.creditor || "Bill", "Choose an action", actions);
  }

  // --- Combined Tab Button ---
  const SegButton = ({
    active,
    label,
    amount,
    onPress,
  }: {
    active: boolean;
    label: string;
    amount: number;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        button(theme, active ? "primary" : "ghost"),
        { paddingVertical: 10, flex: 1, alignItems: 'center' },
      ]}
    >
      <Text style={[buttonText(theme, active ? "primary" : "ghost"), { fontSize: 13, opacity: 0.8 }]}>
        {label}
      </Text>
      <Text style={[buttonText(theme, active ? "primary" : "ghost"), { fontSize: 16, fontWeight: '900' }]}>
        ${centsToDollars(amount)}
      </Text>
    </Pressable>
  );

  // --- Cycle Sort Logic ---
function cycleSort() {
     if (sort === 'due') setSort('amount');
     else if (sort === 'amount') setSort('name');
     else setSort('due');
  }

  // OLD:
  // const sortLabel = {
  //     due: "Due Date",
  //     amount: "Amount",
  //     name: "Name"
  // }[sort];

  // NEW: Dynamic Label
  const sortLabel = useMemo(() => {
    if (sort === 'amount') return "Amount";
    if (sort === 'name') return "Name";
    
    // If sort is 'due', check the tab
    return tab === 'pending' ? "Due Date" : "Paid Date";
  }, [sort, tab]);

  return (
    <View style={screen(theme)}>
      {/* Header Profile Button */}
      <Stack.Screen
        options={{
          headerTitle: "My Bills",
          headerRight: () => (
            <Pressable 
              onPress={() => router.push("/(app)/profile")}
              style={{ padding: 8 }} // hit slop
            >
                 <Text style={{ color: theme.colors.primaryText, fontWeight: '700' }}>Profile</Text> 
            </Pressable>
          ),
        }}
      />

      {/* Main Action Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={() => router.push("/(app)/insights")}
          style={[button(theme, "primary"), { flex: 1 }]}
        >
          <Text style={buttonText(theme, "primary")}>Insights</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(app)/bill-edit")}
          style={[button(theme, "primary"), { flex: 1 }]}
        >
          <Text style={buttonText(theme, "primary")}>+ Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={visibleBills}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 12 }}>
            
            {/* Combined Filter & Stats: Tabs now show $$$ */}
            <View style={[card(theme), { flexDirection: "row", gap: 6, padding: 6 }]}>
              <SegButton
                active={tab === "pending"}
                label="Pending"
                amount={stats.pendingTotal}
                onPress={() => setTab("pending")}
              />
              <View style={{width: 1, backgroundColor: theme.colors.border, marginVertical: 6}} />
              <SegButton
                active={tab === "paid"}
                label="Paid"
                amount={stats.paidTotal}
                onPress={() => setTab("paid")}
              />
            </View>

            {/* Minimal Sort & Export Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 }}>
                {/* Single Sort Button (Cycles on tap) */}
                <Pressable onPress={cycleSort} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
                    <Text style={{ color: theme.colors.subtext }}>Sort by: </Text>
                    <Text style={{ fontWeight: '800', color: theme.colors.text }}>{sortLabel} ▾</Text>
                </Pressable>

                {/* Export Link */}
                {bills.length > 0 && (
                  <Pressable onPress={generateAndShareCSV} style={{ padding: 8 }}>
                    <Text style={{ color: theme.colors.accent, fontWeight: "700", fontSize: 13 }}>
                      Export CSV
                    </Text>
                  </Pressable>
                )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[card(theme), { gap: 10, alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 40 }}>{tab === "pending" ? "🎉" : "💸"}</Text>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 18,
                fontWeight: "900",
                textAlign: 'center'
              }}
            >
              {tab === "pending" ? "All caught up!" : "No paid history"}
            </Text>
            <Text style={{ color: theme.colors.subtext, textAlign: 'center', lineHeight: 20 }}>
              {tab === "pending"
                ? "You have no pending bills. Enjoy the freedom!"
                : "Bills you mark as paid will appear here."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const amt = centsToDollars(item.amount_cents);
          const isPaid = Boolean(
            item.paid_at || item.is_paid || item.status === "paid"
          );
          const overdue = isOverdue(item);

          return (
            <Pressable
              onLongPress={() => onLongPressBill(item)}
              delayLongPress={350}
              style={[card(theme), { marginBottom: 10 }]}
            >
              <View style={{flexDirection: 'row', justifyContent:'space-between', alignItems: 'flex-start'}}>
                  <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: theme.colors.text,
                        }}
                      >
                        {item.creditor}
                      </Text>
                      <Text style={{ color: theme.colors.subtext, marginTop: 4 }}>
                        {isPaid ? "Paid on " : "Due "} {item.due_date}
                      </Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                      <Text style={{fontSize: 18, fontWeight: '900', color: theme.colors.text}}>${amt}</Text>
                      {overdue && (
                        <Text style={{color: theme.colors.danger, fontWeight: '800', fontSize: 10, marginTop: 4}}>OVERDUE</Text>
                      )}
                  </View>
              </View>

              {/* Action Buttons Row */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/bill-edit",
                      params: { id: String(item.id) },
                    })
                  }
                  style={{flex: 1, alignItems: 'center'}}
                >
                  <Text style={{color: theme.colors.subtext, fontWeight: '600'}}>Edit</Text>
                </Pressable>

                {!isPaid && (
                  <Pressable
                    onPress={() => markPaid(item)}
                    style={{flex: 1, alignItems: 'center'}}
                  >
                    <Text style={{color: theme.colors.primary, fontWeight: '800'}}>Mark Paid</Text>
                  </Pressable>
                )}
                 
                 {/* Delete is hidden in long-press to clean up UI, or you can keep it here */}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}