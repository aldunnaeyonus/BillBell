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
import { Ionicons } from "@expo/vector-icons"; 
import AsyncStorage from "@react-native-async-storage/async-storage"; // Added for caching
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";

const CACHE_KEY = "billbell_family_requests_cache";

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
      // 1. Load from Cache first (Instant UI)
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setRequests(JSON.parse(cached));
        setLoading(false); // Show cached content immediately
      }

      // 2. Fetch Fresh Data
      const res: any = await api.familyRequests();
      const freshData = res.requests || [];
      
      // 3. Update State & Cache
      setRequests(freshData);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
      
    } catch (e) {
      console.log("Failed to load requests", e);
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
      await api.familyRequestRespond(requestId, action);
      
      // Refresh list (and update cache)
      await loadRequests(); 
    } catch (e: any) {
      Alert.alert(t("Error"), e.message);
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Stack.Screen options={{ title: "Join Requests" }} />

      {loading && requests.length === 0 ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.colors.subtext }}>
            No requests found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const isRejected = item.status === 'rejected';

            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: isRejected ? 0.8 : 1, 
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[styles.name, { color: theme.colors.primaryText }]}
                    >
                      {item.name || "Unknown User"}
                    </Text>
                    
                    {/* ICON: Show Red X if rejected */}
                    {isRejected && (
                      <Ionicons name="close-circle" size={20} color={theme.colors.danger} />
                    )}
                  </View>
                  
                  <Text style={[styles.email, { color: theme.colors.subtext }]}>
                    {item.email}
                  </Text>
                </View>

                <View style={styles.actions}>
                  {isRejected ? (
                    // SHOW DATE OF DENIAL
                    <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>
                      {t("Denied on")} {formatDate(item.updated_at || item.created_at)}
                    </Text>
                  ) : (
                    // SHOW BUTTONS
                    <>
                      <Pressable
                        onPress={() => handleRespond(item.id, "reject")}
                        style={[
                            styles.btn, 
                            { backgroundColor: theme.colors.danger }
                        ]}
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
                    </>
                  )}
                </View>
              </View>
            );
          }}
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
  actions: { flexDirection: "row", gap: 8, alignItems: 'center' },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { fontWeight: "bold", fontSize: 12 },
});