import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import LinearGradient from "react-native-linear-gradient";
import * as Haptics from "expo-haptics";
import { startOfMonth, addMonths, format, parseISO, isSameMonth } from "date-fns";

import { useTheme, Theme } from "../../src/ui/useTheme";
import { api } from "../../src/api/client";
import { getJson } from "../../src/storage/storage";
import { userSettings } from "../../src/storage/userSettings";
import { ScaleButton } from "../../src/ui/ScaleButton";

// --- HELPERS ---

function centsToDollars(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

// --- CHART LOGIC ---

type ChartType = 'creditor_pie' | 'monthly_bar' | 'recurrence_pie';
const chartTypes: { key: ChartType, labelKey: string }[] = [
    { key: 'creditor_pie', labelKey: 'Creditor Breakdown' },
    { key: 'monthly_bar', labelKey: 'Monthly Spending Trend' },
    { key: 'recurrence_pie', labelKey: 'Recurrence Frequency' },
];

function groupDataByCreditor(bills: any[]) {
    const creditorMap: { [key: string]: number } = {};
    let total = 0;
    const colors = ['#2ECC71', '#3498DB', '#E67E22', '#F1C40F', '#9B59B6', '#E74C3C', '#1ABC9C'];
    let colorIndex = 0;

    for (const bill of bills) {
        const amount = Number(bill.amount_cents || 0);
        if (amount > 0) {
            const name = bill.creditor || 'Unknown';
            creditorMap[name] = (creditorMap[name] || 0) + amount;
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

function groupDataByMonth(bills: any[], theme: Theme) {
    const monthMap: { [key: string]: number } = {};
    const today = new Date();
    let total = 0;
    const numMonths = 6;

    for (let i = numMonths - 1; i >= 0; i--) {
        const month = startOfMonth(addMonths(today, -i));
        monthMap[format(month, 'yyyy-MM')] = 0;
    }

    for (const bill of bills) {
        if (!bill.due_date) continue;
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

function groupDataByRecurrence(bills: any[]) {
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

// --- BUDGET LOGIC ---

const CATEGORY_MAP: { regex: RegExp; label: string; color: string }[] = [
  { 
    regex: /netflix|spotify|hulu|disney|hbo|apple|youtube|twitch|sirius|pandora|tidal|audible|peacock|paramount|sling|fubo|roku|xbox|playstation|nintendo|steam|nytimes|wsj|crunchyroll|patreon|onlyfans|starz|showtime|amc|fandango|espn|dazn|nba|nfl|mlb/i, 
    label: "Entertainment", 
    color: "#E50914" 
  },
  { 
    regex: /loan|mortgage|rent|lease|property|hoa|storage|public storage|extra space|adt|ring|simplisafe|vivint|lawn|pest|apartments|invitation homes|greystar|lincoln property|camden|equity residential|terminix|orkin|merry maids|cleaning/i, 
    label: "Housing", 
    color: "#9D174D" 
  },
  { 
    regex: /power|electric|gas|water|trash|sewer|internet|wifi|phone|att|verizon|t-mobile|sprint|boost|mint|google fi|xfinity|comcast|spectrum|cox|centurylink|frontier|optimum|directv|dish|waste|republic services|pge|edison|coned|duke energy|fpl|national grid|dominion|entergy|xcel|dte|pepco|eversource|constellation|reliant|solar|sunrun|tesla energy/i, 
    label: "Utilities", 
    color: "#FBBF24" 
  },
  { 
    regex: /chase|citi|amex|discover|visa|mastercard|capital one|wells fargo|bofa|bank of america|pnc|us bank|affirm|klarna|afterpay|sezzle|paypal credit|synchrony|navient|nelnet|sallie mae|mohela|aidvantage|sofi|lending|rocket|freedom|target card|best buy card|macys|kohls|credit one|ally|schwab|fidelity/i, 
    label: "Debt & Credit", 
    color: "#3B82F6" 
  },
  { 
    regex: /insurance|geico|state farm|progressive|liberty|allstate|usaa|aaa|farmers|nationwide|travelers|hartford|metlife|prudential|aetna|cigna|united|uhc|bcbs|anthem|humana|kaiser|lemonade|root|esurance|amica|erie|chubb|aflac/i, 
    label: "Insurance", 
    color: "#10B981" 
  },
  { 
    regex: /gym|fitness|peloton|planet|equinox|24 hour|la fitness|anytime|gold's|orange theory|crossfit|strava|myfitnesspal|doctor|dental|vision|quest|labcorp|cvs|walgreens|rite aid|capsule|pillpack|calm|headspace|betterhelp|talkspace|weight watchers|noom/i, 
    label: "Health", 
    color: "#8B5CF6" 
  },
  { 
    regex: /uber|lyft|ezpass|fastrak|sunpass|ipass|toll|parking|spothero|zipcar|turo|tesla|toyota|honda|ford|gm financial|nissan|bmw|mercedes|hyundai|kia|carmax|carvana|siriusxm|onstar/i, 
    label: "Auto & Transport", 
    color: "#F97316" // Orange
  },
  { 
    regex: /tuition|school|university|college|udemy|coursera|chegg|duolingo|masterclass|babble|skillshare|linkedin learning|pluralsight|codecademy|kumon|daycare|kinderqaure|bright horizons/i, 
    label: "Education", 
    color: "#EC4899" // Pink
  },
  { 
    regex: /adobe|microsoft|google storage|icloud|dropbox|zoom|slack|chatgpt|openai|github|vercel|aws|digitalocean|heroku|godaddy|namecheap|squarespace|wix|wordpress|canva|figma|notion|evernote|lastpass|1password|nordvpn|expressvpn/i, 
    label: "Software", 
    color: "#6366F1" // Indigo
  },
  { 
    regex: /chewy|barkbox|farmers dog|petco|petsmart|rover|wag|care\.com|hellofresh|blue apron|factor|instacart|doordash|grubhub|uber eats|amazon prime|walmart\+|costco|sams club/i, 
    label: "Family & Lifestyle", 
    color: "#14B8A6" // Teal
  },
];

function getCategory(creditor: string) {
  for (const cat of CATEGORY_MAP) {
    if (creditor.match(cat.regex)) return cat.label;
  }
  return "Other";
}

// --- SUB-COMPONENTS ---

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

function StatCard({ icon, label, value, color, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string; theme: Theme; }) {
    return (
        <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>{label}</Text>
            <Text style={[styles.statValue, { color: theme.colors.primaryText }]}>{value}</Text>
        </View>
    );
}

function ProgressBar({ percent, color, theme }: { percent: number; color: string; theme: Theme }) {
  const cappedPercent = Math.min(Math.max(percent, 0), 100);
  const barColor = percent > 100 ? theme.colors.danger : color;
  
  return (
    <View style={{ height: 8, backgroundColor: theme.mode === 'dark' ? '#333' : '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
      <View style={{ width: `${cappedPercent}%`, height: '100%', backgroundColor: barColor, borderRadius: 4 }} />
    </View>
  );
}

function ChartDropdown({ theme, activeChart, onSelect, t }: { theme: Theme, activeChart: ChartType, onSelect: (type: ChartType) => void, t: any }) {
    const activeLabel = chartTypes.find(c => c.key === activeChart)?.labelKey || 'Creditor Breakdown';
    const showDropdown = () => {
        const options = chartTypes.map(c => t(c.labelKey));
        if (Platform.OS === 'ios') {
            const cancelIndex = options.length;
            options.push(t('Cancel'));
            ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: cancelIndex, title: t('Select Chart') }, (buttonIndex) => { if (buttonIndex < chartTypes.length) { onSelect(chartTypes[buttonIndex].key); } });
        } else {
            Alert.alert(t('Select Chart'), '', chartTypes.map((c, index) => ({ text: t(c.labelKey), onPress: () => onSelect(c.key) })));
        }
    };
    return (
        <Pressable onPress={showDropdown} style={({ pressed }) => [styles.dropdownContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[styles.dropdownLabel, { color: theme.colors.subtext }]}>{t('View')}:</Text>
            <Text style={[styles.dropdownValue, { color: theme.colors.primary }]}>{t(activeLabel)}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
        </Pressable>
    );
}

function ChartRenderer({ bills, activeChart, theme, t }: { bills: any[], activeChart: ChartType, theme: Theme, t: any }) {
    const { width } = Dimensions.get('window');
    const chartWidth = width - 64; // padding adjustments

    if (activeChart === 'creditor_pie' || activeChart === 'recurrence_pie') {
        const { data, total } = activeChart === 'creditor_pie' ? groupDataByCreditor(bills) : groupDataByRecurrence(bills);
        if (data.length === 0) return <Text style={[styles.noData, { color: theme.colors.subtext }]}>{t('No data to display.')}</Text>;
        return (
            <View style={styles.chartInnerContainer}>
                <Text style={[styles.chartTotal, { color: theme.colors.primaryText }]}>{t('Total Amount')}: ${centsToDollars(total)}</Text>
                <PieChart data={data} donut radius={chartWidth * 0.3} innerRadius={chartWidth * 0.2} centerLabelComponent={() => (<View style={{ justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 14, color: theme.colors.subtext, fontWeight: '600' }}>{activeChart === 'creditor_pie' ? t('Creditors') : t('Recurrence')}</Text></View>)} />
                <View style={styles.legendContainer}>
                    {data.map((item, index) => (
                        <View key={item.key} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={[styles.legendText, { color: theme.colors.primaryText }]}>{item.label} ({Math.round((item.value / total) * 100)}%)</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    }
    
    if (activeChart === 'monthly_bar') {
        const { data, total, average } = groupDataByMonth(bills, theme);
        if (data.length === 0) return <Text style={[styles.noData, { color: theme.colors.subtext }]}>{t('No data to display.')}</Text>;
        const maxValue = Math.max(...data.map(item => item.value), average, 0);
        
        return (
            <View style={styles.chartInnerContainer}>
                <Text style={[styles.chartTotal, { color: theme.colors.primaryText }]}>{t('Total 6-Month Spend')}: ${centsToDollars(total)}</Text>
                <BarChart 
                    barWidth={24}
                    noOfSections={4} 
                    maxValue={maxValue > 0 ? maxValue * 1.1 : 100} 
                    data={data} 
                    hideYAxisText 
                    showFractionalValues={false} 
                    yAxisThickness={0} 
                    xAxisThickness={1} 
                    xAxisColor={theme.colors.border} 
                    yAxisTextStyle={{ color: theme.colors.subtext }} 
                    xAxisLabelTextStyle={{ color: theme.colors.subtext }} 
                    spacing={20}
                    width={chartWidth}
                    
                    showLine
                    lineData={data.map(() => ({ value: average }))} 
                    lineConfig={{ color: theme.colors.accent, thickness: 3, curved: false, hideDataPoints: true }} 
                    
                    renderTooltip={(item: any) => (
                        <View style={[styles.tooltip, { backgroundColor: theme.colors.card }]}>
                            <Text style={{ color: theme.colors.primaryText, fontWeight: '700' }}>{item.label}</Text>
                            <Text style={{ color: theme.colors.primaryText }}>${centsToDollars(item.value)}</Text>
                        </View>
                    )} 
                />
                <View style={[styles.legendContainer, { justifyContent: 'flex-start', marginTop: 10 }]}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: theme.colors.accent, width: 20, height: 3, borderRadius: 0 }]} />
                        <Text style={[styles.legendText, { color: theme.colors.primaryText, fontWeight: '700' }]}>{t('6-Month Avg')}: ${centsToDollars(average)}</Text>
                    </View>
                </View>
            </View>
        );
    }
    return null;
}

// --- MAIN SCREEN ---

export default function Insights() {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  
  // Chart State
  const [activeChart, setActiveChart] = useState<ChartType>('creditor_pie');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState("");

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadData = useCallback(async () => {
    try {
      if (loading) setLoading(true); // only show full loader on initial mount

      // 1. Load Bills
      const cached = getJson("billbell_bills_list_cache");
      if (cached && bills.length === 0) setBills(cached);
      
      const res = await api.billsList();
      if (isMounted.current) setBills(res.bills || []);
      
      // 2. Load Budgets
      const savedBudgets = userSettings.getBudgets();
      if (isMounted.current) setBudgets(savedBudgets);

    } catch (e) {
      console.error("Load failed", e);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- STATS CALCULATION ---
  const currentMonthStats = useMemo(() => {
    const today = new Date();
    // Filter for Active bills OR Paid bills in THIS month
    const active = bills.filter(b => b.status === 'active' || (b.status === 'paid' && isSameMonth(parseISO(b.paid_at || b.due_date), today)));
    
    const spendByCategory: Record<string, number> = {};
    active.forEach(b => {
      const cat = getCategory(b.creditor);
      spendByCategory[cat] = (spendByCategory[cat] || 0) + (b.amount_cents || 0);
    });

    return spendByCategory;
  }, [bills]);

  const totalDue = useMemo(() => bills.filter(b => !b.paid_at && !b.is_paid && b.status !== 'paid').reduce((sum, b) => sum + Number(b.amount_cents || 0), 0), [bills]);
  const averageBill = useMemo(() => bills.length > 0 ? totalDue / bills.length : 0, [totalDue, bills.length]);
  const topCreditor = useMemo(() => {
    const { data } = groupDataByCreditor(bills);
    return data[0]?.label || t('N/A');
  }, [bills, t]);

  // --- HANDLERS ---
  const handleEditBudget = (category: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
    setNewLimit(budgets[category] ? String(budgets[category]) : "");
    setModalVisible(true);
  };

  const saveBudget = () => {
    if (selectedCategory) {
      const limit = parseInt(newLimit.replace(/[^0-9]/g, ''), 10) || 0;
      userSettings.setCategoryBudget(selectedCategory, limit);
      setBudgets(prev => ({ ...prev, [selectedCategory]: limit }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setModalVisible(false);
  };

  if (loading && bills.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.content}>
          <Header title={t("Financial Insights")} subtitle={t("Visualize your spending")} theme={theme} />

          {/* STATS ROW */}
          <View style={styles.statsContainer}>
            <StatCard icon="wallet-outline" label={t('Pending')} value={`$${centsToDollars(totalDue)}`} color={theme.colors.danger} theme={theme} />
            <StatCard icon="stats-chart-outline" label={t('Avg Bill')} value={`$${centsToDollars(averageBill)}`} color={theme.colors.primary} theme={theme} />
            <StatCard icon="people-outline" label={t('Top')} value={topCreditor} color={theme.colors.accent} theme={theme} />
          </View>

          {/* CHARTS SECTION */}
          <View>
             <ChartDropdown theme={theme} activeChart={activeChart} onSelect={setActiveChart} t={t} />
             <View style={[styles.chartCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, marginTop: 12 }]}>
                 <ChartRenderer bills={bills} activeChart={activeChart} theme={theme} t={t} />
             </View>
          </View>

          {/* SMART BUDGETS SECTION */}
          <View>
            <Text style={[styles.sectionHeader, { color: theme.colors.primaryText }]}>{t("Smart Budgets")}</Text>
            <Text style={{ color: theme.colors.subtext, marginBottom: 12 }}>{t("Tap a category to set a monthly limit.")}</Text>
            
            <View style={{ gap: 12 }}>
              {CATEGORY_MAP.map((cat) => {
                const spendCents = currentMonthStats[cat.label] || 0;
                const spend = spendCents / 100;
                const limit = budgets[cat.label] || 0;
                const hasLimit = limit > 0;
                const percent = hasLimit ? (spend / limit) * 100 : 0;

                return (
                  <ScaleButton 
                    key={cat.label} 
                    onPress={() => handleEditBudget(cat.label)}
                    style={[styles.budgetRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.color }} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primaryText }}>{cat.label}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.primaryText }}>
                          ${spend.toFixed(0)} 
                          <Text style={{ color: theme.colors.subtext, fontSize: 14, fontWeight: '400' }}>
                             {hasLimit ? ` / $${limit}` : ''}
                          </Text>
                        </Text>
                      </View>
                    </View>
                    {hasLimit ? (
                      <ProgressBar percent={percent} color={cat.color} theme={theme} />
                    ) : (
                      <Text style={{ fontSize: 12, color: theme.colors.accent, marginTop: 4 }}>{t("Set Budget")}</Text>
                    )}
                  </ScaleButton>
                );
              })}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>{t("Set Limit for {{category}}", { category: selectedCategory })}</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.bg }]}>
              <Text style={{ fontSize: 20, color: theme.colors.primaryText, fontWeight: '700' }}>$</Text>
              <TextInput autoFocus keyboardType="numeric" value={newLimit} onChangeText={setNewLimit} placeholder="0" placeholderTextColor={theme.colors.subtext} style={[styles.input, { color: theme.colors.primaryText }]} />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalBtn}>
                <Text style={{ color: theme.colors.subtext, fontWeight: '600' }}>{t("Cancel")}</Text>
              </Pressable>
              <Pressable onPress={saveBudget} style={[styles.modalBtn, { backgroundColor: theme.colors.primary, paddingHorizontal: 24 }]}>
                <Text style={{ color: theme.colors.primaryTextButton, fontWeight: '700' }}>{t("Save")}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 24 },
  
  // Header
  headerShadowContainer: { backgroundColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginVertical: 4, borderRadius: 20 },
  headerGradient: { borderRadius: 20, height: 100, paddingBottom: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" },
  headerIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },

  // Stats
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statCard: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, gap: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '900' },

  // Charts
  dropdownContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, justifyContent: 'space-between' },
  dropdownLabel: { fontSize: 14, fontWeight: '600' },
  dropdownValue: { fontSize: 16, fontWeight: '700' },
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  chartInnerContainer: { width: '100%', alignItems: 'center' },
  chartTotal: { fontSize: 14, fontWeight: '700', marginBottom: 20 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  legendColor: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12 },
  noData: { fontSize: 16, textAlign: 'center', paddingVertical: 40 },
  tooltip: { padding: 8, borderRadius: 8, opacity: 0.9 },

  // Budgets
  sectionHeader: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  budgetRow: { padding: 16, borderRadius: 16, borderWidth: 1 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24, alignItems: 'center', gap: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 60, width: '100%', borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  input: { flex: 1, fontSize: 24, fontWeight: '700', marginLeft: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  modalBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', minWidth: 80 },
});