import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Linking from "expo-linking";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme, Theme } from "../../src/ui/useTheme";

const SUPPORT_EMAIL = "support@dunn-carabali.com";

// --- Components ---

function Header({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerIconCircle}>
          <Ionicons name="chatbubbles" size={28} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function FeedbackTypeToggle({
  type,
  setType,
  theme,
  t,
}: {
  type: "feedback" | "bug";
  setType: (t: "feedback" | "bug") => void;
  theme: Theme;
  t: any;
}) {
  return (
    <View style={[styles.toggleContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Pressable
        onPress={() => setType("feedback")}
        style={[
          styles.toggleButton,
          type === "feedback" && { backgroundColor: theme.colors.primary },
        ]}
      >
        <Ionicons 
          name="bulb-outline" 
          size={18} 
          color={type === "feedback" ? theme.colors.primaryTextButton : theme.colors.subtext} 
        />
        <Text
          style={[
            styles.toggleText,
            { color: type === "feedback" ? theme.colors.primaryTextButton : theme.colors.subtext },
          ]}
        >
          {t("Feedback")}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setType("bug")}
        style={[
          styles.toggleButton,
          type === "bug" && { backgroundColor: theme.colors.danger },
        ]}
      >
        <Ionicons 
          name="bug-outline" 
          size={18} 
          color={type === "bug" ? "#FFF" : theme.colors.subtext} 
        />
        <Text
          style={[
            styles.toggleText,
            { color: type === "bug" ? "#FFF" : theme.colors.subtext },
          ]}
        >
          {t("Bug Report")}
        </Text>
      </Pressable>
    </View>
  );
}

// --- Main Screen ---

export default function FeedbackScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const [type, setType] = useState<"feedback" | "bug">("feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        t("Missing info"),
        t("Please add a title and description first.")
      );
      return;
    }

    const subject = `[${
      type === "bug" ? "Bug" : "Feedback"
    }] ${title.trim()}`;

    const bodyLines = [
      `Type: ${type === "bug" ? t("Bug Report") : t("General Feedback")}`,
      `Platform: ${Platform.OS} ${Platform.Version ?? ""}`,
      contact ? `Contact: ${contact.trim()}` : "",
      "--------------------------------",
      description.trim(),
    ].filter(Boolean);

    const body = bodyLines.join("\n");
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      setSubmitting(true);
      const canOpen = await Linking.canOpenURL(mailto);
      if (!canOpen) {
        Alert.alert(
          t("Error"),
          `${t("Unable to open mail app")}\n\n${SUPPORT_EMAIL}`
        );
        return;
      }
      await Linking.openURL(mailto);
    } catch (e: any) {
      Alert.alert(t("Error"), e?.message || "Error opening mail app");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Header */}
            <Header
              title={t("FeedbackTitle")}
              subtitle={t("FeedbackSubtitle")}
              theme={theme}
            />

            {/* Type Selector */}
            <FeedbackTypeToggle type={type} setType={setType} theme={theme} t={t} />

            {/* Form Fields */}
            <View style={styles.formGroup}>
              
              {/* Title Input */}
              <View>
                <Text style={[styles.label, { color: theme.colors.primaryText }]}>{t("Title")}</Text>
                <TextInput
                  placeholder={t("TitlePlaceholder")}
                  placeholderTextColor={theme.colors.subtext}
                  value={title}
                  onChangeText={setTitle}
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    borderColor: theme.colors.border,
                    color: theme.colors.primaryText
                  }]}
                />
              </View>

              {/* Description Input */}
              <View>
                <Text style={[styles.label, { color: theme.colors.primaryText }]}>{t("Details")}</Text>
                <TextInput
                  placeholder={
                    type === "bug"
                      ? t("DetailsPlaceholderBug")
                      : t("DetailsPlaceholderFeedback")
                  }
                  placeholderTextColor={theme.colors.subtext}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: theme.colors.card, 
                    borderColor: theme.colors.border,
                    color: theme.colors.primaryText
                  }]}
                />
              </View>

              {/* Contact Input */}
              <View>
                <Text style={[styles.label, { color: theme.colors.primaryText }]}>{t("ContactLabel")}</Text>
                <TextInput
                  placeholder={t("ContactPlaceholder")}
                  placeholderTextColor={theme.colors.subtext}
                  value={contact}
                  onChangeText={setContact}
                  autoCapitalize="none"
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card, 
                    borderColor: theme.colors.border,
                    color: theme.colors.primaryText
                  }]}
                />
              </View>

            </View>

            {/* Submit Button */}
            <View>
                <Pressable
                onPress={onSubmit}
                disabled={submitting}
                style={({ pressed }) => [
                    styles.submitButton,
                    {
                    backgroundColor: theme.colors.primary,
                    opacity: submitting ? 0.6 : pressed ? 0.8 : 1,
                    },
                ]}
                >
                {submitting ? (
                    <ActivityIndicator color={theme.colors.primaryTextButton} />
                ) : (
                    <Text style={[styles.submitButtonText, { color: theme.colors.primaryTextButton }]}>
                    {t("Send")}
                    </Text>
                )}
                </Pressable>
                <Text style={[styles.disclaimer, { color: theme.colors.subtext }]}>
                    {t("MailAppDisclaimer")}
                </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  // Header
  headerShadowContainer: {
    backgroundColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 4,
    borderRadius: 20,
  },
headerGradient: {
    borderRadius: 20,
    height:120,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft:10
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
    width:'70%'
  },
  // Toggle
  toggleContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    height: 50,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    gap: 8,
  },
  toggleText: {
    fontWeight: "700",
    fontSize: 14,
  },
  // Form
  formGroup: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  // Submit
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 12,
  },
});