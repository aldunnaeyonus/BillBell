import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { openLink } from "../../src/ui/openLink";
import { router } from "expo-router";

import { api } from "../../src/api/client";
import { notifyImportCode } from "../../src/notifications/importCode";
import { copyToClipboard } from "../../src/ui/copy";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

const IMPORT_URL_BASE = "https://YOURDOMAIN.com/import.html"; // change this

export default function ImportScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    family_code?: string;
    email?: string;
  }>();

  const [familyCode, setFamilyCode] = useState(
    (params.family_code ?? "").toString()
  );
  const [email, setEmail] = useState((params.email ?? "").toString());
  const [latestCode, setLatestCode] = useState<string | null>(null);
  const [latestExpiresAt, setLatestExpiresAt] = useState<string | null>(null);

  const importUrlWithPrefill = useMemo(() => {
    const fc = encodeURIComponent((familyCode || "").trim().toUpperCase());
    const em = encodeURIComponent((email || "").trim());
    // Prefill via query string (we’ll update import.html to read these)
    return `${IMPORT_URL_BASE}?family_code=${fc}&email=${em}`;
  }, [familyCode, email]);

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    borderRadius: 12,
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
  };

  async function generateCode() {
    try {
      const res = await api.createImportCode(15);
      setLatestCode(res.code);
      setLatestExpiresAt(res.expires_at);

      await notifyImportCode(res.code, res.expires_at);
      await copyToClipboard(res.code);

      Alert.alert(
        "Import Code Generated",
        `Code copied to clipboard.\n\nCode: ${res.code}\nExpires: ${res.expires_at}`,
        [
          {
            text: "Open Upload Page",
            onPress: async () =>
              router.push({
                pathname: "/(app)/browser",
                params: { url: encodeURIComponent(importUrlWithPrefill) },
              }),
          },
          { text: "OK", style: "cancel" },
        ]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <View style={screen(theme)}>
      <View style={[card(theme), { gap: 12 }]}>
        <Text
          style={{ fontSize: 20, fontWeight: "900", color: theme.colors.text }}
        >
          Bulk Upload Bills
        </Text>
        <Text style={{ color: theme.colors.subtext }}>
          Use your Family ID + Email to prefill the upload page. Generate an
          Import Code (admin) and paste it on the upload page.
        </Text>

        <Text style={{ fontWeight: "800", color: theme.colors.text }}>
          Family ID
        </Text>
        <TextInput
          value={familyCode}
          onChangeText={setFamilyCode}
          autoCapitalize="characters"
          placeholder="e.g. K7P3D9"
          placeholderTextColor={theme.colors.subtext}
          style={inputStyle}
        />

        <Text style={{ fontWeight: "800", color: theme.colors.text }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@email.com"
          placeholderTextColor={theme.colors.subtext}
          style={inputStyle}
        />

        <Pressable onPress={generateCode} style={button(theme, "primary")}>
          <Text style={buttonText(theme, "primary")}>
            Generate Import Code (copies)
          </Text>
        </Pressable>

        <Pressable
          disabled={!latestCode}
          onPress={async () => {
            if (!latestCode) return;
            await copyToClipboard(latestCode);
            Alert.alert(
              "Copied",
              latestExpiresAt
                ? `Code copied.\nExpires: ${latestExpiresAt}`
                : "Code copied."
            );
          }}
          style={[button(theme, "ghost"), { opacity: latestCode ? 1 : 0.5 }]}
        >
          <Text style={buttonText(theme, "ghost")}>Copy Latest Code</Text>
        </Pressable>

        <Pressable
          onPress={async () => await openLink(importUrlWithPrefill)}
          style={button(theme, "ghost")}
        >
          <Text style={buttonText(theme, "ghost")}>Open Upload Page</Text>
        </Pressable>
      </View>
    </View>
  );
}
