import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";

export default function Terms() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {t("TermsText") || "Terms of Use Placeholder...\n\n1. Acceptance\nBy using this app, you agree to these terms.\n\n2. User Conduct\nYou agree not to use this app for illegal activities.\n\n3. Disclaimer\nThis app is provided 'as is' without warranties of any kind."}
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
