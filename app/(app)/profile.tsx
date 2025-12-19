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
  ActionSheetIOS,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { router } from "expo-router";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as FileSystem from "expo-file-system"; // <--- Restored expo-file-system
import Share from "react-native-share";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";

import { api } from "../../src/api/client";
import { clearToken } from "../../src/auth/session";
import { useTheme, Theme } from "../../src/ui/useTheme";
import { notifyImportCode } from "../../src/notifications/importCode";
import { copyToClipboard } from "../../src/ui/copy";
import { googleSignOut } from "../../src/auth/providers";
import * as EncryptionService from "../../src/security/EncryptionService";
import { getDeviceId } from "../../src/security/device";

// Imports for Live Activity Logic
import { userSettings } from "../../src/storage/userSettings";
import { stopActivity } from "../../src/native/LiveActivity";

// --- Helpers ---

function centsToDollars(cents: number) {
  return (Number(cents || 0) / 100).toFixed(2);
}

const jsonToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const escapeField = (field: any) => {
    if (field === null || field === undefined) return "";
    const stringField = String(field);
    if (stringField.match(/["\n,]/)) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };
  const headerRow = headers.map(escapeField).join(",");
  const rows = data.map((row) =>
    headers.map((header) => escapeField(row[header])).join(",")
  );
  return [headerRow, ...rows].join("\n");
};

// --- Components ---

function ProfileHeader({
  familyCode,
  theme,
  onCopy,
  t,
}: {
  familyCode: string;
  theme: Theme;
  onCopy: () => void;
  t: any;
}) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContentLeft}>
          <Text style={styles.headerLabel}>{t("Family ID")}</Text>
          <Text
            style={styles.headerCode}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {familyCode || "..."}
          </Text>
        </View>

        <Pressable
          onPress={onCopy}
          hitSlop={8}
          style={({ pressed }) => [
            styles.copyButton,
            {
              backgroundColor: pressed
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.1)",
            },
          ]}
        >
          <Ionicons name="copy-outline" size={18} color="#FFF" />
          <Text style={styles.copyButtonText}>{t("Copy")}</Text>
        </Pressable>
      </LinearGradient>
    </View>
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
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: danger
              ? "#FFE5E5"
              : theme.mode === "dark"
              ? "#1E293B"
              : "#F1F5F9",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={danger ? theme.colors.danger : theme.colors.primary}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
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
      <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
    </Pressable>
  );
}

function SwitchRow({
  icon,
  label,
  value,
  onValueChange,
  theme,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  theme: Theme;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.actionRow,
        {
          backgroundColor: theme.colors.card,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: theme.mode === "dark" ? "#1E293B" : "#F1F5F9" },
        ]}
      >
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionLabel, { color: theme.colors.primaryText }]}>
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: theme.colors.primary }}
        thumbColor={"#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
      />
    </View>
  );
}

function MemberAvatar({
  item,
  theme,
  onRemove,
  isCurrentUser,
}: {
  item: any;
  theme: Theme;
  onRemove: (item: any) => void;
  isCurrentUser: boolean;
}) {
  const name = item.name || item.email || "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <Pressable
      onLongPress={() => {
        if (!isCurrentUser) onRemove(item);
      }}
      delayLongPress={500}
      style={({ pressed }) => [
        styles.memberContainer,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.avatarCircle,
          {
            backgroundColor: isCurrentUser
              ? theme.colors.primary
              : theme.colors.accent,
          },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            {
              color: isCurrentUser
                ? theme.colors.primaryTextButton
                : theme.colors.navy,
            },
          ]}
        >
          {initial}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[styles.memberName, { color: theme.colors.primaryText }]}
      >
        {name} {isCurrentUser ? "(You)" : ""}
      </Text>
    </Pressable>
  );
}

// --- Main Screen ---

