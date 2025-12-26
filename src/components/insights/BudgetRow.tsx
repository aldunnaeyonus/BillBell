import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScaleButton } from "../../ui/ScaleButton";
import { Theme } from "../../ui/useTheme";

interface BudgetRowProps {
  label: string;
  color: string;
  spend: number;
  limit: number;
  theme: Theme;
  t: any;
  onPress: () => void;
}

export default function BudgetRow({ label, color, spend, limit, theme, t, onPress }: BudgetRowProps) {
  const hasLimit = limit > 0;
  const percent = hasLimit ? (spend / limit) * 100 : 0;
  
  function ProgressBar({ pct }: { pct: number }) {
    const cappedPercent = Math.min(Math.max(pct, 0), 100);
    const barColor = pct > 100 ? theme.colors.danger : color;
    return (
      <View style={{ height: 8, backgroundColor: theme.mode === 'dark' ? '#333' : '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
        <View style={{ width: `${cappedPercent}%`, height: '100%', backgroundColor: barColor, borderRadius: 4 }} />
      </View>
    );
  }

  return (
    <ScaleButton 
      onPress={onPress}
      style={[styles.budgetRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primaryText }}>{t(label)}</Text>
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
        <ProgressBar pct={percent} />
      ) : (
        <Text style={{ fontSize: 12, color: theme.colors.accent, marginTop: 4 }}>{t("Set Budget")}</Text>
      )}
    </ScaleButton>
  );
}

const styles = StyleSheet.create({
  budgetRow: { padding: 16, borderRadius: 16, borderWidth: 1 },
});