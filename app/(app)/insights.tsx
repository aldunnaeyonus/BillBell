import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useFocusEffect } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { api } from "../../src/api/client";
import { useTheme, Theme } from "../../src/ui/useTheme";

// --- Helpers ---

function centsToDollars(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

// --- Components ---

function Header({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerIconCircle}>
          <Ionicons name="stats-chart" size={28} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function StatCard({ 
  label, 
  amount, 
  icon, 
  color, 
  theme 
}: { 
  label: string; 
  amount: string; 
  icon: keyof typeof Ionicons.glyphMap; 
  color: string; 
  theme: Theme 
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}> 
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>{label}</Text>
        <Text style={[styles.statAmount, { color: theme.colors.primaryText }]}>${amount}</Text>
      </View>
    </View>
  );
}

// --- Main Screen ---

export default function Insights() {
  const theme = useTheme();
  const { t } = useTranslation();
  const screenWidth = Dimensions.get("window").width;
  
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

    const monthlyTotals: Record<string, number> = {};
    const months: string[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyTotals[key] = 0;
      months.push(key);
    }

    let pendingCents = 0;
    let paidCents = 0;
    let projectedNextMonthCents = 0;

    bills.forEach((b) => {
      const d = new Date(b.due_date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const amount = Number(b.amount_cents || 0);

      if (monthlyTotals[key] !== undefined) {
        monthlyTotals[key] += amount;
      }

      if (key === currentMonthKey) {
        const isPaid = b.paid_at || b.is_paid || b.status === "paid";
        if (isPaid) paidCents += amount;
        else pendingCents += amount;
      }

      if (b.recurrence === 'monthly') {
        projectedNextMonthCents += amount;
      }
    });

    const barData = months.map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const val = monthlyTotals[key] / 100;
        const isCurrent = key === currentMonthKey;
        
        return {
            value: val,
            label: date.toLocaleString('default', { month: 'short' }),
            frontColor: isCurrent ? theme.colors.accent : theme.colors.primary,
            topLabelComponent: () => (
                <Text style={{color: theme.colors.subtext, fontSize: 10, marginBottom: 4, fontWeight: '600'}}>
                    {val > 0 ? Math.round(val) : ''}
                </Text>
            )
        };
    });

    const pieData = [
        { value: pendingCents, color: theme.colors.danger, text: 'Due' },
        { value: paidCents, color: theme.colors.accent, text: 'Paid' },
    ].filter(d => d.value > 0);

    return {
        barData,
        pieData,
        pendingTotal: pendingCents,
        paidTotal: paidCents,
        projectedTotal: projectedNextMonthCents,
    };
  }, [bills, theme]);

  if (loading && bills.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        
        {/* Header */}
        <Header 
          title={t("Financial Insights")} 
          subtitle={t("Track your spending habits")} 
          theme={theme} 
        />

        {/* 1. Pulse Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
                <StatCard 
                    label={t("Remaining Due")} 
                    amount={centsToDollars(analytics.pendingTotal)} 
                    icon="alert-circle" 
                    color={theme.colors.danger}
                    theme={theme}
                />
            </View>
            <View style={{ flex: 1 }}>
                <StatCard 
                    label={t("Paid this Month")} 
                    amount={centsToDollars(analytics.paidTotal)} 
                    icon="checkmark-circle" 
                    color={theme.colors.accent}
                    theme={theme}
                />
            </View>
        </View>

        {/* 2. Monthly Trend */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.cardHeader}>
                <Ionicons name="bar-chart" size={20} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.primaryText }]}>{t("6-Month Trend")}</Text>
            </View>
            
            <View style={{ alignItems: 'center', marginTop: 10 }}>
                <BarChart
                    data={analytics.barData}
                    barWidth={32}
                    noOfSections={3}
                    barBorderRadius={6}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    yAxisTextStyle={{ color: theme.colors.subtext, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: theme.colors.subtext, fontSize: 11, fontWeight: '600' }}
                    hideRules
                    isAnimated
                    height={180}
                    width={screenWidth - 80}
                />
            </View>
        </View>

        {/* 3. Projection Card */}
        <View style={[styles.projectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent }]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <Text style={[styles.cardTitle, { color: theme.colors.primaryText }]}>
                    {t("Projected Liabilities")}
                </Text>
                <View style={{backgroundColor: theme.colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                    <Text style={{fontSize: 10, fontWeight: 'bold', color: theme.colors.navy }}>{t("PRO ESTIMATE")}</Text>
                </View>
            </View>
            
            <Text style={{ color: theme.colors.subtext, lineHeight: 20, fontSize: 13 }}>
                {t("Based on your recurring bills, next month's minimum:")}
            </Text>
            <Text style={[styles.bigAmount, { color: theme.colors.primaryText }]}>
                ${centsToDollars(analytics.projectedTotal)}
            </Text>
        </View>

        {/* 4. Payment Ratio */}
        {analytics.pendingTotal > 0 && (
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', paddingVertical: 20 }]}>
                 <View style={{flex: 1, gap: 4}}>
                    <Text style={[styles.cardTitle, { color: theme.colors.primaryText }]}>
                        {t("Payment Ratio")}
                    </Text>
                    <Text style={{ color: theme.colors.subtext, fontSize: 13, lineHeight: 18 }}>
                        {t("You have paid {{percent}}% of this month's obligations.", { percent: Math.round((analytics.paidTotal / (analytics.paidTotal + analytics.pendingTotal)) * 100) })}
                    </Text>
                 </View>
                 <View style={{ paddingRight: 10 }}>
                    <PieChart
                        data={analytics.pieData}
                        donut
                        radius={45}
                        innerRadius={32}
                        innerCircleColor={theme.colors.card}
                    />
                 </View>
            </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  // Header
  headerShadowContainer: {
    backgroundColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 4,
    borderRadius: 20,
  },
  headerGradient: {
    borderRadius: 20,
    height:120,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  // Stat Card
  statCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  // Generic Card
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  // Projection Card
  projectionCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 6, // Stylish accent on left
  },
  bigAmount: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
});