import { useCallback, useMemo, useState, useRef, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Pressable,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useFocusEffect } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { format, parseISO, startOfMonth, addMonths, isSameMonth } from 'date-fns';

import { api } from "../../src/api/client";
import { useTheme, Theme } from "../../src/ui/useTheme";
import * as EncryptionService from "../../src/security/EncryptionService";

// --- Helpers ---

function centsToDollars(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

// --- Types ---
type ChartType = 'creditor_pie' | 'monthly_bar' | 'recurrence_pie';
const chartTypes: { key: ChartType, labelKey: string }[] = [
    { key: 'creditor_pie', labelKey: 'Creditor Breakdown' },
    { key: 'monthly_bar', labelKey: 'Monthly Spending Trend' },
    { key: 'recurrence_pie', labelKey: 'Recurrence Frequency' },
];

// --- Data Aggregation ---

function groupDataByCreditor(bills: any[], theme: Theme): { data: any[], total: number } {
    const creditorMap: { [key: string]: number } = {};
    let total = 0;
    
    const colors = ['#2ECC71', '#3498DB', '#E67E22', '#F1C40F', '#9B59B6', '#E74C3C', '#1ABC9C'];
    let colorIndex = 0;

    for (const bill of bills) {
        const amount = Number(bill.amount_cents || 0);
        if (amount > 0) {
            creditorMap[bill.creditor] = (creditorMap[bill.creditor] || 0) + amount;
            total += amount;
        }
    }

    const data = Object.keys(creditorMap)
        .map(creditor => ({
            value: creditorMap[creditor],
            label: creditor,
            color: colors[colorIndex++ % colors.length],
            text: `$${centsToDollars(creditorMap[creditor])}`,
            key: creditor,
        }))
        .sort((a, b) => b.value - a.value);

    return { data, total };
}

function groupDataByMonth(bills: any[], theme: Theme): { data: any[], total: number, average: number } {
    const monthMap: { [key: string]: number } = {};
    const today = new Date();
    let total = 0;
    const numMonths = 6;

    // Define the last 6 months buckets
    for (let i = numMonths - 1; i >= 0; i--) {
        const month = startOfMonth(addMonths(today, -i));
        monthMap[format(month, 'yyyy-MM')] = 0;
    }

    for (const bill of bills) {
        const date = parseISO(bill.due_date);
        const amount = Number(bill.amount_cents || 0);
        const dateKey = format(date, 'yyyy-MM');
        
        if (monthMap.hasOwnProperty(dateKey)) {
            monthMap[dateKey] += amount;
            total += amount;
        }
    }

    const data = Object.keys(monthMap)
        .sort()
        .map(key => ({
            value: monthMap[key],
            label: format(parseISO(key), 'MMM'),
            frontColor: theme.colors.primary,
        }));
        
    const average = total / numMonths;

    return { data, total, average };
}

function groupDataByRecurrence(bills: any[], theme: Theme): { data: any[], total: number } {
    const recurrenceMap: { [key: string]: number } = {};
    let total = 0;
    const colors = ['#3498DB', '#9B59B6', '#E74C3C', '#F1C40F', '#2ECC71'];
    let colorIndex = 0;

    for (const bill of bills) {
        const amount = Number(bill.amount_cents || 0);
        if (amount > 0) {
            const key = bill.recurrence || 'none';
            recurrenceMap[key] = (recurrenceMap[key] || 0) + amount;
            total += amount;
        }
    }

    const data = Object.keys(recurrenceMap)
        .map(key => ({
            value: recurrenceMap[key],
            label: key.charAt(0).toUpperCase() + key.slice(1),
            color: colors[colorIndex++ % colors.length],
            key: key,
        }))
        .sort((a, b) => b.value - a.value);

    return { data, total };
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
    icon,
    label,
    value,
    color,
    theme,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
    theme: Theme;
}) {
    return (
        <View style={[styles.statCard, { borderColor: theme.colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>{label}</Text>
            <Text style={[styles.statValue, { color: theme.colors.primaryText }]}>{value}</Text>
        </View>
    );
}

function ChartDropdown({ 
    theme, 
    activeChart, 
    onSelect, 
    t 
}: { 
    theme: Theme, 
    activeChart: ChartType, 
    onSelect: (type: ChartType) => void, 
    t: any 
}) {
    const activeLabel = chartTypes.find(c => c.key === activeChart)?.labelKey || 'Creditor Breakdown';
    
    const showDropdown = () => {
        const options = chartTypes.map(c => t(c.labelKey));
        
        if (Platform.OS === 'ios') {
            const cancelIndex = options.length;
            options.push(t('Cancel'));
            
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: cancelIndex,
                    title: t('Select Chart'),
                },
                (buttonIndex) => {
                    if (buttonIndex < chartTypes.length) {
                        onSelect(chartTypes[buttonIndex].key);
                    }
                }
            );
        } else {
            Alert.alert(
                t('Select Chart'),
                '',
                chartTypes.map((c, index) => ({
                    text: t(c.labelKey),
                    onPress: () => onSelect(c.key),
                }))
            );
        }
    };
    
    return (
        <Pressable 
            onPress={showDropdown}
            style={({ pressed }) => [styles.dropdownContainer, { 
                backgroundColor: theme.colors.card, 
                borderColor: theme.colors.border,
                opacity: pressed ? 0.8 : 1,
            }]}
        >
            <Text style={[styles.dropdownLabel, { color: theme.colors.subtext }]}>
                {t('View')}:
            </Text>
            <Text style={[styles.dropdownValue, { color: theme.colors.primary }]}>
                {t(activeLabel)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
        </Pressable>
    );
}

function ChartRenderer({ bills, activeChart, theme, t }: { bills: any[], activeChart: ChartType, theme: Theme, t: any }) {
    const { width } = Dimensions.get('window');
    const chartWidth = width - 32 - 32;

    if (activeChart === 'creditor_pie' || activeChart === 'recurrence_pie') {
        const { data, total } = activeChart === 'creditor_pie' 
            ? groupDataByCreditor(bills, theme) 
            : groupDataByRecurrence(bills, theme);

        if (data.length === 0) return <Text style={[styles.noData, { color: theme.colors.subtext }]}>{t('No data to display in this category.')}</Text>;

        return (
            <View style={styles.chartInnerContainer}>
                <Text style={[styles.chartTotal, { color: theme.colors.primaryText }]}>
                    {t('Total Bills Amount')}: ${centsToDollars(total)}
                </Text>
                <PieChart
                    data={data}
                    donut
                    radius={chartWidth * 0.35}
                    innerRadius={chartWidth * 0.25}
                    centerLabelComponent={() => (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, color: theme.colors.subtext, fontWeight: '600' }}>
                                {activeChart === 'creditor_pie' ? t('Creditors') : t('Recurrence')}
                            </Text>
                        </View>
                    )}
                />
                <View style={styles.legendContainer}>
                    {data.map((item, index) => (
                        <View key={item.key} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={[styles.legendText, { color: theme.colors.primaryText }]}>
                                {item.label} ({Math.round((item.value / total) * 100)}%)
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    }
    
    if (activeChart === 'monthly_bar') {
        const { data, total, average } = groupDataByMonth(bills, theme);
        
        if (data.length === 0) return <Text style={[styles.noData, { color: theme.colors.subtext }]}>{t('No data to display in this category.')}</Text>;

        const maxValue = Math.max(...data.map(item => item.value), average, 0);

        return (
            <View style={styles.chartInnerContainer}>
                <Text style={[styles.chartTotal, { color: theme.colors.primaryText }]}>
                    {t('Total 6-Month Spend')}: ${centsToDollars(total)}
                </Text>
                <BarChart
                    barWidth={chartWidth / (data.length * 1.5)}
                    noOfSections={4}
                    maxValue={maxValue > 0 ? maxValue * 1.1 : 100} 
                    data={data}
                    showValuesOnTopOfBars
                    hideYAxisText
                    showFractionalValues={false}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={theme.colors.border}
                    yAxisTextStyle={{ color: theme.colors.subtext }}
                    xAxisLabelTextStyle={{ color: theme.colors.subtext }}
                    spacing={chartWidth / (data.length * 2.5)}
                    
                    showLine
                    lineConfig={{
                        color: theme.colors.accent,
                        thickness: 3,
                        curved: false,
                        // FIX: Use 'data' property with the average line values
                        data: data.map(() => ({ value: average })),
                        isDash: true,
                        dashWidth: 4,
                        dashGap: 2,
                        hideDataPoints: true,
                    }}
                    
                    // Tooltip
                    renderTooltip={(item: { label: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; value: number; }) => (
                        <View style={[styles.tooltip, { backgroundColor: theme.colors.card }]}>
                            <Text style={{ color: theme.colors.primaryText, fontWeight: '700' }}>
                                {item.label}
                            </Text>
                            <Text style={{ color: theme.colors.primaryText }}>
                                ${centsToDollars(item.value)}
                            </Text>
                        </View>
                    )}
                />
                
                {/* Add average line legend */}
                <View style={[styles.legendContainer, { justifyContent: 'flex-start', marginTop: 10 }]}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: theme.colors.accent, width: 20, height: 3, borderRadius: 0 }]} />
                        <Text style={[styles.legendText, { color: theme.colors.primaryText, fontWeight: '700' }]}>
                            {t('6-Month Avg')}: ${centsToDollars(average)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }
    
    return null;
}


// --- Main Component ---

export default function Insights() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartType>('creditor_pie');

  const decryptedBillsRef = useRef<any[]>([]);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.billsList();
      
      const decrypted = await Promise.all(res.bills.map(async (b: any) => ({
          ...b,
          creditor: await EncryptionService.decryptData(b.creditor),
          notes: await EncryptionService.decryptData(b.notes),
      })));
      
      decryptedBillsRef.current = decrypted.filter(b => b.status !== 'paid');
      
    } catch (e) {
      console.error("Failed to load/decrypt bills for insights:", e);
      decryptedBillsRef.current = [];
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadBills();
  }, [loadBills]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  }, [loadBills]);
  
  // STATS: Computed after loading
  const totalDue = useMemo(() => decryptedBillsRef.current.reduce((sum, b) => sum + Number(b.amount_cents || 0), 0), [loading, refreshing]);
  const averageBill = useMemo(() => decryptedBillsRef.current.length > 0 ? totalDue / decryptedBillsRef.current.length : 0, [totalDue]);
  const topCreditor = useMemo(() => {
    const { data } = groupDataByCreditor(decryptedBillsRef.current, theme);
    return data[0]?.label || t('N/A');
  }, [loading, refreshing, theme, t]);

  const stats = [
    { icon: "wallet-outline" as keyof typeof Ionicons.glyphMap, label: t('Total Pending'), value: `$${centsToDollars(totalDue)}`, color: theme.colors.danger },
    { icon: "stats-chart-outline" as keyof typeof Ionicons.glyphMap, label: t('Avg Bill Amount'), value: `$${centsToDollars(averageBill)}`, color: theme.colors.primary },
    { icon: "people-outline" as keyof typeof Ionicons.glyphMap, label: t('Top Creditor'), value: topCreditor, color: theme.colors.accent },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          <Header
            title={t("Financial Insights")}
            subtitle={t("Visualize your spending trends")}
            theme={theme}
          />
          
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} theme={theme} />
            ))}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.subtext, marginTop: 10 }}>{t('Loading and decrypting bills...')}</Text>
            </View>
          ) : (
            <>
              {/* Chart Dropdown */}
              <View style={styles.chartControls}>
                <ChartDropdown 
                    theme={theme} 
                    activeChart={activeChart} 
                    onSelect={setActiveChart} 
                    t={t}
                />
              </View>
              
              {/* Chart Visualization */}
              <View style={[styles.chartCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                  <ChartRenderer 
                      bills={decryptedBillsRef.current} 
                      activeChart={activeChart} 
                      theme={theme} 
                      t={t}
                  />
              </View>
            </>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  headerShadowContainer: {
    backgroundColor: "transparent",
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
    marginLeft:10
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
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
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  // Charts
  chartControls: {
    marginTop: 10,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  chartInnerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  chartTotal: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
      fontSize: 12,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
      padding: 8,
      borderRadius: 8,
      opacity: 0.9,
  },
  noData: {
      fontSize: 16,
      textAlign: 'center',
      paddingVertical: 40,
  }
});