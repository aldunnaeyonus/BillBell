import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; // Standard in Expo
import { useTranslation } from "react-i18next";
import { api } from "../../src/api/client";
import { clearToken } from "../../src/auth/session";
import { useTheme, Theme } from "../../src/ui/useTheme";
import { notifyImportCode } from "../../src/notifications/importCode";
import { copyToClipboard } from "../../src/ui/copy";
import { googleSignOut } from "../../src/auth/providers";

// --- Components ---

function ProfileHeader({
  familyCode,
  theme,
  onCopy,
}: {
  familyCode: string;
  theme: Theme;
  onCopy: () => void;
}) {
  return (
    <LinearGradient
      colors={[theme.colors.navy, "#1a2c4e"]} // Navy to slightly lighter navy
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerCard}
    >
      <View>
        <Text style={styles.headerLabel}>Family ID</Text>
        <Text style={styles.headerCode}>{familyCode || "..."}</Text>
      </View>
      <Pressable
        onPress={onCopy}
        style={({ pressed }) => [
          styles.copyButton,
          { backgroundColor: pressed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)" },
        ]}
      >
        <Ionicons name="copy-outline" size={20} color="#FFF" />
        <Text style={styles.copyButtonText}>Copy</Text>
      </Pressable>
    </LinearGradient>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: Theme }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>
      {title}
    </Text>
  );
}

function ActionRow({
  icon,
  label,
  subLabel,
  onPress,
  theme,
  danger = false,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subLabel?: string | null;
  onPress: () => void;
  theme: Theme;
  danger?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        {
          backgroundColor: theme.colors.card,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: theme.colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: danger ? "#FFE5E5" : theme.mode === 'dark' ? '#1E293B' : '#F1F5F9' }]}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? theme.colors.danger : theme.colors.primary}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[
            styles.actionLabel,
            { color: danger ? theme.colors.danger : theme.colors.primaryText },
          ]}
        >
          {label}
        </Text>
        {subLabel && (
          <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
            {subLabel}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.subtext}
      />
    </Pressable>
  );
}

function MemberAvatar({ name, theme }: { name: string; theme: Theme }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <View style={styles.memberContainer}>
      <View style={[styles.avatarCircle, { backgroundColor: theme.colors.accent }]}>
        <Text style={[styles.avatarText, { color: theme.colors.navy }]}>{initial}</Text>
      </View>
      <Text
        numberOfLines={1}
        style={[styles.memberName, { color: theme.colors.primaryText }]}
      >
        {name}
      </Text>
    </View>
  );
}

// --- Main Screen ---

export default function Profile() {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [importInfo, setImportInfo] = useState<{ code: string; expires: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.familyMembers();
      setData(res);
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCopyFamilyID = async () => {
    if (data?.family_code) {
      await copyToClipboard(data.family_code);
      Alert.alert(t("Copied"), t("Share ID copied to clipboard."));
    }
  };

  const handleGenerateCode = async () => {
    try {
      setLoadingCode(true);
      const res = await api.createImportCode(15);
      
      const expiresTime = new Date(res.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setImportInfo({ code: res.code, expires: expiresTime });
      
      await copyToClipboard(res.code);
      await notifyImportCode(t("Import Code"), t("CodeExpires", { code: res.code, expiresAt: expiresTime }));
      
      Alert.alert(
        t("Import Code Generated"),
        `${t("Code")}: ${res.code}\n${t("Expires")}: ${expiresTime}`,
        [
          { text: t("Copy"), onPress: () => copyToClipboard(res.code) },
          { text: t("OK") }
        ]
      );
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
    } finally {
      setLoadingCode(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t("Logout"), t("Are you sure?"), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Logout"),
        style: "destructive",
        onPress: async () => {
          await googleSignOut();
          await clearToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (!data && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg, justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        
        {/* Hero Section */}
        {data && (
          <ProfileHeader
            familyCode={data.family_code}
            theme={theme}
            onCopy={handleCopyFamilyID}
          />
        )}

        {/* Members Section */}
        {data?.members && (
          <View style={styles.section}>
            <SectionTitle title={t("Members")} theme={theme} />
            <FlatList
              data={data.members}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ gap: 16, paddingVertical: 8 }}
              renderItem={({ item }) => (
                <MemberAvatar 
                  name={item.name || item.email || `User`} 
                  theme={theme} 
                />
              )}
            />
          </View>
        )}

        {/* Management Section */}
        <View style={styles.section}>
          <SectionTitle title={t("Management")} theme={theme} />
          <View style={[styles.cardGroup, { borderColor: theme.colors.border }]}>
            <ActionRow
              icon="settings-outline"
              label={t("Shared Settings")}
              theme={theme}
              onPress={() => router.push("/(app)/family-settings")}
            />
             <ActionRow
              icon="cloud-upload-outline"
              label={t("Bulk Upload")}
              subLabel="Import via CSV/XLSX"
              theme={theme}
              onPress={() => router.push("/(app)/bulk-import")}
            />
            <ActionRow
              icon="key-outline"
              label={t("Generate Import Code")}
              subLabel={importInfo ? `${t("Active")}: ${importInfo.code}` : t("Create secure code for upload")}
              theme={theme}
              onPress={handleGenerateCode}
              isLast
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <SectionTitle title={t("Support")} theme={theme} />
          <View style={[styles.cardGroup, { borderColor: theme.colors.border }]}>
            <ActionRow
              icon="help-circle-outline"
              label={t("FAQ & Help")}
              theme={theme}
              onPress={() => router.push("/(app)/faq")}
            />
            <ActionRow
              icon="bug-outline"
              label={t("Feedback & Bugs")}
              theme={theme}
              onPress={() => router.push("/(app)/feedback")}
              isLast
            />
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginTop: 20 }]}>
           <View style={[styles.cardGroup, { borderColor: theme.colors.border }]}>
            <ActionRow
              icon="log-out-outline"
              label={t("Logout")}
              theme={theme}
              danger
              onPress={handleLogout}
              isLast
            />
          </View>
          <Text style={{ textAlign: 'center', color: theme.colors.subtext, marginTop: 16, fontSize: 12 }}>
            Version 1.0.0 (DueView)
          </Text>
        </View>

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
    gap: 24,
  },
  // Header
  headerCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 120,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerCode: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  copyButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  // Sections
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  // Action Row
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Members
  memberContainer: {
    alignItems: "center",
    gap: 8,
    width: 70,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
  },
  memberName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});