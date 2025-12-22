import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "react-native-linear-gradient";
import * as Haptics from "expo-haptics";
import { startOfMonth, subMonths, format, parseISO, isSameMonth } from "date-fns";

import { useTheme, Theme } from "../../src/ui/useTheme";
import { api } from "../../src/api/client";
import { getJson } from "../../src/storage/storage"; // MMKV
import { AnimatedAmount } from "../../src/ui/AnimatedAmount";

// --- Logic Reuse (Category Mapping) ---
// Ideally this lives in src/utils/categories.ts, but keeping it here for drop-in usage
const CATEGORY_MAP: { regex: RegExp; label: string; color: string }[] = [
  { regex: /netflix|spotify|hulu|disney|hbo|apple|youtube|twitch|sirius/i, label: "Entertainment", color: "#E50914" },
  { regex: /loan|mortgage|rent|lease|property|hoa/i, label: "Housing", color: "#9D174D" },
  { regex: /visa|mastercard|amex|discover|capital one|chase|citi|bank/i, label: "Credit Cards", color: "#1F618D" },
  { regex: /power|electric|utility|gas|water|trash|sewer/i, label: "Utilities", color: "#FBBF24" },
  { regex: /insurance|geico|statefarm|progressive/i, label: "Insurance", color: "#3498DB" },
  { regex: /att|t-mobile|verizon|xfinity|internet|phone/i, label: "Connectivity", color: "#1D4ED8" },
  { regex: /car|auto|toyota|ford|uber|lyft/i, label: "Transport", color: "#16A085" },
  { regex: /walmart|target|costco|amazon/i, label: "Shopping", color: "#FF9900" },
];

const OTHER_COLOR = "#95A5A6";

// --- Components ---

function Header({ theme, title }: { theme: Theme; title: string }) {
  return (
    <View style={{ backgroundColor: theme.colors.navy }}>
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.navy]}
        style={{ paddingTop: Platform.OS === 'android' ? 40 : 60, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} /> 
        </View>
      </LinearGradient>
    </View>
  );
}

function InsightCard({ title, children, theme }: { title: string; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.cardTitle, { color: theme.colors.subtext }]}>{title}</Text>
      {children}
    </View>
  );
}

// --- Main Screen ---

export default function Insights() {
  const theme = useTheme();
  const { t } = useTranslation();
  const BILLS_CACHE_KEY = "billbell_bills_list_cache";

  const [bills, setBills] = useState<any[]>(() => getJson(BILLS_CACHE_KEY) || []);
  const [loading, setLoading] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // 1. Fetch Fresh Data (Background)
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.billsList();
      setBills(res.bills);
    } catch (e) {
      console.log("Insights load error", e);
    }
  };

  // 2. Bar Chart Data (Last 6 Months)
  const barData = useMemo(() => {
    const today = new Date();
    const data = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthLabel = format(date, "MMM"); // "Jan", "Feb"
      
      // Filter bills for this month
      const total = bills
        .filter(b => {
          const due = parseISO(b.due_date);
          return isSameMonth(due, date);
        })
        .reduce((sum, b) => sum + (b.amount_cents || 0), 0);

      // Gifted Charts format
      data.push({
        value: total / 100, // Convert to dollars for height
        label: monthLabel,
        frontColor: i === 0 ? theme.colors.accent : theme.colors.primary, // Highlight current month
        topLabelComponent: () => (
           <Text style={{ color: theme.colors.subtext, fontSize: 10, marginBottom: 6 }}>
             ${Math.round(total / 100)}
           </Text>
        ),
      });
    }
    return data;
  }, [bills, theme]);

  // 3. Donut Chart Data (Categories)
  const pieData = useMemo(() => {
    const totals: Record<string, number> = {};
    const colors: Record<string, string> = {};

    bills.forEach(b => {
      const amt = b.amount_cents || 0;
      let category = "Other";
      let color = OTHER_COLOR;

      // Find category
      const match = CATEGORY_MAP.find(c => (b.creditor || "").match(c.regex));
      if (match) {
        category = match.label;
        color = match.color;
      }

      totals[category] = (totals[category] || 0) + amt;
      colors[category] = color;
    });

    // Convert to Chart Data
    return Object.keys(totals)
      .map(cat => ({
        value: totals[cat] / 100,
        color: colors[cat],
        text: cat, // for Legend
        focused: false
      }))
      .sort((a, b) => b.value - a.value); // Sort biggest first
  }, [bills]);

  // 4. Interaction Handlers
  const onBarPress = (item: any, index: number) => {
    Haptics.selectionAsync();
    setSelectedMonthIndex(index);
  };

  const totalSpending = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header theme={theme} title={t("Spending Insights")} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* MONTHLY TREND (Bar Chart) */}
        <InsightCard title={t("6 Month Trend")} theme={theme}>
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <BarChart
              data={barData}
              barWidth={32}
              noOfSections={4}
              barBorderRadius={6}
              frontColor={theme.colors.primary}
              yAxisThickness={0}
              xAxisThickness={0}
              hideRules
              yAxisTextStyle={{ color: theme.colors.subtext, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: theme.colors.text, fontSize: 12 }}
              isAnimated
              animationDuration={600}
              onPress={onBarPress}
              height={180}
              width={Dimensions.get('window').width - 80} // Responsive width
            />
          </View>
        </InsightCard>

        {/* CATEGORY BREAKDOWN (Donut Chart) */}
        <InsightCard title={t("Top Categories")} theme={theme}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            
            {/* Chart */}
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={60}
                showGradient
                focusOnPress
                onPress={() => Haptics.selectionAsync()}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.subtext, fontSize: 10 }}>Total</Text>
                    <Text style={{ color: theme.colors.primaryText, fontSize: 16, fontWeight: '800' }}>
                      ${Math.round(totalSpending)}
                    </Text>
                  </View>
                )}
              />
            </View>

            {/* Custom Legend */}
            <View style={{ flex: 1, marginLeft: 20, gap: 8 }}>
              {pieData.slice(0, 5).map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                    <Text style={{ color: theme.colors.subtext, fontSize: 12 }} numberOfLines={1}>{item.text}</Text>
                  </View>
                  <Text style={{ color: theme.colors.primaryText, fontSize: 12, fontWeight: '700' }}>
                    {Math.round((item.value / totalSpending) * 100)}%
                  </Text>
                </View>
              ))}
            </View>

          </View>
        </InsightCard>

        {/* STATS GRID */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="trending-up" size={24} color={theme.colors.accent} />
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>{t("Highest Bill")}</Text>
            <AnimatedAmount 
              amount={Math.max(...bills.map(b => b.amount_cents || 0))} 
              style={{ color: theme.colors.primaryText, fontSize: 18, fontWeight: '800' }} 
            />
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>{t("Active Bills")}</Text>
            <Text style={{ color: theme.colors.primaryText, fontSize: 18, fontWeight: '800' }}>
              {bills.length}
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFF" },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  statLabel: { fontSize: 12, fontWeight: '600' }
});