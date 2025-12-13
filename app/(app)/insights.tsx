import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, Dimensions, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/api/client"; // Assumed path based on your file structure
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

// --- Helpers ---

function centsToDollars(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function getMonthLabel(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'short' });
}

export default function Insights() {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;
  
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load Data
  const load = useCallback(async () => {
    try {
      const res = await api.billsList();
      setBills(res.bills);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // --- Analytics Logic ---

  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`; // "2023-10"

    // 1. Monthly Trends (Last 6 Months)
    const monthlyTotals: Record<string, number> = {};
    const months: string[] = [];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyTotals[key] = 0;
      months.push(key);
    }

    // 2. Aggregates
    let pendingCents = 0;
    let paidCents = 0;
    let projectedNextMonthCents = 0;

    bills.forEach((b) => {
      // Parse Due Date
      const d = new Date(b.due_date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const amount = Number(b.amount_cents || 0);

      // Add to monthly total if within range
      if (monthlyTotals[key] !== undefined) {
        monthlyTotals[key] += amount;
      }

      // Current Month Stats
      if (key === currentMonthKey) {
        const isPaid = b.paid_at || b.is_paid || b.status === "paid";
        if (isPaid) paidCents += amount;
        else pendingCents += amount;
      }

      // Projection: If recurring, add to next month forecast
      if (b.recurrence === 'monthly') {
        projectedNextMonthCents += amount;
      }
    });

    // Format Data for Bar Chart
    const barData = months.map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const val = monthlyTotals[key] / 100; // Convert to dollars
        return {
            value: val,
            label: date.toLocaleString('default', { month: 'short' }),
            frontColor: key === currentMonthKey ? theme.colors.primary : theme.colors.subtext,
            topLabelComponent: () => (
                <Text style={{color: theme.colors.subtext, fontSize: 10, marginBottom: 4}}>
                    {val > 0 ? Math.round(val) : ''}
                </Text>
            )
        };
    });

    // Format Data for Pie Chart
    const pieData = [
        { value: pendingCents, color: theme.colors.danger, text: 'Due' },
        { value: paidCents, color: theme.colors.primary, text: 'Paid' },
    ].filter(d => d.value > 0);

    return {
        barData,
        pieData,
        pendingTotal: pendingCents,
        paidTotal: paidCents,
        projectedTotal: projectedNextMonthCents,
        highestBill: [...bills].sort((a,b) => b.amount_cents - a.amount_cents)[0]
    };
  }, [bills, theme]);

  if (loading && bills.length === 0) {
    return (
      <View style={[screen(theme), { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={screen(theme)}>
      {/* Header */}

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. The "Pulse" Card - Immediate Status */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[card(theme), { flex: 1, alignItems: 'center', paddingVertical: 20 }]}>
                <Text style={{ color: theme.colors.subtext, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>
                    Remaining Due
                </Text>
                <Text style={{ color: theme.colors.danger, fontSize: 22, fontWeight: '900', marginTop: 4 }}>
                    ${centsToDollars(analytics.pendingTotal)}
                </Text>
            </View>
            <View style={[card(theme), { flex: 1, alignItems: 'center', paddingVertical: 20 }]}>
                <Text style={{ color: theme.colors.subtext, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>
                    Paid this Month
                </Text>
                <Text style={{ color: theme.colors.primary, fontSize: 22, fontWeight: '900', marginTop: 4 }}>
                    ${centsToDollars(analytics.paidTotal)}
                </Text>
            </View>
        </View>

        {/* 2. Monthly Trend Chart */}
        <View style={[card(theme), { paddingRight: 0 }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 20 }}>
                6-Month Trend
            </Text>
            <BarChart
                data={analytics.barData}
                barWidth={32}
                noOfSections={3}
                barBorderRadius={4}
                frontColor={theme.colors.primary}
                yAxisThickness={0}
                xAxisThickness={0}
                yAxisTextStyle={{ color: theme.colors.subtext }}
                xAxisLabelTextStyle={{ color: theme.colors.subtext, fontSize: 12 }}
                hideRules
                isAnimated
                height={180}
                width={screenWidth - 80} // Adjust for padding
            />
        </View>

        {/* 3. Forecasting / Pro Card */}
        <View style={card(theme)}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text }}>
                    Projected Liabilities
                </Text>
                <View style={{backgroundColor: theme.colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                    <Text style={{fontSize: 10, fontWeight: 'bold', color: '#fff'}}>PRO ESTIMATE</Text>
                </View>
            </View>
            
            <Text style={{ color: theme.colors.subtext, lineHeight: 20 }}>
                Based on your recurring bills, you are committed to spending at least:
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: theme.colors.text, marginVertical: 10 }}>
                ${centsToDollars(analytics.projectedTotal)}
            </Text>
            <Text style={{ color: theme.colors.subtext, fontSize: 12 }}>
                Next month. This does not include one-time expenses.
            </Text>
        </View>

        {/* 4. Ratio Chart (Optional visualization) */}
        {analytics.pendingTotal > 0 && (
            <View style={[card(theme), { flexDirection: 'row', alignItems: 'center' }]}>
                 <View style={{flex: 1}}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>
                        Payment Ratio
                    </Text>
                    <Text style={{ color: theme.colors.subtext }}>
                        You have paid {Math.round((analytics.paidTotal / (analytics.paidTotal + analytics.pendingTotal)) * 100)}% of this month's obligations.
                    </Text>
                 </View>
                 <PieChart
                    data={analytics.pieData}
                    donut
                    radius={40}
                    innerRadius={30}
                    innerCircleColor={theme.colors.bg}
                 />
            </View>
        )}

      </ScrollView>
    </View>
  );
}