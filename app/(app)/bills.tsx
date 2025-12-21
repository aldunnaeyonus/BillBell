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
  NativeModules
} from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Share from "react-native-share";
import { SafeAreaView } from "react-native-safe-area-context";
import { isSameMonth, addMonths, parseISO, startOfDay } from "date-fns";
import { userSettings } from "../../src/storage/userSettings";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../src/api/client";
import {
  resyncLocalNotificationsFromBills,
  cancelBillReminderLocal,
} from "../../src/notifications/notifications";
import { useTheme, Theme } from "../../src/ui/useTheme";
import { File, Paths } from "expo-file-system";
import {
  startSummaryActivity,
  stopActivity,
  startAndroidLiveActivity,
} from "../../src/native/LiveActivity";
import { getToken } from "../../src/auth/session";

const getWidgetModule = () => {
  try {
    return NativeModules?.WidgetModule;
  } catch {
    return undefined;
  }
};

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

// ICON MAPPING LOGIC OMITTED FOR BREVITY (No Changes Needed)
// ... (Keep existing BILL_ICON_MAP) ...
const BILL_ICON_MAP: { regex: RegExp; icon: string; color: string }[] = [
  { regex: /netflix/i, icon: "netflix", color: "#E50914" },
  { regex: /spotify/i, icon: "spotify", color: "#1DB954" },
  { regex: /hulu/i, icon: "hulu", color: "#1CE783" },
  { regex: /disney|plus/i, icon: "movie-open", color: "#0D2593" },
  { regex: /hbo|max|prime video|amc/i, icon: "movie-open", color: "#532386" },
  { regex: /apple|music|itunes/i, icon: "apple", color: "#A2AAAD" },
  { regex: /youtube|twitch/i, icon: "youtube", color: "#FF0000" },
  { regex: /sirius|audible|podcast|radio/i, icon: "radio", color: "#F07241" },
  {
    regex: /visa|mastercard|amex|discover|capital one|bofa/i,
    icon: "credit-card-multiple-outline",
    color: "#1F618D",
  },
  {
    regex: /chase|citi|wells fargo|pnc|td bank|us bank/i,
    icon: "bank",
    color: "#005691",
  },
  {
    regex: /paypal|venmo|cash app|zelle|crypto/i,
    icon: "hand-coin-outline",
    color: "#003087",
  },
  {
    regex: /loan|mortgage|rent|lease|property/i,
    icon: "home-city",
    color: "#9D174D",
  },
  { regex: /student loan|fedloan/i, icon: "school", color: "#2ECC71" },
  {
    regex: /insurance|geico|statefarm|allstate|progressive|liberty/i,
    icon: "shield-car",
    color: "#3498DB",
  },
  {
    regex: /power|electric|utility|pge|con edison|duke energy/i,
    icon: "lightning-bolt",
    color: "#FBBF24",
  },
  {
    regex: /gas|heating|propane|ng|national grid/i,
    icon: "fire",
    color: "#E74C3C",
  },
  {
    regex: /water|sewer|waterworks|sanitation/i,
    icon: "water",
    color: "#0E7490",
  },
  {
    regex: /trash|waste|republic services|wm/i,
    icon: "trash-can",
    color: "#839192",
  },
  { regex: /security|alarm|adt|ring/i, icon: "security", color: "#E67E22" },
  { regex: /hoa|community fees/i, icon: "home-group", color: "#6C3483" },
  {
    regex: /att|t-mobile|verizon|sprint|mobile|cellular/i,
    icon: "cellphone",
    color: "#E7008A",
  },
  {
    regex: /xfinity|comcast|spectrum|fios|cox|internet/i,
    icon: "router-wireless",
    color: "#1D4ED8",
  },
  { regex: /phone|landline/i, icon: "phone", color: "#3F51B5" },
  { regex: /amazon|aws|cloud/i, icon: "amazon", color: "#FF9900" },
  {
    regex: /microsoft|azure|office|xbox/i,
    icon: "microsoft",
    color: "#F25022",
  },
  { regex: /adobe|creative cloud/i, icon: "adobe", color: "#FF0000" },
  { regex: /zoom|webex|teams/i, icon: "video-outline", color: "#2D8CFF" },
  {
    regex: /dropbox|onedrive|storage/i,
    icon: "cloud-upload",
    color: "#0061FF",
  },
  {
    regex: /steam|playstation|nintendo|xbox live/i,
    icon: "gamepad-variant",
    color: "#6A5ACD",
  },
  { regex: /github|gitlab|bitbucket/i, icon: "github", color: "#181717" },
  {
    regex: /walmart|target|costco|sams club/i,
    icon: "shopping",
    color: "#0071C5",
  },
  {
    regex: /home depot|lowes|hardware/i,
    icon: "home-assistant",
    color: "#F96302",
  },
  { regex: /etsy|ebay|shopify/i, icon: "cart", color: "#546E7A" },
  {
    regex: /car loan|auto payment|lease payment/i,
    icon: "car",
    color: "#16A085",
  },
  { regex: /toll|ezpass|highway|sunpass/i, icon: "highway", color: "#F4D03F" },
  { regex: /uber|lyft|taxi/i, icon: "taxi", color: "#000000" },
];

