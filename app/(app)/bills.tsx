import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  NativeModules,
  TextInput,
  Keyboard,
  useWindowDimensions
} from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Share from "react-native-share";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  isSameMonth,
  addMonths,
  parseISO,
  startOfDay,
  isSameWeek,
  addWeeks,
  isToday,
  isTomorrow,
  differenceInCalendarDays,
} from "date-fns";
import { userSettings } from "../../src/storage/userSettings";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";
import { useCurrency } from "../../src/hooks/useCurrency";
import {
  resyncLocalNotificationsFromBills,
  cancelBillReminderLocal,
} from "../../src/notifications/notifications";
import { useTheme, Theme } from "../../src/ui/useTheme";
import {
  startSummaryActivity,
  stopActivity,
  startAndroidLiveActivity,
} from "../../src/native/LiveActivity";
import { getToken } from "../../src/auth/session";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { AnimatedAmount } from "../../src/ui/AnimatedAmount";
import { FlashList } from "@shopify/flash-list";
import ConfettiCannon from "react-native-confetti-cannon";
import * as StoreReview from "expo-store-review";
import { BILL_ICON_MAP } from '../../src/data/vendors';
import { formatCurrency } from "../../src/utils/currency";
// --- NEW VISUAL IMPORTS ---
import Animated, { LinearTransition, FadeIn, FadeOut } from 'react-native-reanimated';
import { ScaleButton } from "../../src/ui/ScaleButton";
import { useBills, useBillMutations } from "../../src/hooks/useBills"; 
import { Bill } from "../../src/types/domain";
import { Skeleton } from "../../src/ui/Skeleton";
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";


const getWidgetModule = () => {
  try {
    return NativeModules?.WidgetModule;
  } catch {
    return undefined;
  }
};

// --- Types ---
type SortKey = "due" | "amount" | "name";
type SummaryItem = { label: string; amount: number; highlight?: boolean };

// FlatList Types
type ListItemType = "header" | "bill";
type FlatListItem =
  | { type: "header"; title: string; special?: string; id: string }
  | { type: "bill"; data: Bill; id: string };



function safeDateNum(s?: string | null) {
  if (!s) return 0;
  try {
    return parseISO(s).getTime();
  } catch {
    return 0;
  }
}

function isOverdue(item: Bill) {
  const isPaid = Boolean(
    item.paid_at || item.is_paid || item.status === "paid"
  );
  if (isPaid) return false;

  const due = parseISO(item.due_date);
  const today = startOfDay(new Date());
  return due < today;
}

