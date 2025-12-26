import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ActionSheetIOS, Alert, Pressable } from 'react-native';
import { BarChart, PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../ui/useTheme";
import { 
  ChartType, chartTypes, centsToDollars, 
  groupDataByCreditor, groupDataByRecurrence, groupDataByMonth 
} from "../../utils/insightsLogic";
import { MAX_CONTENT_WIDTH } from "../../ui/styles";

interface ChartSectionProps {
  bills: any[];
  activeChart: ChartType;
  setActiveChart: (type: ChartType) => void;
  theme: Theme;
  t: any;
}

export default function ChartSection({ bills, activeChart, setActiveChart, theme, t }: ChartSectionProps) {
  const { width } = Dimensions.get('window');
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const chartWidth = contentWidth - 64; 

  const showDropdown = () => {
    const options = chartTypes.map(c => t(c.labelKey));
    if (Platform.OS === 'ios') {
        const cancelIndex = options.length;
        options.push(t('Cancel'));
        ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: cancelIndex, title: t('Select Chart') }, (buttonIndex) => { if (buttonIndex < chartTypes.length) { setActiveChart(chartTypes[buttonIndex].key); } });
    } else {
        Alert.alert(t('Select Chart'), '', chartTypes.map((c) => ({ text: t(c.labelKey), onPress: () => setActiveChart(c.key) })));
    }
  };

  const activeLabel = chartTypes.find(c => c.key === activeChart)?.labelKey || 'Creditor Breakdown';

  const renderChart = () => {
    if (activeChart === 'creditor_pie' || activeChart === 'recurrence_pie') {
        const { data, total } = activeChart === 'creditor_pie' ? groupDataByCreditor(bills) : groupDataByRecurrence(bills);
        if (data.length === 0) return <Text style={[styles.noData, { color: theme.colors.subtext }]}>{t('No data to display.')}</Text>;
        return (
            <View style={styles.chartInnerContainer}>
                <Text style={[styles.chartTotal, { color: theme.colors.primaryText }]}>{t('Total Amount')}: ${centsToDollars(total)}</Text>
                <PieChart data={data} donut radius={chartWidth * 0.3} innerRadius={chartWidth * 0.2} centerLabelComponent={() => (<View style={{ justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 14, color: theme.colors.subtext, fontWeight: '600' }}>{activeChart === 'creditor_pie' ? t('Creditors') : t('Recurrence')}</Text></View>)} />
                <View style={styles.legendContainer}>
                    {data.map((item) => (
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
  };

  return (
    <View>
      <Pressable onPress={showDropdown} style={({ pressed }) => [styles.dropdownContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[styles.dropdownLabel, { color: theme.colors.subtext }]}>{t('View')}:</Text>
          <Text style={[styles.dropdownValue, { color: theme.colors.primary }]}>{t(activeLabel)}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
      </Pressable>
      <View style={[styles.chartCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, marginTop: 12 }]}>
          {renderChart()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});