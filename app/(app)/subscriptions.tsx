import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, LayoutAnimation, Platform, UIManager, TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/ui/useTheme";
import { useBills } from "../../src/hooks/useBills";
import { Bill } from "../../src/types/domain";
import { AnimatedAmount } from "../../src/ui/AnimatedAmount";
import { ScaleButton } from "../../src/ui/ScaleButton";
import { Skeleton } from "../../src/ui/Skeleton";
import { useCurrency } from "../../src/hooks/useCurrency";
import { formatCurrency } from "@/utils/currency";
import { KNOWN_SUBSCRIPTIONS } from "@/data/vendors";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- WORLDWIDE SUBSCRIPTION DATABASE ---
// Add more patterns here as needed.


// Helper to match raw creditor string to known brand
function enrichSubscription(creditorRaw: string, theme: any) {
  const match = KNOWN_SUBSCRIPTIONS.find(sub => 
    sub.patterns.some(pattern => pattern.test(creditorRaw))
  );

  if (match) {
    // Special handling for Apple black icon in dark mode
    let iconColor = match.color;
    if (match.id === 'apple' && theme.isDark) {
        iconColor = '#FFFFFF';
    }

    return {
      displayName: match.name,
      icon: match.icon,
      color: iconColor,
      type: match.type,
      isKnown: true
    };
  }

  // Fallback for unknown
  return {
    displayName: creditorRaw,
    icon: 'card-outline',
    color: theme.colors.subtext, // Neutral color for unknown
    type: 'Ionicons',
    isKnown: false
  };
}

// Mock History
const getMockHistory = (amount: number) => {
  const today = new Date();
  return [
    { id: 1, date: new Date(today.getFullYear(), today.getMonth() + 1, 15), status: 'upcoming', label: 'Next Payment' },
    { id: 2, date: new Date(today.getFullYear(), today.getMonth(), 15), status: 'paid', label: 'Paid' },
    { id: 3, date: new Date(today.getFullYear(), today.getMonth() - 1, 15), status: 'paid', label: 'Paid' },
  ];
};

export default function Subscriptions() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: bills, isLoading } = useBills();
  const currency = useCurrency();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter for "Subscriptions"
  const subs = useMemo(() => {
    if (!bills) return [];
    return bills.filter(
      (b: { status: string; payment_method: string; recurrence: string; }) =>
        b.status === "active" &&
        (b.payment_method === "auto" || (b.recurrence && b.recurrence !== "none"))
    ).sort((a: { amount_cents: number; }, b: { amount_cents: number; }) => b.amount_cents - a.amount_cents); 
  }, [bills]);

  const totalMonthly = useMemo(() => {
    return subs.reduce((sum: any, b: { amount_cents: any; }) => sum + b.amount_cents, 0);
  }, [subs]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Bill }) => {
    // Use the enrichment logic here
    const details = enrichSubscription(item.creditor, theme);
    const IconLib = details.type === "Ionicons" ? Ionicons : MaterialCommunityIcons;
    const isExpanded = expandedId === String(item.id);
    const history = getMockHistory(item.amount_cents);

    return (
      <View style={[
        styles.cardContainer, 
        { 
          backgroundColor: theme.colors.card, 
          borderColor: isExpanded ? theme.colors.primary : theme.colors.border 
        }
      ]}>
        <ScaleButton
          onPress={() => toggleExpand(String(item.id))}
          style={styles.cardHeader}
        >
          {/* Icon Box with Brand Color Background (Low Opacity) */}
          <View style={[styles.iconBox, { backgroundColor: details.isKnown ? details.color + "20" : theme.colors.border }]}>
            <IconLib name={details.icon as any} size={24} color={details.color} />
          </View>
          
          <View style={{ flex: 1 }}>
            {/* Use Display Name (Clean) */}
            <Text style={[styles.name, { color: theme.colors.primaryText }]}>
              {details.displayName}
            </Text>
            {/* Show original creditor name if we renamed it, for clarity */}
            {details.isKnown && details.displayName !== item.creditor && (
               <Text style={[styles.originalName, { color: theme.colors.subtext }]}>
                 {item.creditor}
               </Text>
            )}
            <Text style={[styles.date, { color: theme.colors.subtext }]}>
              {item.recurrence ? t("Repeats: {{freq}}", { freq: item.recurrence }) : t("Auto-Payment")}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amount, { color: theme.colors.primaryText }]}>
              {formatCurrency(item.amount_cents, currency)}
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={theme.colors.subtext} 
              style={{ marginTop: 4 }}
            />
          </View>
        </ScaleButton>

        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>{t("Recent & Upcoming")}</Text>
            
            {history.map((h, index) => (
              <View key={h.id} style={styles.historyRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.dot, { backgroundColor: h.status === 'upcoming' ? theme.colors.warning : theme.colors.success }]} />
                  <Text style={{ color: theme.colors.primaryText, fontSize: 14 }}>
                    {h.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={{ color: h.status === 'upcoming' ? theme.colors.primaryText : theme.colors.subtext, fontSize: 14 }}>
                  {h.status === 'upcoming' ? t("Due") : t("Paid")}
                </Text>
              </View>
            ))}

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.bg }]}
                onPress={() => router.push({ pathname: "/(app)/bill-edit", params: { id: String(item.id) } })}
              >
                <Text style={{ color: theme.colors.primaryText, fontWeight: "600" }}>{t("Edit Bill Details")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
              currency={currency}
              amount={totalMonthly}
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
  
  // Card Styles
  cardContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  
  // Expanded Styles
  expandedContent: { padding: 16, borderTopWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: 'uppercase', marginBottom: 4 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actionRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'flex-end' },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },

  // Icon & Text Styles
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700" },
  originalName: { fontSize: 11, marginBottom: 2 },
  date: { fontSize: 13, marginTop: 0 },
  amount: { fontSize: 18, fontWeight: "700" },
});