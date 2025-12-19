import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";

export default function FamilyRequests() {
  const theme = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      // FIX: Use client method instead of raw api.get
      const res: any = await api.familyRequests();
      setRequests(res.requests || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(
    requestId: number,
    action: "approve" | "reject"
  ) {
    try {
      setLoading(true);
      // FIX: Use client method instead of raw api.post
      await api.familyRequestRespond(requestId, action);
      await loadRequests(); // Refresh list
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Stack.Screen options={{ title: t("Join Requests") }} />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.colors.subtext }}>
            {t("No pending requests.")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.name, { color: theme.colors.primaryText }]}
                >
                  {item.name || t("Unknown User")}
                </Text>
                <Text style={[styles.email, { color: theme.colors.subtext }]}>
                  {item.email}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleRespond(item.id, "reject")}
                  // FIX: Use theme.colors.danger
                  style={[styles.btn, { backgroundColor: theme.colors.danger }]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: theme.colors.dangerText },
                    ]}
                  >
                    {t("Deny")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRespond(item.id, "approve")}
                  // FIX: Use theme.colors.primary (Navy/Mint)
                  style={[
                    styles.btn,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: theme.colors.primaryTextButton },
                    ]}
                  >
                    {t("Approve")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  name: { fontWeight: "bold", fontSize: 16 },
  email: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { fontWeight: "bold", fontSize: 12 },
});