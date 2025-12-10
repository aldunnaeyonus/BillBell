import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { clearToken } from "../../src/auth/session";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

export default function Profile() {
  const [data, setData] = useState<any>(null);
  const theme = useTheme();

  useEffect(() => { api.familyMembers().then(setData).catch(() => {}); }, []);

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 12 }]}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: theme.colors.text }}>Profile</Text>

        {data && (
          <>
            <Text style={{ fontWeight: "800", color: theme.colors.text }}>Family ID</Text>
            <Text style={{ color: theme.colors.subtext }}>{data.family_code}</Text>

            <Text style={{ fontWeight: "800", color: theme.colors.text, marginTop: 8 }}>Members</Text>
            <FlatList
              data={data.members}
              keyExtractor={(m) => String(m.id)}
              renderItem={({ item }) => (
                <View style={{ paddingVertical: 8 }}>
                  <Text style={{ fontWeight: "700", color: theme.colors.text }}>
                    {item.name || item.email || `User ${item.id}`}
                  </Text>
                  <Text style={{ color: theme.colors.subtext }}>{item.role}</Text>
                </View>
              )}
            />
          </>
        )}

        <Pressable onPress={() => router.push("/(app)/family-settings")} style={button(theme, "ghost")}>
          <Text style={buttonText(theme, "ghost")}>Family Settings</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
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
