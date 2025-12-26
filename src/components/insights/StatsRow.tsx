import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../ui/useTheme";

interface StatsRowProps {
  totalDue: string;
  averageBill: string;
  topCreditor: string;
  theme: Theme;
  t: any;
}

export default function StatsRow({ totalDue, averageBill, topCreditor, theme, t }: StatsRowProps) {
  
  function StatCard({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string; }) {
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

  return (
    <View style={styles.statsContainer}>
      <StatCard icon="wallet-outline" label={t('Pending')} value={totalDue} color={theme.colors.danger} />
      <StatCard icon="stats-chart-outline" label={t('Avg Bill')} value={averageBill} color={theme.colors.primary} />
      <StatCard icon="people-outline" label={t('Top')} value={topCreditor} color={theme.colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statCard: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, gap: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '900' },
});