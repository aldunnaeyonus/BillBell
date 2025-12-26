import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; 
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";
import { getJson, setJson } from "../../src/storage/storage"; 
import { Skeleton } from "../../src/ui/Skeleton"; 
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";

const CACHE_KEY = "billbell_family_requests_cache";

function RequestSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width={120} height={16} borderRadius={4} />
        <Skeleton width={180} height={12} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={60} height={34} borderRadius={10} />
        <Skeleton width={70} height={34} borderRadius={10} />
      </View>
    </View>
  );
}

export default function FamilyRequests() {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [requests, setRequests] = useState<any[]>(() => getJson(CACHE_KEY) || []);
  const [loading, setLoading] = useState(requests.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh || requests.length === 0) {
      if (!isRefresh) setLoading(true);
    }
    try {
      const res: any = await api.familyRequests();
      const freshData = res.requests || [];
      if(isMounted.current) {
          setRequests(freshData);
          setJson(CACHE_KEY, freshData);
      }
    } catch (e) {
      console.log("Failed to load requests", e);
    } finally {
      if(isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [requests.length]);

  useFocusEffect(useCallback(() => { loadRequests(); }, [loadRequests]));

  const onRefresh = () => { setRefreshing(true); loadRequests(true); };

  async function handleRespond(requestId: number, action: "approve" | "reject") {
    const originalRequests = [...requests];
    const updatedRequests = requests.map(r => 
        r.id === requestId 
            ? { ...r, status: action === 'reject' ? 'rejected' : 'approved', updated_at: new Date().toISOString() } 
            : r
    );
    const optimisticList = action === 'approve' ? requests.filter(r => r.id !== requestId) : updatedRequests;
    setRequests(optimisticList);
    try {
      await api.familyRequestRespond(requestId, action);
      const res: any = await api.familyRequests();
      if(isMounted.current && res.requests) {
          setRequests(res.requests);
          setJson(CACHE_KEY, res.requests);
      }
    } catch (e: any) {
      if(isMounted.current) {
          setRequests(originalRequests);
          Alert.alert(t("Error"), e.message);
      }
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Stack.Screen options={{ title: t("Join Requests") }} />

      {loading && requests.length === 0 ? (
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', padding: 16, gap: 12 }}>
          <RequestSkeleton />
          <RequestSkeleton />
          <RequestSkeleton />
        </View>
      ) : (
        <FlatList
          data={requests}
                  showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={theme.colors.border} />
              <Text style={{ color: theme.colors.subtext, marginTop: 12 }}>{t("No pending requests.")}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isRejected = item.status === 'rejected';
            const isApproved = item.status === 'approved'; 
            if (isApproved) return null; 
            return (
              <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: isRejected ? 0.7 : 1 }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.name, { color: theme.colors.primaryText }]}>{item.name || t("Unknown User")}</Text>
                    {isRejected && <Ionicons name="close-circle" size={18} color={theme.colors.danger} />}
                  </View>
                  <Text style={[styles.email, { color: theme.colors.subtext }]}>{item.email}</Text>
                </View>

                <View style={styles.actions}>
                  {isRejected ? (
                    <Text style={{ color: theme.colors.danger, fontSize: 12, fontWeight: '600' }}>{t("Denied")}</Text>
                  ) : (
                    <>
                      <Pressable onPress={() => handleRespond(item.id, "reject")} style={[styles.btn, { backgroundColor: theme.colors.danger + '20' }]}>
                        <Text style={[styles.btnText, { color: theme.colors.danger }]}>{t("Deny")}</Text>
                      </Pressable>
                      <Pressable onPress={() => handleRespond(item.id, "approve")} style={[styles.btn, { backgroundColor: theme.colors.primary }]}>
                        <Text style={[styles.btnText, { color: theme.colors.primaryTextButton }]}>{t("Approve")}</Text>
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
  card: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1 },
  name: { fontWeight: "700", fontSize: 16 },
  email: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, alignItems: 'center' },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnText: { fontWeight: "700", fontSize: 13 },
});