export default function Profile() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [isRotatingKeys, setIsRotatingKeys] = useState(false);
  const [importInfo, setImportInfo] = useState<{
    code: string;
    expires: string;
  } | null>(null);
  const [showLangModal, setShowLangModal] = useState(false);
  const [liveActivityEnabled, setLiveActivityEnabled] = useState(true);

  const langs = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
    { code: "fr", label: "Français" },
    { code: "it", label: "Italiano" },
    { code: "pt-BR", label: "Português (BR)" },
    { code: "zh-Hans", label: "简体中文" },
    { code: "ja", label: "日本語" },
  ];

  const loadData = useCallback(async () => {
    try {
      const res = await api.familyMembers();
      setData(res);
    } catch (e: any) {
      if ((e?.message || "").includes("Not authenticated")) {
        router.replace("/(auth)/login");
        return;
      }
      console.log(e);
    }
  }, []);

  useEffect(() => {
    loadData();
    userSettings.getLiveActivityEnabled().then(setLiveActivityEnabled);
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

  const handleToggleLiveActivity = async (val: boolean) => {
    setLiveActivityEnabled(val);
    await userSettings.setLiveActivityEnabled(val);
    if (!val && Platform.OS === "ios") {
      stopActivity();
    }
  };

  const handleRemoveMember = (member: any) => {
    Alert.alert(
      t("Remove Member"),
      t("Are you sure you want to remove {{name}}?", {
        name: member.name || member.email,
      }),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.familyMemberRemove(member.id);
              Alert.alert(t("Success"), t("Member removed."));
              onRefresh();
            } catch (e: any) {
              Alert.alert(
                t("Error"),
                e.message || t("Failed to remove member.")
              );
            }
          },
        },
      ]
    );
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      t("Leave Family"),
      t(
        "You will leave this group and take your data with you. We will re-encrypt your data with a new key."
      ),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Leave & Secure Data"),
          style: "destructive",
          onPress: async () => {
            try {
              setIsRotatingKeys(true);

              // 1) Fetch bills (api.billsList() returns decrypted fields)
              const { bills } = await api.billsList();
              const plaintextBills = bills.map((b: any) => ({
                ...b,
                creditor_plain: b.creditor || "",
                notes_plain: b.notes || "",
                amount_cents_plain: b.amount_cents,
              }));

              // 2) Leave the family on Server
              const leaveRes = await api.familyLeave();

              // 3) Generate a NEW family key
              const newKeyHex = EncryptionService.generateNewFamilyKey();
              const NEW_FAMILY_KEY_VERSION = 1;

              // Cache new key as active locally so api.billsUpdate uses it for encryption
              await EncryptionService.cacheFamilyKey(
                newKeyHex,
                NEW_FAMILY_KEY_VERSION
              );

              // 4) Re-encrypt bills and write back
              for (const b of plaintextBills) {
                await api.billsUpdate(b.id, {
                  creditor: b.creditor_plain,
                  notes: b.notes_plain,
                  amount_cents: b.amount_cents_plain,
                });
              }

              // 5) Share the NEW key to the server (FIXED Types & Added device_id)
              const myKeys = await EncryptionService.ensureKeyPair();
              if (!myKeys.publicKey) {
                throw new Error("Security keys missing. Please Hard Reset.");
              }

              const wrappedKey = EncryptionService.wrapKeyForUser(
                newKeyHex,
                myKeys.publicKey as string // cast to string to fix TS error
              );

              const deviceId = await getDeviceId(); // Added device_id for multi-device support

              await api.shareKey({
                family_id: leaveRes.new_family_id,
                target_user_id: data.current_user_id,
                encrypted_key: wrappedKey,
                device_id: deviceId, // Included device_id
              });

              Alert.alert(
                t("Success"),
                t("You have left the family and your data has been re-secured.")
              );
              onRefresh();
            } catch (e: any) {
              console.error("Leave failed", e);
              Alert.alert(
                t("Error"),
                e.message || t("Failed to leave family securely.")
              );
            } finally {
              setIsRotatingKeys(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(t("Delete Account"), t("DeleteAccountConfirm"), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteAccount();
            await googleSignOut();
            await clearToken();
            await AsyncStorage.removeItem("billbell_bills_list_cache");
            Alert.alert(t("Success"), t("Account deleted successfully."));
            router.replace("/(auth)/login");
          } catch (e: any) {
            Alert.alert(t("Error"), e.message || "Failed to delete account");
          }
        },
      },
    ]);
  };

  const shareInvite = async (familyCode: string) => {
    if (!familyCode) {
      return Alert.alert(t("Error"), t("Family ID not found."));
    }
    // Your server link with the code attached
    const inviteLink = `https://dunn-carabali.com/billMVP/?code=${familyCode}`;

    const shareOptions = {
      title: t("Invite to Group"),
      message:
        `${t("Join my family on BillBell to sync our bills!")}\n\n` +
        `${t("Click to join or download")}: ${inviteLink}\n\n` +
        `${t("Use Code")}: ${familyCode}`,
    };

    try {
      await Share.open(shareOptions);
    } catch (error: any) {
      if (error && error.message !== "User did not share") {
        Alert.alert(t("Error"), error.message);
      }
    }
  };

  const handleChangeLanguage = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...langs.map((l) => l.label), t("Cancel")],
          cancelButtonIndex: langs.length,
          title: t("Select Language"),
        },
        (buttonIndex) => {
          if (buttonIndex < langs.length) {
            i18n.changeLanguage(langs[buttonIndex].code);
          }
        }
      );
    } else {
      setShowLangModal(true);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setLoadingCode(true);
      const res = await api.createImportCode(15);

      const expiresTime = new Date(res.expires_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setImportInfo({ code: res.code, expires: expiresTime });

      await copyToClipboard(res.code);
      await notifyImportCode(
        t("Import Code"),
        t("CodeExpires", { code: res.code, expiresAt: expiresTime })
      );

      Alert.alert(
        t("Import Code Generated"),
        `${t("Code")}: ${res.code}\n${t("Expires")}: ${expiresTime}`,
        [
          { text: t("Copy"), onPress: () => copyToClipboard(res.code) },
          { text: t("OK") },
        ]
      );
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
    } finally {
      setLoadingCode(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.billsList();
      const bills = res.bills || [];

      if (bills.length === 0) {
        Alert.alert(t("No Data"), t("There are no bills to export."));
        return;
      }

      const exportData = await Promise.all(
        bills.map(async (b: any) => ({
          name: await EncryptionService.decryptData(b.creditor),
          amount: centsToDollars(b.amount_cents),
          due_date: b.due_date,
          notes: await EncryptionService.decryptData(b.notes || ""),
          recurrence: b.recurrence || "none",
          offset: b.reminder_offset_days || "0",
        }))
      );

      const csvString = jsonToCSV(exportData);

      // 2. Initialize the file object using Paths.cache
      // This replaces manual string concatenation and FileSystem.cacheDirectory
      const exportFile = new File(Paths.cache, "bills_export.csv");

      // 3. Write directly to the file
      // No encoding parameter needed; strings default to UTF-8
       exportFile.write(csvString);

      // 4. Share using the file's native URI
      // .uri automatically includes the correct 'file://' prefix
      await Share.open({
        url: exportFile.uri,
        type: "text/csv",
        filename: "bills_export",
        title: t("Export Bills CSV"),
      });
    } catch (e: any) {
      console.error("Export failed:", e);
      if (e?.message !== "User did not share") {
        Alert.alert(t("Error"), t("Failed to export data"));
      }
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
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.bg, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.bg }]}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Hero Section */}
          {data && (
            <ProfileHeader
              familyCode={data.family_code}
              theme={theme}
              onCopy={handleCopyFamilyID}
              t={t}
            />
          )}

          {/* Members Section */}
          {data?.members && (
            <View style={styles.section}>
              <SectionTitle title={t("Members")} theme={theme} />
              <Text
                style={{
                  color: theme.colors.subtext,
                  fontSize: 12,
                  marginLeft: 6,
                  marginBottom: 4,
                }}
              >
                {t("Long press to remove member")}
              </Text>
              <FlatList
                data={data.members}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{
                  gap: 16,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                }}
                renderItem={({ item }) => (
                  <MemberAvatar
                    item={item}
                    theme={theme}
                    onRemove={handleRemoveMember}
                    isCurrentUser={item.id === data.current_user_id}
                  />
                )}
              />
            </View>
          )}

          {/* Management Section */}
          <View style={styles.section}>
            <SectionTitle title={t("Application")} theme={theme} />
            <View
              style={[styles.cardGroup, { borderColor: theme.colors.border }]}
            >
              {Platform.OS === "ios" && (
                <SwitchRow
                  icon="notifications-outline"
                  label={t("Show Overdue on Lock Screen")}
                  value={liveActivityEnabled}
                  onValueChange={handleToggleLiveActivity}
                  theme={theme}
                />
              )}
            
            <ActionRow
                icon="globe-outline"
                label={t("Language")}
                subLabel={i18n.language.toUpperCase()}
                theme={theme}
                onPress={handleChangeLanguage}
              />
              </View></View> 
              <View style={styles.section}>
            <SectionTitle title={t("Management")} theme={theme} />
            <View
              style={[styles.cardGroup, { borderColor: theme.colors.border }]}
            >
              <ActionRow
                icon="settings-outline"
                label={t("Shared Settings")}
                theme={theme}
                onPress={() => router.push("/(app)/family-settings")}
              />
               <ActionRow
                icon="person-add-outline"
                label={t("Invite Members")}
                theme={theme}
                onPress={() => {
                  shareInvite(data.family_code);
                }}
              />
              
               <ActionRow
                icon="git-pull-request-outline"
                label={t("Join Requests")}
                subLabel={t("View Join Requests from family or friends")}
                theme={theme}
                onPress={() => router.push("/(app)/family-requests")}
              />
                            </View>
          </View>
       <View style={styles.section}>
            <SectionTitle title={t("Data")} theme={theme} />
            <View style={[styles.cardGroup, { borderColor: theme.colors.border }]}>

              <ActionRow
                icon="cloud-upload-outline"
                label={t("Bulk Upload")}
                subLabel={t("Import via CSV/XLSX")}
                theme={theme}
                onPress={() => router.push("/(app)/bulk-import")}
              />
              <ActionRow
                icon="download-outline"
                label={t("Export Data")}
                subLabel={t("Download CSV")}
                theme={theme}
                onPress={handleExportData}
              />
              <ActionRow
                icon="key-outline"
                label={t("Generate Import Code")}
                subLabel={
                  importInfo
                    ? `${t("Active")}: ${importInfo.code}`
                    : t("Create secure code for upload")
                }
                theme={theme}
                onPress={handleGenerateCode}
                isLast={data.members.length < 2}
              />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <SectionTitle title={t("Support")} theme={theme} />
            <View
              style={[styles.cardGroup, { borderColor: theme.colors.border }]}
            >
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
              />
              </View>
          </View>
       <View style={styles.section}>
            <SectionTitle title={t("Policies")} theme={theme} />
            <View style={[styles.cardGroup, { borderColor: theme.colors.border }]}>

              <ActionRow
                icon="shield-checkmark-outline"
                label={t("Privacy Policy")}
                theme={theme}
                onPress={() => router.push("/(app)/privacy")}
              />
              <ActionRow
                icon="document-text-outline"
                label={t("Terms of Use")}
                theme={theme}
                onPress={() => router.push("/(app)/terms")}
                isLast
              />
            </View>
          </View>

          {/* Logout & Delete */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <View
              style={[styles.cardGroup, { borderColor: theme.colors.border }]}
            >
              {data.members.length > 1 && (
                <ActionRow
                  icon="exit-outline"
                  label={t("Leave Family")}
                  subLabel={t("Start new family with your data")}
                  theme={theme}
                  onPress={handleLeaveFamily}
                />
              )}
              <ActionRow
                icon="log-out-outline"
                label={t("Logout")}
                theme={theme}
                danger
                onPress={handleLogout}
              />
              <ActionRow
                icon="trash-outline"
                label={t("Delete Account")}
                theme={theme}
                danger
                onPress={handleDeleteAccount}
                isLast
              />
            </View>
            <Text
              style={{
                textAlign: "center",
                color: theme.colors.subtext,
                marginTop: 16,
                fontSize: 12,
              }}
            >
              {t("Version")} 1.0.0 (BillBell)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay for Key Rotation */}
      {isRotatingKeys && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999,
            },
          ]}
        >
          <View
            style={{
              backgroundColor: theme.colors.card,
              padding: 24,
              borderRadius: 16,
              alignItems: "center",
              gap: 16,
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={{ color: theme.colors.primaryText, fontWeight: "600" }}
            >
              {t("Securing your data...")}
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLangModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: theme.colors.primaryText }]}
            >
              {t("Select Language")}
            </Text>
            {langs.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => {
                  i18n.changeLanguage(l.code);
                  setShowLangModal(false);
                }}
                style={({ pressed }) => [
                  styles.modalItem,
                  {
                    backgroundColor: pressed
                      ? theme.colors.border
                      : "transparent",
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    { color: theme.colors.primaryText },
                  ]}
                >
                  {l.label}
                </Text>
                {i18n.language === l.code && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowLangModal(false)}
              style={[
                styles.modalCancel,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.modalCancelText, { color: theme.colors.text }]}
              >
                {t("Cancel")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    margin: 2,
    borderRadius: 20,
    width: "100%",
  },
  headerGradient: {
    borderRadius: 20,
    height: 120,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  headerContentLeft: {
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
    minWidth: 0,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerCode: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    flexShrink: 0,
    paddingRight: 50,
  },
  copyButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancel: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
