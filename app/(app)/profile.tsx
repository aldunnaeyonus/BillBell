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
import { useTranslation } from "react-i18next";

export default function Profile() {
  const [data, setData] = useState<any>(null);
  const theme = useTheme();
  const [latestImportCode, setLatestImportCode] = useState<string | null>(null);
  const [latestImportExpiresAt, setLatestImportExpiresAt] = useState<
    string | null
  >(null);
  const { t } = useTranslation();
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
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: theme.colors.primaryText,
          }}
        >
          {t("Profile")}
        </Text>

        {data && (
          <>
            <Text
              style={{ fontWeight: "800", color: theme.colors.primaryText }}
            >
              {t("Share ID")}
            </Text>
            <Text style={{ color: theme.colors.subtext }}>
              {data.family_code}
            </Text>

            <Text
              style={{ fontWeight: "800", color: theme.colors.primaryText }}
            >
              {t("Import Codes & Epiration Date")}
            </Text>
            <Text style={{ color: theme.colors.subtext }}>
              {latestImportCode || t("Touch Generate Import Code")}{" "}
              {latestImportExpiresAt || ""}
            </Text>

            <Text
              style={{
                fontWeight: "800",
                color: theme.colors.primaryText,
                marginTop: 8,
              }}
            >
              {t("Members")}
            </Text>
            <FlatList
              data={data.members}
              keyExtractor={(m) => String(m.id)}
              renderItem={({ item }) => (
                <View style={{ paddingVertical: 8 }}>
                  <Text
                    style={{
                      fontWeight: "700",
                      color: theme.colors.primaryText,
                    }}
                  >
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
          <Text style={buttonText(theme, "ghost")}>{t("Settings")}</Text>
        </Pressable>

        <Pressable
          onPress={async () => router.push("(app)/bulk-import")}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>
            {t("Bulk Upload (CSV/XLSX)")}
          </Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const res = await api.createImportCode(15);
              const notifTitle = t("Import Code");
              const notifBody = t("CodeExpires", {
                code: res.code,
                expiresAt: res.expires_at.toLocaleString(),
              });

              setLatestImportCode(res.code);
              await copyToClipboard(res.code);

              setLatestImportExpiresAt(res.expires_at);

              await notifyImportCode(notifTitle, notifBody);
              Alert.alert(
                t("Import Code Generated"),
                t("CodeExpires", { code: res.code, expiresAt: res.expires_at }),

                [
                  {
                    text: t("Copy Code"),
                    onPress: async () => {
                      await copyToClipboard(res.code);
                      Alert.alert(
                        t("Copied"),
                        t("Import code copied to clipboard.")
                      );
                    },
                  },
                  {
                    text: t("Open Upload Page"),
                    onPress: () => router.push("(app)/bulk-import"),
                  },
                  { text: t("OK"), style: "cancel" },
                ]
              );
            } catch (e: any) {
              Alert.alert(t("Error"), e.message);
            }
          }}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>
            {t("Generate Import Code")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(app)/faq")}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>{t("FAQ & Help")}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(app)/feedback")}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>{t("Feedback & Bugs")}</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await googleSignOut();
            await clearToken();
            router.replace("/(auth)/login");
          }}
          style={button(theme, "danger")}
        >
          <Text style={buttonText(theme, "danger")}>{t("Logout")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
