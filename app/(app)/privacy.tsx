import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {t("PrivacyText")}
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
