import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import { SafeAreaView } from "react-native-safe-area-context";
import { isSameMonth, addMonths, parseISO, startOfDay } from "date-fns"; 
import { userSettings } from "../../src/storage/userSettings"; // Import the helper

import { api } from "../../src/api/client";
import {
  resyncLocalNotificationsFromBills,
  cancelBillReminderLocal,
} from "../../src/notifications/notifications";
import { useTheme, Theme } from "../../src/ui/useTheme";

// [NEW] Import the Live Activity Wrapper
import { startOverdueActivity, stopActivity } from "../../src/native/LiveActivity";

// --- Types ---
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
  
  const due = parseISO(item.due_date);
  const today = startOfDay(new Date());
  return due < today;
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

// --- Components ---

function Header({ theme, title, onProfilePress }: { theme: Theme; title: string; onProfilePress: () => void }) {
  return (
    <View style={{ backgroundColor: theme.colors.navy }}>
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {title}
            </Text>
            <Pressable 
              onPress={onProfilePress}
              style={styles.profileButton}
            >
              <Ionicons name="person" size={20} color="#FFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function SummaryCard({ theme, label, amount, t }: { theme: Theme; label: string; amount: number; t: any }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.summaryLabel, { color: theme.colors.subtext }]}>{t("Total")} {label}</Text>
      <Text style={[styles.summaryAmount, { color: theme.colors.primaryText }]}>
        ${centsToDollars(amount)}
      </Text>
    </View>
  );
}

