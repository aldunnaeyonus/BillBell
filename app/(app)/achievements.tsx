// app/(app)/achievements.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../src/ui/useTheme';
import { BADGES } from '../../src/data/badges';
import { useBadges } from '../../src/hooks/useBadges';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import LinearGradient from 'react-native-linear-gradient';
import { Theme } from "../../src/ui/useTheme";
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";

export default function AchievementsScreen() {
  const theme = useTheme();
  const { achievements } = useBadges();
  const { t } = useTranslation();

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
            <MaterialCommunityIcons name="trophy-award" size={28} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const renderBadge = ({ item }: { item: typeof BADGES[0] }) => {
    const isUnlocked = achievements.unlockedBadges.includes(item.id);

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: isUnlocked ? 1 : 0.5 }]}>
        <View style={[styles.iconContainer, { backgroundColor: isUnlocked ? item.color + '20' : theme.colors.border }]}>
          <Ionicons 
            name={isUnlocked ? item.icon as any : "lock-closed"} 
            size={32} 
            color={isUnlocked ? item.color : theme.colors.subtext} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.primaryText }]}>
            {t(item.title)}
          </Text>
          <Text style={[styles.description, { color: theme.colors.subtext }]}>
            {t(item.description)}
          </Text>
        </View>
        {isUnlocked && (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* ADDED flex: 1 HERE */}
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
        
        <Header
          title={t("Achievements")}
          subtitle={t("Celebrate your financial wins.")}
          theme={theme}
        />

        <FlatList
          showsVerticalScrollIndicator={false}
          data={BADGES}
          renderItem={renderBadge}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      </View> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerShadowContainer: { backgroundColor: 'transparent', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginVertical: 4, borderRadius: 20 },
  headerGradient: { borderRadius: 20, height: 120, paddingBottom: 24, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" },
  headerIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFF", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  
  // ADDED paddingBottom: 100
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 16 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  description: { fontSize: 13 },
});