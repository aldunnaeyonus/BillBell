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
} from "react-native";
import * as Linking from "expo-linking";

import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";
import { useTranslation } from "react-i18next";

const SUPPORT_EMAIL = "support@dunn-carabali.com"; // change if needed

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
      Alert.alert(t("Missing info"), t("Please add a title and description first."));
      return;
    }

    const subject = `[${type === "bug" ? t("Bug") : t("Feedback")}] ${title.trim()}`;

    const bodyLines = [
      `Type: ${type === "bug" ? t("Bug Report") : t("General Feedback")}`,
      `Platform: ${Platform.OS} ${Platform.Version ?? ""}`,
      contact ? `Contact (optional): ${contact.trim()}` : "",
      "",
      "Details:",
      description.trim(),
    ].filter(Boolean);

    const body = bodyLines.join("\n");

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      setSubmitting(true);
      const canOpen = await Linking.canOpenURL(mailto);
      if (!canOpen) {
        Alert.alert(
          "Unable to open mail app",
          "Please send your feedback to:\n\n" + SUPPORT_EMAIL
        );
        return;
      }
      await Linking.openURL(mailto);
    } catch (e: any) {
      Alert.alert(
        t("Error"),
        e?.message || "Something went wrong opening your mail app."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={screen(theme)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[card(theme), { gap: 16 }]}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: theme.colors.text,
            }}
          >
            {t("Feedback & Bug Reports")}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: theme.colors.subtext,
              lineHeight: 20,
            }}
          >
            {t(
              "Spotted a bug or have an idea to make the app better? Send it here and we'll take a look."
            )}
          </Text>

          {/* Type toggle */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              {t("What are you sending?")}
            </Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setType("feedback")}
                style={[
                  button(theme, type === "feedback" ? "primary" : "ghost"),
                  { flex: 1 },
                ]}
              >
                <Text
                  style={buttonText(theme, type === "feedback" ? "primary" : "ghost")}
                >
                  {t("Feedback")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setType("bug")}
                style={[
                  button(theme, type === "bug" ? "primary" : "ghost"),
                  { flex: 1 },
                ]}
              >
                <Text
                  style={buttonText(theme, type === "bug" ? "primary" : "ghost")}
                >
                  {t("Bug")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Title */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              {t("Title")}
            </Text>
            <TextInput
              placeholder={t("Short summary (e.g. 'Crash when adding bill')")}
              placeholderTextColor={theme.colors.subtext}
              value={title}
              onChangeText={setTitle}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: theme.colors.text,
              }}
            />
          </View>

          {/* Description */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              {t("Details")}
            </Text>
            <TextInput
              placeholder={
                type === "bug"
                  ? t(
                      "What happened? What did you expect? Any steps to reproduce?"
                    )
                  : t("Share your thoughts, ideas, or suggestions.")
              }
              placeholderTextColor={theme.colors.subtext}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 120,
                color: theme.colors.text,
              }}
            />
          </View>

          {/* Contact (optional) */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              {t("Contact (optional)")}
            </Text>
            <TextInput
              placeholder={t("Email or @handle if you want a reply")}
              placeholderTextColor={theme.colors.subtext}
              value={contact}
              onChangeText={setContact}
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: theme.colors.text,
              }}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={[
              button(theme, "ghost"),
              submitting && { opacity: 0.7 },
              { marginTop: 8 },
            ]}
          >
            <Text style={buttonText(theme, "primary")}>
              {submitting ? t("Opening mail…") : t("Send")}
            </Text>
          </Pressable>

          <Text
            style={{
              fontSize: 12,
              color: theme.colors.subtext,
              marginTop: 4,
            }}
          >
            {t(
              "This will open your email app with a pre-filled message so you can review and send."
            )}
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
