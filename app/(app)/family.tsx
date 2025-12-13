import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";
import { useTranslation } from "react-i18next";

export default function Family() {
  const [code, setCode] = useState("");
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 12 }]}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: theme.colors.primaryText,
          }}
        >
          {t("Family setup")}
        </Text>

        <Pressable
          onPress={async () => {
            try {
              const res = await api.familyCreate();
              Alert.alert(
                t("Family created"),
                t("Your Family ID", { family_code: res.family_code })
              );
              router.replace("/(app)/bills");
            } catch (e: any) {
              Alert.alert(t("Error"), e.message);
            }
          }}
          style={button(theme, "primary")}
        >
          <Text style={buttonText(theme, "primary")}>
            {t("Create a new Family")}
          </Text>
        </Pressable>

        <Text style={{ color: theme.colors.subtext, marginTop: 8 }}>
          {t("Or join with Family ID")}
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder={t("e.g. K7P3D9")}
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="characters"
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 12,
            borderRadius: 12,
            color: theme.colors.primaryText,
            backgroundColor: theme.colors.bg,
          }}
        />
        <Pressable
          onPress={async () => {
            try {
              await api.familyJoin(code.trim().toUpperCase());
              router.replace("/(app)/bills");
            } catch (e: any) {
              Alert.alert(t("Error"), e.message);
            }
          }}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>{t("Join Family")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
