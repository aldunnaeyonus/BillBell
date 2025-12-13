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
import { router, useFocusEffect } from "expo-router";
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

/**
 * Converts array of objects to CSV string handling escapes.
 */
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

      // 1. Format Data for CSV (Clean up API response for export)
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

      // 2. Generate CSV String
      const csvString = jsonToCSV(exportData);

      // 3. Write file
      const path =
        Platform.OS === "ios"
          ? `${RNFS.DocumentDirectoryPath}/bills_export.csv`
          : `${RNFS.CachesDirectoryPath}/bills_export.csv`;

      await RNFS.writeFile(path, csvString, "utf8");

      // 4. Share
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

  const SegButton = ({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        button(theme, active ? "primary" : "ghost"),
        { paddingVertical: 10, flex: 1 },
      ]}
    >
      <Text style={buttonText(theme, active ? "primary" : "ghost")}>
        {label}
      </Text>
    </Pressable>
  );

  const SortPill = ({
    keyName,
    label,
  }: {
    keyName: SortKey;
    label: string;
  }) => {
    const active = sort === keyName;
    return (
      <Pressable
        onPress={() => setSort(keyName)}
        style={[
          button(theme, active ? "primary" : "ghost"),
          { paddingVertical: 8, paddingHorizontal: 12 },
        ]}
      >
        <Text style={buttonText(theme, active ? "primary" : "ghost")}>
          {label}
        </Text>
      </Pressable>
    );
  };

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
            Debts
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/(app)/profile")}
            style={button(theme, "ghost")}
          >
            <Text style={buttonText(theme, "ghost")}>Profile</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)/bill-edit")}
            style={button(theme, "primary")}
          >
            <Text style={buttonText(theme, "primary")}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={visibleBills}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 12 }}>
            {/* Pending / Paid toggle */}
            <View style={[card(theme), { flexDirection: "row", gap: 10 }]}>
              <SegButton
                active={tab === "pending"}
                label={`Pending (${stats.pendingCount})`}
                onPress={() => setTab("pending")}
              />
              <SegButton
                active={tab === "paid"}
                label={`Paid (${stats.paidCount})`}
                onPress={() => setTab("paid")}
              />
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[card(theme), { flex: 1 }]}>
                <Text
                  style={{ color: theme.colors.subtext, fontWeight: "700" }}
                >
                  Pending Total
                </Text>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 18,
                    fontWeight: "900",
                    marginTop: 6,
                  }}
                >
                  ${centsToDollars(stats.pendingTotal)}
                </Text>
              </View>

              <View style={[card(theme), { flex: 1 }]}>
                <Text
                  style={{ color: theme.colors.subtext, fontWeight: "700" }}
                >
                  Paid Total
                </Text>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 18,
                    fontWeight: "900",
                    marginTop: 6,
                  }}
                >
                  ${centsToDollars(stats.paidTotal)}
                </Text>
              </View>
            </View>

            {/* Sort controls */}
            <View style={[card(theme), { gap: 10 }]}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={{ color: theme.colors.subtext, fontWeight: "800" }}>
                  Sort
                </Text>
                {/* Export Button Added Here for Visibility */}
                {bills.length > 0 && (
                   <Pressable onPress={generateAndShareCSV}>
                      <Text style={{color: theme.colors.accent, fontSize: 12, fontWeight: '700'}}>Export CSV</Text>
                   </Pressable>
                )}
              </View>
              
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <SortPill
                  keyName="due"
                  label={tab === "pending" ? "Due soon" : "Recently paid"}
                />
                <SortPill keyName="amount" label="Amount" />
                <SortPill keyName="name" label="Name" />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[card(theme), { gap: 10 }]}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 18,
                fontWeight: "900",
              }}
            >
              {tab === "pending" ? "No pending debts 🎉" : "No paid debts yet"}
            </Text>
            <Text style={{ color: theme.colors.subtext, lineHeight: 20 }}>
              {tab === "pending"
                ? "Add your first debt or bulk import a CSV to get started."
                : "Mark a debt paid to see it show up here."}
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => router.push("/(app)/bill-edit")}
                style={[button(theme, "primary"), { flex: 1 }]}
              >
                <Text style={buttonText(theme, "primary")}>+ Add</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(app)/bulk-import")}
                style={[button(theme, "ghost"), { flex: 1 }]}
              >
                <Text style={buttonText(theme, "ghost")}>Import</Text>
              </Pressable>
              
              {/* Keep this fallback just in case lists are empty but data exists elsewhere */}
               <Pressable
                onPress={generateAndShareCSV}
                style={[button(theme, "ghost"), { flex: 1 }]}
              >
                <Text style={buttonText(theme, "ghost")}>Export</Text>
              </Pressable>
            </View>
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
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                {item.creditor} {isPaid ? "✅" : ""}
              </Text>
              {overdue && (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: theme.colors.danger,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primaryText,
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    OVERDUE
                  </Text>
                </View>
              )}
              <Text style={{ color: theme.colors.subtext }}>
                ${amt} • {isPaid ? "Paid" : "Due"} {item.due_date}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/bill-edit",
                      params: { id: String(item.id) },
                    })
                  }
                  style={button(theme, "ghost")}
                >
                  <Text style={buttonText(theme, "ghost")}>Edit</Text>
                </Pressable>

                {!isPaid && (
                  <Pressable
                    onPress={() => markPaid(item)}
                    style={button(theme, "primary")}
                  >
                    <Text style={buttonText(theme, "primary")}>Mark Paid</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => deleteBill(item)}
                  style={button(theme, "danger")}
                >
                  <Text style={buttonText(theme, "danger")}>Delete</Text>
                </Pressable>
              </View>

              <Text
                style={{
                  color: theme.colors.subtext,
                  marginTop: 10,
                  fontSize: 12,
                }}
              >
                Tip: long-press for quick actions
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}