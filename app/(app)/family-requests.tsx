import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; 
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";

const CACHE_KEY = "billbell_family_requests_cache";

export default function FamilyRequests() {
  const theme = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // 1. Load from Cache first (Instant UI) if not refreshing
      if (!isRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && isMounted.current) {
          setRequests(JSON.parse(cached));
          setLoading(false); 
        }
      }

      // 2. Fetch Fresh Data
      const res: any = await api.familyRequests();
      const freshData = res.requests || [];
      
      // 3. Update State & Cache
      if(isMounted.current) {
          setRequests(freshData);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
      }
      
    } catch (e) {
      console.log("Failed to load requests", e);
    } finally {
      if(isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadRequests();
  }, [loadRequests]));

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests(true);
  };

  async function handleRespond(
    requestId: number,
    action: "approve" | "reject"
  ) {
    // 1. Optimistic Update: Immediately update UI
    const originalRequests = [...requests];
    
    // For rejection, we keep it but mark as rejected visually
    // For approval, we usually remove it from the 'Pending' list or mark as approved
    const updatedRequests = requests.map(r => 
        r.id === requestId 
            ? { ...r, status: action === 'reject' ? 'rejected' : 'approved', updated_at: new Date().toISOString() } 
            : r
    );
    
    // If approved, we might want to just hide it, but let's stick to status update or removal
    // If you want to remove approved items immediately:
    const optimisticList = action === 'approve' 
        ? requests.filter(r => r.id !== requestId)
        : updatedRequests;

    setRequests(optimisticList);

    try {
      await api.familyRequestRespond(requestId, action);
      
      // Background re-fetch to ensure consistency
      const res: any = await api.familyRequests();
      if(isMounted.current && res.requests) {
          setRequests(res.requests);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(res.requests));
      }
    } catch (e: any) {
      // Revert on failure
      if(isMounted.current) {
          setRequests(originalRequests);
          Alert.alert(t("Error"), e.message);
      }
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Stack.Screen options={{ title: t("Join Requests") }} />

      {loading && requests.length === 0 ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={theme.colors.border} />
              <Text style={{ color: theme.colors.subtext, marginTop: 12 }}>
                {t("No pending requests.")}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isRejected = item.status === 'rejected';
            const isApproved = item.status === 'approved'; // Assuming API returns this status

            if (isApproved) return null; // Don't show approved items in the list

            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: isRejected ? 0.7 : 1, 
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[styles.name, { color: theme.colors.primaryText }]}
                    >
                      {item.name || t("Unknown User")}
                    </Text>
                    
                    {isRejected && (
                      <Ionicons name="close-circle" size={18} color={theme.colors.danger} />
                    )}
                  </View>
                  
                  <Text style={[styles.email, { color: theme.colors.subtext }]}>
                    {item.email}
                  </Text>
                </View>

                <View style={styles.actions}>
                  {isRejected ? (
                    <Text style={{ color: theme.colors.danger, fontSize: 12, fontWeight: '600' }}>
                      {t("Denied")}
                    </Text>
                  ) : (
                    <>
                      <Pressable
                        onPress={() => handleRespond(item.id, "reject")}
                        style={[
                            styles.btn, 
                            { backgroundColor: theme.colors.danger + '20' } // Light red bg
                        ]}
                      >
                        <Text
                          style={[
                            styles.btnText,
                            { color: theme.colors.danger },
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  name: { fontWeight: "700", fontSize: 16 },
  email: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, alignItems: 'center' },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnText: { fontWeight: "700", fontSize: 13 },
});