import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { clearToken } from "../../src/auth/session";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";
import { notifyImportCode } from "../../src/notifications/importCode";
import { copyToClipboard } from "../../src/ui/copy";
import { googleSignOut } from "../../src/auth/providers";

export default function Profile() {
  const [data, setData] = useState<any>(null);
  const theme = useTheme();
  const [latestImportCode, setLatestImportCode] = useState<string | null>(null);
  const [latestImportExpiresAt, setLatestImportExpiresAt] = useState<
    string | null
  >(null);

  useEffect(() => {
    api
      .familyMembers()
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 12 }]}>
        <Text
          style={{ fontSize: 20, fontWeight: "900", color: theme.colors.text }}
        >
          Profile
        </Text>

        {data && (
          <>
            <Text style={{ fontWeight: "800", color: theme.colors.text }}>
              Family ID
            </Text>
            <Text style={{ color: theme.colors.subtext }}>
              {data.family_code}
            </Text>

            <Text
              style={{
                fontWeight: "800",
                color: theme.colors.text,
                marginTop: 8,
              }}
            >
              Members
            </Text>
            <FlatList
              data={data.members}
              keyExtractor={(m) => String(m.id)}
              renderItem={({ item }) => (
                <View style={{ paddingVertical: 8 }}>
                  <Text style={{ fontWeight: "700", color: theme.colors.text }}>
                    {item.name || item.email || `User ${item.id}`}
                  </Text>
                  <Text style={{ color: theme.colors.subtext }}>
                    {item.role}
                  </Text>
                </View>
              )}
            />
          </>
        )}

        <Pressable
          onPress={() => router.push("/(app)/family-settings")}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>Family Settings</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            try {
              const res = await api.createImportCode(15);
              await notifyImportCode(res.code, res.expires_at);
              Alert.alert(
                "Import Code",
                `Code: ${res.code}\nExpires: ${res.expires_at}`
              );
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          }}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>Generate Import Code</Text>
        </Pressable>

        <Pressable
          onPress={async () =>
            router.push("(app)/bulk-import")}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>Bulk Upload (CSV/XLSX)</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const res = await api.createImportCode(15);
              setLatestImportCode(res.code);
              await copyToClipboard(res.code);

              setLatestImportExpiresAt(res.expires_at);

              await notifyImportCode(res.code, res.expires_at);

              Alert.alert(
                "Import Code Generated",
                `Code: ${res.code}\nExpires: ${res.expires_at}`,
                [
                  {
                    text: "Copy Code",
                    onPress: async () => {
                      await copyToClipboard(res.code);
                      Alert.alert("Copied", "Import code copied to clipboard.");
                    },
                  },
                  {
                    text: "Open Upload Page",
                    onPress: () =>router.push("(app)/bulk-import"),
                  },
                  { text: "OK", style: "cancel" },
                ]
              );
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          }}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>Generate Import Code</Text>
        </Pressable>

        <Pressable
          disabled={!latestImportCode}
          onPress={async () => {
            if (!latestImportCode) return;
            await copyToClipboard(latestImportCode);
            Alert.alert(
              "Copied",
              latestImportExpiresAt
                ? `Import code copied.\nExpires: ${latestImportExpiresAt}`
                : "Import code copied."
            );
          }}
          style={[
            button(theme, "ghost"),
            { opacity: latestImportCode ? 1 : 0.5 },
          ]}
        >
          <Text style={buttonText(theme, "ghost")}>
            Copy Latest Import Code
          </Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            await googleSignOut();
            await clearToken();
            Alert.alert("Logged out");
            router.replace("/(auth)/login");
          }}
          style={button(theme, "danger")}
        >
          <Text style={buttonText(theme, "danger")}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
