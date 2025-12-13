import { useState, useMemo } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Keyboard } from "react-native";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card } from "../../src/ui/styles";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { Key } from "react";

interface FaqSection {
  title: string;
  items: { q: string; a: string }[];
}

export default function FAQ() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Cast the translation result to our interface
  const rawFaqItems = t("faqSections", { returnObjects: true }) as FaqSection[];

  // Filter logic
  const filteredFaqItems = useMemo(() => {
    if (!searchQuery.trim()) return rawFaqItems;

    const lowerQuery = searchQuery.toLowerCase();

    return rawFaqItems
      .map((section) => {
        // Filter items within the section
        const matchingItems = section.items.filter((item) => {
          const question = t(item.q).toLowerCase();
          const answer = t(item.a).toLowerCase();
          return question.includes(lowerQuery) || answer.includes(lowerQuery);
        });

        // Return the section with only matching items
        return {
          ...section,
          items: matchingItems,
        };
      })
      // Only keep sections that actually have matching items left
      .filter((section) => section.items.length > 0);
  }, [searchQuery, rawFaqItems, t]);

  return (
    <View style={screen(theme)}>
      <Stack.Screen options={{ title: t("FAQ") }} />

      {/* Search Bar */}
      <View style={{ marginBottom: 16 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("Search questions...")}
          placeholderTextColor={theme.colors.subtext}
          style={{
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 12,
            padding: 12,
            fontSize: 16,
            color: theme.colors.text,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredFaqItems.length === 0 ? (
           // Empty State
          <View style={[card(theme), { alignItems: "center", padding: 30 }]}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
            <Text
              style={{
                color: theme.colors.subtext,
                fontSize: 16,
                textAlign: "center",
              }}
            >
              {t("No results found for")} "{searchQuery}"
            </Text>
            <Pressable onPress={() => setSearchQuery("")} style={{ marginTop: 20 }}>
                <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>{t("Clear Search")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[card(theme), { gap: 20 }]}>
            {filteredFaqItems.map((section, sIdx) => (
              <View key={sIdx} style={{ marginTop: sIdx === 0 ? 0 : 12 }}>
                {/* Section title */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    marginBottom: 12,
                    color: theme.colors.primaryText,
                    textTransform: 'uppercase', 
                    opacity: 0.8
                  }}
                >
                  {t(section.title)}
                </Text>

                {section.items.map((item, index) => (
                  <View key={index} style={{ gap: 4, marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: theme.colors.primaryText,
                      }}
                    >
                      {t(item.q)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 15, // Bumped slightly for readability
                        color: theme.colors.subtext,
                        lineHeight: 22,
                      }}
                    >
                      {t(item.a)}
                    </Text>

                    {index < section.items.length - 1 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: theme.colors.border,
                          marginTop: 12,
                          opacity: 0.5
                        }}
                      />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}