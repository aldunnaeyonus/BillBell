import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useTheme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";

export default function Privacy() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
        <View style={styles.content}>
          <Text style={[styles.text, { color: theme.colors.text }]}>
            {t("PrivacyText")}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  text: { fontSize: 16, lineHeight: 24 },
});