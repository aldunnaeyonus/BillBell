import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {t("PrivacyPolicyText") || "Privacy Policy Placeholder...\n\n1. Data Collection\nWe collect basic account information to provide the bill tracking service.\n\n2. Data Usage\nYour data is used solely for the purpose of syncing your bills with your family group.\n\n3. Data Deletion\nYou can delete your account at any time from the Profile page, which will remove your data from our servers."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  text: { fontSize: 16, lineHeight: 24 },
});