function TabSegment({ 
  tabs, 
  activeTab, 
  onTabPress, 
  theme 
}: { 
  tabs: { key: string; label: string }[]; 
  activeTab: string; 
  onTabPress: (key: string) => void; 
  theme: Theme 
}) {
  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={[
              styles.tabButton,
              isActive && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? theme.colors.primaryTextButton : theme.colors.subtext, fontWeight: isActive ? "700" : "500" },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BillItem({ item, theme, t, onLongPress }: { item: any; theme: Theme; t: any; onLongPress: () => void }) {
  const amt = centsToDollars(item.amount_cents);
  const isPaid = Boolean(item.paid_at || item.is_paid || item.status === "paid");
  const overdue = isOverdue(item);

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.billCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: overdue ? theme.colors.danger : theme.colors.border,
          opacity: pressed ? 0.9 : 1,
          borderWidth: overdue ? 1 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.billCreditor, { color: theme.colors.primaryText }]} numberOfLines={1}>
            {item.creditor}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Ionicons 
              name={isPaid ? "checkmark-circle" : "calendar-outline"} 
              size={14} 
              color={isPaid ? theme.colors.accent : theme.colors.subtext} 
            />
            <Text style={{ color: isPaid ? theme.colors.accent : theme.colors.subtext, fontSize: 13, fontWeight: "500" }}>
              {isPaid ? `${t("Paid on")} ${item.paid_at || item.due_date}` : `${t("Due")} ${item.due_date}`}
            </Text>
          </View>
        </View>
        
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.billAmount, { color: theme.colors.primaryText }]}>${amt}</Text>
          {overdue && (
            <View style={{ backgroundColor: "#FFE5E5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
              <Text style={{ color: theme.colors.danger, fontSize: 10, fontWeight: "800" }}>{t("OVERDUE")}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// --- Main Screen ---

export default function Bills() {
  const theme = useTheme();
  const { t } = useTranslation();

  const [bills, setBills] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"pending" | "paid">("pending");
  const [sort, setSort] = useState<SortKey>("due");
  const [isExporting, setIsExporting] = useState(false);

  const syncedBillsHash = useRef("");

  // 1. Notification Sync
  useEffect(() => {
    const currentHash = JSON.stringify(bills.map(b => b.id + b.status + b.due_date));
    if (syncedBillsHash.current !== currentHash && bills.length > 0) {
      resyncLocalNotificationsFromBills(bills);
      syncedBillsHash.current = currentHash;
    }
  }, [bills]);

  // 2. [NEW] Live Activity Sync (iOS Only)
useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const syncLiveActivity = async () => {
      // CHECK SETTING FIRST
      const isEnabled = await userSettings.getLiveActivityEnabled();
      if (!isEnabled) {
        stopActivity(); // Ensure it's off if user disabled it
        return;
      }

      // Existing Logic
      const overdueBills = bills.filter(b => isOverdue(b));

      if (overdueBills.length > 0) {
          const mostUrgent = overdueBills.sort((a,b) => safeDateNum(a.due_date) - safeDateNum(b.due_date))[0];
          const amt = centsToDollars(mostUrgent.amount_cents);
          startOverdueActivity(mostUrgent.creditor, `$${amt}`, mostUrgent.due_date);
      } else {
          stopActivity();
      }
    };

    syncLiveActivity();
  }, [bills]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
      return () => {
        const defaultStyle = theme.mode === "dark" ? "light-content" : "dark-content";
        StatusBar.setBarStyle(defaultStyle);
      };
    }, [theme.mode])
  );

  const pendingBills = useMemo(
    () => bills.filter((b: any) => !b.paid_at && !b.is_paid && b.status !== "paid"),
    [bills]
  );
  const paidBills = useMemo(
    () => bills.filter((b: any) => b.paid_at || b.is_paid || b.status === "paid"),
    [bills]
  );

  const sections = useMemo(() => {
    const list = tab === "pending" ? pendingBills : paidBills;

    const sorted = [...list].sort((a: any, b: any) => {
      if (sort === "name") return String(a.creditor || "").localeCompare(String(b.creditor || ""));
      if (sort === "amount") return Number(b.amount_cents || 0) - Number(a.amount_cents || 0);
      
      const dateA = tab === "pending" ? safeDateNum(a.due_date) : (safeDateNum(a.paid_at) || safeDateNum(a.due_date));
      const dateB = tab === "pending" ? safeDateNum(b.due_date) : (safeDateNum(b.paid_at) || safeDateNum(b.due_date));
      
      return tab === "pending" ? dateA - dateB : dateB - dateA;
    });

    if (sort !== "due") {
        return [{ title: t("All Bills"), data: sorted }];
    }

    const today = new Date();
    const nextMonthDate = addMonths(today, 1);

    const buckets: Record<string, any[]> = {
      overdue: [],
      thisMonth: [],
      nextMonth: [],
      future: [],
    };

    sorted.forEach((bill) => {
      const dateStr = tab === "pending" ? bill.due_date : (bill.paid_at || bill.due_date);
      const billDate = parseISO(dateStr);

      if (tab === "pending" && isOverdue(bill)) {
        buckets.overdue.push(bill);
      } else if (isSameMonth(billDate, today)) {
        buckets.thisMonth.push(bill);
      } else if (isSameMonth(billDate, nextMonthDate)) {
        buckets.nextMonth.push(bill);
      } else {
        buckets.future.push(bill);
      }
    });

    const result = [];
    if (buckets.overdue.length > 0) result.push({ title: t("Overdue"), data: buckets.overdue, special: 'danger' });
    if (buckets.thisMonth.length > 0) result.push({ title: t("This Month"), data: buckets.thisMonth });
    if (buckets.nextMonth.length > 0) result.push({ title: t("Next Month"), data: buckets.nextMonth });
    if (buckets.future.length > 0) result.push({ title: t("Future"), data: buckets.future });

    return result;

  }, [tab, pendingBills, paidBills, sort, t]);

  const stats = useMemo(() => {
    const today = new Date();
    const pendingTotal = pendingBills.reduce((sum, b) => {
      const due = parseISO(b.due_date);
      const shouldInclude = isOverdue(b) || isSameMonth(due, today);
      return shouldInclude ? sum + Number(b.amount_cents || 0) : sum;
    }, 0);

    const paidTotal = paidBills.reduce((sum, b) => sum + Number(b.amount_cents || 0), 0);
    return { pendingTotal, paidTotal };
  }, [pendingBills, paidBills]);

  const sortLabel = useMemo(() => {
    if (sort === "amount") return t("Amount");
    if (sort === "name") return t("Name");
    return tab === "pending" ? t("Due Date") : t("Paid Date");
  }, [sort, tab, t]);

  const load = useCallback(async () => {
    const res = await api.billsList();
    setBills(res.bills);
  }, []);

  useFocusEffect(
    useCallback(() => { load().catch(() => {}); }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function markPaid(item: any) {
    try {
      await api.billsMarkPaid(item.id);
      await cancelBillReminderLocal(item.id);
      if (item.recurrence_rule || item.is_recurring) {
        Alert.alert(t("Bill Paid"), t("Since this bill is recurring, we went ahead and recreated it for the next period."));
      }
      await load();
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
    }
  }

  async function deleteBill(item: any) {
    try {
      await api.billsDelete(item.id);
      await cancelBillReminderLocal(item.id);
      await load();
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
    }
  }

  function cycleSort() {
    if (sort === "due") setSort("amount");
    else if (sort === "amount") setSort("name");
    else setSort("due");
  }

  const generateAndShareCSV = async () => {
    if (isExporting) return;
    try {
      if (bills.length === 0) {
        Alert.alert(t("No Data"), t("There are no bills to export."));
        return;
      }
      setIsExporting(true);
      const exportData = bills.map((b) => ({
        ID: b.id,
        Creditor: b.creditor,
        Amount: centsToDollars(b.amount_cents),
        DueDate: b.due_date,
        Status: b.status === "paid" ? "Paid" : "Pending",
        Notes: b.notes || "",
        Recurrence: b.recurrence || "none",
        Offset: b.reminder_offset_days || "0"
      }));
      const csvString = jsonToCSV(exportData);
      const path = Platform.OS === "ios"
          ? `${RNFS.DocumentDirectoryPath}/bills_export.csv`
          : `${RNFS.CachesDirectoryPath}/bills_export.csv`;
      await RNFS.writeFile(path, csvString, "utf8");
      await Share.open({
        url: `file://${path}`,
        type: "text/csv",
        filename: "bills_export",
        title: t("Export Bills CSV"),
      });
    } catch (error) {
      console.log("Share cancelled or failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  function onLongPressBill(item: any) {
    const isPaid = Boolean(item.paid_at || item.is_paid || item.status === "paid");
    const actions: any[] = [{ text: t("Edit"), onPress: () => router.push({ pathname: "/(app)/bill-edit", params: { id: String(item.id) } }) }];
    if (!isPaid) actions.push({ text: t("Mark Paid"), onPress: () => markPaid(item) });
    actions.push({ text: t("Delete"), style: "destructive", onPress: () => deleteBill(item) });
    actions.push({ text: t("Cancel"), style: "cancel" });
    Alert.alert(item.creditor || t("Bill"), t("Choose an action"), actions);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header 
        theme={theme} 
        title={t("My Bills")} 
        onProfilePress={() => router.push("/(app)/profile")} 
      />

      <View style={{ flex: 1, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.colors.bg, paddingHorizontal: 16, overflow: "hidden" }}>
        
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}

          ListHeaderComponent={
            <View style={{ gap: 16, marginBottom: 16 }}>
              <SummaryCard 
                theme={theme} 
                label={tab === "pending" ? t("Pending (This Month)") : t("Paid")} 
                amount={tab === "pending" ? stats.pendingTotal : stats.paidTotal} 
                t={t}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable onPress={() => router.push("/(app)/insights")} style={[styles.actionBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}>
                  <Ionicons name="bar-chart" size={18} color={theme.colors.primaryTextButton} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.primaryTextButton }]}>{t("Insights")}</Text>
                </Pressable>
                 <Pressable onPress={() => router.push("/(app)/bulk-import")} style={[styles.actionBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}>
                  <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.primaryTextButton} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.primaryTextButton }]}>{t("Import")}</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/(app)/bill-edit")} style={[styles.actionBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}>
                  <Ionicons name="add" size={20} color={theme.colors.primaryTextButton} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.primaryTextButton }]}>{t("+ Add")}</Text>
                </Pressable>
              </View>

              <TabSegment 
                theme={theme}
                activeTab={tab}
                onTabPress={(key) => setTab(key as any)}
                tabs={[
                  { key: "pending", label: t("Pending") },
                  { key: "paid", label: t("Paid") },
                ]}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 }}>
                <Pressable onPress={cycleSort} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: theme.colors.subtext, fontSize: 13 }}>{t("Sort by")}:</Text>
                  <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 13 }}>{sortLabel}</Text>
                  <Ionicons name="chevron-down" size={12} color={theme.colors.text} />
                </Pressable>
                
                {bills.length > 0 && (
                  <Pressable 
                    onPress={generateAndShareCSV}
                    disabled={isExporting}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    {isExporting ? (
                      <ActivityIndicator size="small" color={theme.colors.accent} />
                    ) : null}
                    <Text style={{ color: theme.colors.accent, fontWeight: "700", fontSize: 13 }}>
                      {isExporting ? t("Exporting...") : t("Export CSV")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          }

          renderSectionHeader={({ section: { title, special } }) => (
             <View style={{ paddingVertical: 12, backgroundColor: theme.colors.bg, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ 
                   fontSize: 18, 
                   fontWeight: "800", 
                   color: special === 'danger' ? theme.colors.danger : theme.colors.text 
                }}>
                 {title}
                </Text>
                {special === 'danger' && <Ionicons name="warning" size={16} color={theme.colors.danger} />}
             </View>
          )}

          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
              <Ionicons name={tab === "pending" ? "checkmark-done-circle-outline" : "wallet-outline"} size={64} color={theme.colors.border} />
              <Text style={{ color: theme.colors.subtext, fontSize: 16, textAlign: "center" }}>
                {tab === "pending" ? t("You have no pending bills. Enjoy the freedom!") : t("No paid history")}
              </Text>
            </View>
          }
          
          ListFooterComponent={
            bills.length > 0 ? (
              <View style={{ padding: 20, alignItems: "center", opacity: 0.6 }}>
                <Text style={{ fontSize: 12, color: theme.colors.subtext, textAlign: "center" }}>
                  {t("Tip: Long press a bill to see more actions")}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <BillItem item={item} theme={theme} t={t} onLongPress={() => onLongPressBill(item)} />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingBottom: 40, 
  },
  safeArea: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: "900",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabText: {
    fontSize: 14,
  },
  billCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  billCreditor: {
    fontSize: 16,
    fontWeight: "700",
  },
  billAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
});