function getBillIcon(creditor: string): {
  name: string;
  color: string;
  type: "MaterialCommunityIcons" | "Ionicons";
} {
  const match = BILL_ICON_MAP.find((m) => creditor.match(m.regex));
  if (match) {
    return {
      name: match.icon,
      color: match.color,
      type: "MaterialCommunityIcons",
    };
  }
  return { name: "receipt-outline", color: "#808080", type: "Ionicons" };
}

// --- Components ---
// (Header, SummaryCard, TabSegment components unchanged)
function Header({ theme, title, onProfilePress }: { theme: Theme; title: string; onProfilePress: () => void; }) {
  return (
    <View style={{ backgroundColor: theme.colors.navy }}>
      <LinearGradient colors={[theme.colors.navy, theme.colors.navy]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable onPress={onProfilePress} style={styles.profileButton}>
              <Ionicons name="person" size={20} color="#FFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function SummaryCard({ theme, label, amount, t }: { theme: Theme; label: string; amount: number; t: any; }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.summaryLabel, { color: theme.colors.subtext }]}>{t("Total")} {label}</Text>
      <Text style={[styles.summaryAmount, { color: theme.colors.primaryText }]}>${centsToDollars(amount)}</Text>
    </View>
  );
}

function TabSegment({ tabs, activeTab, onTabPress, theme }: { tabs: { key: string; label: string }[]; activeTab: string; onTabPress: (key: string) => void; theme: Theme; }) {
  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable key={tab.key} onPress={() => onTabPress(tab.key)} style={[styles.tabButton, isActive && { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.tabText, { color: isActive ? theme.colors.primaryTextButton : theme.colors.subtext, fontWeight: isActive ? "700" : "500" }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BillItem({ item, theme, t, onLongPress, onEdit, onMarkPaid, onDelete }: { item: any; theme: Theme; t: any; onLongPress: () => void; onEdit: () => void; onMarkPaid: () => void; onDelete: () => void; }) {
  const amt = centsToDollars(item.amount_cents);
  const isPaid = Boolean(item.paid_at || item.is_paid || item.status === "paid");
  const overdue = isOverdue(item);
  const swipeableRef = useRef<SwipeableMethods>(null);

  const closeSwipe = () => { swipeableRef.current?.close(); };
  const iconData = getBillIcon(item.creditor);
  const IconComponent = iconData.type === "Ionicons" ? Ionicons : MaterialCommunityIcons;

  const renderRightActions = useCallback(() => {
    const ActionButton = ({ icon, color, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; onPress: () => void; }) => (
      <RectButton
        style={[{ backgroundColor: color }, styles.swipeAction]}
        onPress={() => {
          closeSwipe();
          onPress();
        }}
      >
        <Ionicons name={icon} size={24} color="#FFF" />
        <Text style={styles.actionText}>{label}</Text>
      </RectButton>
    );

    return (
      <View style={styles.rightActionsContainer}>
        <ActionButton icon="create-outline" color="#3498DB" label={t("Edit")} onPress={onEdit} />
        {!isPaid && <ActionButton icon="checkmark-done-circle-outline" color="#2ECC71" label={t("Paid")} onPress={onMarkPaid} />}
        <ActionButton icon="trash-outline" color="#E74C3C" label={t("Delete")} onPress={onDelete} />
      </View>
    );
  }, [isPaid, onEdit, onMarkPaid, onDelete, t]);

  const BillContent = (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.billCard, { backgroundColor: theme.colors.card, borderColor: overdue ? theme.colors.danger : theme.colors.border, opacity: pressed ? 0.9 : 1, borderWidth: 1 }]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={[styles.iconBox, { backgroundColor: iconData.color + "20" }]}>
          <IconComponent name={iconData.name as any} size={20} color={iconData.color} />
        </View>

        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.billCreditor, { color: theme.colors.primaryText }]} numberOfLines={1}>{item.creditor}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <MaterialCommunityIcons name={item.payment_method === "auto" ? "refresh-auto" : "hand-pointing-right"} size={14} color={item.payment_method === "auto" ? theme.colors.accent : theme.colors.subtext} />
              <Text style={{ color: item.payment_method === "auto" ? theme.colors.accent : theme.colors.subtext, fontSize: 11, fontWeight: "600", marginLeft: 4, textTransform: "uppercase" }}>{item.payment_method === "auto" ? t("Auto-Draft") : t("Manual Pay")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Ionicons name={isPaid ? "checkmark-circle" : "calendar-outline"} size={14} color={isPaid ? theme.colors.accent : theme.colors.subtext} />
              <Text style={{ color: isPaid ? theme.colors.accent : theme.colors.subtext, fontSize: 13, fontWeight: "500" }}>{isPaid ? `${t("Paid on")} ${item.paid_at || item.due_date}` : `${t("Due")} ${item.due_date}`}</Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end", marginLeft: 10, flexShrink: 0 }}>
            <Text style={[styles.billAmount, { color: theme.colors.primaryText }]}>${amt}</Text>
            {overdue && <View style={{ backgroundColor: "#FFE5E5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}><Text style={{ color: theme.colors.danger, fontSize: 10, fontWeight: "800" }}>{t("OVERDUE")}</Text></View>}
          </View>
        </View>
      </View>
    </Pressable>
  );

  if (Platform.OS === "ios") {
    return (
      <ReanimatedSwipeable ref={swipeableRef} friction={2} rightThreshold={40} renderRightActions={renderRightActions} containerStyle={{ marginVertical: 0 }}>
        {BillContent}
      </ReanimatedSwipeable>
    );
  }

  return BillContent;
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
  const BILLS_CACHE_KEY = "billbell_bills_list_cache";
  
  // FIX: Track mounted state to prevent memory leaks/warnings on async updates
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // 1. Notification Sync
  useEffect(() => {
    const currentHash = JSON.stringify(
      bills.map((b) => b.id + b.status + b.due_date)
    );
    if (syncedBillsHash.current !== currentHash && bills.length > 0) {
      resyncLocalNotificationsFromBills(bills);
      syncedBillsHash.current = currentHash;
    }
  }, [bills]);

  // 2. Android Widget & Live Activity Sync
  useEffect(() => {
        const initializeApp = async () => {
  if (Platform.OS !== "android" || bills.length === 0) return;

  const widgetModule = getWidgetModule();

  const pending = bills.filter(
    (b: any) => !b.paid_at && !b.is_paid && b.status !== "paid"
  );

  const overdueBills = pending.filter((b: any) => isOverdue(b));
  const overdueSum = overdueBills.reduce(
    (sum: number, b: any) => sum + Number(b.amount_cents || 0),
    0
  );

  const nextBill = pending.find((b: any) => !isOverdue(b));
  
  // Ensure we don't try to get token if unmounted, although getting token is side-effect free
  if (!isMounted.current) return;
  
  const token = await getToken(); 

  if (widgetModule?.syncWidgetData) {
    widgetModule.syncWidgetData(
      overdueBills.length,
      nextBill?.creditor || t("None"),
      nextBill?.due_date || "",
      String(nextBill?.id || ""),
      nextBill?.payment_method || "manual",
      token
    );
  }

  startAndroidLiveActivity(
    `$${centsToDollars(overdueSum)}`,
    overdueBills.length,
    String(nextBill?.id ?? "")
  );
        };
              initializeApp();

}, [bills]); // Note: In a production app, debouncing this effect is recommended if `bills` updates often.


  // 3. iOS Live Activity Sync
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const syncLiveActivity = async () => {
      const isEnabled = await userSettings.getLiveActivityEnabled();

      const pending = bills.filter(
        (b: any) => !b.paid_at && !b.is_paid && b.status !== "paid"
      );

      const overdueBills = pending.filter((b: any) => isOverdue(b));
      const overdueSum = overdueBills.reduce(
        (sum: number, b: any) => sum + Number(b.amount_cents || 0),
        0
      );

      const today = new Date();
      const thisMonthBills = pending.filter((b: any) => {
        const due = parseISO(b.due_date);
        return isSameMonth(due, today) && !isOverdue(b);
      });
      const monthSum = thisMonthBills.reduce(
        (sum: number, b: any) => sum + Number(b.amount_cents || 0),
        0
      );

      if (overdueBills.length === 0 && thisMonthBills.length === 0) {
        stopActivity();
        return;
      }

      if (!isEnabled) {
        stopActivity();
        return;
      }

      startSummaryActivity(
        `$${centsToDollars(overdueSum)}`,
        overdueBills.length,
        `$${centsToDollars(monthSum)}`,
        thisMonthBills.length
      );
    };

    syncLiveActivity();
  }, [bills]);

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const cachedData = await AsyncStorage.getItem(BILLS_CACHE_KEY);
      if (cachedData && isMounted.current) setBills(JSON.parse(cachedData));
      
      const res = await api.billsList();
      if (!isMounted.current) return;
      
      setBills(res.bills);
      await AsyncStorage.setItem(BILLS_CACHE_KEY, JSON.stringify(res.bills));
    } catch (e) {
      console.log("Failed to load bills:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
      
      load().catch(() => {});

      return () => {
        const defaultStyle =
          theme.mode === "dark" ? "light-content" : "dark-content";
        StatusBar.setBarStyle(defaultStyle);
      };
    }, [theme.mode, load])
  );

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

  const sections = useMemo(() => {
    const list = tab === "pending" ? pendingBills : paidBills;
    const sorted = [...list].sort((a: any, b: any) => {
      if (sort === "name")
        return String(a.creditor || "").localeCompare(String(b.creditor || ""));
      if (sort === "amount")
        return Number(b.amount_cents || 0) - Number(a.amount_cents || 0);
      const dateA =
        tab === "pending"
          ? safeDateNum(a.due_date)
          : safeDateNum(a.paid_at) || safeDateNum(a.due_date);
      const dateB =
        tab === "pending"
          ? safeDateNum(b.due_date)
          : safeDateNum(b.paid_at) || safeDateNum(b.due_date);
      return tab === "pending" ? dateA - dateB : dateB - dateA;
    });

    if (sort !== "due") return [{ title: t("All Bills"), data: sorted }];

    const today = new Date();
    const nextMonthDate = addMonths(today, 1);
    const buckets: Record<string, any[]> = {
      overdue: [],
      thisMonth: [],
      nextMonth: [],
      future: [],
    };

    sorted.forEach((bill) => {
      const dateStr =
        tab === "pending" ? bill.due_date : bill.paid_at || bill.due_date;
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
    if (buckets.overdue.length > 0)
      result.push({
        title: t("Overdue"),
        data: buckets.overdue,
        special: "danger",
      });
    if (buckets.thisMonth.length > 0)
      result.push({ title: t("This Month"), data: buckets.thisMonth });
    if (buckets.nextMonth.length > 0)
      result.push({ title: t("Next Month"), data: buckets.nextMonth });
    if (buckets.future.length > 0)
      result.push({ title: t("Future"), data: buckets.future });
    return result;
  }, [tab, pendingBills, paidBills, sort, t]);

  const stats = useMemo(() => {
    const today = new Date();
    const pendingTotal = pendingBills.reduce((sum, b) => {
      const due = parseISO(b.due_date);
      const shouldInclude = isOverdue(b) || isSameMonth(due, today);
      return shouldInclude ? sum + Number(b.amount_cents || 0) : sum;
    }, 0);
    const paidTotal = paidBills.reduce(
      (sum, b) => sum + Number(b.amount_cents || 0),
      0
    );
    return { pendingTotal, paidTotal };
  }, [pendingBills, paidBills]);

  const sortLabel = useMemo(() => {
    if (sort === "amount") return t("Amount");
    if (sort === "name") return t("Name");
    return tab === "pending" ? t("Due Date") : t("Paid Date");
  }, [sort, tab, t]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    if (isMounted.current) setRefreshing(false);
  }

  async function markPaid(item: any) {
    try {
      await api.billsMarkPaid(item.id);
      await cancelBillReminderLocal(item.id);
      if (item.recurrence_rule || item.is_recurring) {
        Alert.alert(
          t("Bill Paid"),
          t(
            "Since this bill is recurring, we went ahead and recreated it for the next period."
          )
        );
      }
      if (isMounted.current) await load();
    } catch (e: any) {
      if (isMounted.current) Alert.alert(t("Error"), e.message);
    }
  }

  async function deleteBill(item: any) {
    try {
      await api.billsDelete(item.id);
      await cancelBillReminderLocal(item.id);
      if (isMounted.current) await load();
    } catch (e: any) {
      if (isMounted.current) Alert.alert(t("Error"), e.message);
    }
  }

  const onDeleteBill = useCallback(
    (item: any) => {
      Alert.alert(
        t("Delete Bill"),
        t("Are you sure you want to delete this bill?"),
        [
          { text: t("Cancel"), style: "cancel" },
          {
            text: t("Delete"),
            style: "destructive",
            onPress: () => deleteBill(item),
          },
        ]
      );
    },
    [deleteBill, t]
  );

  const onMarkPaidBill = useCallback(
    (item: any) => {
      Alert.alert(
        t("Mark Paid"),
        t("Mark {{creditor}} as paid?", { creditor: item.creditor }),
        [
          { text: t("Cancel"), style: "cancel" },
          { text: t("Mark Paid"), onPress: () => markPaid(item) },
        ]
      );
    },
    [markPaid, t]
  );

  const onEditBill = useCallback((item: any) => {
    router.push({
      pathname: "/(app)/bill-edit",
      params: { id: String(item.id) },
    });
  }, []);

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
        Offset: b.reminder_offset_days || "0",
      }));
      const csvString = jsonToCSV(exportData);
      const fileName = "bills_export.csv";
      const myFile = new File(Paths.cache, fileName);
      myFile.write(csvString);
      await Share.open({
        url: `${Paths.cache}${fileName}`,
        type: "text/csv",
        filename: "bills_export",
        title: t("Export Bills CSV"),
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      if (isMounted.current) setIsExporting(false);
    }
  };

  function onLongPressBill(item: any) {
    const isPaid = Boolean(
      item.paid_at || item.is_paid || item.status === "paid"
    );
    const actions: any[] = [
      { text: t("Edit"), onPress: () => onEditBill(item) },
    ];
    if (!isPaid)
      actions.push({
        text: t("Mark Paid"),
        onPress: () => onMarkPaidBill(item),
      });
    actions.push({
      text: t("Delete"),
      style: "destructive",
      onPress: () => onDeleteBill(item),
    });
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

      <View
        style={{
          flex: 1,
          marginTop: -24,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: theme.colors.bg,
          paddingHorizontal: 16,
          overflow: "hidden",
        }}
      >
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View style={{ gap: 16, marginBottom: 16 }}>
              <SummaryCard
                theme={theme}
                label={
                  tab === "pending" ? t("Pending (This Month)") : t("Paid")
                }
                amount={
                  tab === "pending" ? stats.pendingTotal : stats.paidTotal
                }
                t={t}
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                }}
              >
                <Pressable
                  onPress={() => router.push("/(app)/insights")}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: theme.colors.primary, flex: 1 },
                  ]}
                >
                  <Ionicons
                    name="bar-chart"
                    size={18}
                    color={theme.colors.primaryTextButton}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: theme.colors.primaryTextButton },
                    ]}
                  >
                    {t("Insights")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/(app)/bill-edit")}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: theme.colors.primary, flex: 1 },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={theme.colors.primaryTextButton}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: theme.colors.primaryTextButton },
                    ]}
                  >
                    {t("+ Add")}
                  </Text>
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

              <View
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  paddingHorizontal: 4,
                  gap: 8,
                }}
              >
                <Pressable
                  onPress={cycleSort}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={{ color: theme.colors.subtext, fontSize: 13 }}>
                    {t("Sort by")}:
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {sortLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={12}
                    color={theme.colors.text}
                  />
                </Pressable>

                {bills.length > 0 && (
                  <View style={{ width: "100%", alignItems: "flex-end" }}>
                    <Pressable
                      onPress={generateAndShareCSV}
                      disabled={isExporting}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {isExporting && (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.accent}
                        />
                      )}
                      <Text
                        style={{
                          color: theme.colors.accent,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {isExporting ? t("Exporting...") : t("Export CSV")}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          }
          renderSectionHeader={({ section: { title, special } }) => (
            <View
              style={{
                paddingVertical: 12,
                backgroundColor: theme.colors.bg,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color:
                    special === "danger"
                      ? theme.colors.danger
                      : theme.colors.text,
                }}
              >
                {title}
              </Text>
              {special === "danger" && (
                <Ionicons
                  name="warning"
                  size={16}
                  color={theme.colors.danger}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            <View
              style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}
            >
              <Ionicons
                name={
                  tab === "pending"
                    ? "checkmark-done-circle-outline"
                    : "wallet-outline"
                }
                size={64}
                color={theme.colors.border}
              />
              <Text
                style={{
                  color: theme.colors.subtext,
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                {tab === "pending"
                  ? t("You have no pending bills. Enjoy the freedom!")
                  : t("No paid history")}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BillItem
              item={item}
              theme={theme}
              t={t}
              onLongPress={() => onLongPressBill(item)}
              onEdit={() => onEditBill(item)}
              onMarkPaid={() => onMarkPaidBill(item)}
              onDelete={() => onDeleteBill(item)}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: { paddingBottom: 40 },
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
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFF" },
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
  summaryAmount: { fontSize: 36, fontWeight: "900" },
  actionBtn: {
    paddingHorizontal: 16,
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
  actionBtnText: { fontSize: 15, fontWeight: "700" },
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  tabText: { fontSize: 14 },
  billCard: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  billCreditor: { fontSize: 16, fontWeight: "700" },
  billAmount: { fontSize: 18, fontWeight: "800" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rightActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  actionText: { color: "#FFF", fontSize: 12, fontWeight: "600", marginTop: 4 },
});