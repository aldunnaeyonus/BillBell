import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

export default function Family() {
  const [code, setCode] = useState("");
  const theme = useTheme();

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 12 }]}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.colors.text }}>Family setup</Text>

        <Pressable
          onPress={async () => {
            try {
              const res = await api.familyCreate();
              Alert.alert("Family created", `Your Family ID: ${res.family_code}`);
              router.replace("/(app)/bills");
            } catch (e: any) { Alert.alert("Error", e.message); }
          }}
          style={button(theme, "primary")}
        >
          <Text style={buttonText(theme, "primary")}>Create a new Family</Text>
        </Pressable>

        <Text style={{ color: theme.colors.subtext, marginTop: 8 }}>Or join with Family ID</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="e.g. K7P3D9"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="characters"
          style={{
            borderWidth: 1, borderColor: theme.colors.border,
            padding: 12, borderRadius: 12,
            color: theme.colors.text, backgroundColor: theme.colors.bg
          }}
        />
        <Pressable
          onPress={async () => {
            try { await api.familyJoin(code.trim().toUpperCase()); router.replace("/(app)/bills"); }
            catch (e: any) { Alert.alert("Error", e.message); }
          }}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>Join Family</Text>
        </Pressable>
      </View>
    </View>
  );
}