// Smart Date Formatter
function getSmartDueDate(
  dateStr: string,
  t: any,
  locale?: string
): { label: string; color?: string; urgent?: boolean } {
  const due = parseISO(dateStr);
  const today = startOfDay(new Date());

  if (isToday(due))
    return { label: t("Due Today"), color: "#E67E22", urgent: true };
  if (isTomorrow(due))
    return { label: t("Due Tomorrow"), color: "#F1C40F", urgent: true };

  const diff = differenceInCalendarDays(due, today);

  if (diff < 0) {
    return {
      label: t("Overdue by {{days}} days", { days: Math.abs(diff) }),
      color: "#E74C3C",
      urgent: true,
    };
  }

  if (diff < 7) {
    return {
      label: t("Due in {{days}} days", { days: diff }),
      color: undefined,
    };
  }

  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(due);
  return { label: t("Due {{date}}", { date: formattedDate }), color: undefined };
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

function Header({
  theme,
  title,
  onProfilePress,
  searchQuery,
  setSearchQuery,
  t,
}: any) {
  return (
    <View style={{ backgroundColor: theme.colors.navy }}>
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Centered Content Wrapper for iPad/Tablet */}
          <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Pressable onPress={onProfilePress} style={styles.profileButton}>
                <Ionicons name="person" size={20} color="#FFF" />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t("Search bills...")}
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    setSearchQuery("");
                    Keyboard.dismiss();
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="rgba(255,255,255,0.8)"
                  />
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function SummaryCard({ theme, items }: { theme: Theme; items: SummaryItem[] }) {
  const isSingle = items.length === 1;
  const currency = useCurrency();
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: isSingle ? "center" : "space-between",
        }}
      >
        {items.map((item, index) => (
          <View
            key={index}
            style={{
              alignItems: "center",
              flex: isSingle ? 0 : 1,
              borderRightWidth: !isSingle && index !== items.length - 1 ? 1 : 0,
              borderRightColor: theme.colors.border,
            }}
          >
            <Text
              style={[
                styles.summaryLabel,
                {
                  color: theme.colors.subtext,
                  fontSize: isSingle ? 14 : 11,
                  textAlign: "center",
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <AnimatedAmount
            currency={currency}
              amount={item.amount}
              style={{
                color: item.highlight
                  ? theme.colors.primary
                  : theme.colors.primaryText,
                fontSize: isSingle ? 36 : 20,
                fontWeight: "900",
                fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function TabSegment({ tabs, activeTab, onTabPress, theme }: any) {
  return (
    <View
      style={[
        styles.tabContainer,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {tabs.map((tab: any) => {
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
                {
                  color: isActive
                    ? theme.colors.primaryTextButton
                    : theme.colors.subtext,
                  fontWeight: isActive ? "700" : "500",
                },
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

function BillListSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: 12, paddingTop: 24 }}>
      {[1, 2, 3].map((i) => (
        <View 
          key={i} 
          style={{ 
            padding: 16, 
            borderRadius: 16, 
            borderWidth: 1, 
            borderColor: theme.colors.border, 
            backgroundColor: theme.colors.card,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Skeleton width={36} height={36} borderRadius={10} />
          <View style={{ flex: 1, gap: 6 }}>
             <Skeleton width="60%" height={16} borderRadius={4} />
             <Skeleton width="40%" height={12} borderRadius={4} />
          </View>
          <Skeleton width={60} height={20} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

function BillItem({
  item,
  theme,
  t,
  locale,
  onLongPress,
  onEdit,
  onMarkPaid,
  onDelete,
}: any) {
  const currency = useCurrency();
  
  const amt = formatCurrency(item.amount_cents, currency)
  const isPaid = Boolean(
    item.paid_at || item.is_paid || item.status === "paid"
  );
  const overdue = isOverdue(item);

  const dateInfo = useMemo(() => {
    if (isPaid) {
      const d = item.paid_at || item.due_date;
      const formatted = d ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parseISO(d)) : "";
      return {
        label: `${t("Paid on")} ${formatted}`,
        color: undefined,
      };
    }
    return getSmartDueDate(item.due_date, t, locale);
  }, [item.due_date, item.paid_at, isPaid, t, locale]);

  const swipeableRef = useRef<SwipeableMethods>(null);
  const iconData = getBillIcon(item.creditor);
  const IconComponent =
    iconData.type === "Ionicons" ? Ionicons : MaterialCommunityIcons;

  const renderRightActions = useCallback(() => {
    const ActionButton = ({ icon, color, label, onPress }: any) => (
      <RectButton
        style={[{ backgroundColor: color }, styles.swipeAction]}
        onPress={() => {
          Haptics.selectionAsync();
          swipeableRef.current?.close();
          onPress();
        }}
      >
        <Ionicons name={icon} size={24} color="#FFF" />
        <Text style={styles.actionText}>{label}</Text>
      </RectButton>
    );

    return (
      <View style={styles.rightActionsContainer}>
        <ActionButton
          icon="create-outline"
          color="#3498DB"
          label={t("Edit")}
          onPress={onEdit}
        />
        {!isPaid && (
          <ActionButton
            icon="checkmark-done-circle-outline"
            color="#2ECC71"
            label={t("Paid")}
            onPress={onMarkPaid}
          />
        )}
        <ActionButton
          icon="trash-outline"
          color="#E74C3C"
          label={t("Delete")}
          onPress={onDelete}
        />
      </View>
    );
  }, [isPaid, onEdit, onMarkPaid, onDelete, t]);

  const BillContent = (
    <Pressable
      onPress={onEdit} 
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onLongPress();
      }}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.billCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: overdue ? theme.colors.danger : theme.colors.border,
          opacity: pressed ? 0.9 : 1,
          borderWidth: 1,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={[styles.iconBox, { backgroundColor: iconData.color + "20" }]}
        >
          <IconComponent
            name={iconData.name as any}
            size={20}
            color={iconData.color}
          />
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text
              style={[styles.billCreditor, { color: theme.colors.primaryText }]}
              numberOfLines={1}
            >
              {item.creditor}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <MaterialCommunityIcons
                name={
                  item.payment_method === "auto"
                    ? "refresh-auto"
                    : "hand-pointing-right"
                }
                size={14}
                color={
                  item.payment_method === "auto"
                    ? theme.colors.accent
                    : theme.colors.subtext
                }
              />
              <Text
                style={{
                  color:
                    item.payment_method === "auto"
                      ? theme.colors.accent
                      : theme.colors.subtext,
                  fontSize: 11,
                  fontWeight: "600",
                  marginLeft: 4,
                  textTransform: "uppercase",
                }}
              >
                {item.payment_method === "auto"
                  ? t("Auto-Draft")
                  : t("Manual Pay")}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
              }}
            >
              <Ionicons
                name={isPaid ? "checkmark-circle" : "calendar-outline"}
                size={14}
                color={
                  dateInfo.color ||
                  (isPaid ? theme.colors.accent : theme.colors.subtext)
                }
              />
              <Text
                style={{
                  color:
                    dateInfo.color ||
                    (isPaid ? theme.colors.accent : theme.colors.subtext),
                  fontSize: 13,
                  fontWeight: "500",
                }}
              >
                {dateInfo.label}
              </Text>
            </View>
             {item.recurrence && item.recurrence !== 'none' && item.end_date && (
                   <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                       <Text style={{ color: theme.colors.subtext, fontSize: 10 }}>•</Text>
                       <Text style={{ color: theme.colors.subtext, fontSize: 11, marginLeft: 4 }}>
                          {t("Ends")}: {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parseISO(item.end_date))}
                       </Text>
                   </View>
              )}
          </View>

          <View
            style={{ alignItems: "flex-end", marginLeft: 10, flexShrink: 0 }}
          >
            <Text
              style={[styles.billAmount, { color: theme.colors.primaryText }]}
            >
              {amt}
            </Text>
            {overdue && (
              <View
                style={{
                  backgroundColor: "#FFE5E5",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.danger,
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  {t("OVERDUE")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );

  // --- LAYOUT ANIMATION WRAPPER ---
  if (Platform.OS === "ios") {
    return (
      <Animated.View 
        // Remove 'layout' to stop jumping on reorder/scroll
        // Remove 'entering' to stop jumping on scroll recycle
        exiting={FadeOut} 
        entering={FadeIn} // <-- CAUSE OF JUMP
      >
        <ReanimatedSwipeable
          ref={swipeableRef}
          friction={2}
          rightThreshold={40}
          renderRightActions={renderRightActions}
          containerStyle={{ marginVertical: 0 }}
        >
          {BillContent}
        </ReanimatedSwipeable>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
       // Remove 'layout' and 'entering' here too
       exiting={FadeOut}
       entering={FadeIn} // <-- CAUSE OF JUMP
    >
      {BillContent}
    </Animated.View>
  );
}

function SectionHeader({ title, special, theme }: any) {
  return (
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
          color: special === "danger" ? theme.colors.danger : theme.colors.text,
        }}
      >
        {title}
      </Text>
      {special === "danger" && (
        <Ionicons name="warning" size={16} color={theme.colors.danger} />
      )}
    </View>
  );
}

// --- Main Screen ---

export default function Bills() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const { data: bills, refetch, isRefetching, isLoading } = useBills();
  const { markPaid: markPaidMutation, deleteBill: deleteBillMutation } = useBillMutations();

  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"pending" | "paid">("pending");
  const [sort, setSort] = useState<SortKey>("due");
  const [isExporting, setIsExporting] = useState(false);
  const syncedBillsHash = useRef("");
  const confettiRef = useRef<ConfettiCannon>(null);

  const safeBills = bills || [];
  const currency = useCurrency();

  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return safeBills;
    const lower = searchQuery.toLowerCase();
    return safeBills.filter(
      (b: { creditor: any; amount_cents: number; }) =>
        (b.creditor || "").toLowerCase().includes(lower) ||
        formatCurrency(b.amount_cents, currency)
    );
  }, [safeBills, searchQuery]);

  // Effects & Logic...
  useEffect(() => {
    const currentHash = JSON.stringify(safeBills.map((b: { id: any; status: any; due_date: any; }) => b.id + b.status + b.due_date));
    if (syncedBillsHash.current !== currentHash && safeBills.length > 0) {
      resyncLocalNotificationsFromBills(safeBills);
      syncedBillsHash.current = currentHash;
    }
  }, [safeBills]);

  // Live Activity & Widget Logic
  useEffect(() => {
    const initializeApp = async () => {
        if (Platform.OS !== "android" || safeBills.length === 0) return;
        const widgetModule = getWidgetModule();
        const pending = safeBills.filter(
          (b: { paid_at: any; is_paid: any; status: string; }) => !b.paid_at && !b.is_paid && b.status !== "paid"
        );
        const overdueBills = pending.filter((b: Bill) => isOverdue(b));
        const overdueSum = overdueBills.reduce(
          (sum: number, b: { amount_cents: any; }) => sum + Number(b.amount_cents || 0),
          0
        );
        const nextBill = pending.find((b: Bill) => !isOverdue(b));
        
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
          formatCurrency(overdueSum, currency),
          overdueBills.length,
          String(nextBill?.id ?? "")
        );
    };
    initializeApp();
  }, [safeBills, t]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const syncLiveActivity = async () => {
      const isEnabled = await userSettings.getLiveActivityEnabled();
      const pending = safeBills.filter(
        (b: { paid_at: any; is_paid: any; status: string; }) => !b.paid_at && !b.is_paid && b.status !== "paid"
      );
      const overdueBills = pending.filter((b: Bill) => isOverdue(b));
      const overdueSum = overdueBills.reduce(
        (sum: number, b: { amount_cents: any; }) => sum + Number(b.amount_cents || 0),
        0
      );
      const today = new Date();
      const thisMonthBills = pending.filter((b: Bill) => {
        const due = parseISO(b.due_date);
        return isSameMonth(due, today) && !isOverdue(b);
      });
      const monthSum = thisMonthBills.reduce(
        (sum: number, b: { amount_cents: any; }) => sum + Number(b.amount_cents || 0),
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
        formatCurrency(overdueSum, currency),
        overdueBills.length,
        formatCurrency(monthSum, currency),
        thisMonthBills.length
      );
    };
    syncLiveActivity();
  }, [safeBills]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }
      return () => {
        const defaultStyle = theme.mode === "dark" ? "light-content" : "dark-content";
        StatusBar.setBarStyle(defaultStyle);
        if (Platform.OS === "android") {
          StatusBar.setTranslucent(false);
          StatusBar.setBackgroundColor(theme.colors.bg);
        }
      };
    }, [theme.mode, theme.colors.bg, ])
  );

  const pendingBills = useMemo(() => filteredBills.filter((b: any) => !b.paid_at && !b.is_paid && b.status !== "paid"), [filteredBills]);
  const paidBills = useMemo(() => filteredBills.filter((b: any) => b.paid_at || b.is_paid || b.status === "paid"), [filteredBills]);

  const sections = useMemo(() => {
    const list = tab === "pending" ? pendingBills : paidBills;
    const sorted = [...list].sort((a, b) => {
      if (sort === "name") return String(a.creditor || "").localeCompare(String(b.creditor || ""));
      if (sort === "amount") return Number(b.amount_cents || 0) - Number(a.amount_cents || 0);
      const dateA = tab === "pending" ? safeDateNum(a.due_date) : safeDateNum(a.paid_at) || safeDateNum(a.due_date);
      const dateB = tab === "pending" ? safeDateNum(b.due_date) : safeDateNum(b.paid_at) || safeDateNum(b.due_date);
      return tab === "pending" ? dateA - dateB : dateB - dateA;
    });

    if (sort !== "due") return [{ title: t("All Bills"), data: sorted }];

    const today = new Date();
    const nextMonthDate = addMonths(today, 1);
    const buckets: Record<string, any[]> = { overdue: [], thisMonth: [], nextMonth: [], future: [] };

    sorted.forEach((bill) => {
      const dateStr = tab === "pending" ? bill.due_date : bill.paid_at || bill.due_date;
      const billDate = parseISO(dateStr);
      if (tab === "pending" && isOverdue(bill)) buckets.overdue.push(bill);
      else if (isSameMonth(billDate, today)) buckets.thisMonth.push(bill);
      else if (isSameMonth(billDate, nextMonthDate)) buckets.nextMonth.push(bill);
      else buckets.future.push(bill);
    });

    const result = [];
    if (buckets.overdue.length > 0) result.push({ title: t("Overdue"), data: buckets.overdue, special: "danger" });
    if (buckets.thisMonth.length > 0) result.push({ title: t("This Month"), data: buckets.thisMonth });
    if (buckets.nextMonth.length > 0) result.push({ title: t("Next Month"), data: buckets.nextMonth });
    if (buckets.future.length > 0) result.push({ title: t("Future"), data: buckets.future });
    return result;
  }, [tab, pendingBills, paidBills, sort, t]);

  const flatData = useMemo(() => {
    const data: FlatListItem[] = [];
    sections.forEach((section) => {
      data.push({ type: "header", title: section.title, special: section.special, id: `header-${section.title}` });
      section.data.forEach((bill) => data.push({ type: "bill", data: bill, id: String(bill.id) }));
    });
    return data;
  }, [sections]);

  const stats = useMemo(() => {
    const allPending = safeBills.filter((b: { paid_at: any; is_paid: any; status: string; }) => !b.paid_at && !b.is_paid && b.status !== "paid");
    const allPaid = safeBills.filter((b: { paid_at: any; is_paid: any; status: string; }) => b.paid_at || b.is_paid || b.status === "paid");
    const today = new Date();
    const nextWeekDate = addWeeks(today, 1);
    const thisWeekBills = allPending.filter((b: { due_date: string; }) => isSameWeek(parseISO(b.due_date), today));
    const nextWeekBills = allPending.filter((b: { due_date: string; }) => isSameWeek(parseISO(b.due_date), nextWeekDate));
    const thisMonthBills = allPending.filter((b: { due_date: string; }) => isSameMonth(parseISO(b.due_date), today));
    const sum = (list: any[]) => list.reduce((total, b) => total + Number(b.amount_cents || 0), 0);
    return {
      pendingThisWeek: sum(thisWeekBills),
      pendingNextWeek: sum(nextWeekBills),
      pendingThisMonth: sum(thisMonthBills),
      paidTotal: sum(allPaid),
    };
  }, [safeBills]);

  const sortLabel = useMemo(() => {
    if (sort === "amount") return t("Amount");
    if (sort === "name") return t("Name");
    return tab === "pending" ? t("Due Date") : t("Paid Date");
  }, [sort, tab, t]);

  const markPaid = async (item: Bill) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confettiRef.current?.start();
      if ((await StoreReview.hasAction()) && Math.random() > 0.8) setTimeout(() => StoreReview.requestReview(), 2000);
      markPaidMutation.mutate(item.id);
      await cancelBillReminderLocal(item.id);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("Error"), e.message);
    }
  };

  const deleteBill = async (item: Bill) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      deleteBillMutation.mutate(item.id);
      await cancelBillReminderLocal(item.id);
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
    }
  };

  const onDeleteBill = useCallback((item: Bill) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(t("Delete Bill"), t("Are you sure you want to delete this bill?"), [
          { text: t("Cancel"), style: "cancel" },
          { text: t("Delete"), style: "destructive", onPress: () => deleteBill(item) },
      ]);
  }, [deleteBill, t]);

  const onMarkPaidBill = useCallback((item: Bill) => {
      Alert.alert(t("Mark Paid"), t("Mark {{creditor}} as paid?", { creditor: item.creditor }), [
          { text: t("Cancel"), style: "cancel" },
          { text: t("Mark Paid"), onPress: () => markPaid(item) },
      ]);
  }, [markPaid, t]);

  const onEditBill = useCallback((item: Bill) => {
    router.push({ pathname: "/(app)/bill-edit", params: { id: String(item.id) } });
  }, []);

  function cycleSort() {
    Haptics.selectionAsync();
    if (sort === "due") setSort("amount");
    else if (sort === "amount") setSort("name");
    else setSort("due");
  }

  const generateAndShareCSV = async () => {
    if (isExporting) return;
    try {
      if (safeBills.length === 0) { Alert.alert(t("No Data"), t("There are no bills to export.")); return; }
      setIsExporting(true);
      const exportData = safeBills.map((b: { id: any; creditor: any; amount_cents: number; due_date: any; status: string; notes: any; recurrence: any; reminder_offset_days: any; }) => ({
        ID: b.id, Creditor: b.creditor, Amount: formatCurrency(b.amount_cents, currency), DueDate: b.due_date,
        Status: b.status === "paid" ? "Paid" : "Pending", Notes: b.notes || "",
        Recurrence: b.recurrence || "none", Offset: b.reminder_offset_days || "0",
      }));
      const csvString = jsonToCSV(exportData);
      const fileName = "bills_export.csv";
      const templateFile = new File(Paths.cache, fileName);
      templateFile.write(csvString);
      await Share.open({ url: templateFile.uri, type: "text/csv", filename: "bills_export", title: "Download Bill Export" });
    } catch (error) { console.error("Export failed:", error); } finally { setIsExporting(false); }
  };

  function onLongPressBill(item: Bill) {
    const isPaid = Boolean(item.paid_at || item.is_paid || item.status === "paid");
    const actions: any[] = [{ text: t("Edit"), onPress: () => onEditBill(item) }];
    if (!isPaid) actions.push({ text: t("Mark Paid"), onPress: () => onMarkPaidBill(item) });
    actions.push({ text: t("Delete"), style: "destructive", onPress: () => onDeleteBill(item) });
    actions.push({ text: t("Cancel"), style: "cancel" });
    Alert.alert(item.creditor || t("Bill"), t("Choose an action"), actions);
  }

  const summaryItems = useMemo(() => {
    if (tab === "pending") {
      return [
        { label: t("This Week"), amount: stats.pendingThisWeek },
        { label: t("Next Week"), amount: stats.pendingNextWeek },
        { label: t("This Month"), amount: stats.pendingThisMonth, highlight: true },
      ];
    }
    return [{ label: t("Total Paid"), amount: stats.paidTotal }];
  }, [tab, stats, t]);

  const renderItem = ({ item }: { item: FlatListItem }) => {
    if (item.type === "header") return <SectionHeader title={item.title} special={item.special} theme={theme} />;
    return (
      <BillItem
        item={item.data}
        theme={theme}
        t={t}
        locale={i18n.language}
        onLongPress={() => onLongPressBill(item.data)}
        onEdit={() => onEditBill(item.data)}
        onMarkPaid={() => onMarkPaidBill(item.data)}
        onDelete={() => onDeleteBill(item.data)}
      />
    );
  };

  const showSkeleton = isLoading && safeBills.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Header
        theme={theme}
        title={t("My Bills")}
        onProfilePress={() => router.push("/(app)/profile")}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        t={t}
      />

      {/* Main Body Sheet */}
      <View style={{ flex: 1, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.colors.bg, overflow: "hidden" }}>
        
        {/* Centered Content Wrapper for iPad/Tablet */}
        <View style={{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingHorizontal: 16 }}>
          
          {showSkeleton ? (
             <View>
                <View style={{ height: 24 }} /> 
                <View style={{ marginBottom: 16 }}><Skeleton width="100%" height={100} borderRadius={20} /></View>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                   <Skeleton width="48%" height={50} borderRadius={16} />
                   <Skeleton width="48%" height={50} borderRadius={16} />
                </View>
                <BillListSkeleton />
             </View>
          ) : (
             <FlashList<FlatListItem>
               data={flatData}
               renderItem={renderItem}
               // @ts-ignore
               getItemType={(item) => item.type}
                            // @ts-ignore
               estimatedItemSize={100}
               keyExtractor={(item) => item.id}
               contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }}
               showsVerticalScrollIndicator={false}
               refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
               ListHeaderComponent={
                 <View style={{ gap: 16, marginBottom: 16 }}>
                    <SummaryCard theme={theme} items={summaryItems} />
                    <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", justifyContent: "flex-start" }}>
                      
                      {/* --- REPLACED BUTTONS WITH SCALEBUTTON --- */}
                      <ScaleButton onPress={() => router.push("/(app)/insights")} style={[styles.actionBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}>
                        <Ionicons name="bar-chart" size={18} color={theme.colors.primaryTextButton} />
                        <Text style={[styles.actionBtnText, { color: theme.colors.primaryTextButton }]}>{t("Insights")}</Text>
                      </ScaleButton>
                      
                      <ScaleButton onPress={() => router.push("/(app)/bill-scan")} style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, flex: 0.3 }]}>
                        <Ionicons name="scan" size={20} color={theme.colors.text} />
                      </ScaleButton>

                      <ScaleButton onPress={() => router.push("/(app)/bill-edit")} style={[styles.actionBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}>
                        <Ionicons name="add" size={20} color={theme.colors.primaryTextButton} />
                        <Text style={[styles.actionBtnText, { color: theme.colors.primaryTextButton }]}>{t("+ Add")}</Text>
                      </ScaleButton>
                    </View>
                    <TabSegment theme={theme} activeTab={tab} onTabPress={(key: any) => setTab(key)} tabs={[{ key: "pending", label: t("Pending") }, { key: "paid", label: t("Paid") }]} />
                    
                    <View style={{ flexDirection: "column", alignItems: "flex-start", paddingHorizontal: 4, gap: 8 }}>
                      <Pressable onPress={cycleSort} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={{ color: theme.colors.subtext, fontSize: 13 }}>{t("Sort by")}:</Text>
                        <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 13 }}>{sortLabel}</Text>
                        <Ionicons name="chevron-down" size={12} color={theme.colors.text} />
                      </Pressable>
                      {safeBills.length > 0 && (
                        <View style={{ width: "100%", alignItems: "flex-end" }}>
                          <Pressable onPress={generateAndShareCSV} disabled={isExporting} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            {isExporting && <ActivityIndicator size="small" color={theme.colors.accent} />}
                            <Text style={{ color: theme.colors.accent, fontWeight: "700", fontSize: 13 }}>{isExporting ? t("Exporting...") : t("Export CSV")}</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                 </View>
               }
               ListEmptyComponent={
                 <View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
                    <Ionicons name={tab === "pending" ? "checkmark-done-circle-outline" : "wallet-outline"} size={64} color={theme.colors.border} />
                    <Text style={{ color: theme.colors.subtext, fontSize: 16, textAlign: "center" }}>
                      {searchQuery.length > 0 
                        ? t("No bills found matching '{{query}}'", { query: searchQuery })
                        : tab === "pending" ? t("You have no pending bills. Enjoy the freedom!") : t("No paid history")}
                    </Text>
                 </View>
               }
             />
          )}
        </View>
      </View>

      <ConfettiCannon
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        ref={confettiRef}
        fadeOut={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: { paddingBottom: 30 },
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom:15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
    padding: 0,
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