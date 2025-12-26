import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import LinearGradient from "react-native-linear-gradient";
import * as Haptics from "expo-haptics";
import { parseISO, isSameMonth } from "date-fns";

import { useTheme, Theme } from "../../src/ui/useTheme";
import { api } from "../../src/api/client";
import { getJson } from "../../src/storage/storage";
import { userSettings } from "../../src/storage/userSettings";
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";
import { useBadges } from "../../src/hooks/useBadges";

// --- NEW IMPORTS ---
import { centsToDollars, CATEGORY_MAP, getCategory, groupDataByCreditor, ChartType } from "../../src/utils/insightsLogic";
import ChartSection from "../../src/components/insights/ChartSection";
import StatsRow from "../../src/components/insights/StatsRow";
import BudgetRow from "../../src/components/insights/BudgetRow";
import BudgetModal from "../../src/components/insights/BudgetModal";

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

export default function Insights() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { checkBudgetBadges } = useBadges();
  
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
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
      if (loading) setLoading(true); 

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
      checkBudgetBadges();
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
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
          <View style={styles.content}>
            <Header title={t("Financial Insights")} subtitle={t("Visualize your spending")} theme={theme} />

            <StatsRow 
              totalDue={`$${centsToDollars(totalDue)}`} 
              averageBill={`$${centsToDollars(averageBill)}`} 
              topCreditor={topCreditor} 
              theme={theme} 
              t={t} 
            />

            <ChartSection 
              bills={bills} 
              activeChart={activeChart} 
              setActiveChart={setActiveChart} 
              theme={theme} 
              t={t} 
            />

            <View>
              <Text style={[styles.sectionHeader, { color: theme.colors.primaryText }]}>{t("Smart Budgets")}</Text>
              <Text style={{ color: theme.colors.subtext, marginBottom: 12 }}>{t("Tap a category to set a monthly limit.")}</Text>
              
              <View style={{ gap: 12 }}>
                {CATEGORY_MAP.map((cat) => {
                  const spendCents = currentMonthStats[cat.label] || 0;
                  return (
                    <BudgetRow 
                      key={cat.label}
                      label={cat.label}
                      color={cat.color}
                      spend={spendCents / 100}
                      limit={budgets[cat.label] || 0}
                      theme={theme}
                      t={t}
                      onPress={() => handleEditBudget(cat.label)}
                    />
                  );
                })}
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      <BudgetModal 
        visible={modalVisible}
        category={selectedCategory}
        value={newLimit}
        onChangeText={setNewLimit}
        onClose={() => setModalVisible(false)}
        onSave={saveBudget}
        theme={theme}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 24 },
  headerShadowContainer: { backgroundColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginVertical: 4, borderRadius: 20 },
  headerGradient: { borderRadius: 20, height: 100, paddingBottom: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" },
  headerIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  sectionHeader: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
});